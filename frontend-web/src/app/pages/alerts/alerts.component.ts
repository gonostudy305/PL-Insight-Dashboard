import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-alerts',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="alerts-page">
      <div class="header-row">
        <div>
          <h2 class="page-title">Smart Alert System</h2>
          <p class="page-subtitle">Cảnh báo thông minh & quản lý vòng đời xử lý</p>
        </div>
        <button class="scan-btn" (click)="runTriggerScan()" [disabled]="scanning">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" x2="16.65" y1="21" y2="16.65"/></svg>
          {{ scanning ? 'Scanning...' : 'Trigger Scan' }}
        </button>
      </div>

      <!-- Scan Result Banner -->
      <div class="scan-banner" *ngIf="scanResult">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        <span>Tạo mới: <strong>{{ scanResult.created }}</strong></span>
        <span>Bỏ qua (cooldown): {{ scanResult.skipped }}</span>
        <button class="close-banner" (click)="scanResult = null">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>
        </button>
      </div>

      <!-- Tabs -->
      <div class="tabs">
        <button class="tab" [class.active]="activeTab === 'queue'" (click)="activeTab = 'queue'">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M7 7h10"/><path d="M7 12h10"/><path d="M7 17h10"/></svg>
          Hàng đợi ưu tiên
        </button>
        <button class="tab" [class.active]="activeTab === 'history'" (click)="activeTab = 'history'; loadHistory()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg>
          Lịch sử cảnh báo
          <span class="tab-badge" *ngIf="statusCounts.new > 0">{{ statusCounts.new }}</span>
        </button>
      </div>

      <!-- Tab: Queue -->
      <div *ngIf="activeTab === 'queue'">
        <div class="alert-summary">
          <div class="summary-item high">
            <span class="summary-count">{{ summary.high }}</span>
            <span class="summary-label">Nghiêm trọng</span>
          </div>
          <div class="summary-item standard">
            <span class="summary-count">{{ summary.standard }}</span>
            <span class="summary-label">Tiêu chuẩn</span>
          </div>
          <div class="summary-item monitoring">
            <span class="summary-count">{{ summary.monitoring }}</span>
            <span class="summary-label">Theo dõi</span>
          </div>
        </div>

        <div class="alert-list">
          @for (alert of alerts; track alert.reviewId) {
            <div class="alert-card" [class]="'priority-' + alert.priorityLevel">
              <div class="alert-priority-bar"></div>
              <div class="alert-body">
                <div class="alert-header">
                  <span class="priority-badge">{{ alert.priorityLabel }}</span>
                  <span class="alert-stars">
                    @for (s of getStarsArray(alert.stars); track s) {
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="var(--color-accent)" stroke="var(--color-accent)" stroke-width="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                    }
                  </span>
                  <span class="alert-branch">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                    {{ alert.branchAddress }}
                  </span>
                </div>
                <p class="alert-text">{{ alert.text }}</p>
                <div class="alert-tags">
                  @for (factor of alert.riskFactors; track factor) {
                    <span class="risk-tag">{{ factor }}</span>
                  }
                </div>
                <div class="alert-meta">
                  <span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    {{ alert.session }}
                  </span>
                  <span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
                    {{ alert.textLengthGroup }}
                  </span>
                </div>
              </div>
            </div>
          }
        </div>
      </div>

      <!-- Tab: History -->
      <div *ngIf="activeTab === 'history'">
        <div class="filter-row">
          <select [(ngModel)]="historyFilter" (change)="loadHistory()">
            <option value="">Tất cả trạng thái</option>
            <option value="new">Mới</option>
            <option value="acknowledged">Đã xác nhận</option>
            <option value="resolved">Đã xử lý</option>
          </select>
          <div class="status-summary">
            <span class="mini-badge new-bg">{{ statusCounts.new }} mới</span>
            <span class="mini-badge ack-bg">{{ statusCounts.acknowledged }} xác nhận</span>
            <span class="mini-badge res-bg">{{ statusCounts.resolved }} hoàn tất</span>
          </div>
        </div>

        <div class="history-list" *ngIf="historyAlerts.length > 0; else noHistory">
          @for (h of historyAlerts; track h.alertId) {
            <div class="history-card" [class]="'status-' + h.status">
              <div class="history-left">
                <span class="status-dot"
                  [class.dot-new]="h.status === 'new'"
                  [class.dot-ack]="h.status === 'acknowledged'"
                  [class.dot-res]="h.status === 'resolved'">
                </span>
                <div>
                  <div class="history-branch">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                    {{ h.branchAddress }}
                  </div>
                  <div class="history-rule">{{ h.triggerRule }} — {{ h.triggerCount }} reviews</div>
                  <div class="history-time">{{ formatTime(h.createdAt) }}</div>
                  <div class="history-timeline" *ngIf="h.acknowledgedAt || h.resolvedAt">
                    <span *ngIf="h.acknowledgedAt">Xác nhận: {{ formatTime(h.acknowledgedAt) }}</span>
                    <span *ngIf="h.resolvedAt">Hoàn tất: {{ formatTime(h.resolvedAt) }}</span>
                  </div>
                </div>
              </div>
              <div class="history-actions">
                <button class="action-btn ack-btn"
                  *ngIf="h.status === 'new'"
                  (click)="updateStatus(h.alertId, 'acknowledged')">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
                  Xác nhận
                </button>
                <button class="action-btn resolve-btn"
                  *ngIf="h.status === 'acknowledged'"
                  (click)="updateStatus(h.alertId, 'resolved')">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                  Hoàn tất
                </button>
                <span class="status-label" *ngIf="h.status === 'resolved'">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
                  Đã xử lý
                </span>
              </div>
            </div>
          }
        </div>
        <ng-template #noHistory>
          <div class="empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" stroke-width="1.5"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg>
            <p>Chưa có cảnh báo nào.</p>
            <p>Bấm <strong>Trigger Scan</strong> để quét cảnh báo mới.</p>
          </div>
        </ng-template>
      </div>
    </div>
  `,
  styles: [`
    .alerts-page {
      max-width: 1000px;
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

    /* Tabs */
    .tabs {
      display: flex;
      gap: 4px;
      margin-bottom: var(--space-6);
      border-bottom: 2px solid var(--color-border);
    }

    .tab {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: var(--space-3) var(--space-5);
      border: none;
      background: transparent;
      color: var(--color-text-muted);
      font-size: var(--font-size-base);
      font-weight: 500;
      cursor: pointer;
      border-bottom: 2px solid transparent;
      margin-bottom: -2px;
      transition: all var(--transition-base);
    }

    .tab:hover { color: var(--color-text); }

    .tab.active {
      color: var(--color-primary);
      border-bottom-color: var(--color-primary);
      font-weight: 600;
    }

    .tab-badge {
      background: var(--color-danger);
      color: white;
      font-size: 11px;
      font-weight: 700;
      padding: 2px 7px;
      border-radius: var(--radius-full);
      min-width: 18px;
      text-align: center;
    }

    /* Queue Tab */
    .alert-summary {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: var(--space-4);
      margin-bottom: var(--space-6);
    }

    .summary-item {
      text-align: center;
      padding: var(--space-5);
      border-radius: var(--radius-lg);
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      position: relative;
      overflow: hidden;
    }

    .summary-item::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 3px;
    }

    .summary-item.high::after { background: var(--color-danger); }
    .summary-item.standard::after { background: var(--color-warning); }
    .summary-item.monitoring::after { background: var(--color-info); }

    .summary-count {
      font-size: 30px;
      font-weight: 800;
      display: block;
      color: var(--color-text);
    }

    .summary-label {
      font-size: var(--font-size-xs);
      color: var(--color-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .alert-list {
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
    }

    .alert-card {
      display: flex;
      border-radius: var(--radius-lg);
      overflow: hidden;
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      transition: all var(--transition-base);
    }

    .alert-card:hover {
      box-shadow: var(--shadow-md);
      transform: translateX(2px);
    }

    .alert-priority-bar { width: 4px; flex-shrink: 0; }
    .priority-1 .alert-priority-bar { background: var(--color-danger); }
    .priority-2 .alert-priority-bar { background: var(--color-warning); }
    .priority-3 .alert-priority-bar { background: var(--color-info); }

    .alert-body { padding: var(--space-4) var(--space-5); flex: 1; }

    .alert-header {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      margin-bottom: var(--space-2);
      flex-wrap: wrap;
    }

    .priority-badge {
      padding: 3px 10px;
      border-radius: var(--radius-full);
      font-size: 11px;
      font-weight: 600;
    }

    .priority-1 .priority-badge { background: var(--color-danger-bg); color: var(--color-danger); }
    .priority-2 .priority-badge { background: var(--color-warning-bg); color: var(--color-warning); }
    .priority-3 .priority-badge { background: var(--color-info-bg); color: var(--color-info); }

    .alert-stars { display: flex; gap: 1px; }

    .alert-branch {
      font-size: var(--font-size-xs);
      color: var(--color-text-muted);
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .alert-text {
      font-size: var(--font-size-sm);
      color: var(--color-text);
      line-height: 1.6;
      margin-bottom: var(--space-2);
      max-height: 60px;
      overflow: hidden;
    }

    .alert-tags {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
      margin-bottom: var(--space-2);
    }

    .risk-tag {
      background: var(--color-danger-bg);
      color: var(--color-danger);
      padding: 2px 8px;
      border-radius: var(--radius-sm);
      font-size: 11px;
      font-weight: 500;
    }

    .alert-meta {
      display: flex;
      gap: var(--space-4);
      font-size: var(--font-size-xs);
      color: var(--color-text-muted);
    }

    .alert-meta span {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    /* History Tab */
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

    .status-summary { display: flex; gap: 8px; margin-left: auto; }

    .mini-badge {
      padding: 4px 10px;
      border-radius: var(--radius-full);
      font-size: var(--font-size-xs);
      font-weight: 600;
    }

    .new-bg { background: var(--color-danger-bg); color: var(--color-danger); }
    .ack-bg { background: var(--color-warning-bg); color: var(--color-warning); }
    .res-bg { background: var(--color-success-bg); color: var(--color-success); }

    .history-list {
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
    }

    .history-card {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--space-4) var(--space-5);
      border-radius: var(--radius-lg);
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      transition: all var(--transition-base);
    }

    .history-card:hover {
      box-shadow: var(--shadow-sm);
      transform: translateX(2px);
    }

    .status-new { border-left: 3px solid var(--color-danger); }
    .status-acknowledged { border-left: 3px solid var(--color-warning); }
    .status-resolved { border-left: 3px solid var(--color-success); }

    .history-left { display: flex; gap: var(--space-3); align-items: flex-start; }

    .status-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      margin-top: 5px;
      flex-shrink: 0;
    }

    .dot-new { background: var(--color-danger); }
    .dot-ack { background: var(--color-warning); }
    .dot-res { background: var(--color-success); }

    .history-branch {
      font-size: var(--font-size-base);
      font-weight: 600;
      color: var(--color-text);
      margin-bottom: 3px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .history-rule { font-size: var(--font-size-xs); color: var(--color-text-secondary); margin-bottom: 3px; }
    .history-time { font-size: var(--font-size-xs); color: var(--color-text-muted); }

    .history-timeline {
      font-size: 11px;
      color: var(--color-text-muted);
      margin-top: 4px;
      display: flex;
      gap: var(--space-3);
    }

    .history-actions { display: flex; gap: 8px; align-items: center; }

    .action-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 7px 14px;
      border-radius: var(--radius-md);
      border: none;
      font-size: var(--font-size-xs);
      font-weight: 600;
      cursor: pointer;
      transition: all var(--transition-base);
    }

    .ack-btn { background: var(--color-warning-bg); color: var(--color-warning); }
    .ack-btn:hover { background: rgba(217, 119, 6, 0.2); }

    .resolve-btn { background: var(--color-success-bg); color: var(--color-success); }
    .resolve-btn:hover { background: rgba(5, 150, 105, 0.2); }

    .status-label {
      font-size: var(--font-size-xs);
      color: var(--color-success);
      font-weight: 600;
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
export class AlertsComponent implements OnInit {
  alerts: any[] = [];
  historyAlerts: any[] = [];
  summary = { high: 0, standard: 0, monitoring: 0 };
  statusCounts = { new: 0, acknowledged: 0, resolved: 0 };
  activeTab = 'queue';
  historyFilter = '';
  scanning = false;
  scanResult: any = null;

  constructor(private api: ApiService) { }

  ngOnInit() {
    this.loadQueue();
    this.loadHistory();
  }

  loadQueue() {
    this.api.getAlerts(50).subscribe({
      next: data => {
        this.alerts = data.data || [];
        this.summary = data.summary || this.summary;
      },
      error: err => console.error('Queue load error:', err),
    });
  }

  loadHistory() {
    const params: any = {};
    if (this.historyFilter) params.status = this.historyFilter;
    this.api.getAlertHistory(params).subscribe({
      next: data => {
        this.historyAlerts = data.data || [];
        this.statusCounts = data.statusCounts || this.statusCounts;
      },
      error: err => console.error('History load error:', err),
    });
  }

  runTriggerScan() {
    this.scanning = true;
    this.api.runAlertScan().subscribe({
      next: result => {
        this.scanResult = result;
        this.scanning = false;
        this.loadHistory();
      },
      error: err => {
        console.error('Scan error:', err);
        this.scanning = false;
      },
    });
  }

  updateStatus(alertId: string, status: string) {
    this.api.updateAlertStatus(alertId, status).subscribe({
      next: () => this.loadHistory(),
      error: err => console.error('Status update error:', err),
    });
  }

  getStarsArray(n: number): number[] { return Array(n).fill(0); }

  formatTime(date: string): string {
    if (!date) return '';
    return new Date(date).toLocaleString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }
}
