#from sentence_transformers import SentenceTransformer
import numpy as np
from MLModels.models import get_embedding_query_model


def _clean_section_text(section):
    if not isinstance(section, dict) or not section:
        return ""
    value = next(iter(section.values()))
    if value is None:
        return ""
    if isinstance(value, list):
        value = " ".join(str(v).strip() for v in value if v and str(v).strip())
    text = str(value).strip()
    return "" if text.lower() == "not found" else text


def _normalize_vector(vec):
    norm = np.linalg.norm(vec)
    if norm == 0:
        return vec
    return vec / norm


# embedding JSON file
def add_embeddings(paper_json):
    
    model = get_embedding_query_model()
    processed_paper = paper_json.copy()

    # 1. Extract fields
    title = paper_json.get("name", "")
    authors = ", ".join([a.get("name", "") for a in paper_json.get("author", [])])
    summaries = "\n".join(paper_json.get("summaries", {}).values())
    global_summary = paper_json.get("global_summary", "")
    valid_bodies = []
    sections = []
    for section in paper_json.get("articleBody", []):
        if not isinstance(section, dict) or not section:
            continue
        section_name = next(iter(section))
        text = _clean_section_text(section)
        if text:
            valid_bodies.append({section_name: text})
            sections.append(text)

    # prepare embedding sections for overall paper search
    global_text = "\n".join([
        title,
        authors,
        summaries,
        global_summary,
    ] + sections)

    
    # 4. Generate embeddings
    #4.1 Section embeddings
    if not sections:
        fallback = " ".join([title, authors, summaries, global_summary]).strip()
        sections = [fallback or title or "Uploaded paper"]
        valid_bodies = [{"SUMMARY": sections[0]}]

    section_embeddings = model.encode(sections, convert_to_numpy=True)
    #4.2 normalize embeddings
    section_norms = np.linalg.norm(section_embeddings, axis=1, keepdims=True)
    section_norms[section_norms == 0] = 1
    section_embeddings = section_embeddings / section_norms
    #4.3 Global embedding
    global_embedding = model.encode(global_text, convert_to_numpy=True)
    #4.4 normalize global embedding
    global_embedding = _normalize_vector(global_embedding)
 
    # 5. Add embeddings to the processed paper
    processed_paper["articleBody"] = valid_bodies
    processed_paper["embeddings"]=section_embeddings.tolist()
    processed_paper["global_embedding"] = global_embedding.tolist()
    

    return processed_paper
