from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Annotated
import logging
import uuid

from app.database import get_db
from app.models.model import User, Message
from app.schemas.message_schema import MessageCreate, MessageResponse, MessagesPage
from app.utils.auth import get_current_verified_user
from app.schemas.user_schema import UserResponse

# Configure logging
logger = logging.getLogger(__name__)

router = APIRouter(tags=["Feedback"])

@router.post("/u/{username}", status_code=status.HTTP_201_CREATED, response_model=dict)
async def submit_feedback(username: str, message_data: MessageCreate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == username.lower()).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Check if user accepts messages
    if not user.is_accepting_messages:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This user is not accepting feedback at the moment"
        )
    
    # Create message
    new_message = Message(
        recipient_id=user.id,
        content=message_data.content
    )
    
    db.add(new_message)
    db.commit()
    
    logger.info(f"Feedback submitted to user {user.username}")
    
    return {
        "message": "Feedback submitted successfully",
        "success": True
    }

@router.get("/messages/count", response_model=dict)
async def get_messages_count(
    current_user: Annotated[User, Depends(get_current_verified_user)],
    db: Session = Depends(get_db)
):
    """
    Get the total count of messages received by the authenticated user.
    Useful for dashboard statistics.
    """
    count = db.query(Message).filter(
        Message.recipient_id == current_user.id
    ).count()
    
    logger.info(f"User {current_user.username} has {count} total messages")
    
    return {"count": count}

@router.get("/messages", response_model=MessagesPage)
async def get_my_messages(
    current_user: Annotated[User, Depends(get_current_verified_user)],
    db: Session = Depends(get_db),
    limit: int = Query(20, ge=1, le=100, description="Max number of messages to return"),
    offset: int = Query(0, ge=0, description="Number of messages to skip")
):
    """
    Get messages received by the authenticated user, paginated.
    Messages are sorted by created_at in descending order (newest first).
    """
    base_query = db.query(Message).filter(Message.recipient_id == current_user.id)
    
    # Fetch total before applying limit/offset so the client can render pagination
    total = base_query.count()
    
    items = (
        base_query
        .order_by(Message.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    
    logger.info(f"User {current_user.username} retrieved {len(items)} of {total} messages (offset={offset})")
    
    return MessagesPage(items=items, total=total, limit=limit, offset=offset)

@router.delete("/messages/{message_id}", status_code=status.HTTP_200_OK, response_model=dict)
async def delete_message(
    message_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_verified_user)],
    db: Session = Depends(get_db)
):
    """
    Delete a specific message by ID.
    Users can only delete their own messages (messages they received).
    """
    # Find the message
    message = db.query(Message).filter(Message.id == message_id).first()
    
    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found"
        )
    
    # Verify the message belongs to the current user
    if message.recipient_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to delete this message"
        )
    
    db.delete(message)
    db.commit()
    
    logger.info(f"User {current_user.username} deleted message {message_id}")
    
    return {
        "message": "Message deleted successfully",
        "success": True
    }

@router.post("/toggle-messages", response_model=UserResponse)
async def toggle_message_acceptance(
    current_user: Annotated[User, Depends(get_current_verified_user)],
    db: Session = Depends(get_db)
):
    """
    Toggle message acceptance status.
    If currently accepting messages, will stop accepting.
    If currently not accepting, will start accepting.
    """
    # Flip the boolean value
    current_user.is_accepting_messages = not current_user.is_accepting_messages
    db.commit()
    db.refresh(current_user)
    
    logger.info(f"User {current_user.username} toggled message acceptance to {current_user.is_accepting_messages}")
    
    return current_user