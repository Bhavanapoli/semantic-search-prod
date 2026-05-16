import json
from transformers import pipeline
from MLModels.models import get_summarizer

# Load the summarization model based on the specified language
def add_summaries(paper_json, paper_id):
    processed_paper = paper_json.copy()
    # get the language of the doc
    lang = processed_paper.get("inLanguage", "en")
    # summarize each section and entire doc
    summarizer = get_summarizer(lang)
    
    summaries = {}
    all_text = []

    for section in processed_paper.get("articleBody", []):
        section_name, section_text = list(section.items())[0]

        # Skip if section is "Not found" or empty
        if section_text is None or (
            isinstance(section_text, str)
            and section_text.strip().lower() == "not found"
        ):
            continue

        if isinstance(section_text, list):
            section_text = " ".join(
                s for s in section_text if s and str(s).strip().lower() != "not found"
            )

        if isinstance(section_text, str) and section_text.strip():
            clean_text = section_text.strip()
            # If text is too short, use as is
            if len(clean_text) < 100:
                summaries[section_name.upper()] = clean_text
                all_text.append(clean_text)
                continue
            try:
                summary = summarizer(
                    clean_text[:4000],
                    max_length=150,
                    min_length=100,
                    truncation=True,
                )[0]["summary_text"]
                summaries[section_name.upper()] = summary
                all_text.append(clean_text)
            except Exception as e:
                print(f"⚠️ Skipping section '{section_name}': {e}")
                continue

    # Global summary (combined full text, limited to 4000 characters)
    full_text = " ".join(all_text)
    try:
        global_summary = summarizer(full_text[:4000], max_length=300, min_length=200)[
            0
        ]["summary_text"]
    except Exception as e:
        print(f"⚠️ Skipping global summary: {e}")
        global_summary = ""

    processed_paper["summaries"] = summaries
    processed_paper["global_summary"] = global_summary
    

    return processed_paper



