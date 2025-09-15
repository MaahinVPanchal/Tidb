from typing import List, Dict, Any, Optional
import asyncio
from sentence_transformers import SentenceTransformer
from tidb_vector.integrations import TiDBVectorClient
import logging
from ..config import settings

logger = logging.getLogger(__name__)

class VectorStore:
    def __init__(self):
        """Initialize the vector store with the embedding model and TiDB connection."""
        self.embed_model = None
        self.vector_store = None
        self.embed_model_dims = None
        # Do not load the heavy embedding model at import/constructor time.
        # Embedding model will be initialized asynchronously in _initialize_store
        self._embedding_initialized = False
        
    async def _initialize_store(self):
        """Initialize the vector store connection."""
        await self._initialize_vector_store()
    
    def _load_embedding_sync(self):
        """Blocking load of the SentenceTransformer model. Runs in a threadpool."""
        logger.info("Loading embedding model (blocking call)...")
        device = "cpu"
        model = SentenceTransformer(
            "sentence-transformers/all-MiniLM-L6-v2",
            trust_remote_code=True,
            device=device
        )
        dims = model.get_sentence_embedding_dimension()
        logger.info(f"Embedding model loaded with dimension: {dims} on {device.upper()}")
        return model, dims

    async def _initialize_embedding_model_async(self):
        """Async wrapper to load the embedding model in a background thread.

        This avoids blocking the event loop or import time (which causes issues
        with uvicorn's reload/subprocess behavior).
        """
        if self._embedding_initialized:
            return

        loop = asyncio.get_running_loop()
        try:
            model, dims = await loop.run_in_executor(None, self._load_embedding_sync)
            self.embed_model = model
            self.embed_model_dims = dims
            self._embedding_initialized = True
        except Exception as e:
            logger.error(f"Failed to asynchronously initialize embedding model: {e}")
            # Do not re-raise here so server can still start; downstream code will
            # handle missing embeddings gracefully.
    
    async def _initialize_vector_store(self):
        """Initialize the TiDB vector store connection."""
        try:
            # Ensure embedding model is loaded (run in background thread)
            await self._initialize_embedding_model_async()

            if not settings.tidb_database_url:
                raise ValueError("TIDB_DATABASE_URL is not configured in settings")
                
            logger.info("Initializing TiDB vector store...")
            self.vector_store = TiDBVectorClient(
                table_name='embedded_documents',
                connection_string=settings.tidb_database_url,
                vector_dimension=self.embed_model_dims,
                drop_existing_table=False,  # Set to True if you want to recreate the table on each run
            )
            logger.info("Successfully connected to TiDB vector store")
            logger.info("TiDB Vector store initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize TiDB vector store: {str(e)}")
            raise
    
    def text_to_embedding(self, text: str) -> List[float]:
        """Generate vector embedding for the given text.
        
        Args:
            text: The input text to embed
            
        Returns:
            List[float]: The vector embedding
        """
        if not self.embed_model:
            raise RuntimeError("Embedding model not initialized")
        
        try:
            embedding = self.embed_model.encode(text)
            return embedding.tolist()
        except Exception as e:
            logger.error(f"Failed to generate embedding: {str(e)}")
            raise
    
    def add_documents(self, documents: List[Dict[str, Any]]) -> None:
        """Add documents to the vector store.
        
        Args:
            documents: List of document dictionaries with 'id', 'text', and 'metadata' keys
        """
        if not self.vector_store:
            raise RuntimeError("Vector store not initialized")
        
        try:
            # Prepare documents for insertion
            ids = []
            texts = []
            embeddings = []
            metadatas = []
            
            for doc in documents:
                if not all(k in doc for k in ['id', 'text', 'metadata']):
                    raise ValueError("Each document must have 'id', 'text', and 'metadata' keys")
                
                ids.append(doc['id'])
                texts.append(doc['text'])
                embeddings.append(self.text_to_embedding(doc['text']))
                metadatas.append(doc['metadata'])
            
            # Insert into vector store
            self.vector_store.insert(
                ids=ids,
                texts=texts,
                embeddings=embeddings,
                metadatas=metadatas
            )
            logger.info(f"Successfully added {len(documents)} documents to the vector store")
        except Exception as e:
            logger.error(f"Failed to add documents: {str(e)}")
            raise
    
    def search(self, query: str, k: int = 3, filter_metadata: Optional[Dict] = None) -> List[Dict]:
        """Search for similar documents.
        
        Args:
            query: The search query string
            k: Number of results to return
            filter_metadata: Optional metadata filter
            
        Returns:
            List[Dict]: List of search results with 'text', 'distance', and 'metadata'
        """
        if not self.vector_store:
            raise RuntimeError("Vector store not initialized")
        
        try:
            # Convert query to embedding
            query_embedding = self.text_to_embedding(query)
            
            # Perform search
            # TiDBVectorClient.query expects the query vector as the first positional
            # argument (query_vector). Pass it positionally to avoid missing-arg errors.
            results = self.vector_store.query(
                query_embedding,
                k=k,
                filters=filter_metadata
            )
            
            # Format results
            formatted_results = []
            for r in results:
                formatted_results.append({
                    'text': r.document,
                    'distance': float(r.distance),
                    'metadata': r.metadata
                })
            
            return formatted_results
        except Exception as e:
            logger.error(f"Search failed: {str(e)}")
            raise

    async def get_document_by_id(self, doc_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve a stored document and metadata by its vector-store id.

        Returns a dict with keys: id, document, metadata or None if not found.
        This method executes the query in a threadpool to avoid blocking the event loop.
        """
        if not self.vector_store:
            raise RuntimeError("Vector store not initialized")

        loop = asyncio.get_running_loop()
        return await loop.run_in_executor(None, self._get_document_by_id_sync, doc_id)

    def _get_document_by_id_sync(self, doc_id: str) -> Optional[Dict[str, Any]]:
        """Synchronous helper to query the underlying TiDB table for a given id."""
        try:
            table = getattr(self.vector_store, "_table_name", None)
            if not table:
                # Fallback: use the table model name if present
                table = getattr(self.vector_store, "_table_model", None)
                if table and hasattr(table, "__tablename__"):
                    table = table.__tablename__

            if not table:
                raise RuntimeError("Unable to determine vector table name")

            sql = f"SELECT meta, document, id FROM {table} WHERE id = :id LIMIT 1"
            res = self.vector_store.execute(sql, {"id": doc_id})
            if not res.get("success"):
                logger.error(f"Vector store execute failed for id={doc_id}: {res.get('error')}")
                return None

            rows = res.get("result") or []
            if not rows:
                return None

            row = rows[0]
            # SQLAlchemy rows may be Row or tuple-like
            meta = row[0]
            document = row[1]
            rid = row[2]
            return {"id": rid, "document": document, "metadata": meta}
        except Exception as e:
            logger.error(f"Failed to fetch document by id from vector store: {e}")
            return None

    def get_all_documents_sync(self, limit: int = 1000) -> List[Dict[str, Any]]:
        """Synchronous helper to fetch all documents (up to `limit`) from the vector table."""
        try:
            table = getattr(self.vector_store, "_table_name", None)
            if not table:
                table = getattr(self.vector_store, "_table_model", None)
                if table and hasattr(table, "__tablename__"):
                    table = table.__tablename__

            if not table:
                raise RuntimeError("Unable to determine vector table name")

            sql = f"SELECT meta, document, id FROM {table} LIMIT :limit"
            res = self.vector_store.execute(sql, {"limit": limit})
            if not res.get("success"):
                logger.error(f"Vector store execute failed for get_all: {res.get('error')}")
                return []

            rows = res.get("result") or []
            docs: List[Dict[str, Any]] = []
            for row in rows:
                try:
                    meta = row[0]
                    document = row[1]
                    rid = row[2]
                    docs.append({"id": rid, "document": document, "metadata": meta})
                except Exception:
                    logger.exception("Failed to parse a row from get_all_documents")
            return docs
        except Exception as e:
            logger.error(f"Failed to fetch all documents from vector store: {e}")
            return []

    async def get_all_documents(self, limit: int = 1000) -> List[Dict[str, Any]]:
        """Async wrapper around `get_all_documents_sync`."""
        loop = asyncio.get_running_loop()
        return await loop.run_in_executor(None, self.get_all_documents_sync, limit)

# Create a singleton instance
vector_store = VectorStore()
