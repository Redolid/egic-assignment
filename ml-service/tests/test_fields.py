from datetime import date

from app.fields import (
    card_date_candidates,
    correct_name_words,
    find_status,
    fix_digit_runs,
    GENDERS,
    MARITAL,
    parse_card_date,
    read_national_id,
)
from app.layout import Detection, classify_side, group_lines, split_cards


# ----- national ID from recognizer output -------------------------------------------------------


def test_reads_id_whose_digit_groups_came_back_in_display_order():
    # Printed "٢ ٩٠٠ ١٠١ ٠١ ٢٣٤٥٦" (fictional); the RTL recognizer returns the groups reversed.
    assert read_national_id("٢٣٤٥٦ ٠١ ١٠١ ٩٠٠ ٢") == "29001010123456"


def test_prefers_left_to_right_digit_groups_from_the_digits_only_reread():
    assert read_national_id("noise", ["٢٩٠٠١٠١", "٠١٢٣٤٥٦"]) == "29001010123456"


# ----- dates ---------------------------------------------------------------------------------------


def test_slash_read_as_one_is_understood():
    # "٢٠٣٠/٠٨/٠٥" read digits-only, leading "2" dropped, slashes as "1"
    assert parse_card_date("٠٣٠١٠٨١٠٥", with_day=True) == date(2030, 8, 5)


def test_separator_pattern_beats_bare_digits():
    assert card_date_candidates("030108105", with_day=True)[0] == date(2030, 8, 5)


def test_month_dates():
    assert parse_card_date("٢٣١٠٨", with_day=False) == date(2023, 8, 1)


def test_implausible_dates_are_rejected():
    assert parse_card_date("99999", with_day=True) is None


# ----- statuses and names -------------------------------------------------------------------------


def test_status_words_match_with_spelling_variants():
    assert find_status("ذكر مسلم أعزب", GENDERS) == ("ذكر", "male")
    assert find_status("أنثى مسلمة متزوجة", GENDERS) == ("انثي", "female")
    assert find_status("أنثى مسلمة متزوجة", MARITAL) == ("متزوجه", "Married")


def test_low_confidence_misread_of_a_frequent_name_is_repaired():
    assert correct_name_words("محمل", 0.8) == ("محمد", [("محمل", "محمد")])


def test_real_names_near_a_frequent_name_are_left_alone():
    assert correct_name_words("سعد حسين", 0.5) == ("سعد حسين", [])


def test_high_confidence_readings_are_never_changed():
    assert correct_name_words("محمل", 0.99) == ("محمل", [])


def test_single_digit_runs_are_rejoined():
    assert fix_digit_runs("٥ ١ شارع النصر") == "١٥ شارع النصر"
    assert fix_digit_runs("٧ شارع النصر") == "٧ شارع النصر"


# ----- layout --------------------------------------------------------------------------------------


def d(text, x0, y0, x1, y1, conf=0.9):
    return Detection(text, conf, x0, y0, x1, y1)


def test_groups_lines_and_splits_two_cards_on_one_page():
    detections = [
        d("البطاقة سارية حتى", 100, 700, 800, 780),
        d("ذكر", 700, 540, 790, 620),
        d("مسلم", 400, 545, 520, 620),
        d("بطاقة تحقيق الشخصية", 300, 1390, 900, 1460),
        d("محمد", 700, 1500, 800, 1560),
    ]
    lines = group_lines(detections)
    assert [line.text for line in lines][:1] == ["ذكر مسلم"]
    cards = split_cards(lines)
    assert len(cards) == 2
    assert classify_side(cards[0]) == "back"
    assert classify_side(cards[1]) == "front"
