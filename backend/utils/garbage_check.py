#from transformers import pipeline
from MLModels.models import get_classifier

# 1) Load the same BART-MNLI zero-shot pipeline
classifier = get_classifier()

def is_academic_query(query: str, threshold: float = 0.30) -> bool:
    """
    Returns True if the zero-shot classifier thinks `query` is more like an 'academic question'
    than 'trolling or off-topic', with probability >= threshold.
    """
    if not query.strip():
        return False

    result = classifier(
        sequences=query,
        candidate_labels=["academic question", "trolling or off-topic"],
        multi_label=False
    )

    labels = result["labels"]
    scores = result["scores"]
    try:
        acad_score = scores[labels.index("academic question")]
    except ValueError:
        acad_score = 0.0
    print(f"score: {acad_score}")
    return acad_score >= threshold
