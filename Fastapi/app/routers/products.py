
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status, Depends, Query, Request
from typing import List, Optional, Dict, Any
import json
from uuid import UUID, uuid4
from datetime import datetime
import logging

from ..schemas.product import (
    ProductCreate, 
    ProductResponse, 
    ProductUpdate, 
    ProductSearchResult,
    ProductCategory
)
from ..services.product_store import product_store
from ..services.moonshot_ai import moonshot_ai
from pydantic import HttpUrl, parse_obj_as
from app.utils.auth_dep import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(
    tags=["products"],
    responses={404: {"description": "Not found"}},
)

@router.post("/", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(
    request: Request,
    current_user: dict = Depends(get_current_user),
    name: str = Form(..., description="Name of the product"),
    price: float = Form(..., gt=0, description="Price of the product in USD"),
    category: str = Form(..., description=f"Category of the product. Options: {', '.join([e.value for e in ProductCategory])}"),
    description: str = Form("", description="Detailed description of the product"),
    materials: str = Form("[]", description="JSON array of materials used in the product"),
    care_instructions: str = Form(..., description="Care instructions for the product"),
    image_urls: str = Form("[]", description="JSON array of image URLs"),
    ai_description: str = Form("", description="AI-generated description of the product (optional)"),
    image: Optional[UploadFile] = File(None, description="Product image for AI analysis"),
):
    """
    Create a new product with optional image analysis.
    
    If an image is provided, it will be analyzed by Moonshot AI to enhance the product description.
    """
    try:
        # Parse and validate input data
        try:
            materials_list = json.loads(materials)
            if not isinstance(materials_list, list):
                raise ValueError("Materials must be a JSON array")
            image_urls_list = json.loads(image_urls)
            if not isinstance(image_urls_list, list):
                raise ValueError("Image URLs must be a JSON array")

            # Normalize relative upload paths (/uploads/...) to absolute URLs using request.base_url
            normalized_urls = []
            base = str(request.base_url).rstrip("/")
            for url in image_urls_list:
                if isinstance(url, str) and url.startswith("/uploads/"):
                    normalized_urls.append(f"{base}{url}")
                else:
                    normalized_urls.append(url)

            # Validate parsed URLs as HttpUrl. This will raise if any URL is invalid.
            image_urls_parsed = [parse_obj_as(HttpUrl, url) for url in normalized_urls]
        except json.JSONDecodeError as e:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Invalid JSON in form data: {str(e)}"
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=str(e)
            )
        # Read image file if provided and get AI description
        image_data = None
        # Start with ai_description provided by the client form (if any)
        ai_description = ai_description.strip() if ai_description else ""
        if image:
            try:
                image_data = await image.read()
                if len(image_data) > 10 * 1024 * 1024:
                    raise ValueError("Image size must be less than 10MB")
                # Call Moonshot AI for image description only if client didn't provide one
                import base64
                image_base64 = base64.b64encode(image_data).decode("utf-8")
                if not ai_description:
                    ai_description = await moonshot_ai.generate_image_description(image_base64=image_base64)
            except Exception as e:
                logger.error(f"Error processing image or AI: {str(e)}")
                if not ai_description:
                    ai_description = ""

        # If no UploadFile image was provided and the client didn't provide ai_description,
        # but image_urls were included in the form, try generating AI description from the first image URL.
        if not image and not ai_description and image_urls_list:
            try:
                first_url = image_urls_list[0]
                # image_urls_list may contain HttpUrl objects or strings
                url_str = str(first_url)
                ai_description = await moonshot_ai.generate_image_description(image_url=url_str)
            except Exception as e:
                logger.error(f"Error generating AI description from image URL: {str(e)}")
                if not ai_description:
                    ai_description = ""

        # Merge user and AI descriptions
        merged_description = description.strip()
        if ai_description:
            if merged_description:
                merged_description += "\n" + ai_description
            else:
                merged_description = ai_description

        # Create product data object
        product_data = ProductCreate(
            name=name,
            description=merged_description,
            price=price,
            category=category,
            materials=materials_list,
            care_instructions=care_instructions,
            image_urls=image_urls_parsed,
            ai_description=ai_description
        )

        # Create product in store (uuid and embedding handled in service)
        return await product_store.create_product(product_data, image_data, image.filename if image else None)

    except json.JSONDecodeError as e:
        logger.error(f"JSON decode error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid JSON in form data: {str(e)}"
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating product: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create product: {str(e)}"
        )

@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(product_id: str, current_user: dict = Depends(get_current_user)):
    """
    Get a product by ID.
    
    Args:
        product_id: The unique identifier of the product
        
    Returns:
        Product details including metadata and AI-generated content if available
    """
    try:
        product = await product_store.get_product_by_id(product_id)
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        return product
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching product {product_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while fetching the product"
        )


@router.get("/", response_model=List[ProductResponse])
async def list_products(current_user: dict = Depends(get_current_user)):
    """Return all products (collection view) with full metadata so the UI can display details and add-to-cart."""
    try:
        products = await product_store.get_all_products(limit=1000)
        return products
    except Exception as e:
        logger.error(f"Error listing products: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while listing products"
        )

@router.get("/search")
async def search_products(
    current_user: dict = Depends(get_current_user),
    query: str = Query(..., description="Search query text"),
    category: Optional[ProductCategory] = Query(
        None, 
        description="Filter by product category"
    ),
    min_price: float = Query(
        0, 
        ge=0, 
        description="Minimum price filter"
    ),
    max_price: Optional[float] = Query(
        None, 
        gt=0, 
        description="Maximum price filter"
    ),
    limit: int = Query(
        1, 
        ge=1, 
        le=100, 
        description="Maximum number of results to return (default: 1)"
    )
):
    """
    Search for products using semantic search with optional filters.
    
    Performs a vector similarity search to find products that match the query
    and optional filters.
    """
    try:
        # Prepare filters
        filters = {}
        if category:
            filters["category"] = category.value
        if min_price is not None:
            filters["price"] = {"$gte": min_price}
        if max_price is not None:
            filters.setdefault("price", {})["$lte"] = max_price

        # Generate embedding for the query and perform top-1 search on vector store
        try:
            # vector_store is available via product_store
            vs = product_store.vector_store
            if not vs:
                raise HTTPException(status_code=500, detail="Vector store not available")

            # Use the vector store embedding helper when available
            if hasattr(vs, 'text_to_embedding'):
                query_embedding = vs.text_to_embedding(query)
            else:
                # Fallback to product_store embedding helper
                query_embedding = await product_store._generate_embeddings(query)

            # Call vector store search directly for top-1
            raw_results = vs.search(query=query, k=1, filter_metadata=filters)
            # vs.search returns a list of dicts with 'metadata' and 'distance'
            if not raw_results:
                raise HTTPException(status_code=404, detail="No matching products found")

            top = raw_results[0]
            # Extract id from metadata safely
            top_meta = top.get('metadata') if isinstance(top, dict) else None
            product_id = None
            if isinstance(top_meta, dict):
                product_id = top_meta.get('id')
            if not product_id:
                # Try to get id from document or the raw result
                product_id = top.get('id') if isinstance(top, dict) else None

            if not product_id:
                raise HTTPException(status_code=500, detail="Search result missing product id")

            # Fetch full product by id and return
            product = await product_store.get_product_by_id(str(product_id))
            if not product:
                raise HTTPException(status_code=404, detail="Matched product not found in store")

            return product
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Search endpoint failed: {e}")
            raise HTTPException(status_code=500, detail="Search failed")
        
    except Exception as e:
        logger.error(f"Search failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred during search"
        )


@router.post("/search")
async def search_products_post(
    current_user: dict = Depends(get_current_user),
    body: Dict[str, Any] = None
):
    """
    POST-based search endpoint that accepts a JSON body. Expected body shape:
    { "query": "text", "category": "clothing", "min_price": 0, "max_price": 100, "limit": 1 }
    This endpoint will embed the `query` and perform a top-1 vector search returning the matched product.
    """
    try:
        if not body or not isinstance(body, dict) or 'query' not in body:
            raise HTTPException(status_code=422, detail="Missing 'query' in request body")

        query = body.get('query')
        category = body.get('category')
        min_price = body.get('min_price', 0)
        max_price = body.get('max_price')
        limit = int(body.get('limit', 1)) if body.get('limit') is not None else 1

        # Reuse the same filter prep as the GET endpoint
        filters = {}
        if category:
            filters['category'] = category
        if min_price is not None:
            filters['price'] = {'$gte': min_price}
        if max_price is not None:
            filters.setdefault('price', {})['$lte'] = max_price

        # Use the same vector search flow
        vs = product_store.vector_store
        if not vs:
            raise HTTPException(status_code=500, detail="Vector store not available")

        if hasattr(vs, 'text_to_embedding'):
            _ = vs.text_to_embedding(query)
        else:
            await product_store._generate_embeddings(query)

        raw_results = vs.search(query=query, k=limit or 1, filter_metadata=filters)
        if not raw_results:
            raise HTTPException(status_code=404, detail="No matching products found")

        top = raw_results[0]
        top_meta = top.get('metadata') if isinstance(top, dict) else None
        product_id = None
        if isinstance(top_meta, dict):
            product_id = top_meta.get('id')
        if not product_id:
            product_id = top.get('id') if isinstance(top, dict) else None

        if not product_id:
            raise HTTPException(status_code=500, detail="Search result missing product id")

        product = await product_store.get_product_by_id(str(product_id))
        if not product:
            raise HTTPException(status_code=404, detail="Matched product not found in store")

        return product
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"POST search failed: {e}")
        raise HTTPException(status_code=500, detail="Search failed")

@router.post("/{product_id}/images", status_code=status.HTTP_201_CREATED)
async def add_product_image(
    product_id: str,
    current_user: dict = Depends(get_current_user),
    image: UploadFile = File(..., description="Image file to upload"),
    is_primary: bool = Form(False, description="Whether this should be the primary product image")
):
    """
    Add an image to a product.
    
    Uploads an image for a product and optionally sets it as the primary image.
    The image will be analyzed by AI to enhance the product description.
    """
    try:
        # Validate product exists (in a real implementation)
        # product = await product_store.get_product(product_id)
        # if not product:
        #     raise HTTPException(status_code=404, detail="Product not found")
        
        # Read and validate image
        try:
            image_data = await image.read()
            if len(image_data) > 10 * 1024 * 1024:  # 10MB
                raise ValueError("Image size must be less than 10MB")
        except Exception as e:
            logger.error(f"Error reading image file: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Error processing image: {str(e)}"
            )
        
        # In a real implementation:
        # 1. Upload image to storage (e.g., S3, Cloud Storage)
        # 2. Get back a public URL
        # 3. Update product with new image URL
        # 4. If is_primary, update primary image reference
        
        # For now, return a placeholder response
        return {
            "id": str(uuid4()),
            "product_id": product_id,
            "url": f"https://storage.example.com/products/{product_id}/{image.filename}",
            "is_primary": is_primary,
            "created_at": datetime.utcnow().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload image: {str(e)}"
        )


@router.get("/debug/{product_id}")
async def debug_product_meta(product_id: str, current_user: dict = Depends(get_current_user)):
    """Developer helper: return raw vector-store meta/document for a product id (dev only)."""
    try:
        # Try to fetch raw row from vector store
        doc = await product_store.vector_store.get_document_by_id(product_id)
        return {"ok": True, "doc": doc}
    except Exception as e:
        return {"ok": False, "error": str(e)}
