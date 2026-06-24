# from langchain_ollama import OllamaEmbeddings


# def get_embeddings():
#     return OllamaEmbeddings(
#         model="nomic-embed-text"
#     )

from langchain_huggingface import HuggingFaceEmbeddings


def get_embeddings():

    return HuggingFaceEmbeddings(
        model_name="sentence-transformers/all-MiniLM-L6-v2"
    )