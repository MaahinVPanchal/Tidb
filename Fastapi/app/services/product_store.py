from typing import List, Dict, Any, Optional, Union, cast
from uuid import UUID, uuid4
from datetime import datetime, timezone
import logging
import json
import base64
from pydantic import HttpUrl, ValidationError, parse_obj_as
import asyncio

from .vector_store import VectorStore, vector_store
from ..schemas.product import (
    ProductInDB, 
    ProductResponse, 
    ProductSearchResult, 
    ProductCreate, 
    ProductUpdate,
    ProductCategory
)
from ..config import settings
from .moonshot_ai import moonshot_ai  # For AI description generation

logger = logging.getLogger(__name__)

class ProductStore:
    """
    Service for managing product data with vector search capabilities.
    Handles product CRUD operations, AI analysis, and vector search.
    """
    
    def __init__(self, vs: Optional[VectorStore] = None):
        self.table_name = "products"
        # If a VectorStore instance is provided use it, otherwise fall back to the module-level singleton
        self.vector_store = vs or vector_store
        self.initialized = False
    
    async def initialize(self):
        """Initialize the product store and create necessary database tables."""
        if self.initialized:
            return
            
        try:
            # Create products table if it doesn't exist
            await self._create_products_table()
            
            # Initialize vector store
            if self.vector_store:
                # VectorStore exposes an async _initialize_store method
                await self.vector_store._initialize_store()
                
            self.initialized = True
            logger.info("Product store initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize product store: {str(e)}")
            raise
    
    async def _create_products_table(self):
        """
        Create the products table in TiDB if it doesn't exist.
        
        This method creates a table with appropriate columns for storing product information,
        including fields for product metadata, pricing, categories, and timestamps.
        
        The table includes indexes for common query patterns.
        
        Raises:
            Exception: If there's an error creating the table
        """
        try:
            # In a real implementation, this would execute SQL to create the table
            # Here's an example of what the SQL might look like:
            """
            CREATE TABLE IF NOT EXISTS products (
                id VARCHAR(36) PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                price DECIMAL(10, 2) NOT NULL,
                category VARCHAR(100) NOT NULL,
                materials JSON,
                care_instructions TEXT,
                image_urls JSON,
                ai_description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_category (category),
                INDEX idx_created_at (created_at),
                FULLTEXT INDEX idx_name_desc (name, description) /* For text search */
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            """
            
            # Log that we would create the table
            logger.info("Would create products table if it doesn't exist")
            
        except Exception as e:
            logger.error(f"Failed to create products table: {str(e)}")
            raise
    
    async def _upload_image(self, image_data: bytes, filename: str) -> str:
        """Upload image to storage and return the URL."""
        # In a real implementation, this would upload to S3, GCS, etc.
        # For now, we'll generate a mock URL
        file_extension = filename.split('.')[-1] if '.' in filename else 'jpg'
        return f"https://storage.example.com/products/{uuid4()}.{file_extension}"
    
    # No longer needed: _generate_ai_description (handled in router)
    
    async def _generate_embeddings(self, text: str) -> List[float]:
        """Generate embeddings for the given text."""
        if not text:
            return []
        # Use the vector store's embedding model if available
        if not self.vector_store:
            logger.error("Vector store instance is not available")
            return []

        # Prefer using a provided helper method for embeddings
        try:
            if hasattr(self.vector_store, 'text_to_embedding'):
                emb = self.vector_store.text_to_embedding(text)
                # Ensure a list of floats is returned
                return list(emb) if not isinstance(emb, list) else emb

            # Fallback to using embed_model directly
            if hasattr(self.vector_store, 'embed_model') and self.vector_store.embed_model:
                embedding = self.vector_store.embed_model.encode(text)
                try:
                    return embedding.tolist()
                except Exception:
                    return list(embedding)

        except Exception as e:
            logger.error(f"Embedding generation failed: {str(e)}")
            # Don't raise here; return empty embeddings so product creation can continue
            return []
    
    async def create_product(
        self,
        product_data: ProductCreate,
        image_file: Optional[bytes] = None,
        image_filename: Optional[str] = None
    ) -> ProductInDB:
        """
        Create a new product with optional image analysis.
        
        Args:
            product_data: Product creation data
            image_file: Optional image file bytes for AI analysis
            image_filename: Original filename of the image (for extension)
            
        Returns:
            ProductInDB: The created product with AI-generated metadata
            
        Raises:
            ValueError: If required data is missing or invalid
            Exception: For database or processing errors
        """
        if not product_data:
            raise ValueError("Product data is required")
            
        try:
            # Initialize store if not already done
            await self.initialize()
            
            # Process image if provided
            image_urls = list(product_data.image_urls or [])
            ai_description = product_data.ai_description
            
            if image_file and image_filename:
                try:
                    # Upload image to storage
                    image_url = await self._upload_image(image_file, image_filename)
                    image_urls.insert(0, parse_obj_as(HttpUrl, image_url))
                    
                    # Generate AI description from image
                    ai_description = await self._generate_ai_description(image_url)
                    
                except Exception as e:
                    logger.error(f"Image processing failed: {str(e)}")
                    # Continue without AI features if image processing fails
            
            # Create product in database
            product_id = uuid4()
            now = datetime.now(timezone.utc)
            
            # Generate embeddings for search
            search_text = f"{product_data.name} {product_data.description} {ai_description or ''}"
            logger.info(f"Embedding payload (search_text): {search_text}")
            embeddings = await self._generate_embeddings(search_text)
            logger.info(f"Embeddings generated length={len(embeddings)} sample={embeddings[:8] if embeddings else []}")
            
            # Prepare product data for database
            product_dict = product_data.dict()
            product_dict.update({
                "id": product_id,
                "created_at": now,
                "updated_at": now,
                "ai_description": ai_description,
                "image_urls": [str(url) for url in image_urls],
                "embeddings": embeddings,
                "embed_text": search_text,
                "type": "product"  # For filtering in vector store
            })
            
            # In a real implementation, this would insert into the database
            # For now, we'll just log and return the product
            logger.info(f"Creating product: {product_dict}")
            
            # Store in vector database (vector_store.add_documents expects a list of document dicts)
            if self.vector_store and embeddings:
                documents = [
                    {
                        "id": str(product_id),
                        "text": search_text,
                        # metadata must be JSON-serializable (no UUID/datetime objects)
                        "metadata": None,
                    }
                ]
                # Make a JSON-serializable copy of product_dict for vector metadata
                def _serialize(obj):
                    # Recursively convert common non-serializable types
                    from uuid import UUID as _UUID
                    from datetime import datetime as _dt

                    if obj is None:
                        return None
                    if isinstance(obj, (str, int, float, bool)):
                        return obj
                    if isinstance(obj, _UUID):
                        return str(obj)
                    if isinstance(obj, _dt):
                        try:
                            return obj.isoformat()
                        except Exception:
                            return str(obj)
                    if isinstance(obj, dict):
                        return {k: _serialize(v) for k, v in obj.items()}
                    if isinstance(obj, (list, tuple, set)):
                        return [_serialize(v) for v in obj]
                    # Fallback to string representation
                    try:
                        return str(obj)
                    except Exception:
                        return None

                metadata_serializable = _serialize(product_dict)
                documents[0]["metadata"] = metadata_serializable

                # vector_store.add_documents is synchronous; run it in a thread to avoid blocking
                loop = asyncio.get_running_loop()
                await loop.run_in_executor(None, self.vector_store.add_documents, documents)
            
            # Convert back to Pydantic model for validation
            return ProductInDB(**product_dict)
            
        except Exception as e:
            logger.error(f"Failed to create product: {str(e)}")
            raise
    
    async def get_product(self, product_id: str) -> Optional[ProductInDB]:
        """
        Get a product by ID.
        
        Args:
            product_id: The ID of the product to retrieve
            
        Returns:
            Optional[ProductInDB]: The product if found, None otherwise
            
        Raises:
            ValueError: If product_id is empty or invalid
            Exception: For database or processing errors
            
        Note:
            This is an alias for get_product_by_id for backward compatibility.
            New code should use get_product_by_id instead.
        """
        return await self.get_product_by_id(product_id)
    
    async def update_product(
        self, 
        product_id: str, 
        product_data: ProductUpdate
    ) -> Optional[ProductInDB]:
        """
        Update a product with new data.
        
        Args:
            product_id: The ID of the product to update
            product_data: The updated product data
            
        Returns:
            Optional[ProductInDB]: The updated product if found and updated, None otherwise
            
        Raises:
            ValueError: If product_id is empty or product_data is invalid
            Exception: For database or processing errors
            
        Note:
            - Only non-None fields in product_data will be updated
            - Updates the vector store if searchable fields (name, description, materials) are modified
        """
        if not product_id or not isinstance(product_id, str):
            raise ValueError("Product ID must be a non-empty string")
            
        if not product_data or not isinstance(product_data, ProductUpdate):
            raise ValueError("Invalid product data")
            
        try:
            # Initialize store if not already done
            await self.initialize()
            
            # Get existing product
            existing_product = await self.get_product_by_id(product_id)
            if not existing_product:
                logger.warning(f"Product {product_id} not found for update")
                return None
                
            # Convert to dict for easier manipulation
            update_data = product_data.dict(exclude_unset=True)
            
            # Check if searchable fields are being updated
            searchable_fields_updated = any(
                field in update_data 
                for field in ["name", "description", "materials"]
            )
            
            # In a real implementation:
            # 1. Update the product in the database
            # 2. If searchable_fields_updated, update the vector store
            # 3. Return the updated product
            
            # For now, log the update and return the existing product
            logger.info(f"Would update product {product_id} with data: {update_data}")
            if searchable_fields_updated:
                logger.info("Searchable fields were updated - would update vector store")
                
            # In a real implementation, this would return the updated product
            # For now, return the existing product as a placeholder
            return existing_product
            
        except ValidationError as ve:
            logger.error(f"Validation error updating product {product_id}: {str(ve)}")
            raise ValueError(f"Invalid product data: {str(ve)}")
        except Exception as e:
            logger.error(f"Failed to update product {product_id}: {str(e)}")
            raise
    
    async def delete_product(self, product_id: str) -> bool:
        """
        Delete a product by its ID.
        
        Args:
            product_id: The ID of the product to delete
            
        Returns:
            bool: True if the product was successfully deleted, False if not found
            
        Raises:
            ValueError: If product_id is empty or invalid
            Exception: For database or processing errors
            
        Note:
            - This will remove the product from both the main database and vector store
            - Returns False if the product doesn't exist
        """
        if not product_id or not isinstance(product_id, str):
            raise ValueError("Product ID must be a non-empty string")
            
        try:
            # Initialize store if not already done
            await self.initialize()
            
            # Check if product exists
            existing_product = await self.get_product_by_id(product_id)
            if not existing_product:
                logger.warning(f"Product {product_id} not found for deletion")
                return False
                
            # In a real implementation:
            # 1. Delete from the main database
            # 2. Delete from vector store
            # 3. Handle any cleanup (e.g., deleting associated images)
            
            # For now, log the deletion and return True
            logger.info(f"Would delete product {product_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to delete product {product_id}: {str(e)}")
            raise
    
    async def search_products(
        self,
        query: str,
        limit: int = 10,
        filters: Optional[Dict[str, Any]] = None
    ) -> List[ProductSearchResult]:
        """
        Search for products using semantic search with optional filters.
        
        Args:
            query: The search query text
            limit: Maximum number of results to return (default: 10)
            filters: Optional filters to apply (e.g., category, price range)
            
        Returns:
            List[ProductSearchResult]: List of matching products with similarity scores
            
        Raises:
            ValueError: If required parameters are missing or invalid
            Exception: For search or processing errors
        """
        if not query or not query.strip():
            raise ValueError("Search query cannot be empty")
            
        try:
            # Initialize store if not already done
            await self.initialize()
            
            if not self.vector_store:
                raise ValueError("Vector store not available for search")
            
            # Prepare filters for vector store
            search_filters = {"type": "product"}
            if filters:
                search_filters.update(filters)
                
            # Perform vector search (vector_store.search returns a list of dicts
            # with keys: 'text', 'distance', 'metadata')
            search_results = await self.vector_store.search(
                query=query,
                k=limit,
                filter_metadata=search_filters
            )

            products: List[ProductSearchResult] = []
            for result in search_results:
                try:
                    # Support both dict-shaped results and object-like results
                    if isinstance(result, dict):
                        metadata = result.get('metadata') or {}
                        distance = float(result.get('distance', 1.0))
                    else:
                        # Fallback to attribute access
                        metadata = dict(result.metadata) if hasattr(result, 'metadata') else {}
                        distance = float(getattr(result, 'distance', 1.0))

                    # Ensure metadata is a dict
                    if isinstance(metadata, str):
                        try:
                            metadata = json.loads(metadata)
                        except Exception:
                            metadata = {'meta': metadata}

                    # Add similarity score (convert from distance)
                    similarity = max(0.0, min(1.0, 1.0 - distance))
                    if isinstance(metadata, dict):
                        metadata['similarity_score'] = similarity

                    # Ensure all required fields are present
                    if not isinstance(metadata, dict) or not all(field in metadata for field in ["id", "name", "description"]):
                        logger.warning(f"Incomplete product data in search result: {metadata}")
                        continue

                    # Convert string URLs back to HttpUrl objects
                    if 'image_urls' in metadata and isinstance(metadata['image_urls'], list):
                        try:
                            metadata['image_urls'] = [parse_obj_as(HttpUrl, url) for url in metadata['image_urls'] if isinstance(url, str)]
                        except Exception:
                            pass

                    product = ProductSearchResult(**metadata)
                    products.append(product)

                except ValidationError as e:
                    logger.error(f"Invalid product data in search results: {e}")
                except Exception as e:
                    logger.error(f"Error processing search result: {str(e)}")

            return products
            
        except Exception as e:
            logger.error(f"Product search failed: {str(e)}")
            raise
    
    async def get_product_by_id(self, product_id: str) -> Optional[ProductInDB]:
        """Get a product by its ID.
        
        Args:
            product_id: The product ID to look up
            
        Returns:
            Optional[ProductInDB]: The product if found, None otherwise
            
        Raises:
            ValueError: If product_id is empty or invalid
            Exception: For database or processing errors
        """
        if not product_id or not isinstance(product_id, str):
            raise ValueError("Product ID must be a non-empty string")
            
        try:
            # Initialize store if not already done
            await self.initialize()
            
            # In a real implementation, this would query your database
            # For example:
            # product_data = await self._db_client.query_one(
            #     """
            #     SELECT * FROM products WHERE id = %s
            #     """,
            #     (product_id,)
            # )
            # 
            # if not product_data:
            #     return None
            #     
            # return ProductInDB(**product_data)
            
            # Try to fetch product metadata from the vector store metadata (if available)
            if self.vector_store:
                try:
                    doc = await self.vector_store.get_document_by_id(product_id)
                    if not doc:
                        return None

                    # Normalize the returned doc into a metadata dict
                    metadata = None

                    if isinstance(doc, dict):
                        # Prefer explicit metadata keys when present
                        if 'metadata' in doc:
                            metadata = doc['metadata']
                        elif 'meta' in doc:
                            metadata = doc['meta']
                        else:
                            # The dict itself may already be the metadata
                            metadata = doc

                    elif isinstance(doc, (list, tuple)):
                        # row-like: first column is meta
                        first = doc[0] if len(doc) > 0 else None
                        if isinstance(first, (dict, list)):
                            metadata = first
                        elif isinstance(first, str):
                            try:
                                metadata = json.loads(first)
                            except Exception:
                                metadata = {"meta": first}

                    elif isinstance(doc, str):
                        try:
                            metadata = json.loads(doc)
                        except Exception:
                            metadata = {"meta": doc}

                    else:
                        # Row-like object with attributes
                        if hasattr(doc, 'metadata'):
                            metadata = getattr(doc, 'metadata')
                        elif hasattr(doc, 'meta'):
                            metadata = getattr(doc, 'meta')
                        else:
                            try:
                                metadata = dict(doc)
                            except Exception:
                                metadata = None

                    # If metadata is still a string, try to parse JSON
                    if isinstance(metadata, str):
                        try:
                            metadata = json.loads(metadata)
                        except Exception:
                            metadata = {"meta": metadata}

                    if metadata is None:
                        metadata = {}

                    # Unwrap nested 'meta' if necessary
                    if isinstance(metadata, dict) and 'meta' in metadata and isinstance(metadata['meta'], dict):
                        metadata = metadata['meta']

                    logger.debug(f"Raw doc type={type(doc)}, normalized metadata type={type(metadata)}; keys={(list(metadata.keys()) if isinstance(metadata, dict) else None)}")

                    # Convert image_urls strings back to HttpUrl objects when possible
                    image_urls = metadata.get('image_urls', []) if isinstance(metadata, dict) else []
                    try:
                        image_urls_parsed = [parse_obj_as(HttpUrl, u) for u in image_urls]
                    except Exception:
                        image_urls_parsed = image_urls

                    product_dict = {
                        'id': metadata.get('id', product_id) if isinstance(metadata, dict) else product_id,
                        'name': metadata.get('name', '') if isinstance(metadata, dict) else '',
                        'description': metadata.get('description', '') if isinstance(metadata, dict) else '',
                        'price': metadata.get('price', 0.0) if isinstance(metadata, dict) else 0.0,
                        'category': metadata.get('category', 'other') if isinstance(metadata, dict) else 'other',
                        'materials': metadata.get('materials', []) if isinstance(metadata, dict) else [],
                        'care_instructions': metadata.get('care_instructions', '') if isinstance(metadata, dict) else '',
                        'image_urls': image_urls_parsed,
                        'ai_description': metadata.get('ai_description', None) if isinstance(metadata, dict) else None,
                        'created_at': metadata.get('created_at') if isinstance(metadata, dict) else None,
                        'updated_at': metadata.get('updated_at') if isinstance(metadata, dict) else None,
                        'embeddings': metadata.get('embeddings', []) if isinstance(metadata, dict) else [],
                        'embed_text': metadata.get('embed_text', None) if isinstance(metadata, dict) else None,
                    }

                    return ProductInDB(**product_dict)
                except Exception as e:
                    logger.error(f"Error retrieving product from vector store: {e}")

            # If vector store lookup failed or missing, fallback to None
            return None
            
        except Exception as e:
            logger.error(f"Failed to get product {product_id}: {str(e)}")
            raise

    async def get_all_products(self, limit: int = 1000) -> List[ProductInDB]:
        """Fetch up to `limit` products from the vector store and return as ProductInDB list.

        This method mirrors the normalization logic used in `get_product_by_id`.
        """
        results: List[ProductInDB] = []
        if not self.vector_store:
            return results

        try:
            docs = await self.vector_store.get_all_documents(limit=limit)
            for doc in docs:
                try:
                    # Reuse normalization logic by copying core steps from get_product_by_id
                    metadata = None
                    if isinstance(doc, dict):
                        metadata = doc.get('metadata') or doc.get('meta') or doc
                    elif isinstance(doc, (list, tuple)):
                        first = doc[0] if len(doc) > 0 else None
                        if isinstance(first, (dict, list)):
                            metadata = first
                        elif isinstance(first, str):
                            try:
                                metadata = json.loads(first)
                            except Exception:
                                metadata = {'meta': first}
                    elif isinstance(doc, str):
                        try:
                            metadata = json.loads(doc)
                        except Exception:
                            metadata = {'meta': doc}
                    else:
                        if hasattr(doc, 'metadata'):
                            metadata = getattr(doc, 'metadata')
                        elif hasattr(doc, 'meta'):
                            metadata = getattr(doc, 'meta')
                        else:
                            try:
                                metadata = dict(doc)
                            except Exception:
                                metadata = None

                    if isinstance(metadata, str):
                        try:
                            metadata = json.loads(metadata)
                        except Exception:
                            metadata = {'meta': metadata}

                    if metadata is None:
                        metadata = {}

                    if isinstance(metadata, dict) and 'meta' in metadata and isinstance(metadata['meta'], dict):
                        metadata = metadata['meta']

                    image_urls = metadata.get('image_urls', []) if isinstance(metadata, dict) else []
                    try:
                        image_urls_parsed = [parse_obj_as(HttpUrl, u) for u in image_urls]
                    except Exception:
                        image_urls_parsed = image_urls

                    product_dict = {
                        'id': metadata.get('id'),
                        'name': metadata.get('name', ''),
                        'description': metadata.get('description', ''),
                        'price': metadata.get('price', 0.0),
                        'category': metadata.get('category', 'other'),
                        'materials': metadata.get('materials', []),
                        'care_instructions': metadata.get('care_instructions', ''),
                        'image_urls': image_urls_parsed,
                        'ai_description': metadata.get('ai_description', None),
                        'created_at': metadata.get('created_at'),
                        'updated_at': metadata.get('updated_at'),
                        'embeddings': metadata.get('embeddings', []),
                        'embed_text': metadata.get('embed_text', None),
                    }

                    try:
                        results.append(ProductInDB(**product_dict))
                    except Exception:
                        logger.exception("Failed to validate product metadata into ProductInDB for id=%s", metadata.get('id'))

                except Exception:
                    logger.exception("Failed to normalize a document in get_all_products")

            return results
        except Exception as e:
            logger.error(f"Failed to fetch all products: {e}")
            return results

# Create a singleton instance
product_store = ProductStore()
