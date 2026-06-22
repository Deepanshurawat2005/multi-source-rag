from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os

from rag.pdf_loader import load_all_pdfs
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

vector_store = None
rag_chain = None


def rebuild_vector_db():
    global vector_store
    global rag_chain

    docs = load_all_pdfs()

    if len(docs) == 0:
        vector_store = None
        rag_chain = None
        return

    chunks = split_documents(docs)

    vector_store = create_vector_store(chunks)

    retriever = get_retriever(vector_store)

    rag_chain = get_rag_chain(retriever)


# =========================
# LOAD PDFs ON STARTUP
# =========================

rebuild_vector_db()


class ChatRequest(BaseModel):
    question: str


@app.get("/")
def root():
    return {"status": "running"}


@app.post("/api/chat")
async def chat(request: ChatRequest):

    if vector_store is None or rag_chain is None:
        return {
            "source": "System",
            "answer": "No PDFs uploaded yet."
        }

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

    rebuild_vector_db()

    return {
        "success": True,
        "filename": file.filename
    }


@app.get("/api/pdfs")
async def get_pdfs():

    os.makedirs(UPLOAD_FOLDER, exist_ok=True)

    pdfs = [
        {"name": file}
        for file in os.listdir(UPLOAD_FOLDER)
        if file.endswith(".pdf")
    ]

    return pdfs


@app.delete("/api/delete/{filename}")
async def delete_pdf(filename: str):

    filepath = os.path.join(
        UPLOAD_FOLDER,
        filename
    )

    if os.path.exists(filepath):

        os.remove(filepath)

        rebuild_vector_db()

        return {
            "success": True
        }

    return {
        "success": False,
        "message": "File not found"
    }