from langchain_core.prompts import ChatPromptTemplate
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain.chains import create_retrieval_chain

from llm.llm import get_llm


def get_rag_chain(retriever):

    llm = get_llm()

    prompt = ChatPromptTemplate.from_template(
    """
    Answer the question using only the provided context.

    If the answer is NOT present in the context, respond with exactly:

    NOT_FOUND

    Context:
    {context}

    Question:
    {input}
    """
)
    document_chain = create_stuff_documents_chain(
        llm,
        prompt
    )

    retrieval_chain = create_retrieval_chain(
        retriever,
        document_chain
    )

    return retrieval_chain