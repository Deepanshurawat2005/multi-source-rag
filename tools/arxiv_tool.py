import arxiv
from langchain_core.tools import tool


@tool
def arxiv_search(query: str) -> str:
    """
    Search arXiv for academic papers.
    """

    try:
        client = arxiv.Client()

        search = arxiv.Search(
            query=query,
            max_results=1
        )

        results = []

        for result in client.results(search):
            results.append(
                f"Title: {result.title}\n"
                f"Summary: {result.summary[:1000]}"
            )

        if not results:
            return "No paper found."

        return "\n".join(results)

    except Exception as e:
        return str(e)