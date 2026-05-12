import json
import os
import re
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from embeddings import get_embeddings
from langchain_openai import ChatOpenAI
from langchain_chroma import Chroma
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from optimizer import (
    required_thickness, dose_at_thickness, optimize_multilayer,
    dose_profile, MATERIAL_DATA, SOURCE_PRESETS,
)

load_dotenv()

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    raise RuntimeError("OPENAI_API_KEY is not set in .env")

LLM_MODEL = "gpt-4o-mini"

BASE_DIR  = Path(__file__).parent
CHROMA_DIR = BASE_DIR / "chroma_db"

# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------
app = FastAPI(title="Casker-AI Backend", version="0.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Shared helpers
# ---------------------------------------------------------------------------
def _get_vectorstore() -> Chroma:
    if not CHROMA_DIR.exists():
        raise HTTPException(
            status_code=503,
            detail="ChromaDB가 없습니다. build_db.py를 먼저 실행하세요."
        )
    embeddings = get_embeddings(api_key=OPENAI_API_KEY)
    return Chroma(persist_directory=str(CHROMA_DIR), embedding_function=embeddings)


def _get_llm(temperature: float = 0.2, max_tokens: int = 900) -> ChatOpenAI:
    return ChatOpenAI(
        model=LLM_MODEL,
        openai_api_key=OPENAI_API_KEY,
        temperature=temperature,
        max_tokens=max_tokens,
    )


_ZERO_RUN = re.compile(r'(?:0[\s,]){8,}')    # 청크 필터용 (8개+)
_GARBAGE_RUN = re.compile(r'(?:0[\s,]){30,}') # 답변 garbage 판정용 (30개+)

_TABLE_RE = re.compile(r'Table\s+\d+\.\d+.*?(?:Default|Numerical|Values|Particle|Cross)', re.I)

def _is_useful_chunk(text: str) -> bool:
    """핵단면적 테이블·수치 기본값 표 등 LLM을 혼란시키는 청크를 걸러낸다."""
    if len(text) < 80:
        return False
    if _ZERO_RUN.search(text):
        return False
    if _TABLE_RE.search(text[:200]):
        return False
    numeric = sum(1 for c in text if c.isdigit() or c in (' ', '\n', '\r', '.', 'E', '+', '-'))
    return numeric / len(text) < 0.65


def _is_valid_answer(text: str) -> bool:
    return not _GARBAGE_RUN.search(text)


# ---------------------------------------------------------------------------
# 역설계 계산 의도 탐지 (Tab2 챗봇용)
# ---------------------------------------------------------------------------
_MAT_KW: dict[str, str] = {
    "납": "lead", "lead": "lead", "pb": "lead",
    "콘크리트": "concrete", "concrete": "concrete",
    "철": "iron", "iron": "iron", "ss304": "iron", "스틸": "iron", "스테인리스": "iron",
    "물": "water", "water": "water", "h2o": "water",
    "hdpe": "hdpe", "폴리에틸렌": "hdpe", "pe": "hdpe",
    "b4c": "b4c", "탄화붕소": "b4c",
    "boral": "boral",
}

_SRC_KW: dict[str, float] = {
    "cs-137": 0.662, "cs137": 0.662, "세슘": 0.662, "cs 137": 0.662,
    "co-60": 1.25,  "co60": 1.25,  "코발트": 1.25, "co 60": 1.25,
    "ir-192": 0.380, "ir192": 0.380, "이리듐": 0.380,
    "am-241": 0.060, "am241": 0.060,
}

_THICK_KW = ["두께", "thickness", "hvl", "tvl", "반가층", "십분의일", "차폐", "감쇠", "투과"]


def _detect_calc_intent(message: str):
    """
    메시지에서 재질·에너지·투과율을 추출해 (mat_key, energy_MeV, dose_reduction, is_thickness_q) 반환.
    탐지 실패 시 None/False 반환.
    """
    msg_lower = message.lower()

    mat_key = next((mk for kw, mk in _MAT_KW.items() if kw in msg_lower), None)

    energy: Optional[float] = next((e for kw, e in _SRC_KW.items() if kw in msg_lower), None)
    if energy is None:
        m = re.search(r'(\d+(?:\.\d+)?)\s*mev', msg_lower)
        if m:
            energy = float(m.group(1))
    if energy is None:
        energy = 1.25  # Co-60 기본값

    dose_reduction: Optional[float] = None

    # 1) "X% 투과" / "X% 차폐" / "1/N" 분수 표현
    m = re.search(r'(\d+(?:\.\d+)?)\s*%\s*투과', message)
    if m:
        dose_reduction = float(m.group(1)) / 100
    if dose_reduction is None:
        m = re.search(r'(\d+(?:\.\d+)?)\s*%\s*차폐', message)
        if m:
            dose_reduction = 1.0 - float(m.group(1)) / 100
    if dose_reduction is None:
        m = re.search(r'1\s*/\s*(\d+)', message)
        if m:
            dose_reduction = 1.0 / float(m.group(1))

    # 2) 선량률 패턴: "X μSv/h", "X mSv/h" 등
    #    두 값이 있으면 min/max = 투과율, 하나면 I₀=1 가정으로 그 값 자체 사용
    if dose_reduction is None:
        sv_vals = re.findall(r'(\d+(?:\.\d+)?)\s*[μuµ]sv(?:/h)?', msg_lower)
        if not sv_vals:
            sv_vals = re.findall(r'(\d+(?:\.\d+)?)\s*msv(?:/h)?', msg_lower)
        if sv_vals:
            vals = [float(v) for v in sv_vals]
            if len(vals) >= 2:
                dose_reduction = round(min(vals) / max(vals), 6)
            elif 0 < vals[0] < 1:
                # 단일 선량률 < 1: I₀ = 1.0 단위 가정
                dose_reduction = vals[0]

    is_thickness_q = any(kw in msg_lower for kw in _THICK_KW)
    return mat_key, energy, dose_reduction, is_thickness_q

# ---------------------------------------------------------------------------
# Request / Response models
# ---------------------------------------------------------------------------
class HistoryItem(BaseModel):
    role: str   # "user" | "model"
    text: str


class RagContext(BaseModel):
    cellCount: int = 0
    surfCount: int = 0
    materials: list[str] = []
    mode: str = "N"
    nps: str = "—"


class OptimizeContext(BaseModel):
    cellCount: int = 0
    surfCount: int = 0
    materials: list[str] = []
    mode: str = "N"
    nps: str = "—"
    errors: list[str] = []
    warns: list[str] = []
    summary: str = ""
    code: str = ""


class RagRequest(BaseModel):
    message: str
    history: list[HistoryItem] = []
    context: Optional[RagContext] = None


class OptimizeRequest(BaseModel):
    message: str
    history: list[HistoryItem] = []
    context: Optional[OptimizeContext] = None


class Source(BaseModel):
    file: str
    page: int


class ChatResponse(BaseModel):
    reply: str
    sources: list[Source] = []

# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------
@app.get("/health")
def health():
    return {"status": "ok", "model": LLM_MODEL, "chroma": CHROMA_DIR.exists()}


@app.post("/chat/rag", response_model=ChatResponse)
async def chat_rag(req: RagRequest):
    """Tab 1 — MCNP 매뉴얼 기반 지식 Q&A (RAG + 출처 반환)."""
    try:
        vs = _get_vectorstore()
        retriever = vs.as_retriever(search_kwargs={"k": 3})

        # 설계 컨텍스트 문자열
        ctx_str = ""
        if req.context:
            c = req.context
            mats = ", ".join(c.materials) if c.materials else "없음"
            ctx_str = (
                f"[현재 설계] 셀 {c.cellCount}개 · 서페이스 {c.surfCount}개 · "
                f"재질: {mats} · MODE {c.mode} · NPS {c.nps}\n\n"
            )

        # 히스토리 문자열 (최근 6턴)
        hist_str = ""
        if req.history:
            hist_str = "[이전 대화]\n"
            for h in req.history[-6:]:
                role = "사용자" if h.role == "user" else "AI"
                hist_str += f"{role}: {h.text}\n"
            hist_str += "\n"

        full_question = f"{ctx_str}{hist_str}[질문] {req.message}"

        # 문서 검색 (원본 question으로 검색해야 정확함)
        docs = retriever.invoke(req.message)

        good_docs = [d for d in docs if _is_useful_chunk(d.page_content)]
        # 정크 청크만 있으면 컨텍스트 없이 진행 (fallback으로 정크 넘기지 않음)
        doc_context = (
            "\n\n---\n\n".join(doc.page_content for doc in good_docs)
            if good_docs
            else "관련 매뉴얼 발췌를 찾지 못했습니다. 일반 MCNP 6.3 지식으로 답변하세요."
        )

        # LLM 호출
        prompt = ChatPromptTemplate.from_messages([
            (
                "system",
                "당신은 MCNP 6.3 핵 차폐 설계 전문가입니다.\n"
                "MCNP 코드 작성 요청에는 아래 규칙과 예시를 그대로 따라 완성된 코드를 생성하세요.\n\n"

                "## MCNP 입력 파일 구조 (순서 불변)\n"
                "  1행: 제목\n"
                "  Cell Cards (빈 줄)\n"
                "  Surface Cards (빈 줄)\n"
                "  Data Cards\n\n"

                "## 셀 카드 문법\n"
                "  <셀ID> <재질ID> <밀도g/cm3>  <영역>  IMP:<입자>=1\n"
                "  void:  <셀ID>  0             <영역>  IMP:<입자>=1   (추적 계속)\n"
                "  graveyard: <셀ID>  0          <영역>  IMP:<입자>=0   (추적 종료)\n"
                "  밀도 음수 = g/cm³\n\n"

                "## 영역 연산자\n"
                "  -N  = 서페이스/매크로바디 N 내부\n"
                "   N  = 서페이스/매크로바디 N 외부\n"
                "  A B = AND(교집합)   A:B = OR(합집합)\n\n"

                "## IMP 입자 표기 규칙 (중요)\n"
                "  IMP:N=1        → 중성자만 추적\n"
                "  IMP:P=1        → 광자만 추적\n"
                "  IMP:P,N=1      → 중성자+광자 동시 추적  ← 질문에 '중성자와 광자' 또는 mode n p 이면 반드시 이 형식\n"
                "  IMP:P,N=0      → graveyard (외부 공간)\n\n"

                "## 완성 예시 — RCC 이중 원통 Cask (반드시 이 형식 준수)\n"
                "아래는 외부RCC=17, 내부RCC=18, 재질5=철, 중성자+광자 추적 예시입니다:\n\n"
                "Iron Cask - RCC Macrobody\n"
                "c *** BLOCK 1 -- cells\n"
                "8  0        -18          IMP:P,N=1  $ 캐스크 내부 void (18 안쪽)\n"
                "7  5  -7.86  18 -17      IMP:P,N=1  $ 철제 쉘 (18 바깥 & 17 안쪽)\n"
                "9  0         17           IMP:P,N=0  $ 외부 공간 graveyard\n"
                "\n"
                "c *** BLOCK 2 -- surfaces/macrobodies\n"
                "17  RCC  0 0 0  0 0 20  10    $ 외부 원통 base(0,0,0) h-vec(0,0,20) r=10\n"
                "18  RCC  0 0 1  0 0 18  9     $ 내부 원통 base(0,0,1) h-vec(0,0,18) r=9\n"
                "\n"
                "c *** BLOCK 3 -- data\n"
                "m5   26056.70c  1.0\n"
                "mode n p\n"
                "nps  100000\n\n"

                "## 서페이스 카드\n"
                "  RCC  Vx Vy Vz  Hx Hy Hz  R   (밑면중심, 높이벡터, 반지름)\n"
                "  SPH  x y z R  /  RPP xmin xmax ymin ymax zmin zmax\n\n"

                "## 데이터 카드\n"
                "  재질: m<N>  <ZAID>.<lib>  <비율>   주요ZAID: Fe=26056.70c Pb=82208.70c Pu239=94239.80c U235=92235.70c\n"
                "  모드: mode p (광자만) / mode n (중성자만) / mode n p (둘다)\n"
                "  차폐=sdef  임계=kcode+ksrc   (kcode는 임계 전용)\n\n"

                "규칙: MCNP 코드는 반드시 ```mcnp 코드블록으로 감싸세요. 숫자를 나열하지 마세요. 500단어 이내.\n\n"

                "[MCNP 6.3 매뉴얼 발췌]\n{context}"
            ),
            ("human", "{question}"),
        ])

        chain = prompt | _get_llm(0.2) | StrOutputParser()
        answer = chain.invoke({"context": doc_context, "question": full_question})

        if not _is_valid_answer(answer):
            answer = (
                "⚠ 답변 생성 중 반복 패턴 오류가 발생했습니다.\n"
                "질문을 더 구체적으로 다시 입력하거나, 백엔드를 재시작해 주세요."
            )

        # 출처 추출 (중복 제거)
        seen = set()
        sources: list[Source] = []
        for doc in docs:
            meta = doc.metadata or {}
            raw_file = meta.get("source", "MCNP6.3 메뉴얼.pdf")
            file_name = Path(raw_file).name
            page = int(meta.get("page", 0)) + 1  # 0-indexed → 1-indexed
            key = (file_name, page)
            if key not in seen:
                seen.add(key)
                sources.append(Source(file=file_name, page=page))

        return ChatResponse(reply=answer, sources=sources)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"RAG 오류: {e}")


@app.post("/chat/optimize", response_model=ChatResponse)
async def chat_optimize(req: OptimizeRequest):
    """Tab 2 — 업로드된 MCNP 파일 역설계 및 최적화 채팅 (물리 수식 계산 포함)."""
    try:
        system_prompt = (
            "당신은 MCNP 6.3 핵 차폐 설계 전문가입니다. 친절하고 이해하기 쉽게 설명하세요.\n\n"

            "## 표기 규칙\n"
            "- 수학 기호: μ ρ × · exp ln (LaTeX 금지: \\mu \\rho 등)\n"
            "- 수식은 한 줄로: I = I₀ × exp(-μx)\n\n"

            "## 계산 컨텍스트가 있을 때 답변 구조\n"
            "1. 한두 문장으로 상황 요약 (왜 이 계산이 필요한지)\n"
            "2. **감쇠 계수** μ = μ/ρ × ρ 값 제시\n"
            "3. **① 단순 감쇠 (과소평가)**: x = -ln(투과율)/μ 풀이 → 결과 cm\n"
            "   '이 값만으로는 충분하지 않습니다. 산란선(Buildup)을 고려해야 합니다.' 한 줄 추가\n"
            "4. **② Buildup 보정 (실제 필요 두께)**: D = B(μx) × I₀ × exp(-μx) 소개\n"
            "   컨텍스트의 수치해 결과를 인용: 방정식을 수치해법으로 풀면 x = X cm\n"
            "   B(μx) 값과 검증식 제시\n"
            "5. **결과 정리** 두께 / HVL / TVL / 감쇠배수\n"
            "6. **MCNP 적용** 재질 카드 한 줄 예시 + 한 문장 설명\n\n"

            "## 빌드업 핵심 원칙 (반드시 지킬 것)\n"
            "- 단순 감쇠와 빌드업 보정 두께를 반드시 둘 다 제시하고 차이를 설명하세요\n"
            "- 컨텍스트에 계산값이 있으면 그 값을 인용하고 스스로 다시 유도하지 마세요\n"
            "- x_buildup ≠ x_simple × B  (수치해법 결과만 신뢰)\n\n"

            "## MCNP 문법 요약\n"
            "셀: ID MatID dens region IMP:P,N=1  (밀도 음수=g/cm³)\n"
            "graveyard: ID 0 region IMP:P,N=0\n"
            "주요ZAID: Fe=26056.70c  Pb=82208.70c\n\n"

            "규칙: MCNP 코드 예시는 코드블록으로 감싸세요. 한국어로 답하세요."
        )

        # ── 설계 컨텍스트 구성 ──────────────────────────────────────────
        ctx_parts: list[str] = []
        if req.context:
            c = req.context
            mats = ", ".join(c.materials) if c.materials else "없음"
            info = (
                f"셀: {c.cellCount}개, 서페이스: {c.surfCount}개, "
                f"재질: {mats}, MODE: {c.mode}, NPS: {c.nps}"
            )
            if c.errors:
                info += f"\n감지된 오류: {'; '.join(c.errors[:5])}"
            if c.warns:
                info += f"\n경고: {'; '.join(c.warns[:5])}"
            if c.summary:
                info += f"\n설계 요약: {c.summary}"
            ctx_parts.append(f"[MCNP 설계 컨텍스트]\n{info}")
            if c.code:
                ctx_parts.append(f"[업로드된 MCNP 입력 파일]\n```\n{c.code}\n```")

        # ── 역설계 물리 계산 (의도 탐지 → optimizer 함수 호출) ─────────
        mat_key, energy, dose_reduction, is_thickness_q = _detect_calc_intent(req.message)
        if mat_key and is_thickness_q:
            dr = dose_reduction if dose_reduction is not None else 0.5  # 기본 HVL
            try:
                import math as _math
                calc     = required_thickness(mat_key, dr, energy, use_buildup=True)
                mu       = calc["mu_linear_cm-1"]
                t        = calc["thickness_cm"]          # Brent 수치해 결과
                x_simple = round(-_math.log(dr) / mu, 3) # 단순감쇠 두께
                mu_x     = round(mu * t, 3)
                # B 검증: B(μx) × exp(-μx) = dr 를 수치적으로 확인
                d_simple  = dose_at_thickness(mat_key, t, energy, 1.0, use_buildup=False)
                d_buildup = dose_at_thickness(mat_key, t, energy, 1.0, use_buildup=True)
                B = round(d_buildup / d_simple, 3) if d_simple > 0 else 1.0
                verify = round(B * _math.exp(-mu_x), 4)  # ≈ dr 이면 올바른 해
                ctx_parts.append(
                    f"[역설계 계산 결과 — 아래 값을 그대로 인용하고 스스로 유도하지 마세요]\n"
                    f"재질: {calc['mat_name']} | 에너지: {energy} MeV | 목표 투과율: {dr*100:.1f}%\n"
                    f"μ = {mu} cm⁻¹\n"
                    f"\n"
                    f"① 단순 감쇠(buildup 미포함) 두께: x = -ln({dr}) / {mu} = {x_simple} cm\n"
                    f"   → 이 값은 과소평가입니다. 빌드업 보정이 필요합니다.\n"
                    f"\n"
                    f"② Berger 빌드업 보정 (수치해법으로 풀어야 하며, 단순히 x_simple × B ≠ x_buildup):\n"
                    f"   방정식: B(μx) × exp(-μx) = {dr}  →  Brent 수치해\n"
                    f"   해: x = {t} cm (μx = {mu_x})\n"
                    f"   이 두께에서 B(μx={mu_x}) = {B}\n"
                    f"   검증: {B} × exp(-{mu_x}) = {verify}  ≈ {dr} ✓\n"
                    f"\n"
                    f"HVL = ln(2)/{mu} = {calc['hvl_cm']} cm | "
                    f"TVL = ln(10)/{mu} = {calc['tvl_cm']} cm | "
                    f"감쇠: {calc['attenuation_factor']}배"
                )
            except Exception:
                pass  # 계산 실패 시 LLM 단독 응답으로 폴백

        # ── 메시지 리스트 구성 (히스토리 반영) ───────────────────────────
        messages: list = [SystemMessage(content=system_prompt)]
        if req.history:
            for h in req.history[-6:]:
                if h.role == "user":
                    messages.append(HumanMessage(content=h.text))
                else:
                    messages.append(AIMessage(content=h.text))

        user_msg = "\n\n".join(ctx_parts + [req.message]) if ctx_parts else req.message
        messages.append(HumanMessage(content=user_msg))

        response = _get_llm(0.3, max_tokens=1800).invoke(messages)
        return ChatResponse(reply=response.content)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Optimize 오류: {e}")


# ---------------------------------------------------------------------------
# Optimizer endpoints
# ---------------------------------------------------------------------------
class ThicknessRequest(BaseModel):
    material: str             # 재질 키 ('lead', 'concrete', ...)
    dose_reduction: float     # 목표 투과율 (0~1, 예: 0.1 = 10% 투과)
    energy_MeV: float = 1.25  # 광자 에너지
    use_buildup: bool = True


class MultilayerRequest(BaseModel):
    materials: list[str]         # 재질 키 리스트
    total_thickness_cm: float    # 총 두께 [cm]
    energy_MeV: float = 1.25
    use_buildup: bool = True


class ProfileRequest(BaseModel):
    material: str
    energy_MeV: float = 1.25
    x_max_cm: float = 30.0
    use_buildup: bool = True


@app.get("/optimize/materials")
def list_materials():
    """사용 가능한 차폐 재질 목록."""
    return {
        k: {"name": v["name"], "density_g_cm3": v["density"]}
        for k, v in MATERIAL_DATA.items()
    }


@app.get("/optimize/sources")
def list_sources():
    """선원 에너지 프리셋 목록."""
    return SOURCE_PRESETS


@app.post("/optimize/thickness")
def calc_thickness(req: ThicknessRequest):
    """
    목표 차폐율 달성에 필요한 두께 계산.
    예: 납으로 Cs-137을 10% 투과(90% 차폐)하려면?
    """
    if req.material not in MATERIAL_DATA:
        raise HTTPException(400, f"알 수 없는 재질: {req.material}. /optimize/materials 참고")
    try:
        return required_thickness(
            mat_key=req.material,
            dose_reduction=req.dose_reduction,
            energy_MeV=req.energy_MeV,
            use_buildup=req.use_buildup,
        )
    except ValueError as e:
        raise HTTPException(400, str(e))


@app.post("/optimize/multilayer")
def calc_multilayer(req: MultilayerRequest):
    """
    다층 차폐체 총 두께 고정 → 재질별 최적 두께 배분 (scipy.minimize).
    """
    for m in req.materials:
        if m not in MATERIAL_DATA:
            raise HTTPException(400, f"알 수 없는 재질: {m}")
    try:
        return optimize_multilayer(
            materials=req.materials,
            total_thickness_cm=req.total_thickness_cm,
            energy_MeV=req.energy_MeV,
            use_buildup=req.use_buildup,
        )
    except ValueError as e:
        raise HTTPException(400, str(e))


@app.post("/optimize/profile")
def calc_profile(req: ProfileRequest):
    """두께에 따른 선량 프로파일 (프론트 그래프 데이터)."""
    if req.material not in MATERIAL_DATA:
        raise HTTPException(400, f"알 수 없는 재질: {req.material}")
    return dose_profile(
        mat_key=req.material,
        energy_MeV=req.energy_MeV,
        x_max_cm=req.x_max_cm,
        use_buildup=req.use_buildup,
    )


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
