from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, status, Request
import os
import base64
import uuid
import pathlib
from app.config import settings
from app.utils.auth_dep import get_current_user
from app.services.moonshot_ai import moonshot_ai

router = APIRouter(tags=["upload"])


@router.post("/uploadimage")
async def upload_image(
    request: Request,
    image: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    # Validate content type
    if image.content_type not in settings.allowed_file_types:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported file type: {image.content_type}",
        )

    data = await image.read()
    if len(data) > settings.max_upload_size:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="File too large",
        )

    os.makedirs(settings.upload_dir, exist_ok=True)

    suffix = pathlib.Path(image.filename).suffix or ".jpg"
    filename = f"{uuid.uuid4().hex}{suffix}"
    filepath = os.path.join(settings.upload_dir, filename)

    try:
        with open(filepath, "wb") as f:
            f.write(data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")

    # Call Moonshot AI with base64 image for analysis (non-blocking failure)
    ai_description = ""
    try:
        b64 = base64.b64encode(data).decode("utf-8")
        ai_description = await moonshot_ai.generate_image_description(image_base64=b64)
    except Exception:
        # Ignore AI failures for upload endpoint
        ai_description = ""

    # Return absolute public URL to the uploaded file (served by StaticFiles mount)
    base = str(request.base_url).rstrip("/")
    public_url = f"{base}/uploads/{filename}"
    return {"url": public_url, "filename": filename, "ai_description": ai_description}
