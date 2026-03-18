import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type Lang = 'vi' | 'en';

/**
 * Lightweight i18n service.
 * Key naming convention (enforced):
 *   nav.*      — navigation items
 *   sidebar.*  — sidebar titles & filter groups
 *   header.*   — header-level controls
 *   common.*   — shared actions / labels
 *   status.*   — status badges & states
 */

const DICT: Record<Lang, Record<string, string>> = {
    vi: {
        // ── nav ──
        'nav.dashboard': 'Tổng quan',
        'nav.liveMonitor': 'Live Monitor',
        'nav.analytics': 'Phân tích',
        'nav.reviews': 'Đánh giá',
        'nav.alerts': 'Cảnh báo',
        'nav.map': 'Bản đồ',

        // ── header ──
        'header.allSystem': 'Toàn hệ thống',
        'header.language': 'Tiếng Việt',
        'header.theme': 'Giao diện',
        'header.notifications': 'Thông báo',
        'header.noNotifications': 'Không có thông báo mới',
        'header.markAllRead': 'Đánh dấu đã đọc',
        'header.profile': 'Tài khoản',
        'header.logout': 'Đăng xuất',

        // ── sidebar ──
        'sidebar.overview': 'Tổng quan',
        'sidebar.filters': 'Bộ lọc',
        'sidebar.timeRange': 'Thời gian',
        'sidebar.region': 'Khu vực',
        'sidebar.satisfaction': 'Mức độ Hài lòng',
        'sidebar.starRating': 'Xếp hạng Sao',
        'sidebar.healthScore': 'Tình trạng Health Score',
        'sidebar.trendAnalysis': 'Phân tích Xu hướng',
        'sidebar.viewMode': 'Chế độ xem',
        'sidebar.navigation': 'Điều hướng',
        'sidebar.mapNetwork': 'Bản đồ mạng lưới',
        'sidebar.insightAnalytics': 'Phân tích Insight',
        'sidebar.branch': 'Chi nhánh',
        'sidebar.alertClassification': 'Phân loại',
        'sidebar.alertHistory': 'Lịch sử xử lý',
        'sidebar.liveMonitorTitle': 'Giám sát',

        // ── common ──
        'common.export': 'Xuất báo cáo',
        'common.search': 'Tìm kiếm',
        'common.save': 'Lưu',
        'common.cancel': 'Hủy',
        'common.all': 'Tất cả',
        'common.today': 'Hôm nay',
        'common.yesterday': 'Hôm qua',
        'common.thisWeek': 'Tuần này',
        'common.thisMonth': 'Tháng này',
        'common.loading': 'Đang tải...',
        'common.noData': 'Không có dữ liệu',
        'common.viewDetail': 'Xem chi tiết',
        'common.back': 'Quay lại',
        'common.prev': 'Trước',
        'common.next': 'Sau',
        'common.page': 'Trang',

        // ── status ──
        'status.positive': 'Tích cực',
        'status.negative': 'Tiêu cực',
        'status.loading': 'Đang tải',
        'status.good': 'Tốt',
        'status.average': 'Trung bình',
        'status.weak': 'Yếu',
        'status.resolved': 'Đã xử lý',
        'status.pending': 'Chờ xử lý',
        'status.ignored': 'Bỏ qua',
    },

    en: {
        // ── nav ──
        'nav.dashboard': 'Dashboard',
        'nav.liveMonitor': 'Live Monitor',
        'nav.analytics': 'Analytics',
        'nav.reviews': 'Reviews',
        'nav.alerts': 'Alerts',
        'nav.map': 'Map',

        // ── header ──
        'header.allSystem': 'All Branches',
        'header.language': 'English',
        'header.theme': 'Theme',
        'header.notifications': 'Notifications',
        'header.noNotifications': 'No new notifications',
        'header.markAllRead': 'Mark all as read',
        'header.profile': 'Profile',
        'header.logout': 'Sign out',

        // ── sidebar ──
        'sidebar.overview': 'Overview',
        'sidebar.filters': 'Filters',
        'sidebar.timeRange': 'Time Range',
        'sidebar.region': 'Region',
        'sidebar.satisfaction': 'Satisfaction',
        'sidebar.starRating': 'Star Rating',
        'sidebar.healthScore': 'Health Score Status',
        'sidebar.trendAnalysis': 'Trend Analysis',
        'sidebar.viewMode': 'View Mode',
        'sidebar.navigation': 'Navigation',
        'sidebar.mapNetwork': 'Branch Network',
        'sidebar.insightAnalytics': 'Insight Analytics',
        'sidebar.branch': 'Branch',
        'sidebar.alertClassification': 'Classification',
        'sidebar.alertHistory': 'Processing History',
        'sidebar.liveMonitorTitle': 'Monitoring',

        // ── common ──
        'common.export': 'Export Report',
        'common.search': 'Search',
        'common.save': 'Save',
        'common.cancel': 'Cancel',
        'common.all': 'All',
        'common.today': 'Today',
        'common.yesterday': 'Yesterday',
        'common.thisWeek': 'This Week',
        'common.thisMonth': 'This Month',
        'common.loading': 'Loading...',
        'common.noData': 'No data available',
        'common.viewDetail': 'View Details',
        'common.back': 'Go Back',
        'common.prev': 'Previous',
        'common.next': 'Next',
        'common.page': 'Page',

        // ── status ──
        'status.positive': 'Positive',
        'status.negative': 'Negative',
        'status.loading': 'Loading',
        'status.good': 'Good',
        'status.average': 'Average',
        'status.weak': 'Weak',
        'status.resolved': 'Resolved',
        'status.pending': 'Pending',
        'status.ignored': 'Ignored',
    },
};

@Injectable({ providedIn: 'root' })
export class I18nService {
    private readonly STORAGE_KEY = 'pl-insight-lang';
    private langSubject: BehaviorSubject<Lang>;

    readonly currentLang$;

    constructor() {
        const saved = (localStorage.getItem(this.STORAGE_KEY) as Lang) || 'vi';
        this.langSubject = new BehaviorSubject<Lang>(saved);
        this.currentLang$ = this.langSubject.asObservable();
    }

    get current(): Lang {
        return this.langSubject.value;
    }

    toggle(): void {
        const next: Lang = this.current === 'vi' ? 'en' : 'vi';
        this.langSubject.next(next);
        localStorage.setItem(this.STORAGE_KEY, next);
    }

    setLang(lang: Lang): void {
        this.langSubject.next(lang);
        localStorage.setItem(this.STORAGE_KEY, lang);
    }

    /**
     * Translate a key.
     * Fallback chain: currentLang → vi → raw key
     */
    t(key: string): string {
        const current = DICT[this.current];
        if (current && current[key] !== undefined) return current[key];

        // fallback to Vietnamese
        const fallback = DICT['vi'];
        if (fallback && fallback[key] !== undefined) return fallback[key];

        // fallback to raw key (dev-visible)
        return key;
    }
}
