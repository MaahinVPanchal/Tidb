import os
import uuid
from typing import Iterable, List, Tuple

from pytidb import TiDBClient
from pytidb.schema import TableModel, Field
from pytidb.embeddings import EmbeddingFunction
from pytidb.datatype import TEXT

from app.config import settings


class Document(TableModel):
    __tablename__ = "code_documents"

    id: int = Field(primary_key=True)
    batch_uuid: str = Field()
    repo_uuid: str = Field()
    repo_name: str = Field()
    source: str = Field()
    clone_url: str = Field()
    file_path: str = Field()
    content: str = Field(sa_type=TEXT)

    # Automatic embedding generated from the 'content' field using TiDB Cloud function
    embedding: list[float] = EmbeddingFunction(
        model_name="tidbcloud_free/amazon/titan-embed-text-v2"
    ).VectorField(source_field="content")

    # Suppress pydantic protected namespace warning for model_name
    model_config = {"protected_namespaces": ()}


def connect_tidb() -> TiDBClient:
    """Create and return a TiDB client using env-backed settings."""
    client = TiDBClient.connect(
        host=settings.db_host,
        port=settings.db_port,
        username=settings.db_username,
        password=settings.db_password,
        database=settings.db_database,
        ensure_db=True,
    )
    return client


def ensure_tables(client: TiDBClient):
    """Create required tables if they don't exist."""
    try:
        client.create_table(schema=Document, if_exists="ignore")
    except Exception as e:
        print(f"Table create check ignored error: {e}")

    client.execute(
        """
        CREATE TABLE IF NOT EXISTS repo_index (
            repo_uuid CHAR(36) PRIMARY KEY,
            batch_uuid CHAR(36) NOT NULL,
            source VARCHAR(50) NOT NULL,
            repo_name VARCHAR(255) NOT NULL,
            clone_url TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """
    )


def iter_code_files(root_dir: str) -> Iterable[str]:
    exts = {
        ".py", ".js", ".ts", ".tsx", ".jsx", ".java", ".go", ".rs",
        ".rb", ".php", ".swift", ".kt", ".kts", ".c", ".h", ".cpp", ".hpp",
        ".cs", ".scala", ".sh", ".bash", ".zsh", ".ps1", ".yml", ".yaml",
        ".toml", ".ini", ".cfg", ".gradle", ".md"
    }

    skip_dirs = {".git", "node_modules", "venv", "__pycache__", ".mypy_cache", ".pytest_cache"}

    for dirpath, dirnames, filenames in os.walk(root_dir):
        dirnames[:] = [d for d in dirnames if d not in skip_dirs]
        for fname in filenames:
            _, ext = os.path.splitext(fname)
            if ext.lower() in exts:
                yield os.path.join(dirpath, fname)


def chunk_text(text: str, max_chars: int = 1000, overlap: int = 100) -> List[str]:
    if not text:
        return []

    chunks = []
    start = 0
    n = len(text)
    while start < n:
        end = min(n, start + max_chars)
        chunks.append(text[start:end])
        start = end - overlap if end < n else end
        if start < 0:
            start = 0
    return chunks


def embed_repo(repo_path: str, repo_name: str, batch_uuid: str, repo_uuid: str, clone_url: str) -> Tuple[int, int]:
    """Embed all code files in a repo and store in TiDB (ORM style)."""
    client = connect_tidb()
    ensure_tables(client)

    # Upsert repo_index
    try:
        client.execute(
            """
            INSERT INTO repo_index (repo_uuid, batch_uuid, source, repo_name, clone_url)
            VALUES (%s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE 
              batch_uuid=VALUES(batch_uuid), 
              source=VALUES(source), 
              repo_name=VALUES(repo_name), 
              clone_url=VALUES(clone_url)
            """,
            (repo_uuid, batch_uuid, "github", repo_name, clone_url),
        )
    except Exception as e:
        print(f"Failed upsert repo_index for {repo_name}: {e}")

    files_processed = 0
    chunks_inserted = 0

    for fpath in iter_code_files(repo_path):
        try:
            with open(fpath, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()
        except Exception:
            continue

        chunks = chunk_text(content)
        if not chunks:
            continue

        rel_path = os.path.relpath(fpath, repo_path)

        # Use pytidb table + bulk_insert (faster, matches official usage)
        table = client.create_table(schema=Document, if_exists="ignore")

        docs = [
            Document(
                batch_uuid=batch_uuid,
                repo_uuid=repo_uuid,
                repo_name=repo_name,
                source="github",
                clone_url=clone_url,
                file_path=rel_path,
                content=ch,
            )
            for ch in chunks
        ]

        try:
            table.bulk_insert(docs)
            chunks_inserted += len(docs)
        except Exception as e:
            print(f"Failed bulk_insert for {rel_path}: {e}")

        files_processed += 1

    return files_processed, chunks_inserted