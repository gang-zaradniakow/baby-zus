"""Interfejsy ``LLMClient`` i ``EmbeddingClient`` oraz ich adaptery (ZUS-50)."""

from assistant.llm.base import (
    Capabilities,
    Completion,
    EmbeddingClient,
    LLMClient,
    LLMConfigurationError,
    LLMError,
    LLMInvalidOutputError,
    LLMRequestError,
    LLMUnavailableError,
    Message,
    Usage,
)
from assistant.llm.factory import create_embedding_client, create_llm_client
from assistant.llm.fake import FakeEmbeddingClient, FakeLLMClient
from assistant.llm.openai_compatible import OpenAICompatibleClient, OpenAICompatibleEmbeddingClient

__all__ = [
    "Capabilities",
    "Completion",
    "EmbeddingClient",
    "FakeEmbeddingClient",
    "FakeLLMClient",
    "LLMClient",
    "LLMConfigurationError",
    "LLMError",
    "LLMInvalidOutputError",
    "LLMRequestError",
    "LLMUnavailableError",
    "Message",
    "OpenAICompatibleClient",
    "OpenAICompatibleEmbeddingClient",
    "Usage",
    "create_embedding_client",
    "create_llm_client",
]
