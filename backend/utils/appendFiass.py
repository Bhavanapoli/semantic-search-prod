import faiss
import numpy as np
import pickle
import os


def _read_index_or_empty(path, dim):
    if os.path.exists(path):
        return faiss.read_index(path)
    return faiss.IndexFlatIP(dim)


def _read_metadata_or_empty(path):
    if os.path.exists(path):
        with open(path, "rb") as f:
            data = pickle.load(f)
        return data if isinstance(data, list) else []
    return []


def _clean_text(value):
    if value is None:
        return ""
    if isinstance(value, list):
        return " ".join(str(v).strip() for v in value if v and str(v).strip())
    return str(value).strip()

def append_embeddings_to_faiss(
    new_paper_embeddings,
    global_idx_path,
    metadata_pkl_path,
    section_idx_path,
    section_pkl_path,
):
    first_global = next(
        (
            np.array(paper["global_embedding"], dtype=np.float32)
            for paper in new_paper_embeddings
            if paper and paper.get("global_embedding")
        ),
        None,
    )
    first_section = next(
        (
            np.array(sec_emb, dtype=np.float32)
            for paper in new_paper_embeddings
            if paper
            for sec_emb in paper.get("embeddings", [])
            if sec_emb
        ),
        first_global,
    )
    if first_global is None or first_section is None:
        raise ValueError("No embeddings were produced for this PDF")

    # Load existing indexes, or create them on the first upload.
    global_index = _read_index_or_empty(global_idx_path, int(first_global.shape[0]))
    global_metadata = _read_metadata_or_empty(metadata_pkl_path)
    section_index = _read_index_or_empty(section_idx_path, int(first_section.shape[0]))
    section_metadata = _read_metadata_or_empty(section_pkl_path)

    # -------- GLOBAL EMBEDDINGS --------
    for paper in new_paper_embeddings:
        if paper is None or "global_embedding" not in paper:
            print("Skipping invalid paper (no global embedding)")
            continue

        vec = np.array(paper["global_embedding"], dtype=np.float32).reshape(1, -1)
        norm = np.linalg.norm(vec)
        if norm == 0:
            continue
        vec = vec / norm
        global_index.add(vec)

        global_metadata.append({
            "title": paper.get("name", "Unknown"),
            "authors": [
                a.get("name") for a in paper.get("author", [])
                if isinstance(a, dict)
            ],
            "summary": paper.get("global_summary", ""),
            "uploaded_by": paper.get("uploaded_by"),
        })

    # -------- SECTION EMBEDDINGS --------
    for paper in new_paper_embeddings:
        if paper is None:
            continue

        title = paper.get("name", "")
        uploaded_by = paper.get("uploaded_by")
        bodies = paper.get("articleBody", [])
        embs = paper.get("embeddings", [])

        if not bodies or not embs:
            print(f"⚠️ Skipping sections for {title} (missing data)")
            continue

        for sec_dict, sec_emb in zip(bodies, embs):
            if not isinstance(sec_dict, dict) or len(sec_dict) != 1:
                continue

            sec_name = next(iter(sec_dict))
            sec_text = _clean_text(sec_dict[sec_name])
            if not sec_text or sec_text.lower() == "not found":
                continue

            try:
                vec = np.array(sec_emb, dtype=np.float32).reshape(1, -1)
                norm = np.linalg.norm(vec)
                if norm == 0:
                    continue
                vec = vec / norm
                section_index.add(vec)

                section_metadata.append({
                    "title": title,
                    "section_name": sec_name,
                    "section_text": sec_text,
                    "uploaded_by": uploaded_by,
                })

            except Exception as e:
                print(f"Error adding section: {e}")
                continue

    return global_index, global_metadata, section_index, section_metadata
