from typing import Optional
from fastapi import APIRouter, Depends, File, Form, UploadFile, status
from src.BE.db.models import User
from src.BE.service.ai_service import AIService
from src.BE.service.auth_service import get_current_user

router = APIRouter(prefix="/api/ai", tags=["Speech to Task AI"])


@router.post("/speech-to-task", status_code=status.HTTP_200_OK)
async def speech_to_task(
    file: UploadFile = File(...),
    api_key: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
):
    """
    Accepts recorded voice audio (mp3/wav/webm/m4a), forwards to the
    speech-to-task service using OPENAI_API_KEY from .env, and returns
    structured task fields.
    """
    file_bytes = await file.read()
    filename = file.filename or "audio.mp3"
    content_type = file.content_type or "audio/mpeg"

    result = await AIService.process_speech_to_task(
        file_bytes=file_bytes,
        filename=filename,
        content_type=content_type,
        override_api_key=api_key,
    )
    return result
