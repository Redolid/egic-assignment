"""Card reading pipeline: page -> text regions -> card sides -> fields -> cross-checks."""

from __future__ import annotations

import re
import time
from dataclasses import asdict, dataclass, field
from datetime import date

import numpy as np

from . import fields as F
from .documents import encode_jpeg
from .layout import Detection, Line, classify_side, group_lines, normalize_arabic, split_cards
from .national_id import NationalIdInfo, parse_national_id
from .ocr import ARABIC_INDIC_DIGITS, OcrEngine

CARD_SERIAL = re.compile(r"([A-Z]{2}\d{7})", re.IGNORECASE)
CARD_VALIDITY_YEARS = 7


@dataclass
class Field:
    key: str
    label: str
    value: str
    confidence: float
    side: str
    # Normalised [x0, y0, x1, y1] inside that side's image, so the app can draw a callout on it.
    box: list[float] | None = None
    note: str | None = None


@dataclass
class Side:
    side: str
    image: str
    fields: list[Field] = field(default_factory=list)


@dataclass
class Check:
    key: str
    label: str
    status: str  # pass | fail | warn
    detail: str


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _confidence(detections: list[Detection]) -> float:
    """Length-weighted mean over tokens that carry letters or digits (punctuation like "-" is ignored)."""
    weighted = [(d.confidence, len(re.sub(r"[^\w]", "", d.text))) for d in detections]
    weighted = [(c, n) for c, n in weighted if n > 0]
    if not weighted:
        return 0.0
    return round(sum(c * n for c, n in weighted) / sum(n for _, n in weighted), 3)


def _digits(text: str) -> int:
    return sum(ch in ARABIC_INDIC_DIGITS for ch in text)


def _bounds(detections: list[Detection]) -> tuple[float, float, float, float]:
    return (
        min(d.x0 for d in detections),
        min(d.y0 for d in detections),
        max(d.x1 for d in detections),
        max(d.y1 for d in detections),
    )


def _box(detections: list[Detection], crop: tuple[int, int, int, int]) -> list[float]:
    cx0, cy0, cx1, cy1 = crop
    w, h = cx1 - cx0, cy1 - cy0
    x0, y0, x1, y1 = _bounds(detections)
    return [round((x0 - cx0) / w, 4), round((y0 - cy0) / h, 4), round((x1 - cx0) / w, 4), round((y1 - cy0) / h, 4)]


def _line_detections(lines: list[Line]) -> list[Detection]:
    return [d for line in lines for d in line.detections]


def _card_crop(lines: list[Line], page: np.ndarray) -> tuple[int, int, int, int]:
    """Text extent padded out toward the card edge (text never reaches the edge of a card)."""
    x0, y0, x1, y1 = _bounds(_line_detections(lines))
    pad_x = (x1 - x0) * 0.08
    pad_y = (y1 - y0) * 0.08
    height, width = page.shape[:2]
    return (max(0, int(x0 - pad_x)), max(0, int(y0 - pad_y)), min(width, int(x1 + pad_x)), min(height, int(y1 + pad_y)))


def _content_length(text: str) -> int:
    return len(re.sub(r"[^\w]", "", text))


def _best_reading(engine: OcrEngine, page: np.ndarray, line: Line) -> tuple[str, float]:
    """Chooses between the page-level reading and an enlarged re-read of the line.

    The re-read wins when it is more confident, or when it captured more characters (e.g. a house
    number the page pass dropped) at a confidence within 0.15 of the page reading.
    """
    page_text, page_conf = line.text, _confidence(line.detections)
    reread = engine.reread(page, _bounds(line.detections))
    if reread:
        text = " ".join(d.text for d in sorted(reread, key=lambda d: -d.x1))
        confidence = _confidence(reread)
        more_confident = confidence >= page_conf and _content_length(text) >= _content_length(page_text)
        more_complete = _content_length(text) > _content_length(page_text) and confidence >= page_conf - 0.15
        if more_confident or more_complete:
            return F.fix_digit_runs(text), confidence
    return F.fix_digit_runs(page_text), page_conf


def _read_id(engine: OcrEngine, page: np.ndarray, id_detections: list[Detection]) -> tuple[str | None, float]:
    """Tries the page reading (both group orders) and a digits-only enlarged re-read of the ID region."""
    region = Line(id_detections)
    groups = engine.reread(page, _bounds(id_detections), allowlist=ARABIC_INDIC_DIGITS)
    ltr = [d.text for d in sorted(groups, key=lambda d: d.x0)]
    national_id = F.read_national_id(region.text, ltr)
    confidence = max(_confidence(id_detections), _confidence(groups)) if national_id else _confidence(id_detections)
    return national_id, confidence


def _id_detections(line: Line) -> list[Detection]:
    """The ID's own regions: the other digits on that line (birth date hologram, issue date) are shorter groups."""
    long_groups = [d for d in line.detections if _digits(d.text) >= 8]
    return long_groups or [max(line.detections, key=lambda d: _digits(d.text))]


def _read_date(engine: OcrEngine, page: np.ndarray, box, with_day: bool) -> list[tuple[date, float]]:
    """Every plausible date from digits-only readings of the region (enlarged and plain), best pattern first."""
    found: list[tuple[date, float]] = []
    for enlarge in (True, False):
        digits = engine.reread(page, box, allowlist=ARABIC_INDIC_DIGITS + "/", enlarge=enlarge)
        raw = "".join(d.text for d in sorted(digits, key=lambda d: d.x0))
        for parsed in F.card_date_candidates(raw, with_day=with_day):
            found.append((parsed, _confidence(digits)))
    return found


# ---------------------------------------------------------------------------
# Sides
# ---------------------------------------------------------------------------


def read_front(engine: OcrEngine, page: np.ndarray, lines: list[Line], crop) -> list[Field]:
    out: list[Field] = []
    header_index = next(
        (i for i, line in enumerate(lines) if any(a in normalize_arabic(line.text) for a in ("تحقيق", "الشخصيه", "بطاقه"))),
        -1,
    )
    id_line = next((line for line in reversed(lines) if line.digit_count >= 8), None)

    if id_line:
        id_detections = _id_detections(id_line)
        national_id, confidence = _read_id(engine, page, id_detections)
        if national_id:
            out.append(Field("nationalId", "National ID", national_id, confidence, "front", _box(id_detections, crop)))

    body = [line for i, line in enumerate(lines) if i > header_index and line is not id_line]
    name_lines = [line for line in body if line.has_arabic_letters and line.digit_count == 0][:2]
    if name_lines:
        words: list[str] = []
        confidences: list[float] = []
        corrections: list[tuple[str, str]] = []
        for line in name_lines:  # corrected per line, using that line's own confidence
            text, confidence = _best_reading(engine, page, line)
            fixed, line_corrections = F.correct_name_words(text, confidence)
            words.append(fixed)
            confidences.append(confidence)
            corrections += line_corrections
        note = ("Corrected " + ", ".join(f"“{a}” → “{b}”" for a, b in corrections)) if corrections else None
        out.append(Field("name", "Name", " ".join(words), round(min(confidences), 3), "front", _box(_line_detections(name_lines), crop), note))

        after_name = [line for line in body if line.y0 > name_lines[-1].y1 and (id_line is None or line.y1 < id_line.y0)]
        address_lines = [line for line in after_name if line.has_arabic_letters][:2]
        if address_lines:
            readings = [_best_reading(engine, page, line) for line in address_lines]
            out.append(
                Field(
                    "address",
                    "Address",
                    " — ".join(reading for reading, _ in readings),
                    round(min(conf for _, conf in readings), 3),
                    "front",
                    _box(_line_detections(address_lines), crop),
                )
            )

    for line in lines:
        for detection in line.detections:
            match = CARD_SERIAL.search(detection.text.replace(" ", ""))
            if match:
                out.append(Field("cardNumber", "Card number", match.group(1).upper(), round(detection.confidence, 3), "front", _box([detection], crop)))
                return out
    return out


def read_back(engine: OcrEngine, page: np.ndarray, lines: list[Line], crop) -> list[Field]:
    out: list[Field] = []
    id_line = next((line for line in lines if line.digit_count >= 8), None)
    issued: tuple[date, float, Detection] | None = None

    if id_line:
        id_detections = _id_detections(id_line)
        national_id, confidence = _read_id(engine, page, id_detections)
        if national_id:
            out.append(Field("nationalId", "National ID", national_id, confidence, "back", _box(id_detections, crop)))
        # The issue date (YYYY/MM) shares the ID's line as a short separate group.
        for detection in id_line.detections:
            if detection not in id_detections and 2 <= _digits(detection.text) < 8:
                dates = _read_date(engine, page, (detection.x0, detection.y0, detection.x1, detection.y1), with_day=False)
                if dates:
                    issued = (dates[0][0], max(dates[0][1], detection.confidence), detection)
                    out.append(Field("issueDate", "Issued", issued[0].strftime("%Y-%m"), round(issued[1], 3), "back", _box([detection], crop)))
                break

    status_line = next((line for line in lines if F.find_status(line.text, F.GENDERS) or F.find_status(line.text, F.RELIGIONS)), None)
    if status_line:
        for key, label, table in (("gender", "Gender", F.GENDERS), ("religion", "Religion", F.RELIGIONS), ("maritalStatus", "Marital status", F.MARITAL)):
            found = F.find_status(status_line.text, table)
            if found:
                detection = next((d for d in status_line.detections if found[0] in normalize_arabic(d.text)), None)
                source = [detection] if detection else status_line.detections
                out.append(Field(key, label, found[1], round(_confidence(source), 3), "back", _box(source, crop)))

    if id_line and status_line:
        job_lines = [line for line in lines if id_line.y1 <= line.y0 and line.y1 <= status_line.y0 + 1 and line.has_arabic_letters]
        if job_lines:
            readings = [_best_reading(engine, page, line) for line in job_lines]
            out.append(
                Field(
                    "job",
                    "Profession",
                    " ".join(reading for reading, _ in readings),
                    round(min(conf for _, conf in readings), 3),
                    "back",
                    _box(_line_detections(job_lines), crop),
                )
            )

    expiry_line = next((line for line in lines if "ساريه" in normalize_arabic(line.text)), None)
    if expiry_line:
        # "البطاقة سارية حتى <date>": right-to-left, so the date sits at the left end of the line.
        x0, y0, x1, y1 = _bounds(expiry_line.detections)
        candidates: list[tuple[date, float]] = []
        for fraction in (0.45, 0.55):
            candidates += _read_date(engine, page, (x0, y0, x0 + (x1 - x0) * fraction, y1), with_day=True)
        if candidates:
            # Cards are valid for seven years: a reading consistent with the issue date wins outright.
            # Otherwise the first candidate stands (patterns with surviving separators come first).
            consistent = [c for c in candidates if issued and c[0].year == issued[0].year + CARD_VALIDITY_YEARS]
            expiry, confidence = (consistent or candidates)[0]
            note = f"Consistent with issue date + {CARD_VALIDITY_YEARS} years" if consistent else "Not cross-checked: issue date unreadable"
            out.append(Field("expiryDate", "Valid until", expiry.isoformat(), round(confidence, 3), "back", _box(expiry_line.detections, crop), note))
    return out


# ---------------------------------------------------------------------------
# Document
# ---------------------------------------------------------------------------


def _checks(front: list[Field], back: list[Field], today: date) -> tuple[list[Check], NationalIdInfo | None]:
    checks: list[Check] = []
    front_id = next((f.value for f in front if f.key == "nationalId"), None)
    back_id = next((f.value for f in back if f.key == "nationalId"), None)
    national_id = front_id or back_id
    parsed = parse_national_id(national_id, today) if national_id else None
    info = parsed if isinstance(parsed, NationalIdInfo) else None

    if info:
        checks.append(Check("structure", "ID structure", "pass", "Century, birth date and governorate code are valid."))
    else:
        checks.append(Check("structure", "ID structure", "fail", parsed if isinstance(parsed, str) else "No valid 14-digit national ID was found."))

    if front_id and back_id:
        same = front_id == back_id
        checks.append(Check("sides", "Front ↔ back", "pass" if same else "fail", "Both sides carry the same number." if same else "The two sides show different numbers."))

    gender = next((f.value for f in back if f.key == "gender"), None)
    if info and gender:
        same = gender == info.gender
        checks.append(Check("gender", "Gender ↔ ID digit", "pass" if same else "warn", f"13th digit says {info.gender}; the card says {gender}."))

    expiry = next((f.value for f in back if f.key == "expiryDate"), None)
    if expiry:
        valid = date.fromisoformat(expiry) >= today
        checks.append(Check("expiry", "Card validity", "pass" if valid else "warn", f"Valid until {expiry}." if valid else f"Expired on {expiry}."))
    return checks, info


def read_document(engine: OcrEngine, pages: list[np.ndarray], today: date | None = None) -> dict:
    today = today or date.today()
    started = time.perf_counter()
    sides: list[Side] = []
    warnings: list[str] = []

    for page in pages:
        lines = group_lines(engine.read(page))
        cards = split_cards(lines)
        for card_lines in cards:
            kind = classify_side(card_lines) or ("front" if len(cards) == 1 and any(line.digit_count >= 8 for line in card_lines) else None)
            if kind is None or any(existing.side == kind for existing in sides):
                continue
            crop = _card_crop(card_lines, page)
            x0, y0, x1, y1 = crop
            reader = read_front if kind == "front" else read_back
            sides.append(Side(kind, encode_jpeg(page[y0:y1, x0:x1]), reader(engine, page, card_lines, crop)))

    if not sides:
        warnings.append("No Egyptian ID card side was recognised. Check that the photo shows the card clearly and upright.")
    elif len(sides) == 1:
        missing = "back" if sides[0].side == "front" else "front"
        warnings.append(f"Only the {sides[0].side} of the card was found; add the {missing} to read its fields too.")

    sides.sort(key=lambda side: 0 if side.side == "front" else 1)
    front = next((s.fields for s in sides if s.side == "front"), [])
    back = next((s.fields for s in sides if s.side == "back"), [])
    checks, info = _checks(front, back, today)

    summary: dict[str, str] = {}
    for side_fields in (back, front):  # front wins for fields both sides carry
        for f in side_fields:
            summary[f.key] = f.value
    if info:
        summary["birthDate"] = info.birth_date.isoformat()
        summary["governorate"] = info.governorate_en
        summary.setdefault("gender", info.gender)

    return {
        "engine": "local-model",
        "model": "EasyOCR · CRAFT text detector + Arabic CRNN recognizer",
        "device": engine.device,
        "timingsMs": {"total": round((time.perf_counter() - started) * 1000)},
        "sides": [asdict(side) for side in sides],
        "summary": summary,
        "checks": [asdict(check) for check in checks],
        "warnings": warnings,
    }
