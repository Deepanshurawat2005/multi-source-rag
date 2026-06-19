from langchain.agents import initialize_agent, AgentType

from llm.llm import get_llm
from tools.wikipedia_tool import get_wikipedia_tool
from tools.arxiv_tool import arxiv_search
from tools.web_search_tool import get_web_search_tool


def get_fallback_agent():

    llm = get_llm()

    tools = [
        get_wikipedia_tool(),
        arxiv_search,
        get_web_search_tool()
    ]

    agent = initialize_agent(
        tools=tools,
        llm=llm,
        agent=AgentType.ZERO_SHOT_REACT_DESCRIPTION,
        verbose=True
    )

    return agent