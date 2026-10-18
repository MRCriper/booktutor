"""
FastAPI Backend Server для платформы репетитора «Квант & Код».
Включает роуты аутентификации, расписания, банка задач, домашних заданий и прокси Piston API.
"""
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import httpx

app = FastAPI(
    title="Квант & Код API",
    description="Backend API для репетитора по математике, физике и информатике",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

PISTON_URL = "https://emkc.org/api/v2/piston/execute"

class CodeExecuteRequest(BaseModel):
    language: str
    code: str
    stdin: Optional[str] = ""

@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "tutor_platform_backend"}

@app.post("/api/sandbox/execute")
async def execute_code(req: CodeExecuteRequest):
    """
    Проксирование запроса на выполнение кода через открытый Piston API
    """
    lang_map = {"python": "python", "cpp": "c++", "javascript": "javascript"}
    payload = {
        "language": lang_map.get(req.language, req.language),
        "version": "*",
        "files": [{"name": "solution", "content": req.code}],
        "stdin": req.stdin,
        "run_timeout": 5000
    }
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.post(PISTON_URL, json=payload, timeout=10.0)
            return resp.json()
        except Exception as e:
            raise HTTPException(status_code=502, detail=f"Ошибка выполнения в Piston: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
