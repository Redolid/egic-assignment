"""Turns an uploaded file (photo or PDF) into page images the OCR models can read."""

from __future__ import annotations

import cv2
import fitz  # PyMuPDF
import numpy as np

IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}
PDF_TYPE = "application/pdf"
MAX_BYTES = 15 * 1024 * 1024
MAX_PDF_PAGES = 2
# Card text is ~2-4 mm tall; ~250 DPI keeps glyphs well above the recognizer's minimum height.
PDF_DPI = 250
# Very large phone photos are downscaled: detection cost grows with pixels, accuracy does not.
MAX_EDGE = 3000
MIN_EDGE = 500


class DocumentError(ValueError):
    """The upload cannot be turned into a readable image. The message is safe to show to users."""


def _limit_size(image: np.ndarray) -> np.ndarray:
    height, width = image.shape[:2]
    if min(height, width) < MIN_EDGE:
        raise DocumentError(f"The image is too small ({width}×{height}px). Use a photo or scan at least {MIN_EDGE}px on its short side.")
    scale = MAX_EDGE / max(height, width)
    if scale < 1:
        image = cv2.resize(image, None, fx=scale, fy=scale, interpolation=cv2.INTER_AREA)
    return image


def load_pages(data: bytes, content_type: str) -> list[np.ndarray]:
    """Returns BGR page images. Raises DocumentError with a user-facing message."""
    if len(data) > MAX_BYTES:
        raise DocumentError("The file is larger than 15 MB.")

    if content_type == PDF_TYPE or data[:5] == b"%PDF-":
        try:
            document = fitz.open(stream=data, filetype="pdf")
        except Exception as error:  # PyMuPDF raises several error types for broken files
            raise DocumentError("The PDF could not be opened.") from error
        if document.page_count == 0:
            raise DocumentError("The PDF has no pages.")
        pages = []
        for page in list(document)[:MAX_PDF_PAGES]:
            pixmap = page.get_pixmap(dpi=PDF_DPI, alpha=False)
            rgb = np.frombuffer(pixmap.samples, dtype=np.uint8).reshape(pixmap.height, pixmap.width, pixmap.n)
            pages.append(_limit_size(cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)))
        return pages

    if content_type not in IMAGE_TYPES:
        raise DocumentError("Upload a JPG, PNG or WebP photo, or a PDF scan.")
    image = cv2.imdecode(np.frombuffer(data, dtype=np.uint8), cv2.IMREAD_COLOR)
    if image is None:
        raise DocumentError("The file could not be read as an image.")
    return [_limit_size(image)]


def encode_jpeg(image: np.ndarray, max_edge: int = 1100, quality: int = 85) -> str:
    """Small JPEG data URL, used to show the detected card sides in the web app."""
    height, width = image.shape[:2]
    scale = min(1.0, max_edge / max(height, width))
    if scale < 1:
        image = cv2.resize(image, None, fx=scale, fy=scale, interpolation=cv2.INTER_AREA)
    ok, buffer = cv2.imencode(".jpg", image, [cv2.IMWRITE_JPEG_QUALITY, quality])
    if not ok:
        raise RuntimeError("JPEG encoding failed")
    import base64

    return "data:image/jpeg;base64," + base64.b64encode(buffer.tobytes()).decode("ascii")
