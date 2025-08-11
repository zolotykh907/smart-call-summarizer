import shutil
import os
from pathlib import Path

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

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
            "dialogue": result['dialogue']
        })
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": str(e)}
        )
    finally:
        if os.path.exists(file_path):
            os.remove(file_path)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)