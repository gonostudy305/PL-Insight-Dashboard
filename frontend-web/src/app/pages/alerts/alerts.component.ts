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
          <h2 class="page-title">🚨 Smart Alert System</h2>
          <p class="page-subtitle">Cảnh báo thông minh & quản lý vòng đời xử lý</p>
        </div>
        <button class="scan-btn" (click)="runTriggerScan()" [disabled]="scanning">
          {{ scanning ? '⏳ Scanning...' : '🔍 Trigger Scan' }}
        </button>
      </div>

      <!-- Scan Result Banner -->
      <div class="scan-banner" *ngIf="scanResult">
        <span>✅ Tạo mới: <strong>{{ scanResult.created }}</strong></span>
        <span>⏭️ Bỏ qua (cooldown): {{ scanResult.skipped }}</span>
        <button class="close-banner" (click)="scanResult = null">✕</button>
      </div>

      <!-- Tabs -->
      <div class="tabs">
        <button class="tab" [class.active]="activeTab === 'queue'" (click)="activeTab = 'queue'">
          📋 Hàng đợi ưu tiên
        </button>
        <button class="tab" [class.active]="activeTab === 'history'" (click)="activeTab = 'history'; loadHistory()">
          📜 Lịch sử cảnh báo
          <span class="tab-badge" *ngIf="statusCounts.new > 0">{{ statusCounts.new }}</span>
        </button>
      </div>

      <!-- Tab: Queue -->
      <div *ngIf="activeTab === 'queue'">
        <!-- Alert Summary -->
        <div class="alert-summary">
          <div class="summary-item high">
            <span class="summary-count">{{ summary.high }}</span>
            <span class="summary-label">🔴 Nghiêm trọng</span>
          </div>
          <div class="summary-item standard">
            <span class="summary-count">{{ summary.standard }}</span>
            <span class="summary-label">🟡 Tiêu chuẩn</span>
          </div>
          <div class="summary-item monitoring">
            <span class="summary-count">{{ summary.monitoring }}</span>
            <span class="summary-label">🔵 Theo dõi</span>
          </div>
        </div>

        <!-- Alert List -->
        <div class="alert-list">
          @for (alert of alerts; track alert.reviewId) {
            <div class="alert-card" [class]="'priority-' + alert.priorityLevel">
              <div class="alert-priority-bar"></div>
              <div class="alert-body">
                <div class="alert-header">
                  <span class="priority-badge">{{ alert.priorityLabel }}</span>
                  <span class="alert-stars">
                    @for (s of getStarsArray(alert.stars); track s) { ⭐ }
                  </span>
                  <span class="alert-branch">📍 {{ alert.branchAddress }}</span>
                </div>
                <p class="alert-text">{{ alert.text }}</p>
                <div class="alert-tags">
                  @for (factor of alert.riskFactors; track factor) {
                    <span class="risk-tag">{{ factor }}</span>
                  }
                </div>
                <div class="alert-meta">
                  <span>🕐 {{ alert.session }}</span>
                  <span>📝 {{ alert.textLengthGroup }}</span>
                </div>
              </div>
            </div>
          }
        </div>
      </div>

      <!-- Tab: History -->
      <div *ngIf="activeTab === 'history'">
        <!-- Status Filter -->
        <div class="filter-row">
          <select [(ngModel)]="historyFilter" (change)="loadHistory()">
            <option value="">Tất cả trạng thái</option>
            <option value="new">🔴 Mới</option>
            <option value="acknowledged">🟡 Đã xác nhận</option>
            <option value="resolved">🟢 Đã xử lý</option>
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
                  <div class="history-branch">📍 {{ h.branchAddress }}</div>
                  <div class="history-rule">{{ h.triggerRule }} — {{ h.triggerCount }} reviews</div>
                  <div class="history-time">{{ formatTime(h.createdAt) }}</div>
                  <div class="history-timeline" *ngIf="h.acknowledgedAt || h.resolvedAt">
                    <span *ngIf="h.acknowledgedAt">✅ Xác nhận: {{ formatTime(h.acknowledgedAt) }}</span>
                    <span *ngIf="h.resolvedAt">🏁 Hoàn tất: {{ formatTime(h.resolvedAt) }}</span>
                  </div>
                </div>
              </div>
              <div class="history-actions">
                <button class="action-btn ack-btn"
                  *ngIf="h.status === 'new'"
                  (click)="updateStatus(h.alertId, 'acknowledged')">
                  ✅ Xác nhận
                </button>
                <button class="action-btn resolve-btn"
                  *ngIf="h.status === 'acknowledged'"
                  (click)="updateStatus(h.alertId, 'resolved')">
                  🏁 Hoàn tất
                </button>
                <span class="status-label" *ngIf="h.status === 'resolved'">✔ Đã xử lý</span>
              </div>
            </div>
          }
        </div>
        <ng-template #noHistory>
          <div class="empty-state">
            <span class="empty-icon">📜</span>
            <p>Chưa có cảnh báo nào.</p>
            <p>Bấm <strong>Trigger Scan</strong> để quét cảnh báo mới.</p>
          </div>
        </ng-template>
      </div>
    </div>
  `,
  styles: [`
    .alerts-page { max-width: 1000px; }

    .header-row {
      display: flex; justify-content: space-between; align-items: flex-start;
      margin-bottom: 20px;
    }
    .page-title {
      font-size: 28px; font-weight: 700;
      background: linear-gradient(135deg, #f4f4f5, #a1a1aa);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    }
    .page-subtitle { color: #71717a; font-size: 14px; margin-top: 4px; }

    .scan-btn {
      padding: 10px 20px; border-radius: 10px; border: none;
      background: linear-gradient(135deg, #f59e0b, #d97706);
      color: white; font-size: 14px; font-weight: 600; cursor: pointer;
      transition: all 0.2s;
    }
    .scan-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 16px rgba(245,158,11,0.3); }
    .scan-btn:disabled { opacity: 0.6; cursor: not-allowed; }

    .scan-banner {
      display: flex; align-items: center; gap: 20px;
      padding: 12px 20px; border-radius: 10px; margin-bottom: 16px;
      background: rgba(245,158,11,0.08); border: 1px solid rgba(245,158,11,0.2);
      color: #d4d4d8; font-size: 13px;
    }
    .close-banner { margin-left: auto; background: none; border: none; color: #71717a; cursor: pointer; font-size: 16px; }

    /* Tabs */
    .tabs {
      display: flex; gap: 4px; margin-bottom: 20px;
      border-bottom: 1px solid rgba(255,255,255,0.06); padding-bottom: 0;
    }
    .tab {
      padding: 10px 20px; border: none; background: transparent;
      color: #71717a; font-size: 14px; font-weight: 500; cursor: pointer;
      border-bottom: 2px solid transparent; transition: all 0.2s;
      display: flex; align-items: center; gap: 8px;
    }
    .tab:hover { color: #d4d4d8; }
    .tab.active { color: #f59e0b; border-bottom-color: #f59e0b; }
    .tab-badge {
      background: #ef4444; color: white; font-size: 11px; font-weight: 700;
      padding: 2px 6px; border-radius: 10px; min-width: 18px; text-align: center;
    }

    /* Queue Tab */
    .alert-summary {
      display: grid; grid-template-columns: repeat(3, 1fr);
      gap: 16px; margin-bottom: 20px;
    }
    .summary-item {
      text-align: center; padding: 18px; border-radius: 12px;
      background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06);
    }
    .summary-item.high { border-bottom: 3px solid #ef4444; }
    .summary-item.standard { border-bottom: 3px solid #f59e0b; }
    .summary-item.monitoring { border-bottom: 3px solid #3b82f6; }
    .summary-count { font-size: 30px; font-weight: 700; display: block; color: #f4f4f5; }
    .summary-label { font-size: 12px; color: #71717a; }

    .alert-card {
      display: flex; margin-bottom: 10px; border-radius: 12px; overflow: hidden;
      background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05);
      transition: transform 0.15s;
    }
    .alert-card:hover { transform: translateX(4px); }
    .alert-priority-bar { width: 4px; flex-shrink: 0; }
    .priority-1 .alert-priority-bar { background: #ef4444; }
    .priority-2 .alert-priority-bar { background: #f59e0b; }
    .priority-3 .alert-priority-bar { background: #3b82f6; }
    .alert-body { padding: 14px 18px; flex: 1; }
    .alert-header { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; flex-wrap: wrap; }
    .priority-badge { padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }
    .priority-1 .priority-badge { background: rgba(239,68,68,0.15); color: #ef4444; }
    .priority-2 .priority-badge { background: rgba(245,158,11,0.15); color: #f59e0b; }
    .priority-3 .priority-badge { background: rgba(59,130,246,0.15); color: #3b82f6; }
    .alert-branch { font-size: 12px; color: #71717a; }
    .alert-text { font-size: 13px; color: #d4d4d8; line-height: 1.5; margin-bottom: 8px; max-height: 60px; overflow: hidden; }
    .alert-tags { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 6px; }
    .risk-tag { background: rgba(239,68,68,0.08); color: #fca5a5; padding: 2px 8px; border-radius: 6px; font-size: 11px; }
    .alert-meta { display: flex; gap: 16px; font-size: 12px; color: #52525b; }

    /* History Tab */
    .filter-row { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
    .filter-row select {
      padding: 8px 14px; border-radius: 8px; font-size: 13px;
      background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
      color: #d4d4d8; cursor: pointer;
    }
    .status-summary { display: flex; gap: 8px; margin-left: auto; }
    .mini-badge { padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 500; }
    .new-bg { background: rgba(239,68,68,0.1); color: #ef4444; }
    .ack-bg { background: rgba(245,158,11,0.1); color: #f59e0b; }
    .res-bg { background: rgba(34,197,94,0.1); color: #22c55e; }

    .history-list { display: flex; flex-direction: column; gap: 10px; }
    .history-card {
      display: flex; justify-content: space-between; align-items: center;
      padding: 16px 20px; border-radius: 12px;
      background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05);
      transition: transform 0.15s;
    }
    .history-card:hover { transform: translateX(2px); }
    .status-new { border-left: 3px solid #ef4444; }
    .status-acknowledged { border-left: 3px solid #f59e0b; }
    .status-resolved { border-left: 3px solid #22c55e; }

    .history-left { display: flex; gap: 12px; align-items: flex-start; }
    .status-dot { width: 10px; height: 10px; border-radius: 50%; margin-top: 5px; flex-shrink: 0; }
    .dot-new { background: #ef4444; }
    .dot-ack { background: #f59e0b; }
    .dot-res { background: #22c55e; }

    .history-branch { font-size: 14px; font-weight: 500; color: #e4e4e7; margin-bottom: 3px; }
    .history-rule { font-size: 12px; color: #a1a1aa; margin-bottom: 3px; }
    .history-time { font-size: 12px; color: #52525b; }
    .history-timeline { font-size: 11px; color: #71717a; margin-top: 4px; display: flex; gap: 12px; }

    .history-actions { display: flex; gap: 8px; align-items: center; }
    .action-btn {
      padding: 6px 14px; border-radius: 8px; border: none; font-size: 12px;
      font-weight: 600; cursor: pointer; transition: all 0.2s;
    }
    .ack-btn { background: rgba(245,158,11,0.15); color: #f59e0b; }
    .ack-btn:hover { background: rgba(245,158,11,0.25); }
    .resolve-btn { background: rgba(34,197,94,0.15); color: #22c55e; }
    .resolve-btn:hover { background: rgba(34,197,94,0.25); }
    .status-label { font-size: 12px; color: #22c55e; font-weight: 500; }

    .empty-state {
      text-align: center; padding: 50px 20px; color: #71717a;
      background: rgba(255,255,255,0.02); border-radius: 12px;
      border: 1px solid rgba(255,255,255,0.05);
    }
    .empty-icon { font-size: 40px; display: block; margin-bottom: 10px; }
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
