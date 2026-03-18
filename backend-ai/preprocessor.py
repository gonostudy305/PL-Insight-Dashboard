"""
PLPreprocessor — Text preprocessing pipeline for PhoBERT inference.
Implements the preprocessing from Chapter 4.3.2 of the research paper.

Note: Aspect detection is RULE-BASED TAGGING (keyword matching),
not model-based aspect classification.
"""

import re
import emoji
from underthesea import word_tokenize, text_normalize, sent_tokenize
from deep_translator import GoogleTranslator
from langdetect import detect, DetectorFactory

# Make langdetect deterministic
DetectorFactory.seed = 0

# Max sentences to process per review (performance guard)
MAX_SENTENCES = 10
# Max characters per review input
MAX_CHARS = 2000
# Minimum text length for reliable language detection
MIN_LANG_DETECT_LENGTH = 15


class PLPreprocessor:
    """
    Preprocessing pipeline for Phuc Long customer reviews.
    Handles: guarded language detection, Unicode normalization,
    text cleaning, Vietnamese word segmentation, and rule-based aspect tagging.
    """

    def __init__(self):
        self.translator = GoogleTranslator(source='auto', target='vi')

        # Rule-based aspect keyword dictionaries (from Chapter 3.2)
        # This is keyword tagging, NOT model-based aspect classification.
        self.aspect_keywords = {
            "Dịch vụ": [
                "nhân_viên", "phục_vụ", "thái_độ", "bảo_vệ", "khó_chịu",
                "lễ_tân", "chăm_sóc", "tư_vấn", "order", "gọi_món",
                "phản_hồi", "hỗ_trợ"
            ],
            "Thời gian chờ": [
                "đợi", "chờ", "lâu", "chậm", "nhanh", "hàng_dài",
                "xếp_hàng", "mất_thời_gian", "delay"
            ],
            "Không gian": [
                "vệ_sinh", "bẩn", "nóng", "máy_lạnh", "điều_hòa",
                "chỗ_ngồi", "hết_bàn", "chật", "ồn", "đông",
                "không_gian", "view", "đẹp", "thoáng"
            ],
            "Sản phẩm": [
                "ngon", "dở", "nhạt", "đá", "đắng", "đậm",
                "trà", "cà_phê", "bánh", "đồ_uống", "nước",
                "vị", "chất_lượng", "tươi", "thơm"
            ],
        }

    def clean_text(self, text: str) -> tuple[str, bool]:
        """
        Full text cleaning pipeline for a single string.
        Returns: (cleaned_text, is_translated)

        Steps: guarded lang detect → translate if non-VI → lowercase →
               normalize Unicode → remove URLs/emails/emoji →
               remove special chars → collapse whitespace.
        """
        if not isinstance(text, str) or text.strip() == "":
            return "", False

        is_translated = False

        # 1. Guarded language detection + translation
        # Only attempt translation if text is long enough for reliable detection
        if len(text.strip()) >= MIN_LANG_DETECT_LENGTH:
            try:
                detected_lang = detect(text)
                if detected_lang != 'vi':
                    translated = self.translator.translate(text)
                    if translated and len(translated.strip()) > 0:
                        text = translated
                        is_translated = True
            except Exception:
                pass  # Keep original text on any failure

        # 2. Lowercase
        text = text.lower()

        # 3. Vietnamese Unicode normalization (e.g., "hoà" → "hòa")
        text = text_normalize(text)

        # 4. Remove URLs, emails
        text = re.sub(
            r'http\S+|www\S+|https\S+|\S+@\S+', '', text,
            flags=re.MULTILINE
        )

        # 5. Remove emojis
        text = emoji.replace_emoji(text, replace=' ')

        # 6. Remove special characters (keep letters, numbers, whitespace)
        text = re.sub(r'[^\w\s]', ' ', text)

        # 7. Collapse whitespace
        text = re.sub(r'\s+', ' ', text).strip()

        return text, is_translated

    def process_for_inference(self, raw_comment: str) -> dict:
        """
        Full preprocessing pipeline for PhoBERT inference.
        1. Truncate to MAX_CHARS
        2. Split comment into sentences (capped at MAX_SENTENCES)
        3. Clean each sentence
        4. Word segmentation (critical for PhoBERT)
        5. Rule-based aspect tagging

        Returns: dict with sentences list and isTranslated flag
        """
        if not raw_comment or not isinstance(raw_comment, str):
            return {"sentences": [], "isTranslated": False}

        # Truncate overly long input
        truncated = raw_comment[:MAX_CHARS]

        # Step A: Sentence tokenization (capped)
        raw_sentences = sent_tokenize(truncated)[:MAX_SENTENCES]

        any_translated = False
        processed_data = []

        for sent in raw_sentences:
            # Step B: Clean (now returns translation flag)
            cleaned, was_translated = self.clean_text(sent)
            if was_translated:
                any_translated = True
            if not cleaned:
                continue

            # Step C: Word segmentation → "nhân viên" → "nhân_viên"
            segmented = word_tokenize(cleaned, format="text")

            # Step D: Rule-based aspect tagging
            aspect_hints = self._detect_aspect_hints(segmented)

            processed_data.append({
                "originalSentence": sent.strip(),
                "processedSentence": segmented,
                "aspectHints": aspect_hints,
            })

        return {"sentences": processed_data, "isTranslated": any_translated}

    def _detect_aspect_hints(self, segmented_text: str) -> list[str]:
        """Rule-based aspect tagging from segmented text using keyword matching."""
        found = []
        text_lower = segmented_text.lower()
        for aspect_name, keywords in self.aspect_keywords.items():
            for kw in keywords:
                if kw in text_lower:
                    found.append(aspect_name)
                    break
        return found

    def extract_keywords(self, segmented_text: str) -> list[str]:
        """Extract meaningful keywords from segmented text."""
        keywords = []
        text_lower = segmented_text.lower()
        for _, kw_list in self.aspect_keywords.items():
            for kw in kw_list:
                if kw in text_lower:
                    keywords.append(kw.replace("_", " "))
        return list(set(keywords))
