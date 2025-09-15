from fastapi import APIRouter, HTTPException, Depends, status
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, UUID4
from datetime import datetime
import uuid

from app.services.vector_store import vector_store

router = APIRouter(
    tags=["vector"],
    responses={404: {"description": "Not found"}},
)

class DocumentCreate(BaseModel):
    """Schema for creating a new document."""
    text: str = Field(..., description="The text content of the document")
    metadata: Dict[str, Any] = Field(
        default_factory=dict,
        description="Optional metadata for the document"
    )

class DocumentResponse(DocumentCreate):
    """Schema for document response."""
    id: str
    created_at: datetime

class DocumentBatchCreate(BaseModel):
    """Schema for creating multiple documents at once."""
    documents: List[DocumentCreate]

class SearchQuery(BaseModel):
    """Schema for search queries."""
    query: str = Field(..., description="The search query string")
    k: int = Field(
        default=3,
        ge=1,
        le=100,
        description="Number of results to return (1-100)"
    )
    filter_metadata: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Optional metadata filter for search results"
    )

class SearchResult(BaseModel):
    """Schema for search results."""
    text: str
    distance: float
    metadata: Dict[str, Any]

@router.post("/documents/", response_model=List[DocumentResponse], status_code=status.HTTP_201_CREATED)
async def create_documents(documents: DocumentBatchCreate):
    """
    Add one or more documents to the vector store.
    
    Each document will be assigned a unique ID and timestamp.
    """
    try:
        # Prepare documents with IDs and timestamps
        docs_to_add = []
        for doc in documents.documents:
            doc_id = str(uuid.uuid4())
            doc_metadata = doc.metadata or {}
            doc_metadata["created_at"] = datetime.utcnow().isoformat()
            
            docs_to_add.append({
                "id": doc_id,
                "text": doc.text,
                "metadata": doc_metadata
            })
        
        # Add to vector store
        vector_store.add_documents(docs_to_add)
        
        # Prepare response
        response = [
            DocumentResponse(
                id=doc["id"],
                text=doc["text"],
                metadata=doc["metadata"],
                created_at=datetime.fromisoformat(doc["metadata"]["created_at"])
            )
            for doc in docs_to_add
        ]
        
        return response
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to add documents: {str(e)}"
        )

@router.post("/search/", response_model=List[SearchResult])
async def search_documents(search: SearchQuery):
    """
    Search for documents similar to the query text.
    
    Returns a list of documents ordered by relevance (closest matches first).
    """
    try:
        results = vector_store.search(
            query=search.query,
            k=search.k,
            filter_metadata=search.filter_metadata
        )
        return results
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Search failed: {str(e)}"
        )
