# Vector Search API

This service provides semantic search capabilities using TiDB Vector and sentence-transformers. It allows you to store documents with vector embeddings and perform similarity searches.

## Features

- Store documents with text and metadata
- Perform semantic similarity searches
- Filter search results by metadata
- Uses the `all-MiniLM-L6-v2` model for text embeddings

## Prerequisites

- Python 3.8+
- TiDB Cloud account with Vector Search enabled
- Required Python packages (install using `pip install -r requirements.txt`)

## Setup

1. Copy `.env.example` to `.env` and update the `TIDB_DATABASE_URL` with your TiDB Cloud connection string:
   ```
   TIDB_DATABASE_URL="mysql+pymysql://<prefix>.root:<password>@gateway01.<region>.prod.aws.tidbcloud.com:4000/test?ssl_ca=/etc/ssl/cert.pem&ssl_verify_cert=true&ssl_verify_identity=true"
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

## Running the Service

Start the FastAPI server:
```bash
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`

## API Endpoints

### Add Documents

**POST** `/api/vector/documents/`

Add one or more documents to the vector store.

**Request Body:**
```json
{
  "documents": [
    {
      "text": "sample text",
      "metadata": {
        "category": "example",
        "source": "test"
      }
    }
  ]
}
```

**Response:**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "text": "sample text",
    "metadata": {
      "category": "example",
      "source": "test",
      "created_at": "2023-01-01T00:00:00.000000"
    },
    "created_at": "2023-01-01T00:00:00"
  }
]
```

### Search Documents

**POST** `/api/vector/search/`

Search for documents similar to the query text.

**Request Body:**
```json
{
  "query": "search query",
  "k": 3,
  "filter_metadata": {
    "category": "example"
  }
}
```

**Response:**
```json
[
  {
    "text": "sample text",
    "distance": 0.123456789,
    "metadata": {
      "category": "example",
      "source": "test",
      "created_at": "2023-01-01T00:00:00.000000"
    }
  }
]
```

## Testing

Run the test script to verify the functionality:

```bash
python test_vector_search.py
```

This will:
1. Add sample documents to the vector store
2. Perform a semantic search
3. Perform a filtered search

## Notes

- The embedding model (`all-MiniLM-L6-v2`) generates 384-dimensional vectors
- Documents are stored with their metadata and a unique ID
- Search results are ordered by distance (lower is more similar)
- The vector store table (`embedded_documents`) will be created automatically on first use
