# Atelier Product Management API

This API provides endpoints for managing products with AI-powered image analysis and semantic search capabilities.

## Features

- **Product Management**: Create, retrieve, and manage product listings
- **AI-Powered Image Analysis**: Automatically generate product descriptions from images using Moonshot AI
- **Semantic Search**: Find products using natural language queries
- **Vector Embeddings**: Store and search product data using TiDB Vector

## Setup

1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Create a `.env` file with your configuration:
   ```
   # TiDB Configuration
   TIDB_DATABASE_URL="mysql+pymysql://<user>:<password>@<host>:<port>/<database>?ssl_verify_cert=true"
   
   # Moonshot AI Configuration
   MOONSHOT_API_KEY="your-moonshot-ai-api-key"
   ```

3. Start the server:
   ```bash
   uvicorn app.main:app --reload
   ```

## API Endpoints

### 1. Create a Product

**POST** `/api/products/`

Create a new product with optional image upload for AI analysis.

**Form Data:**
- `name` (string, required): Product name
- `price` (float, required): Product price in USD
- `category` (string, required): Product category (all, patola, traditional, modern, accessories)
- `description` (string, optional): Product description
- `materials` (JSON array, optional): List of materials
- `care_instructions` (string, required): Care instructions
- `image` (file, optional): Product image for AI analysis
- `image_urls` (JSON array, optional): List of existing image URLs

**Example Request:**
```bash
curl -X POST "http://localhost:8000/api/products/" \
  -H "accept: application/json" \
  -F "name=Handcrafted Ceramic Mug" \
  -F "price=24.99" \
  -F "category=traditional" \
  -F "description=A beautiful handcrafted ceramic mug" \
  -F "materials=[\"ceramic\",\"glaze\"]" \
  -F "care_instructions=Hand wash only" \
  -F "image=@mug.jpg"
```

### 2. Get Product by ID

**GET** `/api/products/{product_id}`

Retrieve a product by its ID.

**Example Request:**
```bash
curl -X GET "http://localhost:8000/api/products/123e4567-e89b-12d3-a456-426614174000" \
  -H "accept: application/json"
```

### 3. Search Products

**POST** `/api/products/search`

Search for products using natural language queries.

**Request Body:**
```json
{
  "query": "handmade ceramic mug",
  "category": "home",
  "max_price": 50.0,
  "min_price": 0,
  "limit": 10
}
```

**Example Request:**
```bash
curl -X POST "http://localhost:8000/api/products/search" \
  -H "Content-Type: application/json" \
  -d '{"query": "handmade ceramic mug", "category": "home"}'
```

### 4. Add Product Image

**POST** `/api/products/{product_id}/images`

Add an image to an existing product.

**Form Data:**
- `image` (file, required): The image file to upload
- `is_primary` (boolean, optional): Whether to set as primary image

**Example Request:**
```bash
curl -X POST "http://localhost:8000/api/products/123e4567-e89b-12d3-a456-426614174000/images" \
  -F "image=@mug_detail.jpg" \
  -F "is_primary=false"
```

## Testing

Run the test script to verify the API functionality:

```bash
python test_product_api.py
```

## Error Handling

The API returns appropriate HTTP status codes and error messages in the following format:

```json
{
  "detail": "Error message describing the issue"
}
```

## Rate Limiting

Consider implementing rate limiting in production to prevent abuse of the API.

## Security

- Use HTTPS in production
- Implement proper authentication and authorization
- Validate and sanitize all user inputs
- Store API keys securely using environment variables

## Dependencies

- FastAPI: Web framework
- TiDB Vector: Vector database for semantic search
- Moonshot AI: Image analysis and description generation
- SQLAlchemy: Database ORM
- Pydantic: Data validation

## License

[Your License Here]
