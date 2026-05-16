from functools import lru_cache
from transformers import pipeline
from sentence_transformers import SentenceTransformer


@lru_cache(maxsize=1)
def get_embedding_query_model():
    """
    Loads the SentenceTransformer model for encoding queries.
    Cached to avoid reloading on every query.
    """
    return SentenceTransformer("paraphrase-multilingual-MiniLM-L12-v2", device="cpu")


@lru_cache(maxsize=1)
def get_classifier():
    """
    Loads the zero-shot classification model for detecting academic queries.
    Cached to avoid reloading on every query.
    """
    return pipeline("zero-shot-classification", model="facebook/bart-large-mnli")


@lru_cache(maxsize=4)
def get_summarizer(lang="en"):
    """
    Loads the summarization model based on the specified language.
    Cached to avoid reloading on every request.
    """
    if lang == "en":
        return pipeline("summarization", model="facebook/bart-large-cnn")
    else:
        # Supports multilingual (e.g. Swedish)
        return pipeline(
            "summarization", model="facebook/mbart-large-50-many-to-many-mmt"
        )
