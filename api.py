from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os

from rag.pdf_loader import load_pdf
from rag.text_splitter import split_documents
from rag.vector_store import create_vector_store
from rag.retriever import get_retriever
from rag.rag_chain import get_rag_chain

from router.query_router import route_query

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_FOLDER = "data/uploaded_pdfs"

# =========================
# LOAD ALL PDFs ON STARTUP
# =========================

docs = []

if os.path.exists(UPLOAD_FOLDER):

    pdf_files = [
        f for f in os.listdir(UPLOAD_FOLDER)
        if f.endswith(".pdf")
    ]

    for pdf_file in pdf_files:

        pdf_path = os.path.join(
            UPLOAD_FOLDER,
            pdf_file
        )

        docs.extend(
            load_pdf(pdf_path)
        )

if len(docs) > 0:

    chunks = split_documents(docs)

    vector_store = create_vector_store(chunks)

    retriever = get_retriever(vector_store)

    rag_chain = get_rag_chain(retriever)

else:

    vector_store = None
    rag_chain = None


class ChatRequest(BaseModel):
    question: str


@app.get("/")
def root():
    return {"status": "running"}


@app.post("/api/chat")
async def chat(request: ChatRequest):

    response = route_query(
        question=request.question,
        vector_store=vector_store,
        rag_chain=rag_chain
    )

    return response


@app.post("/api/upload")
async def upload_pdf(file: UploadFile = File(...)):

    os.makedirs(UPLOAD_FOLDER, exist_ok=True)

    filepath = os.path.join(
        UPLOAD_FOLDER,
        file.filename
    )

    with open(filepath, "wb") as f:
        f.write(await file.read())

    # =========================
    # REBUILD VECTOR DB
    # =========================

    global vector_store
    global rag_chain

    all_docs = []

    pdf_files = [
        f for f in os.listdir(UPLOAD_FOLDER)
        if f.endswith(".pdf")
    ]

    for pdf_file in pdf_files:

        pdf_path = os.path.join(
            UPLOAD_FOLDER,
            pdf_file
        )

        all_docs.extend(
            load_pdf(pdf_path)
        )

    chunks = split_documents(all_docs)

    vector_store = create_vector_store(chunks)

    retriever = get_retriever(vector_store)

    rag_chain = get_rag_chain(retriever)

    return {
        "success": True,
        "filename": file.filename
    }
@app.delete("/api/delete/{filename}")
async def delete_pdf(filename: str):

    print("DELETE CALLED")
    print("Filename:", filename)

    filepath = os.path.join(
        UPLOAD_FOLDER,
        filename
    )

    print("Path:", filepath)

    if os.path.exists(filepath):
        os.remove(filepath)
        print("DELETED")

        return {"success": True}

    print("FILE NOT FOUND")

    return {"success": False}