"""Egyptian national ID number: digit normalisation, structure validation and decoding.

Mirrors src/features/national-id/lib/nationalId.ts so the service and the web app agree.

    2  990101  21  0139  5
    |    |      |    |   +-- 14      check digit (algorithm not officially published)
    |    |      |    +------ 10-13   birth-registration sequence; the 13th digit is the gender
    |    |      |                    (odd = male, even = female)
    |    |      +----------- 8-9     governorate of birth (88 = born outside Egypt)
    |    +------------------ 2-7     birth date YYMMDD
    +----------------------- 1       century: 2 = 1900-1999, 3 = 2000-2099
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from datetime import date

NATIONAL_ID_LENGTH = 14

GOVERNORATES: dict[str, tuple[str, str]] = {
    "01": ("Cairo", "القاهرة"),
    "02": ("Alexandria", "الإسكندرية"),
    "03": ("Port Said", "بورسعيد"),
    "04": ("Suez", "السويس"),
    "11": ("Damietta", "دمياط"),
    "12": ("Dakahlia", "الدقهلية"),
    "13": ("Sharqia", "الشرقية"),
    "14": ("Qalyubia", "القليوبية"),
    "15": ("Kafr El Sheikh", "كفر الشيخ"),
    "16": ("Gharbia", "الغربية"),
    "17": ("Monufia", "المنوفية"),
    "18": ("Beheira", "البحيرة"),
    "19": ("Ismailia", "الإسماعيلية"),
    "21": ("Giza", "الجيزة"),
    "22": ("Beni Suef", "بني سويف"),
    "23": ("Faiyum", "الفيوم"),
    "24": ("Minya", "المنيا"),
    "25": ("Asyut", "أسيوط"),
    "26": ("Sohag", "سوهاج"),
    "27": ("Qena", "قنا"),
    "28": ("Aswan", "أسوان"),
    "29": ("Luxor", "الأقصر"),
    "31": ("Red Sea", "البحر الأحمر"),
    "32": ("New Valley", "الوادي الجديد"),
    "33": ("Matrouh", "مطروح"),
    "34": ("North Sinai", "شمال سيناء"),
    "35": ("South Sinai", "جنوب سيناء"),
    "88": ("Born outside Egypt", "خارج الجمهورية"),
}

_CENTURY_START = {"2": 1900, "3": 2000}
_ARABIC_INDIC = str.maketrans("٠١٢٣٤٥٦٧٨٩۰۱۲۳۴۵۶۷۸۹", "01234567890123456789")


def normalize_digits(text: str) -> str:
    """Arabic-Indic (٠-٩) and Persian (۰-۹) digits -> 0-9."""
    return text.translate(_ARABIC_INDIC)


@dataclass(frozen=True)
class NationalIdInfo:
    id: str
    birth_date: date
    gender: str
    governorate_code: str
    governorate_en: str
    governorate_ar: str


def parse_national_id(raw: str, today: date | None = None) -> NationalIdInfo | str:
    """Returns decoded info, or an error message string explaining why the number is invalid."""
    today = today or date.today()
    digits = re.sub(r"[\s\-]", "", normalize_digits(raw))

    if not digits:
        return "National ID is required"
    if not digits.isdigit():
        return "National ID must contain digits only"
    if len(digits) != NATIONAL_ID_LENGTH:
        return f"National ID must be 14 digits (got {len(digits)})"

    century = _CENTURY_START.get(digits[0])
    if century is None:
        return f'Invalid century digit "{digits[0]}" (expected 2 or 3)'

    try:
        birth = date(century + int(digits[1:3]), int(digits[3:5]), int(digits[5:7]))
    except ValueError:
        return "Birth date encoded in the ID is not a valid date"
    if birth > today:
        return "Birth date encoded in the ID is in the future"

    code = digits[7:9]
    if code not in GOVERNORATES:
        return f'Unknown governorate code "{code}"'

    en, ar = GOVERNORATES[code]
    return NationalIdInfo(
        id=digits,
        birth_date=birth,
        gender="male" if int(digits[12]) % 2 == 1 else "female",
        governorate_code=code,
        governorate_en=en,
        governorate_ar=ar,
    )


def find_valid_id(digit_runs: list[str]) -> str | None:
    """First structurally valid 14-digit window across the given digit strings."""
    for run in digit_runs:
        digits = re.sub(r"\D", "", normalize_digits(run))
        for start in range(0, max(0, len(digits) - NATIONAL_ID_LENGTH) + 1):
            candidate = digits[start : start + NATIONAL_ID_LENGTH]
            if len(candidate) == NATIONAL_ID_LENGTH and isinstance(parse_national_id(candidate), NationalIdInfo):
                return candidate
    return None
