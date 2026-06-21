import json

from llm.llm import get_llm


def classify_query(question):

    llm = get_llm()

    prompt = f"""
    You are an expert Knowledge Routing Engine.

    Decide the best source for answering the query.

    Sources:

    WIKIPEDIA
    - Historical people
    - Countries
    - Places
    - Geography
    - Biography
    - Historical events
    - General knowledge

    ARXIV
    - Research papers
    - AI
    - Machine Learning
    - Deep Learning
    - Mathematics
    - Scientific topics
    - Computer Science

    WEB
    - Current events
    - Latest news
    - Current CEO
    - Stock prices
    - Product launches
    - Recent developments

    Query:
    {question}

    Return ONLY JSON:

    {{
      "source":"WIKIPEDIA|ARXIV|WEB",
      "reason":"short reason"
    }}
    """

    response = llm.invoke(prompt)

    try:
        return json.loads(response.content)

    except:
        return {
            "source": "WEB",
            "reason": "fallback"
        }