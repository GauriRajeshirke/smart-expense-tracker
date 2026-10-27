"""FastAPI wrapper around detector.py.

Run it from the ml-service folder:
    uvicorn main:app --reload --port 8000
Interactive docs (good for a demo): http://localhost:8000/docs

This service is meant to be called only by the Express server. Do not expose
it to the internet; users talk to Express, and Express talks to this service.
"""
from fastapi import FastAPI
from pydantic import BaseModel, Field

from detector import detect_anomalies

app = FastAPI(title="Expense ML Service")


class Expense(BaseModel):
    id: str = Field(max_length=64)
    date: str = Field(max_length=30)
    amount: float = Field(gt=0, lt=1_000_000_000)
    category: str = Field(max_length=40)
    description: str = Field(default="", max_length=100)


class AnalyzeRequest(BaseModel):
    expenses: list[Expense] = Field(max_length=5000)


@app.get("/health")
def health():
    return {"status": "ok", "service": "fastapi-ml"}


@app.post("/analyze")
def analyze(request: AnalyzeRequest):
    """Receive a user's expenses and return the unusual ones."""
    return detect_anomalies([expense.model_dump() for expense in request.expenses])
