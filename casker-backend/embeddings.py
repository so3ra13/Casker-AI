"""
google-genai (신 SDK) 를 사용하는 커스텀 임베딩 클래스.

- 배치 임베딩: 최대 _MAX_BATCH 개씩 묶어 API 호출 횟수를 최소화.
- 일일 한도 초과(PerDay quota)는 즉시 DailyQuotaExceeded 예외로 변환.
- RPM 한도 초과는 지수 백오프 재시도.
- 배치 간 _BATCH_SLEEP 초 대기로 RPM 초과 방지.
"""

import time
from google import genai
from google.genai import types
from langchain_core.embeddings import Embeddings

_MAX_BATCH   = 20    # 한 번에 보낼 최대 텍스트 수
_MAX_RETRY   = 4     # RPM 초과 시 최대 재시도 횟수
_BATCH_SLEEP = 3.0   # 배치 간 대기 시간(초)


class DailyQuotaExceeded(RuntimeError):
    """무료 플랜 하루 API 호출 한도 초과."""


class GeminiEmbeddings(Embeddings):
    def __init__(self, api_key: str, model: str = "models/gemini-embedding-001"):
        self._client = genai.Client(api_key=api_key)
        self._model = model

    def _batch_embed(self, texts: list[str], task_type: str) -> list[list[float]]:
        results: list[list[float]] = []
        for i, start in enumerate(range(0, len(texts), _MAX_BATCH)):
            chunk = texts[start : start + _MAX_BATCH]
            for attempt in range(_MAX_RETRY):
                try:
                    resp = self._client.models.embed_content(
                        model=self._model,
                        contents=chunk,
                        config=types.EmbedContentConfig(task_type=task_type),
                    )
                    results.extend(e.values for e in resp.embeddings)
                    break
                except Exception as e:
                    msg = str(e)
                    if "429" in msg or "RESOURCE_EXHAUSTED" in msg:
                        # 일일 한도 초과 → 재시도해도 소용없으므로 즉시 종료
                        if "PerDay" in msg or "per_day" in msg.lower():
                            raise DailyQuotaExceeded(
                                "하루 임베딩 API 호출 한도(1000회)가 소진됐습니다.\n"
                                "내일 다시 실행하면 이어서 진행됩니다 (r 선택)."
                            ) from e
                        # RPM 초과 → 대기 후 재시도
                        if attempt == _MAX_RETRY - 1:
                            raise
                        wait = min(2 ** attempt * 15, 120)
                        print(f"\n      RPM 초과 — {wait}s 대기 후 재시도 ({attempt+1}/{_MAX_RETRY})...")
                        time.sleep(wait)
                    else:
                        raise
            if i > 0:
                time.sleep(_BATCH_SLEEP)
        return results

    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        if not texts:
            return []
        return self._batch_embed(texts, "RETRIEVAL_DOCUMENT")

    def embed_query(self, text: str) -> list[float]:
        return self._batch_embed([text], "RETRIEVAL_QUERY")[0]
