# MLModels

Copy your existing `MLModels/models.py` file here.

It should export:
- `get_embedding_query_model()` — returns the SentenceTransformer model
- `get_summarizer(lang)` — returns the HuggingFace summarization pipeline
- `get_classifier()` — returns the BART-MNLI zero-shot classifier
