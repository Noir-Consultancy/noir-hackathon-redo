"""Chat model for LangGraph agents, via any OpenAI-compatible endpoint."""

from langchain_openai import ChatOpenAI

from app import config


def get_chat_model(temperature: float = 0.7) -> ChatOpenAI:
    return ChatOpenAI(
        base_url=config.LLM_BASE_URL,
        api_key=config.LLM_API_KEY,
        model=config.LLM_MODEL,
        temperature=temperature,
    )
