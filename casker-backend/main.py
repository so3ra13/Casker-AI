import json
import os
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import google.generativeai as genai

from embeddings import GeminiEmbeddings
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_chroma import Chroma
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough, Runnable

load_dotenv()

# ---------------------------------------------------------------------------
# Gemini configuration
# ---------------------------------------------------------------------------
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise RuntimeError("GEMINI_API_KEY is not set in .env")

genai.configure(api_key=GEMINI_API_KEY)

GEMINI_MODEL = "gemini-1.5-pro"

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
BASE_DIR = Path(__file__).parent
PDF_PATH = BASE_DIR / "pdfs" / "MCNP6.3 메뉴얼.pdf"
CHROMA_DIR = BASE_DIR / "chroma_db"

# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------
app = FastAPI(title="Casker-AI Backend", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# RAG chain (LCEL, lazy-initialised on first request)
# ---------------------------------------------------------------------------
_rag_chain: Optional[Runnable] = None

RAG_PROMPT = ChatPromptTemplate.from_messages([
    (
        "system",
        "당신은 MCNP 핵 차폐 설계 전문가입니다. "
        "아래 MCNP 6.3 메뉴얼 컨텍스트를 참고하여 정확하게 답변하세요. "
        "컨텍스트에 없는 내용은 모른다고 말하세요.\n\n"
        "[컨텍스트]\n{context}",
    ),
    ("human", "{question}"),
])


def _format_docs(docs) -> str:
    return "\n\n".join(doc.page_content for doc in docs)


def _build_rag_chain() -> Runnable:
    """MCNP 메뉴얼 PDF를 ChromaDB에 임베딩하고 LCEL RAG 체인을 반환한다."""
    embeddings = GeminiEmbeddings(api_key=GEMINI_API_KEY)

    if CHROMA_DIR.exists():
        vectorstore = Chroma(
            persist_directory=str(CHROMA_DIR),
            embedding_function=embeddings,
        )
    else:
        if not PDF_PATH.exists():
            raise FileNotFoundError(f"PDF not found: {PDF_PATH}")

        loader = PyPDFLoader(str(PDF_PATH))
        docs = loader.load()

        splitter = RecursiveCharacterTextSplitter(chunk_size=1500, chunk_overlap=200)
        chunks = splitter.split_documents(docs)

        vectorstore = Chroma.from_documents(
            documents=chunks,
            embedding=embeddings,
            persist_directory=str(CHROMA_DIR),
        )

    llm = ChatGoogleGenerativeAI(
        model=GEMINI_MODEL,
        google_api_key=GEMINI_API_KEY,
        temperature=0.2,
    )

    retriever = vectorstore.as_retriever(search_kwargs={"k": 5})

    return (
        {"context": retriever | _format_docs, "question": RunnablePassthrough()}
        | RAG_PROMPT
        | llm
        | StrOutputParser()
    )


def get_rag_chain() -> Runnable:
    global _rag_chain
    if _rag_chain is None:
        _rag_chain = _build_rag_chain()
    return _rag_chain


# ---------------------------------------------------------------------------
# Request / Response models
# ---------------------------------------------------------------------------
class RagRequest(BaseModel):
    message: str
    mcnp_context: Optional[str] = None  # 에디터의 현재 MCNP 코드


class OptimizeRequest(BaseModel):
    message: str
    mcnp_input: Optional[str] = None    # 업로드된 MCNP 입력 파일 원문
    parsed_data: Optional[dict] = None  # Tab2 파서가 추출한 구조화 데이터


class ChatResponse(BaseModel):
    answer: str


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------
@app.get("/health")
def health():
    return {"status": "ok", "model": GEMINI_MODEL}


@app.post("/chat/rag", response_model=ChatResponse)
async def chat_rag(req: RagRequest):
    """Tab 1 — MCNP 메뉴얼 기반 지식 Q&A."""
    try:
        chain = get_rag_chain()

        question = req.message
        if req.mcnp_context:
            question = f"[현재 MCNP 코드]\n{req.mcnp_context}\n\n[질문]\n{req.message}"

        answer = chain.invoke(question)
        return ChatResponse(answer=answer)

    except FileNotFoundError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"RAG error: {e}")


@app.post("/chat/optimize", response_model=ChatResponse)
async def chat_optimize(req: OptimizeRequest):
    """Tab 2 — 업로드된 MCNP 파일 역설계 및 최적화 채팅."""
    try:
        llm = ChatGoogleGenerativeAI(
            model=GEMINI_MODEL,
            google_api_key=GEMINI_API_KEY,
            temperature=0.3,
        )

        system_prompt = (
            "당신은 핵 차폐 설계 전문가입니다. "
            "사용자가 제공한 MCNP 입력 파일 또는 설계 데이터를 분석하여 "
            "정확성, 차폐 성능, MCNP 모범 사례 관점에서 답변하세요. "
            "사용자가 쓰는 언어로 응답하세요."
        )

        context_parts: list[str] = []
        if req.mcnp_input:
            context_parts.append(f"[MCNP 입력 파일]\n{req.mcnp_input}")
        if req.parsed_data:
            context_parts.append(
                f"[파싱된 설계 데이터]\n{json.dumps(req.parsed_data, ensure_ascii=False, indent=2)}"
            )

        user_message = "\n\n".join(context_parts + [req.message]) if context_parts else req.message

        response = llm.invoke([
            SystemMessage(content=system_prompt),
            HumanMessage(content=user_message),
        ])

        return ChatResponse(answer=response.content)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Optimize error: {e}")


# ---------------------------------------------------------------------------
# Entry point (development)
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
