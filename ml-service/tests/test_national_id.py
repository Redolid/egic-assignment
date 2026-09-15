from datetime import date

from app.national_id import NationalIdInfo, find_valid_id, normalize_digits, parse_national_id

TODAY = date(2026, 9, 15)


def test_normalizes_arabic_indic_digits():
    assert normalize_digits("٢٩٠٠١٠١") == "2900101"


def test_decodes_a_valid_id():
    info = parse_national_id("29001010123456", TODAY)
    assert isinstance(info, NationalIdInfo)
    assert info.birth_date == date(1990, 1, 1)
    assert info.gender == "male"
    assert info.governorate_en == "Cairo"


def test_accepts_spaced_arabic_digits():
    assert isinstance(parse_national_id("٢ ٩٠٠ ١٠١ ٠١ ٢٣٤٥٦", TODAY), NationalIdInfo)


def test_rejections():
    assert parse_national_id("", TODAY) == "National ID is required"
    assert parse_national_id("2900101012345", TODAY) == "National ID must be 14 digits (got 13)"
    assert parse_national_id("19001010123456", TODAY) == 'Invalid century digit "1" (expected 2 or 3)'
    assert parse_national_id("29002300123456", TODAY) == "Birth date encoded in the ID is not a valid date"
    assert parse_national_id("29001019923456", TODAY) == 'Unknown governorate code "99"'


def test_find_valid_id_picks_the_valid_window():
    assert find_valid_id(["7 2900101 0123456 1"]) == "29001010123456"
    assert find_valid_id(["123", "99999999999999"]) is None
