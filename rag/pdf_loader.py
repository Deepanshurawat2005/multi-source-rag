import os
from langchain_community.document_loaders import PyPDFLoader

PDF_FOLDER = "data/uploaded_pdfs"

def load_all_pdfs():
    all_docs = []

    for file in os.listdir(PDF_FOLDER):

        if file.endswith(".pdf"):

            pdf_path = os.path.join(PDF_FOLDER, file)

            loader = PyPDFLoader(pdf_path)

            docs = loader.load()

            for doc in docs:
                doc.metadata["source_file"] = file

            all_docs.extend(docs)

    return all_docs