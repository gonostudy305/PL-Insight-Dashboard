import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ApiService {
    private baseUrl = 'http://localhost:3000/api';

    constructor(private http: HttpClient) { }

    // ── Analytics ──
    getOverview(params: any = {}): Observable<any> {
        return this.http.get(`${this.baseUrl}/analytics/overview`, { params: this.buildParams(params) });
    }

    getDistribution(params: any = {}): Observable<any> {
        return this.http.get(`${this.baseUrl}/analytics/distribution`, { params: this.buildParams(params) });
    }

    getTrends(params: any = {}): Observable<any> {
        return this.http.get(`${this.baseUrl}/analytics/trends`, { params: this.buildParams(params) });
    }

    getHeatmap(params: any = {}): Observable<any> {
        return this.http.get(`${this.baseUrl}/analytics/heatmap`, { params: this.buildParams(params) });
    }

    getBySession(params: any = {}): Observable<any> {
        return this.http.get(`${this.baseUrl}/analytics/by-session`, { params: this.buildParams(params) });
    }

    // ── Branches ──
    getBranches(): Observable<any> {
        return this.http.get(`${this.baseUrl}/branches`);
    }

    getBranch(name: string): Observable<any> {
        return this.http.get(`${this.baseUrl}/branches/${encodeURIComponent(name)}`);
    }

    getBranchDetail(placeId: string, params: any = {}): Observable<any> {
        return this.http.get(`${this.baseUrl}/branches/${encodeURIComponent(placeId)}`, { params: this.buildParams(params) });
    }

    // ── Reviews ──
    getReviews(params: any = {}): Observable<any> {
        let httpParams = new HttpParams();
        Object.keys(params).forEach(key => {
            if (params[key] !== undefined && params[key] !== null) {
                httpParams = httpParams.set(key, params[key]);
            }
        });
        return this.http.get(`${this.baseUrl}/reviews`, { params: httpParams });
    }

    predictReview(reviewId: string): Observable<any> {
        return this.http.post(`${this.baseUrl}/reviews/${reviewId}/predict`, {});
    }

    // ── Alerts ──
    getAlerts(limit = 50, priority?: number): Observable<any> {
        let httpParams = new HttpParams().set('limit', limit.toString());
        if (priority) httpParams = httpParams.set('priority', priority.toString());
        return this.http.get(`${this.baseUrl}/alerts`, { params: httpParams });
    }

    getAlertHistory(params: any = {}): Observable<any> {
        let httpParams = new HttpParams();
        Object.keys(params).forEach(key => {
            if (params[key] !== undefined && params[key] !== null) {
                httpParams = httpParams.set(key, params[key]);
            }
        });
        return this.http.get(`${this.baseUrl}/alerts/history`, { params: httpParams });
    }

    runAlertScan(): Observable<any> {
        return this.http.post(`${this.baseUrl}/alerts/scan`, {});
    }

    updateAlertStatus(alertId: string, status: string): Observable<any> {
        return this.http.patch(`${this.baseUrl}/alerts/${encodeURIComponent(alertId)}/status`, { status });
    }

    // ── Live Monitor ──
    getLiveRecent(params: any = {}): Observable<any> {
        let httpParams = new HttpParams();
        Object.keys(params).forEach(key => {
            if (params[key] !== undefined && params[key] !== null) {
                httpParams = httpParams.set(key, params[key]);
            }
        });
        return this.http.get(`${this.baseUrl}/live-monitor/recent`, { params: httpParams });
    }

    analyzeReview(reviewId: string): Observable<any> {
        return this.http.post(`${this.baseUrl}/live-monitor/analyze/${encodeURIComponent(reviewId)}`, {});
    }

    scanReviews(maxItems = 10): Observable<any> {
        return this.http.post(`${this.baseUrl}/live-monitor/scan`, { maxItems });
    }

    // ── Analytics Extended ──
    getDistrictHeatmap(params: any = {}): Observable<any> {
        return this.http.get(`${this.baseUrl}/analytics/district-heatmap`, { params: this.buildParams(params) });
    }

    getKeywords(params: any = {}): Observable<any> {
        return this.http.get(`${this.baseUrl}/analytics/keywords`, { params: this.buildParams(params) });
    }

    // ── Telegram ──
    getTelegramStatus(): Observable<any> {
        return this.http.get(`${this.baseUrl}/alerts/telegram-status`);
    }

    testTelegramNotify(): Observable<any> {
        return this.http.post(`${this.baseUrl}/alerts/test-notify`, {});
    }

    // ── Suggestions ──
    getSuggestions(reviewId: string): Observable<any> {
        return this.http.get(`${this.baseUrl}/suggestions/${encodeURIComponent(reviewId)}`);
    }

    getAIResponse(reviewId: string): Observable<any> {
        return this.http.post(`${this.baseUrl}/suggestions/${encodeURIComponent(reviewId)}/ai-response`, {});
    }

    // ── Insights ──
    getInsights(): Observable<any> {
        return this.http.get(`${this.baseUrl}/analytics/insights`);
    }

    // ── Health ──
    getHealth(): Observable<any> {
        return this.http.get(`${this.baseUrl}/health`);
    }

    // ── Helpers ──
    private buildParams(params: any): HttpParams {
        let httpParams = new HttpParams();
        Object.keys(params).forEach(key => {
            if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
                httpParams = httpParams.set(key, params[key]);
            }
        });
        return httpParams;
    }
}
