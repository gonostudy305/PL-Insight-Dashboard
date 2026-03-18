import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-live-monitor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="monitor">
      <div class="header-row">
        <div>
          <h2 class="page-title">Live Sentiment Monitor</h2>
          <p class="page-subtitle">Phân tích cảm xúc thời gian thực bằng PhoBERT</p>
        </div>
        <div class="header-actions">
          <button class="scan-btn" (click)="runScan()" [disabled]="scanning">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
            {{ scanning ? 'Đang phân tích...' : 'Scan Now' }}
          </button>
          <span class="poll-indicator" [class.active]="pollingActive">
            <span class="pulse-dot" *ngIf="pollingActive"></span>
            {{ pollingActive ? 'Live' : 'Paused' }}
          </span>
        </div>
      </div>

      <!-- Scan Result Banner -->
      <div class="scan-banner" *ngIf="lastScanResult">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        <span>Đã phân tích: <strong>{{ lastScanResult.analyzed }}</strong></span>
        <span *ngIf="lastScanResult.failed > 0" style="color: var(--color-danger);">Lỗi: {{ lastScanResult.failed }}</span>
        <span>Chưa xử lý: {{ lastScanResult.remaining }}</span>
        <button class="close-banner" (click)="lastScanResult = null">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>
        </button>
      </div>

      <!-- Filters -->
      <div class="filter-row">
        <select [(ngModel)]="filterSentiment" (change)="loadRecent()">
          <option value="">Tất cả cảm xúc</option>
          <option value="positive">Tích cực</option>
          <option value="negative">Tiêu cực</option>
        </select>
        <select [(ngModel)]="filterBranch" (change)="loadRecent()">
          <option value="">Tất cả chi nhánh</option>
          @for (b of branches; track b.placeId) {
            <option [value]="b.placeId">{{ b.branchAddress }}</option>
          }
        </select>
        <span class="total-badge">{{ total }} kết quả</span>
      </div>

      <!-- Review List -->
      <div class="review-list" *ngIf="reviews.length > 0; else emptyState">
        @for (review of reviews; track review.reviewId) {
          <div class="review-card"
            [class.positive]="review.aiSentimentSummary === 'Positive'"
            [class.negative]="review.aiSentimentSummary === 'Negative'"
            [class.mixed]="review.aiSentimentSummary === 'Mixed'">
            <div class="card-header">
              <span class="sentiment-badge"
                [class.badge-positive]="review.aiSentimentSummary === 'Positive'"
                [class.badge-negative]="review.aiSentimentSummary === 'Negative'"
                [class.badge-mixed]="review.aiSentimentSummary === 'Mixed'">
                {{ review.aiSentimentSummary === 'Positive' ? 'Tích cực' :
                   review.aiSentimentSummary === 'Negative' ? 'Tiêu cực' : 'Hỗn hợp' }}
              </span>
              <span class="ai-label">{{ review.aiSentimentSummary }}</span>
              <span class="stars">{{ getStarDisplay(review.stars) }}</span>
              <span class="time">{{ formatTime(review.analyzedAt) }}</span>
            </div>

            <p class="review-text">{{ review.text }}</p>

            <div class="card-meta">
              <div class="confidence-wrap">
                <span class="conf-label">Confidence</span>
                <div class="confidence-bar">
                  <div class="confidence-fill"
                    [class.high-conf]="review.confidenceAvg >= 0.8"
                    [class.mid-conf]="review.confidenceAvg >= 0.5 && review.confidenceAvg < 0.8"
                    [class.low-conf]="review.confidenceAvg < 0.5"
                    [style.width.%]="review.confidenceAvg * 100">
                  </div>
                </div>
                <span class="conf-value">{{ (review.confidenceAvg * 100).toFixed(1) }}%</span>
              </div>
              <span class="branch-tag">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
                {{ review.branchAddress }}
              </span>
              <span class="keywords-tag" *ngIf="review.keywords?.length">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"/><path d="M7 7h.01"/></svg>
                {{ review.keywords.join(', ') }}
              </span>
              <span class="translated-tag" *ngIf="review.isTranslated">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" x2="22" y1="12" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                Translated
              </span>
            </div>
          </div>
        }
      </div>

      <ng-template #emptyState>
        <div class="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" stroke-width="1.5"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
          <p>Chưa có review nào được phân tích AI.</p>
          <p>Bấm <strong>Scan Now</strong> để bắt đầu phân tích.</p>
        </div>
      </ng-template>
    </div>
  `,
  styles: [`
    .monitor {
      max-width: 1200px;
      animation: fadeInUp 0.4s ease-out;
    }

    .header-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: var(--space-6);
    }

    .page-title {
      font-size: var(--font-size-2xl);
      font-weight: 800;
      color: var(--color-text);
      letter-spacing: -0.03em;
    }

    .page-subtitle {
      color: var(--color-text-secondary);
      font-size: var(--font-size-base);
      margin-top: var(--space-1);
    }

    .header-actions { display: flex; align-items: center; gap: var(--space-4); }

    .scan-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 20px;
      border-radius: var(--radius-md);
      border: none;
      background: var(--color-primary);
      color: white;
      font-size: var(--font-size-base);
      font-weight: 600;
      cursor: pointer;
      transition: all var(--transition-base);
    }

    .scan-btn:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 4px 16px rgba(12, 113, 61, 0.3);
    }

    .scan-btn:disabled { opacity: 0.6; cursor: not-allowed; }

    .poll-indicator {
      font-size: var(--font-size-sm);
      color: var(--color-text-muted);
      padding: 6px 14px;
      border-radius: var(--radius-full);
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .poll-indicator.active {
      color: var(--color-success);
      border-color: rgba(5, 150, 105, 0.3);
    }

    .pulse-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--color-success);
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }

    .scan-banner {
      display: flex;
      align-items: center;
      gap: var(--space-4);
      padding: var(--space-3) var(--space-5);
      border-radius: var(--radius-md);
      margin-bottom: var(--space-4);
      background: var(--color-success-bg);
      border: 1px solid rgba(5, 150, 105, 0.2);
      color: var(--color-text);
      font-size: var(--font-size-sm);
    }

    .close-banner {
      margin-left: auto;
      background: none;
      border: none;
      color: var(--color-text-muted);
      cursor: pointer;
      display: flex;
    }

    .filter-row {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      margin-bottom: var(--space-5);
    }

    .filter-row select {
      padding: 8px 14px;
      border-radius: var(--radius-md);
      font-size: var(--font-size-sm);
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      color: var(--color-text);
      cursor: pointer;
    }

    .filter-row select:focus {
      outline: none;
      border-color: var(--color-primary);
    }

    .total-badge {
      margin-left: auto;
      font-size: var(--font-size-sm);
      color: var(--color-text-muted);
      padding: 6px 14px;
      border-radius: var(--radius-full);
      background: var(--color-surface);
      border: 1px solid var(--color-border);
    }

    .review-list { display: flex; flex-direction: column; gap: var(--space-3); }

    .review-card {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: var(--space-5) var(--space-6);
      transition: all var(--transition-base);
    }

    .review-card:hover {
      box-shadow: var(--shadow-card-hover);
      transform: translateY(-1px);
    }

    .review-card.positive { border-left: 4px solid var(--color-success); }
    .review-card.negative { border-left: 4px solid var(--color-danger); }
    .review-card.mixed { border-left: 4px solid var(--color-warning); }

    .card-header {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      margin-bottom: var(--space-3);
      flex-wrap: wrap;
    }

    .sentiment-badge {
      padding: 4px 12px;
      border-radius: var(--radius-full);
      font-size: var(--font-size-xs);
      font-weight: 600;
    }

    .badge-positive { background: var(--color-success-bg); color: var(--color-success); }
    .badge-negative { background: var(--color-danger-bg); color: var(--color-danger); }
    .badge-mixed { background: var(--color-warning-bg); color: var(--color-warning); }

    .ai-label { font-size: var(--font-size-xs); color: var(--color-text-muted); font-weight: 500; }
    .stars { font-size: var(--font-size-sm); color: var(--color-accent); }
    .time { margin-left: auto; font-size: var(--font-size-xs); color: var(--color-text-muted); }

    .review-text {
      font-size: var(--font-size-base);
      line-height: 1.7;
      color: var(--color-text);
      margin-bottom: var(--space-3);
      max-height: 80px;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .card-meta {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      flex-wrap: wrap;
    }

    .confidence-wrap { display: flex; align-items: center; gap: 8px; }
    .conf-label { font-size: 11px; color: var(--color-text-muted); }

    .confidence-bar {
      width: 80px;
      height: 6px;
      border-radius: 3px;
      background: var(--color-bg);
      overflow: hidden;
    }

    .confidence-fill { height: 100%; border-radius: 3px; transition: width 0.3s; }
    .high-conf { background: var(--color-success); }
    .mid-conf { background: var(--color-warning); }
    .low-conf { background: var(--color-danger); }
    .conf-value { font-size: var(--font-size-xs); color: var(--color-text-secondary); font-weight: 600; }

    .branch-tag, .keywords-tag, .translated-tag {
      font-size: var(--font-size-xs);
      color: var(--color-text-muted);
      padding: 3px 10px;
      border-radius: var(--radius-full);
      background: var(--color-bg);
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .empty-state {
      text-align: center;
      padding: var(--space-12) var(--space-6);
      color: var(--color-text-muted);
      background: var(--color-surface);
      border-radius: var(--radius-lg);
      border: 1px solid var(--color-border);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-3);
    }
  `],
})
export class LiveMonitorComponent implements OnInit, OnDestroy {
  reviews: any[] = [];
  branches: any[] = [];
  total = 0;
  scanning = false;
  pollingActive = true;
  lastScanResult: any = null;
  filterSentiment = '';
  filterBranch = '';

  private pollTimer: any;
  private readonly POLL_INTERVAL = 30000;

  constructor(private api: ApiService) { }

  ngOnInit() {
    this.loadRecent();
    this.loadBranches();
    this.startPolling();
  }

  ngOnDestroy() {
    this.stopPolling();
  }

  loadRecent() {
    const params: any = { limit: 30 };
    if (this.filterSentiment) params.sentiment = this.filterSentiment;
    if (this.filterBranch) params.placeId = this.filterBranch;

    this.api.getLiveRecent(params).subscribe({
      next: data => {
        this.reviews = data.data || [];
        this.total = data.total || 0;
      },
      error: err => console.error('Live monitor load error:', err),
    });
  }

  loadBranches() {
    this.api.getBranches().subscribe({
      next: data => this.branches = data.data || [],
      error: () => { },
    });
  }

  runScan() {
    this.scanning = true;
    this.api.scanReviews(10).subscribe({
      next: result => {
        this.lastScanResult = result;
        this.scanning = false;
        this.loadRecent();
      },
      error: err => {
        console.error('Scan error:', err);
        this.scanning = false;
      },
    });
  }

  startPolling() {
    this.pollingActive = true;
    this.pollTimer = setInterval(() => this.loadRecent(), this.POLL_INTERVAL);
  }

  stopPolling() {
    this.pollingActive = false;
    if (this.pollTimer) clearInterval(this.pollTimer);
  }

  getStarDisplay(stars: number): string {
    return '★'.repeat(stars);
  }

  formatTime(date: string): string {
    if (!date) return '';
    return new Date(date).toLocaleString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }
}
