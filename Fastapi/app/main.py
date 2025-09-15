import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn

# Import routers
from app.routers import auth, vector, products
from app.routers import upload
from app.services.vector_store import vector_store
from app.services.product_store import product_store
from app.config import settings

# Configure logging
logging.basicConfig(
    level=logging.DEBUG if settings.debug else logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Lifespan events
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize services
    logger.info("Starting up Atelier API...")
    try:
        # Initialize product store (it will initialize the vector store internally)
        logger.info("Initializing product store (and vector store if needed)...")
        await product_store.initialize()
        logger.info("Product store initialized")

        yield

    except Exception as e:
        logger.error(f"Error during startup: {e}")
        raise
    finally:
        # Shutdown: Clean up resources
        logger.info("Shutting down...")
        # Add any cleanup code here

# Create FastAPI app with lifespan
try:
    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        description="API service for Atelier with product management and semantic search capabilities",
        debug=settings.debug,
        lifespan=lifespan
    )
except Exception as e:
    logger.error(f"Failed to create FastAPI app: {e}")
    raise

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=settings.cors_allow_credentials,
    allow_methods=settings.cors_methods,
    allow_headers=settings.cors_headers,
)

# Include routers
app.include_router(auth.router, prefix="/api/auth")
app.include_router(vector.router, prefix="/api/vector")
app.include_router(products.router, prefix="/api/products")
app.include_router(upload.router, prefix="/api")

# Serve uploaded files from the uploads directory
from fastapi.staticfiles import StaticFiles
app.mount("/uploads", StaticFiles(directory=settings.upload_dir), name="uploads")

@app.get("/", include_in_schema=False)
async def root():
    return {
        "service": settings.app_name,
        "version": settings.app_version,
        "status": "running",
        "documentation": "/docs"
    }

# Health check endpoint
@app.get("/health", tags=["Health"])
async def health_check():
    return {
        "status": "healthy",
        "version": settings.app_version,
        "database": "connected"  # Add actual database health check
    }

def run():
    """Run the application using Uvicorn."""
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.reload,
        log_level="debug" if settings.debug else "info"
    )

if __name__ == "__main__":
    run()