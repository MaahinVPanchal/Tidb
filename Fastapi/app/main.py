from fastapi import FastAPI
from app.routers import auth

app = FastAPI(title="BodhiRag Auth Service", version="1.0.0")
app.include_router(auth.router)

@app.get("/")
def root():
    return {"msg": "BodhiRag auth service is running"}