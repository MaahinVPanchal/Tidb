from pydantic import BaseModel, Field, HttpUrl, validator, root_validator
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum
from uuid import UUID, uuid4
import re
from urllib.parse import urlparse

class ProductCategory(str, Enum):
    ALL = "all"
    PATOLA = "patola"
    TRADITIONAL = "traditional"
    MODERN = "modern"
    ACCESSORIES = "accessories"

class ProductBase(BaseModel):
    name: str = Field(
        ..., 
        min_length=2, 
        max_length=200, 
        description="Name of the product",
        example="Classic Cotton T-Shirt"
    )
    description: str = Field(
        ..., 
        min_length=10, 
        max_length=5000,
        description="Detailed description of the product",
        example="A comfortable and stylish t-shirt made from 100% organic cotton."
    )
    price: float = Field(
        ..., 
        gt=0, 
        le=1000000,
        description="Price of the product in USD",
        example=29.99
    )
    category: ProductCategory = Field(
        ..., 
        description="Category of the product"
    )
    materials: List[str] = Field(
        default_factory=list, 
        description="List of materials used in the product",
        example=["cotton", "polyester"]
    )
    care_instructions: str = Field(
        ..., 
        min_length=10,
        max_length=1000,
        description="Care instructions for the product",
        example="Machine wash cold with like colors. Tumble dry low. Do not bleach."
    )
    image_urls: List[HttpUrl] = Field(
        default_factory=list,
        description="List of image URLs for the product. First URL is considered the primary image.",
        example=["https://example.com/images/tshirt.jpg"]
    )
    ai_description: Optional[str] = Field(
        None, 
        description=("AI-generated description from image analysis. The service returns two parts: a short/medium-length "
                     "description (2-3 sentences) and a richer, detailed paragraph. These are concatenated in the stored "
                     "string with the medium description first, then a blank line, then the rich description.")
    )
    
    @validator('name')
    def validate_name(cls, v):
        # Remove extra whitespace and validate name format
        v = ' '.join(v.strip().split())
        if not re.match(r'^[\w\s\-\'\"]+$', v):
            raise ValueError('Name contains invalid characters')
        return v
        
    @validator('materials', each_item=True)
    def validate_materials(cls, v):
        if not v.strip():
            raise ValueError('Material cannot be empty')
        return v.strip()
        
    @validator('image_urls')
    def validate_image_urls(cls, v):
        # Allow empty image_urls at creation; images may be uploaded and URLs added later
        return v

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str] = Field(
        None, 
        min_length=2, 
        max_length=200,
        description="Updated name of the product"
    )
    description: Optional[str] = Field(
        None, 
        min_length=10,
        max_length=5000,
        description="Updated description of the product"
    )
    price: Optional[float] = Field(
        None, 
        gt=0, 
        le=1000000,
        description="Updated price in USD"
    )
    category: Optional[ProductCategory] = Field(
        None,
        description="Updated product category"
    )
    materials: Optional[List[str]] = Field(
        None,
        description="Updated list of materials"
    )
    care_instructions: Optional[str] = Field(
        None,
        min_length=10,
        max_length=1000,
        description="Updated care instructions"
    )
    image_urls: Optional[List[HttpUrl]] = Field(
        None,
        description="Updated list of image URLs"
    )
    
    @root_validator(pre=True)
    def check_empty_update(cls, values):
        if not values:
            raise ValueError('No update data provided')
        return values

class ProductInDB(ProductBase):
    id: UUID = Field(default_factory=uuid4)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    # Embeddings produced for the product (if available)
    embeddings: List[float] = Field(
        default_factory=list,
        description="Numeric embedding vector used for semantic search"
    )
    # The exact text payload that was passed to the embedding model
    embed_text: Optional[str] = Field(
        None,
        description="The text concatenated from name, description and ai_description that was sent to the embedding model"
    )

    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat(),
            UUID: lambda v: str(v),
        }

class ProductResponse(ProductInDB):
    pass

class ProductSearchQuery(BaseModel):
    query: str = Field(..., description="Search query text")
    category: Optional[ProductCategory] = Field(None, description="Filter by product category")
    max_price: Optional[float] = Field(None, gt=0, description="Maximum price filter")
    min_price: Optional[float] = Field(0, ge=0, description="Minimum price filter")
    limit: int = Field(10, ge=1, le=100, description="Maximum number of results to return")

class ProductSearchResult(ProductInDB):
    similarity_score: float = Field(
        ..., 
        ge=0,
        le=1,
        description="Similarity score (0-1), where 1 is an exact match"
    )
    
    class Config:
        json_schema_extra = {
            "example": {
                "id": "550e8400-e29b-41d4-a716-446655440000",
                "name": "Classic Cotton T-Shirt",
                "description": "A comfortable and stylish t-shirt made from 100% organic cotton.",
                "price": 29.99,
                "category": "traditional",
                "materials": ["cotton"],
                "care_instructions": "Machine wash cold. Tumble dry low.",
                "image_urls": ["https://example.com/images/tshirt.jpg"],
                "ai_description": "A white t-shirt with a classic fit.",
                "created_at": "2023-01-01T12:00:00Z",
                "updated_at": "2023-01-01T12:00:00Z",
                "similarity_score": 0.92
            }
        }
