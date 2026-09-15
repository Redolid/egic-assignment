"""Text post-processing for card fields: ID candidates, dates, statuses, name correction. Pure functions."""

from __future__ import annotations

import re
from datetime import date

from .layout import normalize_arabic
from .national_id import find_valid_id, normalize_digits

# ---------------------------------------------------------------------------
# National ID
# ---------------------------------------------------------------------------


def id_candidates(line_text: str, ltr_groups: list[str] | None = None) -> list[str]:
    """Digit strings to test for a valid ID.

    The Arabic recognizer applies right-to-left display ordering, so the printed digit groups
    "٢ ٩٩ ١٢ ..." can come back as "... ١٢ ٩٩ ٢". Both orders are tried, plus a digits-only
    re-read whose groups are already sorted left to right.
    """
    tokens = [re.sub(r"\D", "", normalize_digits(token)) for token in line_text.split()]
    tokens = [token for token in tokens if token]
    candidates = ["".join(reversed(tokens)), "".join(tokens)]
    if ltr_groups:
        candidates.insert(0, "".join(re.sub(r"\D", "", normalize_digits(group)) for group in ltr_groups))
    return [candidate for candidate in candidates if candidate]


def read_national_id(line_text: str, ltr_groups: list[str] | None = None) -> str | None:
    return find_valid_id(id_candidates(line_text, ltr_groups))


# ---------------------------------------------------------------------------
# Dates printed as YYYY/MM/DD (expiry) or YYYY/MM (issue)
# ---------------------------------------------------------------------------

# The recognizer usually reads the slash separator as "١" (one), so the digits-only reading of
# "٢٠٣٠/٠٨/٠٥" comes back as "2030108105", sometimes without the leading "20". Readings where the
# separators survived as "1" are trusted first; separator-less matches are a fallback.
_FULL_WITH_SEPARATORS = re.compile(r"(\d{2})1(0[1-9]|1[0-2])1(0[1-9]|[12]\d|3[01])")
_FULL_BARE = re.compile(r"(\d{2})(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])")
_MONTH_WITH_SEPARATOR = re.compile(r"(\d{2})1(0[1-9]|1[0-2])")
_MONTH_BARE = re.compile(r"(\d{2})(0[1-9]|1[0-2])")


def card_date_candidates(raw: str, with_day: bool, earliest: int = 2005, latest: int = 2045) -> list[date]:
    """All plausible dates in a digits reading, most trustworthy pattern first, every start offset tried."""
    digits = re.sub(r"\D", "", normalize_digits(raw))
    patterns = (_FULL_WITH_SEPARATORS, _FULL_BARE) if with_day else (_MONTH_WITH_SEPARATOR, _MONTH_BARE)
    found: list[date] = []
    for pattern in patterns:
        for start in range(len(digits)):
            match = pattern.match(digits, start)
            if not match:
                continue
            year = 2000 + int(match.group(1))
            if not earliest <= year <= latest:
                continue
            try:
                candidate = date(year, int(match.group(2)), int(match.group(3)) if with_day else 1)
            except ValueError:
                continue
            if candidate not in found:
                found.append(candidate)
    return found


def parse_card_date(raw: str, with_day: bool) -> date | None:
    candidates = card_date_candidates(raw, with_day)
    return candidates[0] if candidates else None


# ---------------------------------------------------------------------------
# Back-side status words
# ---------------------------------------------------------------------------

GENDERS = {"ذكر": "male", "انثي": "female"}
RELIGIONS = {"مسلم": "Muslim", "مسلمه": "Muslim", "مسيحي": "Christian", "مسيحيه": "Christian"}
MARITAL = {
    "اعزب": "Single",
    "عزباء": "Single",
    "انسه": "Single",
    "متزوج": "Married",
    "متزوجه": "Married",
    "مطلق": "Divorced",
    "مطلقه": "Divorced",
    "ارمل": "Widowed",
    "ارمله": "Widowed",
}


def find_status(text: str, table: dict[str, str]) -> tuple[str, str] | None:
    """(Arabic word as printed-normalized, English value) for the first status word found."""
    words = normalize_arabic(text).split()
    for word in words:
        if word in table:
            return word, table[word]
    return None


# ---------------------------------------------------------------------------
# Names
# ---------------------------------------------------------------------------

# The most frequent Egyptian given names. Only these are auto-repaired, and only for a word that is one
# letter away from exactly one of them in a line read below the confidence threshold (e.g. "محمل" ->
# "محمد"). The wider list protects real names from being "corrected" into a frequent one ("سعد" stays).
AUTO_CORRECT_NAMES = ["محمد", "احمد", "محمود", "مصطفي"]
KNOWN_NAMES = AUTO_CORRECT_NAMES + [
    "علي", "حسن", "حسين", "ابراهيم", "عبدالله", "عبدالرحمن", "عمر", "عمرو", "خالد", "يوسف", "طارق", "وليد", "هشام",
    "ايمن", "امين", "اسامه", "ياسر", "سيد", "سعد", "سعيد", "عادل", "هاني", "هادي", "رامي", "سامي", "مجدي",
    "حمدي", "حامد", "حمد", "احمدي", "محمدي", "فاطمه", "مريم", "نور", "هدي", "مني", "ساره", "ايه", "دينا", "رانيا",
    "هبه", "ياسمين", "امل", "منه", "نهي", "مها",
]
_AUTO = {normalize_arabic(name) for name in AUTO_CORRECT_NAMES}
_KNOWN = {normalize_arabic(name) for name in KNOWN_NAMES}


def _edit_distance_at_most_one(a: str, b: str) -> bool:
    if a == b:
        return True
    if abs(len(a) - len(b)) > 1:
        return False
    if len(a) == len(b):
        return sum(x != y for x, y in zip(a, b)) == 1
    shorter, longer = sorted((a, b), key=len)
    for i in range(len(longer)):
        if longer[:i] + longer[i + 1 :] == shorter:
            return True
    return False


def correct_name_words(text: str, confidence: float, threshold: float = 0.95) -> tuple[str, list[tuple[str, str]]]:
    """Repairs single-letter misreads of the most frequent names. Returns (text, [(read, corrected), ...])."""
    if confidence >= threshold:
        return text, []
    corrections: list[tuple[str, str]] = []
    words = []
    for word in text.split():
        normalized = normalize_arabic(word)
        if normalized not in _KNOWN and len(normalized) >= 3:
            matches = [name for name in _AUTO if _edit_distance_at_most_one(normalized, name)]
            if len(matches) == 1:
                corrections.append((word, matches[0]))
                word = matches[0]
        words.append(word)
    return " ".join(words), corrections


def fix_digit_runs(text: str) -> str:
    """Rejoins numbers the recognizer split into spaced single digits in display order ("٥ ١" -> "١٥")."""
    tokens = text.split()
    out: list[str] = []
    run: list[str] = []
    for token in tokens + [""]:
        if len(token) == 1 and normalize_digits(token).isdigit():
            run.append(token)
            continue
        if len(run) >= 2:
            out.append("".join(reversed(run)))
        else:
            out.extend(run)
        run = []
        if token:
            out.append(token)
    return " ".join(out)
