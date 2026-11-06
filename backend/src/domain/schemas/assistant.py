import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class AssistantTurn(BaseModel):
    """One earlier message in the conversation."""

    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=4000)


class AssistantAskRequest(BaseModel):
    """A question plus the recent chat history for context."""

    message: str = Field(min_length=1, max_length=2000)
    history: list[AssistantTurn] = Field(default_factory=list, max_length=20)


class AssistantAnswer(BaseModel):
    """A grounded answer about one workspace.

    The assistant is read-only: this response never changes workspace data and
    never carries an authenticity verdict.
    """

    answer: str
    model: str
    scope: Literal["workspace"] = "workspace"
    generated_at: datetime
    organization_id: uuid.UUID
