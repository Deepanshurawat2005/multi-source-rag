from langchain_community.document_loaders import PyPDFLoader


def load_pdf(pdf_path):
    """
    Load PDF and return documents.
    """

    loader = PyPDFLoader(pdf_path)

    documents = loader.load()

    return documents