from rag.pdf_loader import load_pdf
from rag.text_splitter import split_documents
from rag.vector_store import create_vector_store
from rag.retriever import get_retriever
from rag.rag_chain import get_rag_chain

from router.query_router import route_query


def main():

    pdf_path = "data/uploaded_pdfs/AttentionIsAllYouNeed.pdf"

    docs = load_pdf(pdf_path)

    chunks = split_documents(docs)

    vector_store = create_vector_store(chunks)

    retriever = get_retriever(vector_store)

    rag_chain = get_rag_chain(retriever)

    while True:

        question = input("\nAsk Question (type 'exit' to quit): ")

        if question.lower() == "exit":
            print("Goodbye!")
            break

        try:

            response = route_query(
                question=question,
                vector_store=vector_store,
                rag_chain=rag_chain
            )

            print("\nSource:", response["source"])

            if "reason" in response:
                print("Reason:", response["reason"])

            print("\nAnswer:")
            print(response["answer"])

        except Exception as e:

            print("\nError:")
            print(e)


if __name__ == "__main__":
    main()