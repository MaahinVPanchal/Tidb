import os
import sys
from pathlib import Path

# Add the app directory to the Python path
app_dir = str(Path(__file__).parent / "app")
if app_dir not in sys.path:
    sys.path.append(app_dir)

# Import the FastAPI app
from main import app

# This is needed for Vercel to work with FastAPI
# The handler function name must match the filename (serverless)
async def handler(event, context):
    from mangum import Mangum
    handler = Mangum(app, api_gateway_base_path="/api")
    return await handler(event, context)
