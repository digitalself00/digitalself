import logging
from typing import Any, Dict, Optional
import httpx
from fastapi import HTTPException, status
from src.BE.constant.config import settings

logger = logging.getLogger(__name__)


class AIService:
    @staticmethod
    async def process_speech_to_task(
        file_bytes: bytes,
        filename: str = "audio.mp3",
        content_type: str = "audio/mpeg",
        override_api_key: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Forwards recorded audio to the external Speech-to-Task API
        configured in .env (SPEECH_TO_TASK_URL & OPENAI_API_KEY).
        """
        api_url = settings.SPEECH_TO_TASK_URL.strip()
        api_key = (override_api_key or settings.OPENAI_API_KEY).strip()

        # Handle unconfigured or placeholder endpoint
        if not api_url or "<your-project>" in api_url:
            # Provide sample response for development preview if URL is unconfigured
            logger.warning("[AIService] SPEECH_TO_TASK_URL is not set or contains placeholder. Returning simulated extraction.")
            return {
                "title": "Voice Task",
                "description": "Please configure your SPEECH_TO_TASK_URL and OPENAI_API_KEY in .env to connect to your live Vercel service.",
                "start_time": "10:00 AM",
                "end_time": "11:30 AM",
                "priority": "Medium",
                "raw_transcription": "Sample voice audio recorded successfully.",
                "model_used": "simulated-preview",
            }

        files = {
            "file": (filename or "audio.mp3", file_bytes, content_type or "audio/mpeg")
        }
        data = {
            "api_key": api_key,
        }

        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(api_url, files=files, data=data)

                if response.status_code != 200:
                    err_text = response.text
                    logger.error(f"[AIService] Upstream API error ({response.status_code}): {err_text}")
                    raise HTTPException(
                        status_code=status.HTTP_502_BAD_GATEWAY,
                        detail=f"Speech-to-Task service error ({response.status_code}): {err_text[:200]}",
                    )

                result = response.json()
                return AIService._normalize_task_data(result)

        except httpx.RequestError as exc:
            logger.error(f"[AIService] Network connection error calling speech-to-task: {exc}")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Could not reach Speech-to-Task endpoint at {api_url}: {str(exc)}",
            )

    @staticmethod
    def _normalize_task_data(data: Dict[str, Any]) -> Dict[str, Any]:
        """Normalizes external API output into consistent DigitalSelf fields."""
        title = data.get("title") or "Voice Task"
        description = data.get("description") or ""

        # Handle upstream typo 'strat_time' as well as standard 'start_time'
        start_time = data.get("start_time") or data.get("strat_time") or "09:00 AM"
        end_time = data.get("end_time") or "10:30 AM"

        # Normalize priority into "Low", "Medium", "High"
        raw_priority = str(data.get("priority", "Medium")).strip().capitalize()
        priority = raw_priority if raw_priority in ("Low", "Medium", "High") else "Medium"

        raw_transcription = data.get("raw_transcription") or ""
        model_used = data.get("model_used") or "speech-to-task"

        return {
            "title": title,
            "description": description,
            "start_time": start_time,
            "end_time": end_time,
            "priority": priority,
            "raw_transcription": raw_transcription,
            "model_used": model_used,
        }
