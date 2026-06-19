from langchain_community.vectorstores import FAISS

from rag.embeddings import get_embeddings


def create_vector_store(chunks):
    embeddings = get_embeddings()

    vector_store = FAISS.from_documents(
        documents=chunks,
        embedding=embeddings
    )

    return vector_store