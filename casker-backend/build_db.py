"""
ChromaDB 구축 스크립트
pdfs/ 폴더의 PDF를 읽어 임베딩 후 chroma_db/ 에 저장한다.
중간에 중단됐을 경우 이어서 진행(resume)할 수 있다.

실행:
    python build_db.py
"""

import os
import shutil
import sys
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    print("[ERROR] .env 에 GEMINI_API_KEY 가 설정되지 않았습니다.")
    sys.exit(1)

BASE_DIR = Path(__file__).parent
PDF_DIR = BASE_DIR / "pdfs"
CHROMA_DIR = BASE_DIR / "chroma_db"

CHUNK_SIZE = 1500
CHUNK_OVERLAP = 200
EMBED_MODEL = "models/gemini-embedding-001"
BATCH = 100


def main() -> None:
    # ── 1. Import ─────────────────────────────────────────────────────────────
    try:
        from langchain_community.document_loaders import PyPDFLoader
        from langchain_text_splitters import RecursiveCharacterTextSplitter
        from langchain_chroma import Chroma
        from embeddings import GeminiEmbeddings
    except ImportError as e:
        print(f"[ERROR] 패키지 미설치: {e}")
        print("  → pip install -r requirements.txt 를 먼저 실행하세요.")
        sys.exit(1)

    # ── 2. PDF 목록 확인 ──────────────────────────────────────────────────────
    pdf_files = sorted(PDF_DIR.glob("*.pdf"))
    if not pdf_files:
        print(f"[ERROR] {PDF_DIR} 에 PDF 파일이 없습니다.")
        sys.exit(1)

    print("=== Casker-AI ChromaDB 빌더 ===\n")
    print(f"발견된 PDF ({len(pdf_files)}개):")
    for p in pdf_files:
        size_mb = p.stat().st_size / 1_048_576
        print(f"  • {p.name}  ({size_mb:.1f} MB)")

    # ── 3. 기존 DB 확인 (resume / 재구축 / 중단 선택) ─────────────────────────
    embeddings = GeminiEmbeddings(api_key=GEMINI_API_KEY, model=EMBED_MODEL)
    vectorstore = None
    resume_from = 0

    if CHROMA_DIR.exists():
        existing = Chroma(persist_directory=str(CHROMA_DIR), embedding_function=embeddings)
        existing_count = existing._collection.count()

        print(f"\n[경고] {CHROMA_DIR} 가 이미 존재합니다. (저장된 벡터: {existing_count}개)")
        print("  r) 이어서 진행 (resume)")
        print("  y) 삭제 후 재구축")
        print("  n) 중단")
        answer = input("선택 [r/y/N]: ").strip().lower()

        if answer == "r":
            vectorstore = existing
            resume_from = existing_count
            print(f"  {resume_from}번째 청크부터 이어서 진행합니다.")
        elif answer == "y":
            del existing
            shutil.rmtree(CHROMA_DIR)
            print("  기존 DB 삭제 완료.")
        else:
            print("중단합니다.")
            sys.exit(0)

    # ── 4. PDF 로드 & 청킹 ────────────────────────────────────────────────────
    all_chunks = []
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
    )

    for pdf_path in pdf_files:
        print(f"\n[1/3] 로딩: {pdf_path.name}")
        loader = PyPDFLoader(str(pdf_path))
        pages = loader.load()
        print(f"      {len(pages)} 페이지 로드 완료")

        chunks = splitter.split_documents(pages)
        print(f"      → {len(chunks)} 청크 생성 (chunk_size={CHUNK_SIZE}, overlap={CHUNK_OVERLAP})")
        all_chunks.extend(chunks)

    total = len(all_chunks)
    print(f"\n  총 청크 수: {total}")

    if resume_from >= total:
        print(f"\n이미 모든 청크가 저장되어 있습니다. ({resume_from}/{total})")
        print(f"  저장 경로 : {CHROMA_DIR}")
        return

    # ── 5. 임베딩 & ChromaDB 저장 ─────────────────────────────────────────────
    remaining = total - resume_from
    print(f"\n[2/3] 임베딩 중... (Gemini {EMBED_MODEL})")
    print(f"      처리 대상: {remaining}개 청크 ({resume_from}번째부터)")

    chunks_to_process = all_chunks[resume_from:]

    try:
        for i in range(0, len(chunks_to_process), BATCH):
            batch = chunks_to_process[i : i + BATCH]
            done = resume_from + i + len(batch)
            print(f"      {done}/{total} 청크 처리 중...", end="\r")

            if vectorstore is None:
                vectorstore = Chroma.from_documents(
                    documents=batch,
                    embedding=embeddings,
                    persist_directory=str(CHROMA_DIR),
                )
            else:
                vectorstore.add_documents(batch)
    except Exception as e:
        from embeddings import DailyQuotaExceeded
        print()
        if isinstance(e, DailyQuotaExceeded) or "DailyQuotaExceeded" in type(e).__name__:
            saved = vectorstore._collection.count() if vectorstore else resume_from
            print(f"\n[중단] {e}")
            print(f"  현재 저장된 벡터: {saved} / {total}")
            print(f"  내일 다시 실행 후 'r' 을 선택하면 {saved}번째부터 이어서 진행됩니다.")
            sys.exit(0)
        raise

    print()

    # ── 6. 결과 확인 ─────────────────────────────────────────────────────────
    print(f"\n[3/3] 완료!")
    count = vectorstore._collection.count()
    print(f"  저장 경로 : {CHROMA_DIR}")
    print(f"  저장 벡터 수 : {count} / {total}")
    if count < total:
        print(f"\n  [주의] {total - count}개 청크가 미저장됐습니다. 다시 실행하면 이어서 진행됩니다.")
    else:
        print("\nChromaDB 구축 성공. 이제 python main.py 로 서버를 시작하세요.")


if __name__ == "__main__":
    main()
