from langchain_openai import OpenAIEmbeddings

DEFAULT_MODEL = "text-embedding-3-small"


def get_embeddings(api_key: str, model: str = DEFAULT_MODEL) -> OpenAIEmbeddings:
    return OpenAIEmbeddings(openai_api_key=api_key, model=model)
