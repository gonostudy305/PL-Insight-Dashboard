import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-live-monitor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="kv-wrapper">
      <!-- TOP ACTION BAR -->
      <div class="kv-header-row">
        <div class="kv-title-area">
          <h2>Live Monitor</h2>
        </div>
        <div class="kv-top-actions">
          <div class="search-wrap">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" x2="16.65" y1="21" y2="16.65"/></svg>
            <input type="text" placeholder="Theo chi nhánh, nội dung, từ khóa">
          </div>
          <button class="btn-primary" (click)="runScan()" [disabled]="scanning">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
            {{ scanning ? 'Đang phân tích...' : 'Scan Now' }}
          </button>
          <span class="live-pill" [class.active]="pollingActive">
            <span class="pulse-dot" *ngIf="pollingActive"></span>
            {{ pollingActive ? 'Live' : 'Paused' }}
          </span>
          <button class="btn-outline">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Xuất file
          </button>
          <div class="settings-icons">
            <button class="icon-btn"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg></button>
            <button class="icon-btn"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg></button>
          </div>
        </div>
      </div>

      <div class="kv-body-row">
        <!-- SIDEBAR -->
        <div class="kv-sidebar">
          <div class="filter-box">
            <div class="filter-title">Cảm xúc AI <a class="filter-link">Tạo mới</a></div>
            <div class="filter-content">
              <label class="radio-label" [class.active]="filterSentiment === ''">
                <input type="radio" name="sent" [checked]="filterSentiment === ''" (change)="filterSentiment = ''; loadRecent()"> Tất cả
              </label>
              <label class="radio-label" [class.active]="filterSentiment === 'positive'">
                <input type="radio" name="sent" [checked]="filterSentiment === 'positive'" (change)="filterSentiment = 'positive'; loadRecent()"> Tích cực
              </label>
              <label class="radio-label" [class.active]="filterSentiment === 'negative'">
                <input type="radio" name="sent" [checked]="filterSentiment === 'negative'" (change)="filterSentiment = 'negative'; loadRecent()"> Tiêu cực
              </label>
              <label class="radio-label" [class.active]="filterSentiment === 'mixed'">
                <input type="radio" name="sent" [checked]="filterSentiment === 'mixed'" (change)="filterSentiment = 'mixed'; loadRecent()"> Hỗn hợp
              </label>
            </div>
          </div>

          <div class="filter-box">
            <div class="filter-title">Chi nhánh</div>
            <div class="filter-search">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" x2="16.65" y1="21" y2="16.65"/></svg>
              <input type="text" placeholder="Tìm chi nhánh">
            </div>
            <div class="filter-content">
              <label class="radio-label" [class.active]="filterBranch === ''">
                <input type="radio" name="br" [checked]="filterBranch === ''" (change)="filterBranch = ''; loadRecent()"> Toàn hệ thống
              </label>
              <label class="radio-label" *ngFor="let b of branches" [class.active]="filterBranch === b.placeId">
                <input type="radio" name="br" [checked]="filterBranch === b.placeId" (change)="filterBranch = b.placeId; loadRecent()"> {{ b.branchAddress }}
              </label>
            </div>
          </div>

          <div class="filter-box sidebar-stats">
            <div class="filter-title">Trạng thái Live</div>
            <div class="filter-content">
              <div class="stat-row">
                <span class="stat-label">Tổng review phân tích</span>
                <span class="stat-value">{{ total }}</span>
              </div>
              <div class="stat-row">
                <span class="stat-label">Polling</span>
                <span class="stat-value" [class.live]="pollingActive">{{ pollingActive ? '30s' : 'OFF' }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- DATA TABLE -->
        <div class="kv-table-area">
          <!-- Scan Result Banner -->
          <div class="table-banner" *ngIf="lastScanResult">
            ✅ Đã phân tích: {{lastScanResult.analyzed}} | Lỗi: {{lastScanResult.failed || 0}} | Còn lại: {{lastScanResult.remaining || 0}}
            <button class="close-btn" (click)="lastScanResult = null">×</button>
          </div>

          <table class="kv-table">
            <thead>
              <tr>
                <th class="col-chk"><input type="checkbox"></th>
                <th class="col-star">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                </th>
                <th class="col-id">Mã</th>
                <th class="col-sentiment" title="Phân loại cảm xúc bởi PhoBERT AI">Cảm xúc (AI)<sup class="hint-q">?</sup></th>
                <th class="col-stars-h">Sao</th>
                <th class="col-branch">Chi nhánh</th>
                <th class="col-text">Nội dung</th>
                <th class="col-conf">Tin cậy</th>
                <th class="col-kw">Keywords</th>
                <th class="col-time">Thời gian</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let review of reviews; let i = index"
                  [class.row-positive]="review.aiSentimentSummary === 'Positive'"
                  [class.row-negative]="review.aiSentimentSummary === 'Negative'"
                  [class.row-mixed]="review.aiSentimentSummary === 'Mixed'">
                <td class="col-chk"><input type="checkbox"></td>
                <td class="col-star"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg></td>
                <td class="col-id"><span class="link">LV-{{i + 1}}</span></td>
                <td class="col-sentiment">
                  <span class="st-badge"
                    [class.positive]="review.aiSentimentSummary === 'Positive'"
                    [class.negative]="review.aiSentimentSummary === 'Negative'"
                    [class.mixed]="review.aiSentimentSummary === 'Mixed'">
                    {{ review.aiSentimentSummary === 'Positive' ? 'Tích cực' :
                       review.aiSentimentSummary === 'Negative' ? 'Tiêu cực' : 'Hỗn hợp' }}
                  </span>
                </td>
                <td class="col-stars-h">
                  <span class="stars-inline">
                    <svg *ngFor="let s of getStarsArray(review.stars)" width="12" height="12" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" stroke-width="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                  </span>
                </td>
                <td class="col-branch">{{ review.branchAddress }}</td>
                <td class="col-text">
                  <div class="tbl-text">{{ review.text }}</div>
                </td>
                <td class="col-conf">
                  <span class="conf-badge"
                    [class.high]="review.confidenceAvg >= 0.8"
                    [class.mid]="review.confidenceAvg >= 0.5 && review.confidenceAvg < 0.8"
                    [class.low]="review.confidenceAvg < 0.5">
                    {{ (review.confidenceAvg * 100).toFixed(0) }}%
                  </span>
                </td>
                <td class="col-kw">
                  <span class="kw-tag" *ngFor="let k of review.keywords?.slice(0, 3)">{{k}}</span>
                </td>
                <td class="col-time">{{ formatTime(review.analyzedAt) }}</td>
              </tr>
              <tr *ngIf="reviews.length === 0" class="empty-tr">
                <td colspan="10">Chưa có review nào được phân tích AI. Bấm <strong>Scan Now</strong> để bắt đầu.</td>
              </tr>
            </tbody>
          </table>

          <div class="table-pager">
            <div class="pager-info">Hiển thị {{ reviews.length }} / {{ total }} nhận xét đã phân tích</div>
            <div class="pager-btns">
              <button disabled>&lt;</button>
              <button class="active">1</button>
              <button disabled>&gt;</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* ─── KV SYSTEM LAYOUT ─── */
    .kv-wrapper {
      background: #f4f5f7;
      min-height: calc(100vh - 52px);
      display: flex;
      flex-direction: column;
      font-family: Arial, Helvetica, sans-serif;
    }

    /* TOP BAR */
    .kv-header-row {
      display: flex; padding: 12px 16px; gap: 16px;
    }
    .kv-title-area {
      width: 240px; flex-shrink: 0; display: flex; align-items: center;
    }
    .kv-title-area h2 { font-size: 1.15rem; font-weight: 700; color: #333; margin: 0; }

    .kv-top-actions {
      flex: 1; display: flex; align-items: center; gap: 10px;
    }

    .search-wrap {
      flex: 1; max-width: 380px;
      display: flex; align-items: center;
      background: #fff; border: 1px solid #ced4da; border-radius: 4px; padding: 0 10px;
    }
    .search-wrap svg { color: #888; flex-shrink: 0; }
    .search-wrap input { border: none; outline: none; padding: 7px 8px; width: 100%; font-size: 13px; }

    .btn-primary {
      background: #fff; color: #0070f4; border: 1px solid #0070f4; border-radius: 4px;
      padding: 6px 12px; font-size: 13px; font-weight: 600; cursor: pointer;
      display: flex; align-items: center; gap: 6px; transition: 0.2s;
    }
    .btn-primary:hover { background: #f0f7ff; }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

    .btn-outline {
      background: #fff; color: #333; border: 1px solid #ced4da; border-radius: 4px;
      padding: 6px 12px; font-size: 13px; font-weight: 600; cursor: pointer;
      display: flex; align-items: center; gap: 6px;
    }
    .btn-outline:hover { background: #f8f9fa; }

    .live-pill {
      display: flex; align-items: center; gap: 6px;
      padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;
      border: 1px solid #ced4da; color: #888; background: #fff;
    }
    .live-pill.active { color: #059669; border-color: rgba(5,150,105,0.3); background: #ecfdf5; }
    .pulse-dot {
      width: 8px; height: 8px; border-radius: 50%; background: #10b981;
      animation: pulse 2s infinite;
    }
    @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }

    .settings-icons { margin-left: auto; display: flex; gap: 6px; }
    .icon-btn {
      background: #fff; border: 1px solid #ced4da; padding: 5px; border-radius: 4px;
      cursor: pointer; color: #555; display: flex; align-items: center; justify-content: center;
    }
    .icon-btn:hover { background: #f0f0f0; }

    /* BODY ROW */
    .kv-body-row {
      display: flex; flex: 1; padding: 0 16px 16px 16px; gap: 16px; align-items: flex-start;
    }

    /* SIDEBAR — same width/style as /reviews */
    .kv-sidebar {
      width: 240px; flex-shrink: 0; display: flex; flex-direction: column; gap: 12px;
    }
    .filter-box {
      background: #fff; border-radius: 4px; box-shadow: 0 1px 2px rgba(0,0,0,0.04);
      border: 1px solid #e0e4eb;
    }
    .filter-title {
      padding: 10px 12px; font-size: 13px; font-weight: 700; color: #333;
      display: flex; justify-content: space-between; align-items: center;
    }
    .filter-link { font-size: 11px; color: #0070f4; cursor: pointer; font-weight: 400; }
    .filter-search {
      margin: 0 10px 8px 10px; display: flex; align-items: center;
      border: 1px solid #ced4da; border-radius: 3px; padding: 0 6px; background: #f8f9fa;
    }
    .filter-search svg { color: #888; margin-right: 4px; }
    .filter-search input { border: none; background: transparent; padding: 5px 0; width: 100%; font-size: 12px; outline: none; }
    .filter-content {
      padding: 0 12px 12px 12px; display: flex; flex-direction: column; gap: 6px;
      max-height: 220px; overflow-y: auto;
    }
    .radio-label {
      font-size: 13px; color: #444; display: flex; align-items: center; gap: 6px; cursor: pointer;
      padding: 4px 6px; border-radius: 3px; transition: 0.15s;
    }
    .radio-label:hover { background: #f0f4ff; }
    .radio-label.active { color: #0070f4; font-weight: 600; }

    .stat-row { display: flex; justify-content: space-between; font-size: 13px; color: #555; }
    .stat-value { font-weight: 700; color: #333; }
    .stat-value.live { color: #059669; }

    /* TABLE */
    .kv-table-area {
      flex: 1; background: #fff; border-radius: 4px;
      box-shadow: 0 1px 2px rgba(0,0,0,0.04); border: 1px solid #e0e4eb;
      min-width: 0; overflow-x: auto; display: flex; flex-direction: column;
    }

    .table-banner {
      padding: 10px 16px; background: #e6f3ff; border-bottom: 1px solid #b3d7ff;
      font-size: 13px; color: #004085; display: flex; align-items: center; justify-content: space-between;
    }
    .close-btn { background: none; border: none; font-size: 16px; cursor: pointer; color: inherit; opacity: 0.6; }
    .close-btn:hover { opacity: 1; }

    .kv-table { width: 100%; border-collapse: collapse; min-width: 1000px; }
    .kv-table th, .kv-table td {
      padding: 9px 10px; text-align: left; font-size: 13px; border-bottom: 1px solid #f0f0f0;
      white-space: nowrap;
    }
    .kv-table th {
      background: #e9eaec; font-weight: 700; color: #333;
      position: sticky; top: 0; z-index: 5; border-bottom: 1px solid #ccc;
    }
    .kv-table tbody tr { transition: background 0.15s; }
    .kv-table tbody tr:hover { background: #f8fafd; }

    /* Row tinting */
    .row-negative { border-left: 3px solid #dc3545; }
    .row-positive { border-left: 3px solid #28a745; }
    .row-mixed { border-left: 3px solid #ffc107; }

    /* Columns */
    .col-chk, .col-star { width: 32px; text-align: center; }
    .col-id { width: 60px; }
    .col-sentiment { width: 80px; }
    .hint-q { font-size: 9px; color: #999; cursor: help; margin-left: 1px; }
    .col-stars-h { width: 85px; }
    .col-branch { width: 14%; }
    .col-text { width: 30%; white-space: normal !important; }
    .col-conf { width: 65px; text-align: center; }
    .col-kw { width: 15%; white-space: normal !important; }
    .col-time { width: 120px; }

    .link { color: #0070f4; cursor: pointer; font-weight: 500; }
    .link:hover { text-decoration: underline; }

    .st-badge {
      display: inline-block; padding: 2px 8px; border-radius: 12px;
      font-size: 11px; font-weight: 600; white-space: nowrap;
    }
    .st-badge.positive { background: #def7ec; color: #03543f; }
    .st-badge.negative { background: #fde8e8; color: #c81e1e; }
    .st-badge.mixed { background: #fef3c7; color: #92400e; }

    .stars-inline { display: flex; gap: 1px; }

    .tbl-text {
      display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
      overflow: hidden; line-height: 1.45; color: #333;
    }

    .conf-badge {
      display: inline-block; padding: 2px 6px; border-radius: 3px; font-size: 11px; font-weight: 700;
    }
    .conf-badge.high { background: #def7ec; color: #03543f; }
    .conf-badge.mid { background: #fef3c7; color: #92400e; }
    .conf-badge.low { background: #fde8e8; color: #c81e1e; }

    .kw-tag {
      display: inline-block; font-size: 10px; background: #eef2ff; color: #4338ca;
      padding: 1px 5px; border-radius: 2px; margin: 1px 2px;
    }

    .empty-tr td { text-align: center; color: #888; padding: 32px; font-style: italic; }

    /* PAGINATION */
    .table-pager {
      display: flex; justify-content: space-between; align-items: center;
      padding: 10px 16px; border-top: 1px solid #eee; background: #fff;
      border-radius: 0 0 4px 4px; margin-top: auto;
    }
    .pager-info { font-size: 13px; color: #666; }
    .pager-btns { display: flex; gap: 3px; }
    .pager-btns button {
      background: white; border: 1px solid #ced4da; border-radius: 3px;
      padding: 3px 9px; font-size: 13px; cursor: pointer; color: #555;
    }
    .pager-btns button.active { background: #0070f4; color: white; border-color: #0070f4; }
    .pager-btns button:disabled { opacity: 0.4; cursor: not-allowed; }
  `]
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

  getStarsArray(n: number): number[] { return Array(n).fill(0); }

  formatTime(date: string): string {
    if (!date) return '---';
    return new Date(date).toLocaleString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }
}
