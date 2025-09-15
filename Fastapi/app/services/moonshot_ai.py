import os
import base64
import httpx
from typing import Optional, List, Dict, Any
from pydantic import HttpUrl
import logging
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

class MoonshotAIClient:
    """Client for interacting with Moonshot AI's API for image analysis."""
    
    def __init__(self, api_key: Optional[str] = None):
        """Initialize the Moonshot AI client.
        
        Args:
            api_key: Moonshot AI API key. If not provided, will use MOONSHOT_API_KEY from environment.
        """
        self.api_key = api_key or os.getenv("MOONSHOT_API_KEY")
        if not self.api_key:
            raise ValueError("Moonshot AI API key not provided and MOONSHOT_API_KEY not found in environment")
        
        self.base_url = "https://api.moonshot.ai/v1/chat/completions"
        self.timeout = 30.0  # seconds
    
    async def generate_image_description(
        self,
        image_url: Optional[HttpUrl] = None,
        image_base64: Optional[str] = None,
    prompt: str = "Provide a MEDIUM-LENGTH product description suitable for an e-commerce listing (2-3 sentences), and also provide a RICH, DETAILED description (a longer paragraph). Return the output as a JSON object with keys: \"medium_description\" and \"rich_description\". If you cannot return valid JSON, separate the two sections with a clear delimiter '---'.",
        model: str = "moonshot-v1-8k-vision-preview",
        temperature: float = 0.3
    ) -> str:
        """Generate a product description from an image using Moonshot AI's vision model.
        
        Args:
            image_url: URL of the image to analyze
            image_base64: Base64-encoded image data (alternative to image_url)
            prompt: The prompt to guide the image analysis
            model: The Moonshot AI model to use
            temperature: Controls randomness (0-1, lower is more deterministic)
            
        Returns:
            str: Generated product description
            
        Raises:
            ValueError: If neither image_url nor image_base64 is provided
            httpx.HTTPStatusError: If the API request fails
        """
        if not (image_url or image_base64):
            raise ValueError("Either image_url or image_base64 must be provided")
        
        # Prepare the content for the API request
        content = [
            {"type": "text", "text": prompt}
        ]
        
        # Add image to content
        if image_url:
            content.insert(0, {
                "type": "image_url",
                "image_url": {"url": str(image_url)}
            })
        elif image_base64:
            # Ensure the base64 string is properly formatted
            if not image_base64.startswith("data:image"):
                image_base64 = f"data:image/jpeg;base64,{image_base64}"
            content.insert(0, {
                "type": "image_url",
                "image_url": {"url": image_base64}
            })
        
        # Prepare the request payload
        payload = {
            "model": model,
            "messages": [
                {
                    "role": "system",
                    "content": "You are Kimi, an AI assistant who excels at analyzing product images and generating detailed, accurate, and engaging product descriptions for e-commerce. Focus on factual details visible in the image and avoid making assumptions that can't be verified visually."
                },
                {
                    "role": "user",
                    "content": content
                }
            ],
            "temperature": max(0, min(1, temperature))  # Ensure between 0 and 1
        }
        
        # Make the API request
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.post(
                    self.base_url,
                    headers=headers,
                    json=payload
                )
                response.raise_for_status()
                
                # Extract the generated text from the response
                result = response.json()
                raw = result["choices"][0]["message"]["content"]

                # Try to parse JSON output if model returned structured JSON
                try:
                    import json as _json
                    parsed = _json.loads(raw)
                    # Expect keys 'medium_description' and 'rich_description'
                    medium = parsed.get("medium_description") or parsed.get("medium") or ""
                    rich = parsed.get("rich_description") or parsed.get("rich") or ""
                    combined = "\n\n".join(part for part in [medium.strip(), rich.strip()] if part)
                    logger.info("Successfully generated structured product description from image")
                    return combined.strip()
                except Exception:
                    # Fallback: try splitting by delimiter
                    if isinstance(raw, str) and "---" in raw:
                        parts = [p.strip() for p in raw.split("---", 1)]
                        if len(parts) == 2:
                            combined = "\n\n".join(parts)
                            logger.info("Successfully generated delimited product description from image")
                            return combined.strip()

                    # Fallback: return the raw text
                    logger.info("Returning raw product description from image (unstructured)")
                    return str(raw).strip()
                
            except httpx.HTTPStatusError as e:
                error_detail = f"Moonshot AI API request failed with status {e.response.status_code}: {e.response.text}"
                logger.error(error_detail)
                raise httpx.HTTPStatusError(
                    error_detail,
                    request=e.request,
                    response=e.response
                )
            except Exception as e:
                error_detail = f"Error generating product description: {str(e)}"
                logger.error(error_detail)
                raise Exception(error_detail) from e

# Create a singleton instance
moonshot_ai = MoonshotAIClient()
