"""HTTP API for the local ID reader.

    GET  /health  -> {"status": "ok", "ready": bool, "device": str, "model": str}
    POST /read    -> multipart "file" (JPG/PNG/WebP photo or PDF) -> fields, card sides, checks

Nothing is stored: uploads are processed in memory and discarded with the response.
"""

from __future__ import annotations

import asyncio
import logging
import threading

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from .documents import DocumentError, load_pages
from .ocr import engine
from .pipeline import read_document

logger = logging.getLogger("id-reader")
app = FastAPI(title="EGIC ID reader", version="1.0.0")

# The web app normally reaches this service through Vite's proxy (same origin). CORS is open to
# localhost only, for calling the service directly during development.
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


@app.on_event("startup")
def warm_up() -> None:
    # Load the models in the background so /health answers immediately while they load.
    threading.Thread(target=engine.load, daemon=True).start()


@app.get("/health")
def health() -> dict:
    return {
        "status": "ok",
        "ready": engine.ready,
        "device": engine.device,
        "model": "EasyOCR · CRAFT text detector + Arabic CRNN recognizer",
        "loadMs": engine.load_ms,
    }


@app.post("/read")
async def read(file: UploadFile = File(...)) -> dict:
    data = await file.read()
    try:
        pages = load_pages(data, file.content_type or "")
        # Inference is blocking (GPU/CPU); keep the event loop free for /health.
        return await asyncio.to_thread(read_document, engine, pages)
    except DocumentError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    except Exception as error:  # the message stays generic; details go to the service log only
        logger.exception("Reading failed")
        raise HTTPException(status_code=500, detail="The model could not read this document.") from error
