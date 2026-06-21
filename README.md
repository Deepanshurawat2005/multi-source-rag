# 🚀 Multi-Source RAG System

An intelligent **Multi-Source Retrieval-Augmented Generation (RAG)** application that answers user queries by combining information from multiple knowledge sources including **PDF documents, Wikipedia, Arxiv research papers, and Web Search**.

## ✨ Features

- 📄 PDF-based Question Answering
- 🧠 Retrieval-Augmented Generation (RAG)
- 🌐 Multi-Source Knowledge Retrieval
- 📚 Wikipedia Integration
- 📑 Arxiv Research Paper Search
- 🔍 Web Search Integration
- 🎯 Intelligent Query Routing
- 🤖 LLM-Powered Response Generation
- 🔄 PDF-First Answering Strategy

---

## 🏗️ Project Architecture

```text
User Query
    │
    ▼
PDF RAG Pipeline
    │
    ├── Answer Found
    │      ▼
    │   Return Answer
    │
    └── Answer Not Found
           ▼
    Knowledge Router
           │
           ├── Wikipedia
           ├── Arxiv
           └── Web Search
                    │
                    ▼
              Retrieve Context
                    │
                    ▼
                 LLM
                    │
                    ▼
              Final Answer
```

---

## 📂 Project Structure

```text
multi-src-rag/
│
├── app.py
│
├── data/
│   └── uploaded_pdfs/
│
├── rag/
│   ├── pdf_loader.py
│   ├── text_splitter.py
│   ├── embeddings.py
│   ├── vector_store.py
│   ├── retriever.py
│   └── rag_chain.py
│
├── router/
│   ├── source_router.py
│   └── query_router.py
│
├── tools/
│   ├── wikipedia_tool.py
│   ├── arxiv_tool.py
│   └── web_search_tool.py
│
├── prompts/
│   └── rag_prompt.py
│
├── llm/
│   └── llm.py
│
└── requirements.txt
```

---

## ⚙️ How It Works

### Step 1: PDF Processing

- Load PDF documents
- Split text into chunks
- Generate embeddings
- Store embeddings in FAISS vector database

### Step 2: User Query

When a user asks a question:

1. Search the uploaded PDF
2. If answer exists → return PDF answer
3. If answer is not found → route query to external sources

### Step 3: Intelligent Routing

The router classifies the query and selects the best source:

| Query Type         | Source     |
| ------------------ | ---------- |
| Historical Figures | Wikipedia  |
| Countries & Events | Wikipedia  |
| Research Papers    | Arxiv      |
| AI / ML Topics     | Arxiv      |
| Current Events     | Web Search |
| Latest Information | Web Search |

---

## 🛠️ Tech Stack

### Backend

- Python

### LLM Framework

- LangChain

### Vector Database

- FAISS

### LLM

- Ollama
- Llama 3.1

### Retrieval Sources

- PDF Documents
- Wikipedia
- Arxiv
- Web Search

---

## 🚀 Installation

### Clone Repository

```bash
git clone https://github.com/your-username/multi-source-rag.git
cd multi-source-rag
```

### Create Virtual Environment

```bash
python -m venv venv
```

### Activate Environment

Mac/Linux:

```bash
source venv/bin/activate
```

Windows:

```bash
venv\Scripts\activate
```

### Install Dependencies

```bash
pip install -r requirements.txt
```

### Run Application

```bash
python app.py
```

---

## 💡 Example Queries

### PDF Questions

```text
What is self-attention?
```

### Wikipedia Questions

```text
Who is Mahatma Gandhi?
```

```text
Tell me about Maharana Pratap.
```

### Arxiv Questions

```text
What are the latest research papers on agentic AI?
```

### Web Questions

```text
Who is the current CEO of OpenAI?
```

---

## 👨‍💻 Author

**Deepanshu Rawat**

Built as a learning project to explore:

- RAG Systems
- LangChain
- Vector Databases
- LLM Routing
- Multi-Source Knowledge Retrieval
