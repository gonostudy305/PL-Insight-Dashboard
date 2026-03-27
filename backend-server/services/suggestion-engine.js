/**
 * Response Suggestion Engine
 * Generates AI-personalized responses for negative review responses.
 * Maps by keyword category, priority level, and stars.
 * Detects review language and responds in the SAME language.
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
    'Nhân viên': ['nhân viên', 'nhan vien', 'phục vụ', 'phuc vu', 'thái độ', 'thai do', 'staff', 'bồi', 'nhân_viên', 'phục_vụ', 'thái_độ', 'service', 'rude', 'greet', 'ignore'],
    'Chờ lâu': ['đợi', 'chờ', 'lâu', 'chậm', 'wait', 'slow', 'chờ đợi', 'chờ_đợi', 'đợi_lâu', 'forever', 'long time', 'took so long'],
    'Chất lượng': ['dở', 'tệ', 'chất lượng', 'nhạt', 'không ngon', 'khó uống', 'dở tệ', 'chất_lượng', 'khó_uống', 'không_ngon', 'đắng', 'chua', 'bad', 'terrible', 'tasteless', 'awful', 'disgusting'],
    'Không gian': ['không gian', 'chỗ ngồi', 'chật', 'ồn', 'nóng', 'bàn ghế', 'không_gian', 'chỗ_ngồi', 'bàn_ghế', 'điều hòa', 'điều_hòa', 'crowded', 'noisy', 'dirty table', 'hot'],
    'Vệ sinh': ['bẩn', 'vệ sinh', 'sạch', 'ruồi', 'kiến', 'nhờn', 'hanh', 'vệ_sinh', 'dirty', 'unclean', 'cockroach', 'fly', 'ant'],
    'Giá cả': ['giá', 'đắt', 'mắc', 'expensive', 'giá cao', 'giá_cả', 'overpriced', 'pricey'],
    'Order sai': ['order sai', 'sai', 'nhầm', 'thiếu', 'giao nhầm', 'giao_nhầm', 'wrong order', 'wrong drink', 'missing'],
};

// Vietnamese category name → issue description
const CATEGORY_DESCRIPTIONS = {
    'Nhân viên': 'thái độ phục vụ của nhân viên',
    'Chờ lâu': 'thời gian chờ đợi',
    'Chất lượng': 'chất lượng đồ uống',
    'Không gian': 'không gian cửa hàng',
    'Vệ sinh': 'vấn đề vệ sinh',
    'Giá cả': 'giá cả sản phẩm',
    'Order sai': 'sự nhầm lẫn trong đơn hàng',
};

// English category name → issue description
const CATEGORY_DESCRIPTIONS_EN = {
    'Nhân viên': 'staff service attitude',
    'Chờ lâu': 'long waiting time',
    'Chất lượng': 'drink quality',
    'Không gian': 'store environment',
    'Vệ sinh': 'hygiene issues',
    'Giá cả': 'product pricing',
    'Order sai': 'order mistakes',
};

/**
 * Detect if the review text is primarily English or Vietnamese.
 * Uses isTranslated flag from PhoBERT + Vietnamese diacritics heuristic.
 * @param {string} text
 * @param {boolean} isTranslated - from AI analysis
 * @returns {'en'|'vi'}
 */
function detectLanguage(text, isTranslated = false) {
    if (isTranslated) return 'en';
    const vnPattern = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/gi;
    const matches = (text || '').match(vnPattern);
    if (matches && matches.length >= 2) return 'vi';
    const asciiRatio = (text || '').replace(/[^\x00-\x7F]/g, '').length / Math.max((text || '').length, 1);
    return asciiRatio > 0.85 ? 'en' : 'vi';
}

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
 * Generate rule-based response suggestions (legacy)
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
        suggestions: suggestions.slice(0, 3),
    };
}

/**
 * Generate a personalized AI response using PhoBERT analysis results.
 * Responds in the SAME LANGUAGE as the original review.
 */
function generateAIResponse(review, aiAnalysis) {
    const branchName = review.branch_address || 'chi nhánh';
    const stars = review.stars || 0;
    const lang = detectLanguage(review.text, aiAnalysis.isTranslated);

    // 1. Determine categories
    const ruleCategories = detectCategories(review.text);
    const aiKeywords = aiAnalysis.keywords || [];

    const aiCategories = new Set();
    for (const kw of aiKeywords) {
        for (const [cat, patterns] of Object.entries(KEYWORD_PATTERNS)) {
            if (patterns.some(p => kw.toLowerCase().includes(p) || p.includes(kw.toLowerCase()))) {
                aiCategories.add(cat);
            }
        }
    }

    const allCategories = [...new Set([...aiCategories, ...ruleCategories])].filter(c => c !== 'default');
    const categories = allCategories.length > 0 ? allCategories : ['default'];

    // 2. Find most negative sentences
    const negativeSentences = (aiAnalysis.analysis || [])
        .filter(s => s.label === 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);

    // 3. Build issue descriptions in detected language
    const descMap = lang === 'en' ? CATEGORY_DESCRIPTIONS_EN : CATEGORY_DESCRIPTIONS;
    const issueDescriptions = categories
        .filter(c => c !== 'default')
        .map(c => descMap[c] || c);

    // 4. Compose response in detected language
    let aiResponse;
    if (lang === 'en') {
        aiResponse = composeEnglishResponse(branchName, stars, issueDescriptions, categories, negativeSentences, descMap);
    } else {
        aiResponse = composeVietnameseResponse(branchName, stars, issueDescriptions, categories, negativeSentences);
    }

    return {
        reviewId: review.reviewId || String(review._id),
        aiResponse,
        categories,
        keywords: aiKeywords,
        sentimentSummary: aiAnalysis.sentimentSummary || 'Unknown',
        confidence: aiAnalysis.confidenceAvg || 0,
        negativeSentences: negativeSentences.map(s => ({
            sentence: s.sentence,
            score: s.score,
            aspectHint: s.aspectHint,
        })),
        branchAddress: review.branch_address,
        stars: review.stars,
        language: lang,
    };
}

// ── English Response Composer ──
function composeEnglishResponse(branchName, stars, issueDescriptions, categories, negativeSentences, descMap) {
    let r = '';
    if (issueDescriptions.length > 0) {
        const lastIssue = issueDescriptions.length > 1
            ? issueDescriptions.slice(0, -1).join(', ') + ' and ' + issueDescriptions[issueDescriptions.length - 1]
            : issueDescriptions[0];

        r += `Thank you for taking the time to share your experience at Phuc Long ${branchName}. `;
        r += stars <= 2
            ? `We sincerely apologize for the issues you experienced regarding ${lastIssue}. `
            : `We appreciate your feedback about ${lastIssue}. `;

        if (negativeSentences.length > 0 && negativeSentences[0].aspectHint) {
            const hint = descMap[negativeSentences[0].aspectHint] || negativeSentences[0].aspectHint;
            r += `In particular, we take note of the concern related to ${hint}. `;
        }

        const actions = [];
        if (categories.includes('Nhân viên')) actions.push('retrain our staff team');
        if (categories.includes('Chờ lâu')) actions.push('optimize our service process and staffing during peak hours');
        if (categories.includes('Chất lượng')) actions.push('review our ingredients and preparation procedures');
        if (categories.includes('Không gian')) actions.push('improve the store layout and facilities');
        if (categories.includes('Vệ sinh')) actions.push('immediately inspect and elevate our hygiene standards');
        if (categories.includes('Order sai')) actions.push('improve our order verification process');
        if (categories.includes('Giá cả')) actions.push('review our pricing policy');

        if (actions.length > 0) r += `We will ${actions.join(', ')} at ${branchName}. `;
        r += 'We hope to serve you better on your next visit to Phuc Long.';
    } else {
        r += `Thank you for taking the time to share your experience at Phuc Long ${branchName}. `;
        r += 'We have noted your feedback and will work to improve our service. ';
        r += 'We look forward to serving you again.';
    }
    return r;
}

// ── Vietnamese Response Composer ──
function composeVietnameseResponse(branchName, stars, issueDescriptions, categories, negativeSentences) {
    let r = '';
    if (issueDescriptions.length > 0) {
        const lastIssue = issueDescriptions.length > 1
            ? issueDescriptions.slice(0, -1).join(', ') + ' và ' + issueDescriptions[issueDescriptions.length - 1]
            : issueDescriptions[0];

        r += `Phúc Long tại ${branchName} xin chân thành cảm ơn bạn đã dành thời gian chia sẻ trải nghiệm. `;
        r += stars <= 2
            ? `Chúng tôi rất lấy làm tiếc khi bạn gặp vấn đề về ${lastIssue}. `
            : `Chúng tôi ghi nhận phản hồi của bạn về ${lastIssue}. `;

        if (negativeSentences.length > 0 && negativeSentences[0].aspectHint) {
            r += `Đặc biệt, chúng tôi lưu ý vấn đề liên quan đến ${CATEGORY_DESCRIPTIONS[negativeSentences[0].aspectHint] || negativeSentences[0].aspectHint}. `;
        }

        const actions = [];
        if (categories.includes('Nhân viên')) actions.push('tổ chức đào tạo lại đội ngũ nhân viên');
        if (categories.includes('Chờ lâu')) actions.push('tối ưu quy trình phục vụ và bố trí nhân sự giờ cao điểm');
        if (categories.includes('Chất lượng')) actions.push('kiểm tra lại nguyên liệu và quy trình pha chế');
        if (categories.includes('Không gian')) actions.push('cải thiện bố trí không gian và tiện nghi');
        if (categories.includes('Vệ sinh')) actions.push('kiểm tra và nâng cao tiêu chuẩn vệ sinh ngay lập tức');
        if (categories.includes('Order sai')) actions.push('cải thiện quy trình kiểm tra đơn hàng');
        if (categories.includes('Giá cả')) actions.push('cân nhắc chính sách giá phù hợp hơn');

        if (actions.length > 0) r += `Chúng tôi sẽ ${actions.join(', ')} tại chi nhánh ${branchName}. `;
        r += 'Phúc Long mong được phục vụ bạn tốt hơn trong lần ghé thăm tiếp theo.';
    } else {
        r += `Phúc Long tại ${branchName} xin chân thành cảm ơn bạn đã dành thời gian chia sẻ trải nghiệm. `;
        r += 'Chúng tôi đã ghi nhận phản hồi và sẽ cải thiện dịch vụ để mang đến trải nghiệm tốt hơn cho bạn. ';
        r += 'Phúc Long mong được phục vụ bạn trong lần ghé thăm tiếp theo.';
    }
    return r;
}

module.exports = { generateSuggestions, generateAIResponse, detectCategories };
