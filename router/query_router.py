from router.source_router import classify_query
from tools.wikipedia_tool import get_wikipedia_tool
from tools.arxiv_tool import arxiv_search
from tools.web_search_tool import get_web_search_tool
from llm.llm import get_llm
def generate_answer(question, context):

    llm = get_llm()

    prompt = f"""
You are a helpful AI assistant.

Answer the question in detail.

Rules:
- Give a complete answer.
- Explain important facts.
- Use multiple paragraphs when needed.
- Do not say "according to the context".
- Do not say "based on the provided information".
- Start directly with the answer.

Context:
{context}

Question:
{question}
"""

    response = llm.invoke(prompt)

    return response.content

def route_query(question, vector_store, rag_chain):

    # STEP 1 : PDF FIRST

    rag_response = rag_chain.invoke(
        {"input": question}
    )

    pdf_answer = rag_response["answer"]

    # If answer found in PDF
    if pdf_answer.strip() != "NOT_FOUND":
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