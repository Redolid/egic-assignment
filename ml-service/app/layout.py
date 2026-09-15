"""Geometry: text detections -> lines -> card sides. Pure functions, no model dependency."""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from statistics import median

ARABIC_LETTER = re.compile(r"[ء-ي]")
ARABIC_INDIC_DIGIT = re.compile(r"[٠-٩۰-۹]")
_TASHKEEL = re.compile(r"[ً-ْـ]")


@dataclass(frozen=True)
class Detection:
    """One text region found by the detector and read by the recognizer (page pixel coordinates)."""

    text: str
    confidence: float
    x0: float
    y0: float
    x1: float
    y1: float

    @property
    def height(self) -> float:
        return self.y1 - self.y0


@dataclass
class Line:
    detections: list[Detection] = field(default_factory=list)

    @property
    def y0(self) -> float:
        return min(d.y0 for d in self.detections)

    @property
    def y1(self) -> float:
        return max(d.y1 for d in self.detections)

    @property
    def x0(self) -> float:
        return min(d.x0 for d in self.detections)

    @property
    def x1(self) -> float:
        return max(d.x1 for d in self.detections)

    @property
    def text(self) -> str:
        """Reading order for Arabic: right-most region first."""
        return " ".join(d.text for d in sorted(self.detections, key=lambda d: -d.x1)).strip()

    @property
    def confidence(self) -> float:
        return min(d.confidence for d in self.detections)

    @property
    def digit_count(self) -> int:
        return len(ARABIC_INDIC_DIGIT.findall(self.text)) + len(re.findall(r"[0-9]", self.text))

    @property
    def has_arabic_letters(self) -> bool:
        return bool(ARABIC_LETTER.search(self.text))


def normalize_arabic(text: str) -> str:
    """Folds spelling variants that OCR and people mix up: tashkeel, alef forms, ta marbuta, alef maqsura."""
    text = _TASHKEEL.sub("", text)
    return text.translate(str.maketrans({"أ": "ا", "إ": "ا", "آ": "ا", "ى": "ي", "ة": "ه"}))


def group_lines(detections: list[Detection]) -> list[Line]:
    """Detections whose vertical extents overlap by at least half the shorter one share a line."""
    lines: list[Line] = []
    for detection in sorted(detections, key=lambda d: (d.y0 + d.y1) / 2):
        for line in lines:
            overlap = min(line.y1, detection.y1) - max(line.y0, detection.y0)
            if overlap >= 0.5 * min(detection.height, line.y1 - line.y0):
                line.detections.append(detection)
                break
        else:
            lines.append(Line([detection]))
    return sorted(lines, key=lambda line: line.y0)


def split_cards(lines: list[Line]) -> list[list[Line]]:
    """Splits a page's lines into separate cards wherever the vertical gap is far larger than a text line."""
    if not lines:
        return []
    typical_height = median(line.y1 - line.y0 for line in lines)
    cards: list[list[Line]] = [[lines[0]]]
    for previous, line in zip(lines, lines[1:]):
        if line.y0 - previous.y1 > 3 * typical_height:
            cards.append([line])
        else:
            cards[-1].append(line)
    return cards


FRONT_ANCHORS = ("بطاقه", "تحقيق", "الشخصيه")
BACK_ANCHORS = ("ساريه", "حتي", "ذكر", "انثي", "مسلم", "مسيحي", "اعزب", "متزوج", "مطلق", "ارمل")


def classify_side(lines: list[Line]) -> str | None:
    """'front', 'back', or None when a card cluster carries neither side's anchor words."""
    text = normalize_arabic(" ".join(line.text for line in lines))
    front = sum(anchor in text for anchor in FRONT_ANCHORS)
    back = sum(anchor in text for anchor in BACK_ANCHORS)
    if front == back == 0:
        return None
    return "front" if front >= back else "back"
