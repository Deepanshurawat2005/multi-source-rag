from langchain_core.prompts import ChatPromptTemplate

RAG_PROMPT = ChatPromptTemplate.from_template(
    """
    Answer ONLY from the provided context.

    If the answer is not present in the context, clearly say:

    "There is no mention of this information in the provided document."

    Context:
    {context}

    Question:
    {input}

    Answer:
    """
)