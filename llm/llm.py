import os

from langchain_ollama import ChatOllama
from langchain_google_genai import ChatGoogleGenerativeAI


def get_llm():

    llm_provider = os.getenv(
        "LLM_PROVIDER",
        "ollama"
    )

    if llm_provider == "ollama":

        llm = ChatOllama(
            model="llama3.1",
            temperature=0
        )

    else:

        llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash",
            google_api_key=os.getenv(
                "GOOGLE_API_KEY"
            ),
            temperature=0
        )

    return llm