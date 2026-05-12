"""
ChromaDB 구축 스크립트
pdfs/ 폴더의 PDF를 읽어 임베딩 후 chroma_db/ 에 저장한다.
중간에 중단됐을 경우 이어서 진행(resume)할 수 있다.

실행:
    python build_db.py
"""

import os
import shutil
import sqlite3
import sys
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    print("[ERROR] .env 에 OPENAI_API_KEY 가 설정되지 않았습니다.")
    sys.exit(1)

BASE_DIR = Path(__file__).parent
PDF_DIR  = BASE_DIR / "pdfs"
CHROMA_DIR = BASE_DIR / "chroma_db"

CHUNK_SIZE = 1500
CHUNK_OVERLAP = 200
EMBED_MODEL = "text-embedding-3-small"
BATCH = 100


def _count_sqlite(chroma_dir: Path) -> int:
    """Chroma 연결 없이 SQLite를 읽기전용 URI로 열어 저장된 벡터 수 반환.
    읽기전용 URI(immutable=1)는 WAL 파일을 생성하지 않아 파일 락이 걸리지 않는다."""
    db_path = chroma_dir / "chroma.sqlite3"
    if not db_path.exists():
        return 0
    conn = None
    try:
        uri = f"file:{db_path.as_posix()}?mode=ro&immutable=1"
        conn = sqlite3.connect(uri, uri=True, timeout=3)
        result = conn.execute("SELECT COUNT(*) FROM embeddings").fetchone()
        return result[0] if result else 0
    except Exception:
        return 0
    finally:
        if conn:
            try:
                conn.close()
            except Exception:
                pass


def main() -> None:
    # ── 1. Import ─────────────────────────────────────────────────────────────
    try:
        from langchain_community.document_loaders import PyPDFLoader
        from langchain_text_splitters import RecursiveCharacterTextSplitter
        from langchain_chroma import Chroma
        from embeddings import get_embeddings
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

    # ── 3. 기존 DB 확인 (Chroma 연결 없이 SQLite 직접 조회) ──────────────────
    embeddings = get_embeddings(api_key=OPENAI_API_KEY, model=EMBED_MODEL)
    vectorstore = None
    resume_from = 0

    if CHROMA_DIR.exists():
        existing_count = _count_sqlite(CHROMA_DIR)

        print(f"\n[경고] {CHROMA_DIR} 가 이미 존재합니다. (저장된 벡터: {existing_count}개)")
        print("  r) 이어서 진행 (resume)")
        print("  y) 삭제 후 재구축")
        print("  n) 중단")
        answer = input("선택 [r/y/N]: ").strip().lower()

        if answer == "r":
            resume_from = existing_count
            # resume 시에만 Chroma 연결 오픈
            vectorstore = Chroma(
                persist_directory=str(CHROMA_DIR),
                embedding_function=embeddings,
            )
            print(f"  {resume_from}번째 청크부터 이어서 진행합니다.")
        elif answer == "y":
            import gc, time
            gc.collect()
            # Windows에서 SQLite 파일 락 해제까지 재시도
            for attempt in range(10):
                try:
                    shutil.rmtree(CHROMA_DIR)
                    break
                except PermissionError:
                    if attempt == 9:
                        print("\n[ERROR] 파일이 잠겨 있어 삭제할 수 없습니다.")
                        print("  다른 프로세스(예: 이전 Python 창)가 chroma_db를 사용 중입니다.")
                        print("  해당 프로세스를 종료하고 다시 실행하세요.")
                        sys.exit(1)
                    time.sleep(0.5)
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

    # 핵단면적 테이블 등 쓰레기 청크 제거
    import re as _re
    _zero_run = _re.compile(r'(?:0\s){15,}')

    def _is_useful(text: str) -> bool:
        if len(text) < 80:
            return False
        if _zero_run.search(text):
            return False
        numeric = sum(1 for c in text if c.isdigit() or c in (' ', '\n', '\r', '.', 'E', '+', '-'))
        return numeric / len(text) < 0.72

    before = len(all_chunks)
    all_chunks = [c for c in all_chunks if _is_useful(c.page_content)]
    removed = before - len(all_chunks)
    if removed:
        print(f"  → 숫자 테이블 청크 {removed}개 제거됨")

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
        print()
        saved = _count_sqlite(CHROMA_DIR)
        print(f"\n[중단] {e}")
        print(f"  현재 저장된 벡터: {saved} / {total}")
        print(f"  다시 실행 후 'r' 을 선택하면 {saved}번째부터 이어서 진행됩니다.")
        raise

    print()

    # ── 6. 결과 확인 ─────────────────────────────────────────────────────────
    print(f"\n[3/3] 완료!")
    count = _count_sqlite(CHROMA_DIR)
    print(f"  저장 경로 : {CHROMA_DIR}")
    print(f"  저장 벡터 수 : {count} / {total}")
    if count < total:
        print(f"\n  [주의] {total - count}개 청크가 미저장됐습니다. 다시 실행하면 이어서 진행됩니다.")
    else:
        print("\nChromaDB 구축 성공. 이제 python main.py 로 서버를 시작하세요.")


if __name__ == "__main__":
    main()
