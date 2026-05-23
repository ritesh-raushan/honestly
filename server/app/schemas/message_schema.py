from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import List, Optional
import uuid

class MessageCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=1000, description="Message content up to 1000 characters")

class MessageResponse(BaseModel):
    """Schema for message response."""
    id: uuid.UUID
    content: str
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class MessagesPage(BaseModel):
    """Paginated wrapper around a list of messages."""
    items: List[MessageResponse]
    total: int
    limit: int
    offset: int

class MessageAcceptanceToggle(BaseModel):
    is_accepting_messages: bool = Field(..., description="Whether to accept anonymous messages")