from router.source_router import classify_query

from tools.wikipedia_tool import get_wikipedia_tool
from tools.arxiv_tool import arxiv_search
from tools.web_search_tool import get_web_search_tool

from llm.llm import get_llm


def generate_answer(question, context):

    llm = get_llm()

    prompt = f"""
    Answer the user's question using ONLY the provided context.

    If the context is insufficient, say so.

    Context:
    {context}

    Question:
    {question}

    Give a detailed and helpful answer.
    """

    response = llm.invoke(prompt)

    return response.content


def route_query(question, vector_store, rag_chain):

    # STEP 1 : PDF FIRST
    rag_response = rag_chain.invoke(
        {"input": question}
    )

    pdf_answer = rag_response["answer"]

    failure_phrases = [
        "there is no mention",
        "not mentioned",
        "not present",
        "cannot be found",
        "provided context does not",
        "unfortunately",
    ]

    pdf_found = not any(
        phrase in pdf_answer.lower()
        for phrase in failure_phrases
    )

    if pdf_found:
        return {
            "source": "PDF",
            "answer": pdf_answer
        }

    # STEP 2 : ROUTE TO BEST SOURCE

    route = classify_query(question)

    source = route["source"]

    try:

        if source == "WIKIPEDIA":

            wiki = get_wikipedia_tool()

            context = wiki.invoke(question)

            answer = generate_answer(
                question,
                context
            )

            return {
                "source": "Wikipedia",
                "reason": route["reason"],
                "answer": answer
            }

        elif source == "ARXIV":

            context = arxiv_search.invoke(question)

            answer = generate_answer(
                question,
                context
            )

            return {
                "source": "Arxiv",
                "reason": route["reason"],
                "answer": answer
            }

        else:

            web = get_web_search_tool()

            context = web.invoke(question)

            answer = generate_answer(
                question,
                context
            )

            return {
                "source": "Web",
                "reason": route["reason"],
                "answer": answer
            }

    except Exception as e:

        return {
            "source": "Error",
            "answer": str(e)
        }