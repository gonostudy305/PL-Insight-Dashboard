/**
 * Response Suggestion Engine
 * Rule-based template matching for negative review responses.
 * Maps by keyword category, priority level, and stars.
 */

const TEMPLATES = {
    'Nhân viên': [
        'Phúc Long xin chân thành cảm ơn phản hồi của bạn. Chúng tôi rất lấy làm tiếc về trải nghiệm chưa tốt với đội ngũ nhân viên. Chúng tôi đã ghi nhận và sẽ tổ chức đào tạo lại tại chi nhánh này.',
        'Cảm ơn bạn đã chia sẻ. Sự hài lòng của khách hàng là ưu tiên hàng đầu. Chúng tôi sẽ nhắc nhở đội ngũ cải thiện thái độ phục vụ ngay.',
    ],
    'Chờ lâu': [
        'Phúc Long xin lỗi vì bạn phải chờ đợi lâu. Chúng tôi đang tối ưu quy trình pha chế và bố trí nhân sự vào giờ cao điểm để rút ngắn thời gian phục vụ.',
        'Cảm ơn bạn đã kiên nhẫn và phản hồi. Chúng tôi ghi nhận và sẽ cải thiện tốc độ phục vụ tại chi nhánh.',
    ],
    'Chất lượng': [
        'Cảm ơn phản hồi quý giá của bạn. Chúng tôi rất tiếc vì chất lượng đồ uống chưa đạt kỳ vọng. Chúng tôi sẽ kiểm tra lại nguyên liệu và quy trình pha chế ngay.',
        'Phúc Long luôn cam kết chất lượng. Chúng tôi đã ghi nhận và sẽ kiểm tra kỹ hơn tại chi nhánh này.',
    ],
    'Không gian': [
        'Cảm ơn bạn đã chia sẻ. Chúng tôi hiểu sự thoải mái của không gian rất quan trọng và sẽ cải thiện bố trí chỗ ngồi tại chi nhánh.',
        'Phúc Long ghi nhận phản hồi về không gian. Chúng tôi đang lên kế hoạch cải tạo để mang đến trải nghiệm tốt hơn.',
    ],
    'Vệ sinh': [
        'Phúc Long xin chân thành xin lỗi về vấn đề vệ sinh. Đây là tiêu chuẩn quan trọng nhất của chúng tôi. Chúng tôi sẽ kiểm tra và khắc phục ngay lập tức.',
        'Cảm ơn bạn đã báo cáo. Vệ sinh an toàn thực phẩm là ưu tiên số 1. Chúng tôi đã chuyển thông tin đến bộ phận quản lý chi nhánh.',
    ],
    'Giá cả': [
        'Cảm ơn phản hồi của bạn. Giá của Phúc Long phản ánh cam kết về nguyên liệu chất lượng cao. Chúng tôi luôn cố gắng cân bằng giữa chất lượng và giá cả hợp lý.',
    ],
    'Order sai': [
        'Phúc Long xin lỗi vì sự nhầm lẫn trong đơn hàng. Chúng tôi sẽ cải thiện quy trình kiểm tra đơn trước khi giao để tránh tình trạng tương tự.',
        'Cảm ơn bạn đã thông báo. Chúng tôi rất tiếc về sự cố. Vui lòng liên hệ hotline để được hỗ trợ đổi/bù sản phẩm.',
    ],
    'default': [
        'Phúc Long cảm ơn bạn đã dành thời gian chia sẻ trải nghiệm. Chúng tôi ghi nhận và sẽ cải thiện dịch vụ để phục vụ bạn tốt hơn.',
        'Cảm ơn phản hồi quý giá. Phúc Long luôn lắng nghe và không ngừng cải thiện để mang đến trải nghiệm tốt nhất cho khách hàng.',
    ],
};

const KEYWORD_PATTERNS = {
    'Nhân viên': ['nhân viên', 'nhan vien', 'phục vụ', 'phuc vu', 'thái độ', 'thai do', 'staff', 'bồi'],
    'Chờ lâu': ['đợi', 'chờ', 'lâu', 'chậm', 'wait', 'slow', 'chờ đợi'],
    'Chất lượng': ['dở', 'tệ', 'chất lượng', 'nhạt', 'không ngon', 'khó uống', 'dở tệ'],
    'Không gian': ['không gian', 'chỗ ngồi', 'chật', 'ồn', 'nóng', 'bàn ghế'],
    'Vệ sinh': ['bẩn', 'vệ sinh', 'sạch', 'ruồi', 'kiến', 'nhờn', 'hanh'],
    'Giá cả': ['giá', 'đắt', 'mắc', 'expensive', 'giá cao'],
    'Order sai': ['order sai', 'sai', 'nhầm', 'thiếu', 'giao nhầm'],
};

/**
 * Detect keyword categories in review text
 */
function detectCategories(text) {
    const lower = (text || '').toLowerCase();
    const detected = [];
    for (const [category, patterns] of Object.entries(KEYWORD_PATTERNS)) {
        if (patterns.some(p => lower.includes(p))) {
            detected.push(category);
        }
    }
    return detected.length > 0 ? detected : ['default'];
}

/**
 * Generate response suggestions for a review
 * @param {object} review - Review document from MongoDB
 * @returns {object} { categories, suggestions }
 */
function generateSuggestions(review) {
    const categories = detectCategories(review.text);
    const suggestions = [];
    const seen = new Set();

    for (const cat of categories) {
        const templates = TEMPLATES[cat] || TEMPLATES['default'];
        for (const t of templates) {
            if (!seen.has(t)) {
                suggestions.push({ category: cat, text: t });
                seen.add(t);
            }
        }
    }

    // Add a generic one if we have less than 2
    if (suggestions.length < 2) {
        for (const t of TEMPLATES['default']) {
            if (!seen.has(t)) {
                suggestions.push({ category: 'Chung', text: t });
                seen.add(t);
                break;
            }
        }
    }

    return {
        reviewId: review.reviewId || String(review._id),
        categories,
        suggestions: suggestions.slice(0, 3), // Max 3 suggestions
    };
}

module.exports = { generateSuggestions, detectCategories };
