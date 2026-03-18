"""
PLPreprocessor — Text preprocessing pipeline for PhoBERT inference.
Implements the exact preprocessing from Chapter 4.3.2 of the research paper.
"""

import re
import emoji
from underthesea import word_tokenize, text_normalize, sent_tokenize
from deep_translator import GoogleTranslator
from langdetect import detect


class PLPreprocessor:
    """
    Preprocessing pipeline for Phuc Long customer reviews.
    Handles: language detection, translation, Unicode normalization,
    text cleaning, and Vietnamese word segmentation.
    """

    def __init__(self):
        self.translator = GoogleTranslator(source='auto', target='vi')

        # Aspect keyword dictionaries (from Chapter 3.2 of the paper)
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

    def clean_text(self, text: str) -> str:
        """
        Full text cleaning pipeline for a single string.
        Steps: detect lang → translate → lowercase → normalize Unicode →
               remove URLs/emails/emoji → remove special chars → collapse whitespace.
        """
        if not isinstance(text, str) or text.strip() == "":
            return ""

        # 1. Language detection + translation to Vietnamese
        try:
            detected_lang = detect(text)
            if detected_lang != 'vi':
                text = self.translator.translate(text)
        except Exception:
            pass  # Keep original text if detection/translation fails

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

        return text

    def process_for_inference(self, raw_comment: str) -> list[dict]:
        """
        Full preprocessing pipeline for PhoBERT inference.
        1. Split comment into sentences
        2. Clean each sentence
        3. Word segmentation (critical for PhoBERT)
        4. Detect aspect keywords

        Returns: list of dicts with original_sentence, processed_sentence, aspects
        """
        if not raw_comment or not isinstance(raw_comment, str):
            return []

        # Step A: Sentence tokenization
        raw_sentences = sent_tokenize(raw_comment)

        processed_data = []
        for sent in raw_sentences:
            # Step B: Clean
            cleaned = self.clean_text(sent)
            if not cleaned:
                continue

            # Step C: Word segmentation → "nhân viên" → "nhân_viên"
            segmented = word_tokenize(cleaned, format="text")

            # Step D: Detect aspects
            aspects = self._detect_aspects(segmented)

            processed_data.append({
                "original_sentence": sent.strip(),
                "processed_sentence": segmented,
                "detected_aspects": aspects
            })

        return processed_data

    def _detect_aspects(self, segmented_text: str) -> list[str]:
        """Detect operational aspects from segmented text using keyword matching."""
        found_aspects = []
        text_lower = segmented_text.lower()
        for aspect_name, keywords in self.aspect_keywords.items():
            for kw in keywords:
                if kw in text_lower:
                    found_aspects.append(aspect_name)
                    break
        return found_aspects

    def extract_keywords(self, segmented_text: str) -> list[str]:
        """Extract meaningful keywords from segmented text."""
        keywords = []
        text_lower = segmented_text.lower()
        for _, kw_list in self.aspect_keywords.items():
            for kw in kw_list:
                if kw in text_lower:
                    keywords.append(kw.replace("_", " "))
        return list(set(keywords))
