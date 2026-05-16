from sklearn.cluster import KMeans
import numpy as np

def classify_by_global(papers, k=3):
    # Collect global embeddings
    embeddings = [np.array(p["global_embedding"]) for p in papers]
    # titles = [np.array(p["name"]) for p in papers]
    # print(titles)
    # Fit KMeans clustering
    km = KMeans(n_clusters=k, random_state=42)
    labels = km.fit_predict(embeddings)

    # Group papers by cluster label
    clusters = {i: [] for i in range(k)}
    for label, paper in zip(labels, papers):
     
        clusters[label].append(paper.get("name", "Untitled Paper"))

    return clusters


