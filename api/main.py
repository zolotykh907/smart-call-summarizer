import shutil
import os
from pathlib import Path

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi import BackgroundTasks
import uuid
import threading

import sys
sys.path.append(str(Path(__file__).parent.parent / "src"))

from summary_pipeline import SummaryPipeline


pipeline = SummaryPipeline()

TEMP_DIR = 'temp_files/'
os.makedirs(TEMP_DIR, exist_ok=True)


app = FastAPI(
    title='Smart call summarizer',
    description='Суммаризатор созвонов',
    version=1.0
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

JOBS = {}

def _update_job(job_id: str, **kwargs):
    job = JOBS.get(job_id)
    if not job:
        job = {"status": "pending", "step": None, "progress": 0, "message": None, "result": None, "error": None}
        JOBS[job_id] = job
    job.update(kwargs)

def process_job(job_id: str, file_path: str):
    try:
        _update_job(job_id, status="processing", step=None, progress=0, message="Запуск...")

        def cb(**kwargs):
            job = JOBS.get(job_id, {})
            if job.get("status") == "cancelled":
                raise RuntimeError("Cancelled by user")
            _update_job(job_id, **kwargs)

        result = pipeline.run(file_path, progress_cb=cb)
        _update_job(job_id, status="completed", step="done", progress=100, message="Готово", result=result)
    except Exception as e:
        job = JOBS.get(job_id, {})
        if job.get("status") == "cancelled":
            _update_job(job_id, step="cancelled", message="Отменено пользователем", error=None)
        else:
            _update_job(job_id, status="error", step="failed", message=str(e), error=str(e))
    finally:
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
            except Exception:
                pass

@app.post('/summary-audio/start')
async def summary_audio_start(file: UploadFile = File(...)):
    if not file.filename.lower().endswith((".wav", ".mp3", ".m4a")):
        raise HTTPException(status_code=400, detail="Неподдерживаемый формат файла")

    file_path = os.path.join(TEMP_DIR, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    job_id = str(uuid.uuid4())
    JOBS[job_id] = {"status": "pending", "step": None, "progress": 0, "message": None, "result": None, "error": None}

    thread = threading.Thread(target=process_job, args=(job_id, file_path), daemon=True)
    thread.start()

    return {"jobId": job_id}

@app.get('/summary-audio/status/{job_id}')
async def summary_audio_status(job_id: str):
    job = JOBS.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Задача не найдена")
    response = {
        "status": job.get("status"),
        "step": job.get("step"),
        "progress": job.get("progress"),
        "message": job.get("message"),
    }
    if job.get("status") == "completed" and job.get("result"):
        response.update({"success": True, **job["result"]})
    if job.get("status") == "error":
        response.update({"success": False, "error": job.get("error")})
    return JSONResponse(response)

@app.post('/summary-audio/cancel/{job_id}')
async def summary_audio_cancel(job_id: str):
    job = JOBS.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Задача не найдена")
    _update_job(job_id, status="cancelled", message="Отменено пользователем")
    return {"success": True}

@app.post('/summary-audio')
async def summary_audio(file: UploadFile=File(...)):
    if not file.filename.lower().endswith((".wav", ".mp3", ".m4a")):
        raise HTTPException(status_code=400, detail="Неподдерживаемый формат файла")
    
    file_path = os.path.join(TEMP_DIR, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try: 
        result = pipeline.run(file_path)

        return JSONResponse({
            "success": True,
            "summary": result['summary'],
            "dialogue": result['dialogue'],
            "actions": result.get('actions', [])
        })
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": str(e)}
        )
    finally:
        if os.path.exists(file_path):
            os.remove(file_path)


@app.post('/resummarize')
async def resummarize(payload: dict):
    text = payload.get('text') if isinstance(payload, dict) else None
    if not text or not isinstance(text, str):
        raise HTTPException(status_code=400, detail="Отсутствует текст для суммаризации")
    try:
        summary = pipeline.summarizer.full_summarize(text)
        return {"success": True, "summary": summary}
    except Exception as e:
        return JSONResponse(status_code=500, content={"success": False, "error": str(e)})


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)