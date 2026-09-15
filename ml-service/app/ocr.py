"""The deep-learning models: EasyOCR's CRAFT text detector + Arabic CRNN recognizer."""

from __future__ import annotations

import threading
import time

import cv2
import numpy as np

from .layout import Detection

ARABIC_INDIC_DIGITS = "٠١٢٣٤٥٦٧٨٩"


class OcrEngine:
    """Loads the models once (≈ 3-6 s) and serialises inference; the GPU is shared by all requests."""

    def __init__(self) -> None:
        self._reader = None
        self._lock = threading.Lock()
        self.device = "unloaded"
        self.load_ms: int | None = None

    def load(self) -> None:
        with self._lock:
            if self._reader is not None:
                return
            import easyocr
            import torch

            started = time.perf_counter()
            use_gpu = torch.cuda.is_available()
            # 'ar' reads Arabic letters and Arabic-Indic digits; 'en' covers the Latin card serial.
            self._reader = easyocr.Reader(["ar", "en"], gpu=use_gpu, verbose=False)
            self.device = f"cuda · {torch.cuda.get_device_name(0)}" if use_gpu else "cpu"
            self.load_ms = round((time.perf_counter() - started) * 1000)

    @property
    def ready(self) -> bool:
        return self._reader is not None

    def read(self, image: np.ndarray, allowlist: str | None = None) -> list[Detection]:
        """Detect + recognize all text regions in an image."""
        self.load()
        with self._lock:
            results = self._reader.readtext(image, detail=1, paragraph=False, allowlist=allowlist)
        detections = []
        for box, text, confidence in results:
            xs = [point[0] for point in box]
            ys = [point[1] for point in box]
            detections.append(Detection(text.strip(), float(confidence), min(xs), min(ys), max(xs), max(ys)))
        return [d for d in detections if d.text]

    def reread(
        self,
        page: np.ndarray,
        box: tuple[float, float, float, float],
        allowlist: str | None = None,
        enlarge: bool = True,
    ) -> list[Detection]:
        """Re-reads one region, by default enlarged 2× in greyscale (small card text reads markedly
        better at that scale); `enlarge=False` reads the plain colour crop, which some dates prefer.

        Returned coordinates are in the crop's space (only relative order is used).
        """
        x0, y0, x1, y1 = box
        pad_y = (y1 - y0) * 0.25
        pad_x = (y1 - y0) * 0.4
        height, width = page.shape[:2]
        crop = page[
            max(0, int(y0 - pad_y)) : min(height, int(y1 + pad_y)),
            max(0, int(x0 - pad_x)) : min(width, int(x1 + pad_x)),
        ]
        if crop.size == 0:
            return []
        if not enlarge:
            return self.read(np.ascontiguousarray(crop), allowlist=allowlist)
        grey = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)
        scale = min(2.0, 2400 / max(grey.shape[1], 1))
        enlarged = cv2.resize(grey, None, fx=scale, fy=scale, interpolation=cv2.INTER_CUBIC)
        return self.read(enlarged, allowlist=allowlist)


engine = OcrEngine()
