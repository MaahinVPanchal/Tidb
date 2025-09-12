# BodhiRag Auth Service

FastAPI + Redis + SMTP registration/login with 24-hour rolling sessions.

## Quick start
```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# create db and apply migrations
alembic upgrade head

# run
uvicorn app.main:app --reload