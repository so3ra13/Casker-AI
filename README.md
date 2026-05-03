# ShieldingAI 🛡️

> **MCNP 핵차폐 설계 자동화를 위한 AI 기반 웹 플랫폼**  
> 2025 엔지니어링산업 경진대회 출품작 · 주제 D — 디지털 기반 안전·신뢰 엔지니어링

---

## 목차

1. [프로젝트 개요](#1-프로젝트-개요)
2. [기술 스택](#2-기술-스택)
3. [폴더 구조](#3-폴더-구조)
4. [프론트엔드 설치 및 실행](#4-프론트엔드-설치-및-실행)
5. [백엔드 설치 및 실행](#5-백엔드-설치-및-실행)
6. [RAG 챗봇 구축 방법](#6-rag-챗봇-구축-방법)
7. [기능 설명](#7-기능-설명)
8. [개발 계획 및 TODO](#8-개발-계획-및-todo)
9. [검증 계획](#9-검증-계획)
10. [협업 규칙](#10-협업-규칙)

---

## 1. 프로젝트 개요

### 배경
국내 사용후핵연료 습식 저장조의 포화가 임박하면서 **건식저장용기(Cask)** 대규모 확충이 국가 과제로 대두되고 있습니다.  
차폐 설계의 세계 표준 도구인 **MCNP**는 1970년대부터 사용된 텍스트(메모장) 기반 입력 방식을 고수하고 있어 구조적인 문제를 가집니다.

### 문제
| 문제 | 내용 | 근거 |
|------|------|------|
| 인적 오류 | 좌표 겹침(Overlap), 밀도 부호 오기입 등 치명적 오류 | MCNP User's Manual (LANL) |
| 시간 낭비 | 전처리 수작업이 전체 프로젝트 시간의 **70~80%** 차지 | SuperMC 논문 서론 (2015) |
| 과잉 차폐 | 시행착오식 설계 → 보수적 두께 → 건축 자원·탄소 낭비 | 유전알고리즘 기반 최적화 논문 (2018) |
| 방사선 과소평가 | 미세 기하학적 오류로 방사선이 틈새로 새어나감 | JAEA-Research (2008) |

### 해결 방안
동적 GUI · 실시간 3D 렌더링 · RAG 챗봇 · AI 역설계를 결합한 **웹 기반 차폐 설계 플랫폼**

---

## 2. 기술 스택

### 프론트엔드 (`shielding-ai/`)
| 기술 | 용도 |
|------|------|
| React 18 | UI 컴포넌트 |
| styled-components | 다크테마 스타일링 |
| Zustand | 전역 상태 관리 (셀/서페이스/재질 등) |
| React Three Fiber | 3D Cask 실시간 렌더링 |
| @react-three/drei | OrbitControls 등 3D 헬퍼 |
| Vite | 빌드 도구 |

### 백엔드 (`shielding-backend/`)
| 기술 | 용도 |
|------|------|
| FastAPI | REST API 서버 |
| Gemini 1.5 Pro | LLM 추론 엔진 |
| LangChain | RAG 파이프라인 |
| ChromaDB | 로컬 벡터 DB (MCNP 매뉴얼 임베딩) |
| SciPy | Buildup Factor 역산 (역설계 엔진) |
| Scikit-learn | Surrogate Model (추후 구현) |
| Jinja2 | MCNP .i 파일 템플릿 생성 |

---

## 3. 폴더 구조

```
project/
├── shielding-ai/                   # 프론트엔드 (React)
│   ├── src/
│   │   ├── App.jsx                 # 루트 컴포넌트, 탭 전환
│   │   ├── main.jsx
│   │   ├── theme.js                # 색상/스타일 CSS 변수 및 공통 컴포넌트
│   │   ├── store/
│   │   │   └── mcnpStore.js        # Zustand 전역 상태 (셀/서페이스/재질/격자 등)
│   │   ├── utils/
│   │   │   ├── constants.js        # SURF_PARAMS, MAT_DB, ICRP21 데이터
│   │   │   ├── codeGen.js          # MCNP 코드 생성 + 컬럼 정렬 로직
│   │   │   ├── parser.js           # Tab2 업로드 파일 파싱 (오류 감지)
│   │   │   └── buildCaskLayers.js  # 셀/서페이스 → Three.js 레이어 변환
│   │   └── components/
│   │       ├── CollapsibleCard.jsx # 접이식 카드 공통 컴포넌트
│   │       ├── Topbar.jsx          # 상단 탭 바
│   │       ├── tab1/               # Tab1: Design & View
│   │       │   ├── Tab1.jsx        # 3열 레이아웃
│   │       │   ├── CodePreview.jsx # 실시간 MCNP 코드 미리보기
│   │       │   ├── ViewerChat.jsx  # Three.js 3D 뷰어 + RAG 챗봇
│   │       │   └── cards/
│   │       │       ├── CellCard.jsx    # Cell 카드 입력
│   │       │       ├── SurfaceCard.jsx # Surface 카드 입력
│   │       │       └── DataCard.jsx    # Data 카드 (MODE/재질/선원/NPS)
│   │       ├── tab2/               # Tab2: Optimization & Validation
│   │       │   └── Tab2.jsx        # 파일 업로드/해석/시각화/역설계 챗봇
│   │       └── slide/              # 세부조정 슬라이드 패널
│   │           ├── SlidePanel.jsx  # 슬라이드 패널 컨테이너
│   │           ├── LatticeEditor.jsx # Lattice/Universe 격자 편집기
│   │           └── TallyEditor.jsx   # IMP/Tally/FMESH/SI-SP/KSRC
│   ├── package.json
│   ├── vite.config.js              # @ 절대경로 alias 설정
│   └── index.html
│
└── shielding-backend/              # 백엔드 (Python FastAPI)
    ├── main.py                     # API 서버 엔드포인트
    ├── rag.py                      # RAG 파이프라인 (ChromaDB)
    ├── requirements.txt
    ├── .env                        # API 키 (Git에 올리지 말 것!)
    └── pdfs/                       # MCNP 매뉴얼 PDF 보관 폴더
```

---

## 4. 프론트엔드 설치 및 실행

### 사전 요구사항
- Node.js 18 이상 ([nodejs.org](https://nodejs.org) LTS 다운로드)

### 설치

```bash
cd shielding-ai
npm install
npm run dev
```

브라우저에서 `http://localhost:5173` 접속

### PowerShell 실행 정책 오류 시

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

---

## 5. 백엔드 설치 및 실행

### 사전 요구사항
- Python 3.10 이상
- Gemini API 키 ([aistudio.google.com](https://aistudio.google.com) → Get API Key)

### 설치

```bash
cd shielding-backend

# 가상환경 생성 및 활성화
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # Mac/Linux

pip install -r requirements.txt
```

### 환경변수 설정

`shielding-backend/.env` 파일 생성:

```
GEMINI_API_KEY=여기에_키_붙여넣기
```

> ⚠️ `.env` 파일은 절대 GitHub에 올리면 안 됩니다. `.gitignore`에 추가하세요.

### 서버 실행

```bash
uvicorn main:app --reload --port 8000
```

브라우저에서 `http://localhost:8000/health` 접속해서 아래가 나오면 성공:

```json
{"status": "ok", "vectordb": false, "model": "gemini-1.5-pro"}
```

---

## 6. RAG 챗봇 구축 방법

### PDF 준비

`shielding-backend/pdfs/` 폴더에 PDF 파일 넣기:

```
pdfs/
├── MCNP6_manual.pdf          # MCNP 매뉴얼
└── (원자력법령 등 추가 가능)
```

> ⚠️ MCNP 매뉴얼은 수출통제(Export Control) 대상일 수 있습니다.  
> 교수님께 사용 범위를 먼저 확인하세요.  
> ChromaDB는 로컬에만 저장되므로 외부 유출 없습니다.

### 벡터 DB 구축 (최초 1회, 수 분 소요)

서버가 실행 중인 상태에서:

```bash
# Windows PowerShell
Invoke-WebRequest -Uri http://localhost:8000/build-db -Method POST

# 또는 curl
curl -X POST http://localhost:8000/build-db
```

완료되면 `shielding-backend/chroma_db/` 폴더가 생성됩니다.  
이후부터는 서버 시작 시 자동으로 로드됩니다.

### 동작 방식

```
사용자 질문
    ↓
ChromaDB에서 관련 청크 Top-4 검색 (코사인 유사도)
    ↓
[참고 문서] + [현재 설계 상태] + 질문 → Gemini 1.5 Pro
    ↓
답변 + 출처(파일명 + 페이지) 반환
```

---

## 7. 기능 설명

### Tab1 — Design & View

**3열 레이아웃:**
- 1열: 카드 입력 (Cell → Surface → Data 순서, MCNP 문법과 동일)
- 2열: MCNP 코드 실시간 미리보기 (줄번호 + 문법 하이라이팅)
- 3열: 3D Cask 렌더링 + RAG 챗봇

**Cell 카드:**
- 타입 선택: 일반 / Lattice / Fill / 경계(Boundary)
- M# 드롭박스: 추가된 재질 목록에서 선택 → 밀도 자동 입력
- 삭제 시 1번부터 자동 재정렬

**Surface 카드:**
- 형상 선택: RCC / RPP / SPH / CZ / PZ 등 13종
- 선택에 따라 파라미터 입력 필드 동적 변경

**Data 카드:**
- 재질(M): 드롭박스 선택 후 "추가" → ZAID 내부 저장, 내보내기 시 자동 포함
- 선원: SDEF (차폐 모드) / KCODE (임계 모드) 전환
- 세부조정 슬라이드: IMP · Tally · SI/SP · FMESH · KSRC · Lattice 편집기

**코드 미리보기 정렬 규칙:**
- 각 컬럼 간 최소 3칸 공백
- 밀도값은 소수점 기준 우측 정렬
- Lattice fill 블록은 surf 컬럼 기준 들여쓰기

### Tab2 — Optimization & Validation

- 파일 업로드 (드래그&드롭 / 클릭)
- AI 해석: Cell/Surface/Material 수, NPS, MODE 파싱
- 오류 감지: 표면 번호 불일치(빨간), IMP 개수 불일치(노란)
- 코드 뷰어: 오류 줄 하이라이팅
- 역설계 챗봇: 업로드 파일 컨텍스트 인식 후 조언

### API 엔드포인트

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/health` | 서버 상태 확인 |
| POST | `/build-db` | PDF → ChromaDB 구축 |
| POST | `/chat/rag` | Tab1 RAG 챗봇 |
| POST | `/chat/optimize` | Tab2 역설계 챗봇 |

---

## 8. 개발 계획 및 TODO

### ✅ 완료
- [x] React 프론트엔드 기본 구조
- [x] Cell / Surface / Data 카드 동적 입력
- [x] MCNP 코드 실시간 생성 + 컬럼 정렬
- [x] .i 파일 내보내기
- [x] Three.js 3D Cask 렌더링 (셀/서페이스 연동)
- [x] Lattice/Universe 격자 편집기
- [x] Tab2 파일 업로드 + 오류 감지 파서
- [x] FastAPI 서버 기본 구조
- [x] Gemini API 연동 기본 챗봇
- [x] RAG 파이프라인 (LangChain + ChromaDB)

### 🔲 진행 중 / 예정

#### 단기 (대회 제출 전)
- [ ] **검증 코드 작성** — Buildup Factor Python 계산 + 그래프 (최우선)
- [ ] RAG 챗봇 실제 테스트 (PDF 넣고 답변 품질 확인)
- [ ] Tab2 역설계 챗봇 실제 연동 테스트
- [ ] 설문조사 실시 (MCNP 경험자 대상, 진입장벽 등)
- [ ] 포스터 완성 (검증 그래프 포함)

#### 중기 (역설계 엔진)
- [ ] `/chat/optimize` 에 SciPy Buildup Factor 역산 실제 연동
- [ ] Surrogate Model 학습 데이터 생성 (1,200개)
- [ ] Scikit-learn RandomForest 대리 모델 구현
- [ ] 역설계 결과 → MCNP 코드 자동 제안

#### 장기 (서비스화)
- [ ] Docker 컨테이너화
- [ ] 사용자 인증 + 설계 이력 저장 (PostgreSQL)
- [ ] 온프레미스 배포 (폐쇄망 지원)

---

## 9. 검증 계획

> 대회 규정: "실험·시뮬레이션·데이터 분석 등 최소 검증 1종 이상 필수"

### 검증 방법: Buildup Factor 해석 역산

**물리 수식:**
```
D(x) = D₀ · B(μx) · exp(-μx)

D₀ : 초기 선량률
B   : Buildup Factor (GP fitting, ANSI/ANS-6.4.3)
μ   : 감쇠계수 (재질·에너지별 고정값)
x   : 차폐 두께 (cm)
```

**구현 계획 (Python):**
```python
import numpy as np
from scipy.optimize import brentq

# Co-60 (1.25 MeV), 납 차폐
mu_lead     = 0.657  # cm^-1
mu_concrete = 0.118  # cm^-1

# 목표 선량률 입력 → 필요 두께 역산
def required_thickness(D_target, D0, mu, material):
    def equation(x):
        B = buildup_factor(mu * x, material)
        return D0 * B * np.exp(-mu * x) - D_target
    return brentq(equation, 0, 200)
```

**검증 내용:**
1. 납 두께별(0~30cm) 선량 감쇠 곡선 계산
2. 콘크리트 두께별 선량 감쇠 곡선 계산
3. 기존 경험적 과잉 설계 두께 vs 역산 최적 두께 비교표
4. 차폐재 절감량 → CO₂ 환산 (내재탄소)

**기대 결과:**
- 과잉 설계 대비 납 5~15% 절감 가능 근거 수치화
- 포스터 그래프로 직접 활용

---

## 10. 협업 규칙

### Git 브랜치 전략

```
main          ← 발표/제출용 안정 버전
├── dev       ← 개발 통합 브랜치
│   ├── feat/rag-chatbot     (RAG 챗봇 개발)
│   ├── feat/optimize-engine (역설계 엔진)
│   └── feat/verification    (검증 코드)
```

### 커밋 메시지 규칙

```
feat: 새 기능 추가
fix:  버그 수정
docs: 문서 수정
style: 코드 스타일 변경 (기능 변경 없음)
refactor: 리팩토링

예시:
feat: Tab2 역설계 챗봇 API 연동
fix: Surface 카드 삭제 시 재정렬 오류 수정
```

### .gitignore 필수 항목

```
# .gitignore
node_modules/
.env
shielding-backend/chroma_db/
shielding-backend/venv/
__pycache__/
*.pyc
dist/
```

### 역할 분담 (제안)

| 역할 | 담당 |
|------|------|
| 프론트엔드 UI/UX | |
| 백엔드 + RAG 챗봇 | |
| 역설계 엔진 (Python 계산) | |
| 검증 코드 + 그래프 | |
| 포스터 + 발표 자료 | |

### 매일 동기화

```bash
# 작업 시작 전
git pull origin dev

# 작업 완료 후
git add .
git commit -m "feat: 작업 내용"
git push origin feat/브랜치명
```

---

## 참고 문헌

| 논문/자료 | 내용 |
|-----------|------|
| McCad (KIT, 2013) | CAD→MCNP 자동 변환, 텍스트 입력의 비효율 명시 |
| SuperMC (中科院, 2015) | 전처리 수작업이 전체 시간의 70~80% |
| DAGMC (UW-Madison) | 입자 소실(Lost Particle) 방지 프로젝트 |
| JAEA-Research (2008) | 기하학적 오류로 인한 방사선 과소평가 보고 |
| Yao Cai et al. (2018) | 유전알고리즘 + MCNP 차폐 최적화 |
| M. Arif Sazali et al. (2022) | Python 래퍼로 MCNP 계산 시간 단축 |
| MCNP User's Manual (LANL) | Fatal Errors 섹션 — 밀도 부호 혼동 경고 |
| ANSI/ANS-6.4.3 | Buildup Factor 계수 데이터 |
