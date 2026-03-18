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
          <h2 class="page-title">📡 Live Sentiment Monitor</h2>
          <p class="page-subtitle">Phân tích cảm xúc thời gian thực bằng PhoBERT</p>
        </div>
        <div class="header-actions">
          <button class="scan-btn" (click)="runScan()" [disabled]="scanning">
            {{ scanning ? '⏳ Đang phân tích...' : '🔍 Scan Now' }}
          </button>
          <span class="poll-indicator" [class.active]="pollingActive">
            {{ pollingActive ? '● Live' : '○ Paused' }}
          </span>
        </div>
      </div>

      <!-- Scan Result Banner -->
      <div class="scan-banner" *ngIf="lastScanResult">
        <span>✅ Đã phân tích: <strong>{{ lastScanResult.analyzed }}</strong></span>
        <span *ngIf="lastScanResult.failed > 0">⚠️ Lỗi: {{ lastScanResult.failed }}</span>
        <span>📋 Chưa xử lý: {{ lastScanResult.remaining }}</span>
        <button class="close-banner" (click)="lastScanResult = null">✕</button>
      </div>

      <!-- Filters -->
      <div class="filter-row">
        <select [(ngModel)]="filterSentiment" (change)="loadRecent()">
          <option value="">Tất cả cảm xúc</option>
          <option value="positive">🟢 Tích cực</option>
          <option value="negative">🔴 Tiêu cực</option>
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
                {{ review.aiSentimentSummary === 'Positive' ? '🟢 Tích cực' :
                   review.aiSentimentSummary === 'Negative' ? '🔴 Tiêu cực' : '🟡 Hỗn hợp' }}
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
              <span class="branch-tag">🏪 {{ review.branchAddress }}</span>
              <span class="keywords-tag" *ngIf="review.keywords?.length">
                🏷️ {{ review.keywords.join(', ') }}
              </span>
              <span class="translated-tag" *ngIf="review.isTranslated">🌐 Translated</span>
            </div>
          </div>
        }
      </div>

      <ng-template #emptyState>
        <div class="empty-state">
          <span class="empty-icon">📡</span>
          <p>Chưa có review nào được phân tích AI.</p>
          <p>Bấm <strong>Scan Now</strong> để bắt đầu phân tích.</p>
        </div>
      </ng-template>
    </div>
  `,
  styles: [`
    .monitor { max-width: 1200px; }

    .header-row {
      display: flex; justify-content: space-between; align-items: flex-start;
      margin-bottom: 24px;
    }

    .page-title {
      font-size: 28px; font-weight: 700;
      background: linear-gradient(135deg, #f4f4f5, #a1a1aa);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    }
    .page-subtitle { color: #71717a; font-size: 14px; margin-top: 4px; }

    .header-actions { display: flex; align-items: center; gap: 16px; }

    .scan-btn {
      padding: 10px 20px; border-radius: 10px; border: none;
      background: linear-gradient(135deg, #3b82f6, #2563eb);
      color: white; font-size: 14px; font-weight: 600; cursor: pointer;
      transition: all 0.2s;
    }
    .scan-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 16px rgba(59,130,246,0.3); }
    .scan-btn:disabled { opacity: 0.6; cursor: not-allowed; }

    .poll-indicator {
      font-size: 13px; color: #71717a; padding: 6px 12px;
      border-radius: 20px; background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.06);
    }
    .poll-indicator.active { color: #22c55e; border-color: rgba(34,197,94,0.3); }

    .scan-banner {
      display: flex; align-items: center; gap: 20px;
      padding: 12px 20px; border-radius: 10px; margin-bottom: 16px;
      background: rgba(34,197,94,0.08); border: 1px solid rgba(34,197,94,0.2);
      color: #d4d4d8; font-size: 13px;
    }
    .close-banner {
      margin-left: auto; background: none; border: none;
      color: #71717a; cursor: pointer; font-size: 16px;
    }

    .filter-row {
      display: flex; align-items: center; gap: 12px; margin-bottom: 20px;
    }
    .filter-row select {
      padding: 8px 14px; border-radius: 8px; font-size: 13px;
      background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
      color: #d4d4d8; cursor: pointer;
    }
    .total-badge {
      margin-left: auto; font-size: 13px; color: #71717a;
      padding: 6px 12px; border-radius: 8px;
      background: rgba(255,255,255,0.03);
    }

    .review-list { display: flex; flex-direction: column; gap: 12px; }

    .review-card {
      background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05);
      border-radius: 12px; padding: 18px 20px;
      transition: transform 0.15s, box-shadow 0.15s;
    }
    .review-card:hover { transform: translateY(-1px); box-shadow: 0 4px 20px rgba(0,0,0,0.2); }
    .review-card.positive { border-left: 3px solid #22c55e; }
    .review-card.negative { border-left: 3px solid #ef4444; }
    .review-card.mixed { border-left: 3px solid #f59e0b; }

    .card-header { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; flex-wrap: wrap; }

    .sentiment-badge {
      padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 600;
    }
    .badge-positive { background: rgba(34,197,94,0.12); color: #22c55e; }
    .badge-negative { background: rgba(239,68,68,0.12); color: #ef4444; }
    .badge-mixed { background: rgba(245,158,11,0.12); color: #f59e0b; }

    .ai-label { font-size: 12px; color: #a1a1aa; font-weight: 500; }
    .stars { font-size: 13px; color: #f59e0b; }
    .time { margin-left: auto; font-size: 12px; color: #52525b; }

    .review-text {
      font-size: 14px; line-height: 1.6; color: #d4d4d8;
      margin-bottom: 12px; max-height: 80px; overflow: hidden;
      text-overflow: ellipsis;
    }

    .card-meta {
      display: flex; align-items: center; gap: 14px; flex-wrap: wrap;
    }

    .confidence-wrap { display: flex; align-items: center; gap: 8px; }
    .conf-label { font-size: 11px; color: #71717a; }
    .confidence-bar {
      width: 80px; height: 6px; border-radius: 3px;
      background: rgba(255,255,255,0.06); overflow: hidden;
    }
    .confidence-fill { height: 100%; border-radius: 3px; transition: width 0.3s; }
    .high-conf { background: #22c55e; }
    .mid-conf { background: #f59e0b; }
    .low-conf { background: #ef4444; }
    .conf-value { font-size: 12px; color: #a1a1aa; font-weight: 500; }

    .branch-tag, .keywords-tag, .translated-tag {
      font-size: 12px; color: #71717a; padding: 3px 8px;
      border-radius: 5px; background: rgba(255,255,255,0.03);
    }

    .empty-state {
      text-align: center; padding: 60px 20px; color: #71717a;
      background: rgba(255,255,255,0.02); border-radius: 12px;
      border: 1px solid rgba(255,255,255,0.05);
    }
    .empty-icon { font-size: 48px; display: block; margin-bottom: 12px; }
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
  private readonly POLL_INTERVAL = 30000; // 30 seconds

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
    return '⭐'.repeat(stars);
  }

  formatTime(date: string): string {
    if (!date) return '';
    return new Date(date).toLocaleString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }
}
