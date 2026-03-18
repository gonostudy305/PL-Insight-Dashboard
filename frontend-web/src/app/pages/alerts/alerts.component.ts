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
        <div class="header-actions">
          <div class="telegram-status" [class.connected]="telegramConnected">
            <span class="tg-dot"></span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/></svg>
            {{ telegramConnected ? 'Telegram Connected' : 'Telegram N/A' }}
            <button class="tg-test-btn" *ngIf="telegramConnected" (click)="testTelegram()" [disabled]="testingTelegram" title="Gửi thông báo test">
              {{ testingTelegram ? '...' : 'Test' }}
            </button>
          </div>
          <button class="scan-btn" (click)="runTriggerScan()" [disabled]="scanning">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" x2="16.65" y1="21" y2="16.65"/></svg>
            {{ scanning ? 'Scanning...' : 'Trigger Scan' }}
          </button>
        </div>
      </div>

      <!-- Result Banners -->
      <div class="scan-banner" *ngIf="scanResult">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        <span>Tạo mới: <strong>{{ scanResult.created }}</strong></span>
        <span>Bỏ qua (cooldown): {{ scanResult.skipped }}</span>
        <span *ngIf="scanResult.alerts?.length > 0" class="notif-sent">📩 Đã gửi {{ scanResult.alerts.length }} alert qua Telegram</span>
        <button class="close-banner" (click)="scanResult = null">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>
        </button>
      </div>
      <div class="scan-banner tg-banner" *ngIf="telegramTestResult">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/></svg>
        <span>{{ telegramTestResult.success ? '✅ Test alert gửi thành công!' : '❌ Gửi thất bại: ' + (telegramTestResult.error || 'Unknown') }}</span>
        <button class="close-banner" (click)="telegramTestResult = null">
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
      <div *ngIf="activeTab === 'queue'" class="manager-dashboard">
        <div class="dashboard-header">
          <h1>CẢNH BÁO HÔM NAY ({{alerts.length}})</h1>
        </div>
        
        <div class="alert-table" *ngIf="alerts.length > 0; else noQueue">
          <div class="table-header">
            <span>Cửa hàng / Vị trí</span>
            <span>Mức độ / Đánh giá</span>
            <span>Nội dung phản ánh</span>
            <span>Thao tác xử lý</span>
          </div>
          
          @for (alert of alerts; track alert.reviewId; let i = $index) {
            <div class="table-row" [class.critical]="alert.priorityLevel === 1" [class.warning]="alert.priorityLevel === 2" [class.info]="alert.priorityLevel === 3">
              <span class="branch-name">{{ alert.branchAddress }}</span>
              <span class="trend" [class.up]="alert.priorityLevel === 1" [class.down]="alert.priorityLevel === 2">
                {{ alert.priorityLabel }} (★ {{ alert.stars }})
              </span>
              <span class="reason">
                <div class="alert-msg">{{ alert.text }}</div>
                <div class="risk-tags">
                  @for (factor of alert.riskFactors; track factor) {
                    <span class="risk-badge">#{{ factor }}</span>
                  }
                </div>
              </span>
              <span class="actions-cell">
                  <button class="btn-pro primary" (click)="openSuggestion(alert)">Gợi ý</button>
                  <button class="btn-pro outline" (click)="updateStatus(alert.alertId, 'acknowledged')">Xác nhận</button>
              </span>
            </div>
          }
        </div>
        <ng-template #noQueue>
          <div class="empty-state-pro" style="margin-top: 20px;">
            <div class="empty-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            </div>
            <div class="empty-text">Hệ thống đang ổn định</div>
            <div class="empty-subtext">Không có cảnh báo rủi ro cao nào cần xử lý lúc này.</div>
          </div>
        </ng-template>
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
          <div class="empty-state-pro">
            <div class="empty-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/></svg>
            </div>
            <div class="empty-text">Chưa có dữ liệu lịch sử</div>
            <div class="empty-subtext">Bấm <strong>Trigger Scan</strong> để cập nhật dữ liệu từ hệ thống.</div>
          </div>
        </ng-template>
      </div>

      <!-- Suggestion Modal -->
      <div class="modal-backdrop" *ngIf="suggestionModal" (click)="suggestionModal = null"></div>
      <div class="suggestion-modal" *ngIf="suggestionModal">
        <div class="modal-header">
          <h3>Gợi ý phản hồi khách hàng</h3>
          <button class="close-modal" (click)="suggestionModal = null">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>
          </button>
        </div>
        <div class="modal-review">
          <div class="review-label">Nội dung review:</div>
          <p class="review-text">{{ suggestionModal.reviewText }}</p>
          <div class="review-cats">
            <span class="cat-tag" *ngFor="let c of suggestionModal.categories">{{ c }}</span>
          </div>
        </div>
        <div class="suggestion-loading" *ngIf="suggestionLoading">Đang tạo gợi ý...</div>
        <div class="suggestion-list" *ngIf="!suggestionLoading">
          <div class="suggestion-item" *ngFor="let s of suggestionModal.suggestions; let i = index">
            <div class="suggestion-header">
              <span class="suggestion-num">#{{ i + 1 }}</span>
              <span class="suggestion-cat">{{ s.category }}</span>
              <button class="copy-btn" (click)="copySuggestion(s.text, i)">
                {{ copiedIndex === i ? '✓ Đã copy' : 'Copy' }}
              </button>
            </div>
            <p class="suggestion-text">{{ s.text }}</p>
          </div>
        </div>
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

    .header-actions {
      display: flex;
      align-items: center;
      gap: var(--space-4);
    }

    .telegram-status {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      border-radius: var(--radius-md);
      font-size: 12px;
      font-weight: 600;
      color: var(--color-text-muted);
      background: var(--color-bg);
      border: 1px solid var(--color-border);
    }

    .telegram-status.connected {
      color: #059669;
      background: #ecfdf5;
      border-color: rgba(5, 150, 105, 0.2);
    }

    .tg-dot {
      width: 8px; height: 8px;
      border-radius: 50%;
      background: #d1d5db;
    }

    .telegram-status.connected .tg-dot {
      background: #10b981;
      animation: pulse 2s infinite;
    }

    .tg-test-btn {
      margin-left: 4px;
      padding: 2px 10px;
      border-radius: var(--radius-sm);
      border: 1px solid rgba(5, 150, 105, 0.3);
      background: white;
      color: #059669;
      font-size: 11px;
      font-weight: 700;
      cursor: pointer;
      transition: all var(--transition-fast);
    }

    .tg-test-btn:hover:not(:disabled) { background: #ecfdf5; }
    .tg-test-btn:disabled { opacity: 0.6; cursor: not-allowed; }

    .tg-banner {
      background: #eff6ff !important;
      border-color: rgba(59, 130, 246, 0.2) !important;
    }

    .notif-sent {
      color: var(--color-primary);
      font-weight: 600;
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

    .empty-state-pro {
      padding: 3rem 1rem;
      text-align: center;
      color: #555;
      background: #F9F9F9;
      border: 1px dashed #CCC;
      border-radius: 4px; /* Vuông vức */
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    
    .empty-state-pro .empty-icon {
      margin-bottom: 1rem;
      opacity: 0.6;
      color: #666;
    }
    
    .empty-state-pro .empty-text {
      font-size: 1.1rem;
      font-weight: 600;
      color: #333;
    }
    
    .empty-state-pro .empty-subtext {
      font-size: 0.9rem;
      margin-top: 0.5rem;
      color: #888;
    }

    /* Suggest Button */
    .suggest-btn {
      display: flex; align-items: center; gap: 4px;
      padding: 3px 10px; border-radius: var(--radius-sm);
      border: 1px solid var(--color-primary); background: transparent;
      color: var(--color-primary); font-size: 11px; font-weight: 600;
      cursor: pointer; transition: all var(--transition-fast);
      margin-left: auto;
    }
    .suggest-btn:hover { background: var(--color-primary); color: white; }

    /* Modal */
    .modal-backdrop {
      position: fixed; inset: 0; background: rgba(0,0,0,0.5);
      z-index: 100; backdrop-filter: blur(2px);
    }
    .suggestion-modal {
      position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
      background: white; border-radius: var(--radius-lg);
      box-shadow: 0 25px 50px rgba(0,0,0,0.25);
      padding: 24px; width: 560px; max-width: 90vw;
      max-height: 80vh; overflow-y: auto; z-index: 101;
    }
    .modal-header {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 16px; padding-bottom: 12px;
      border-bottom: 1px solid var(--color-border);
    }
    .modal-header h3 { font-size: 16px; font-weight: 700; color: var(--color-text); }
    .close-modal {
      background: none; border: none; color: var(--color-text-muted);
      cursor: pointer; padding: 4px; border-radius: 4px;
    }
    .close-modal:hover { color: var(--color-text); background: var(--color-bg); }

    .modal-review { margin-bottom: 16px; }
    .review-label { font-size: 11px; font-weight: 700; color: var(--color-text-muted); text-transform: uppercase; margin-bottom: 6px; }
    .review-text { font-size: 13px; color: var(--color-text); line-height: 1.6; background: var(--color-bg); padding: 12px; border-radius: var(--radius-md); }
    .review-cats { display: flex; gap: 6px; margin-top: 8px; }
    .cat-tag { padding: 2px 10px; border-radius: var(--radius-full); background: #ecfdf5; color: #059669; font-size: 11px; font-weight: 700; }

    .suggestion-loading { text-align: center; padding: 24px; color: var(--color-text-muted); font-size: 13px; }
    .suggestion-list { display: flex; flex-direction: column; gap: 12px; }
    .suggestion-item {
      border: 1px solid var(--color-border); border-radius: var(--radius-md);
      padding: 12px; transition: border-color var(--transition-fast);
    }
    .suggestion-item:hover { border-color: var(--color-primary); }
    .suggestion-header { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
    .suggestion-num { font-size: 11px; font-weight: 800; color: var(--color-primary); }
    .suggestion-cat { font-size: 11px; color: var(--color-text-muted); font-weight: 600; }
    .copy-btn {
      margin-left: auto; padding: 3px 12px;
      border: 1px solid var(--color-border); background: white;
      border-radius: var(--radius-sm); font-size: 11px;
      font-weight: 600; cursor: pointer; transition: all var(--transition-fast);
      color: var(--color-text-secondary);
    }
    .copy-btn:hover { border-color: var(--color-primary); color: var(--color-primary); }
    .suggestion-text { font-size: 13px; color: var(--color-text); line-height: 1.6; }

    /* ─── Manager Pro Alerts ─── */
    .manager-dashboard {
      background: var(--pl-bg-pro);
      border: 1px solid var(--color-border);
      padding: var(--spacing-grid);
      border-radius: var(--border-radius-pro);
      box-shadow: var(--shadow-sm);
    }

    .dashboard-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--spacing-grid);
    }

    .dashboard-header h1 {
      font-family: var(--font-pro);
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--pl-dark-green);
      margin: 0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .table-header, .table-row {
      display: grid;
      grid-template-columns: 2fr 1.5fr 3fr 1.5fr;
      gap: var(--spacing-grid);
      padding: 1rem;
      border-bottom: 1px solid var(--color-border);
    }

    .table-header {
      background: var(--pl-card-bg);
      font-weight: var(--font-bold);
      color: #666;
      text-transform: uppercase;
      font-size: 0.85rem;
      border: 1px solid var(--color-border);
      border-radius: 4px 4px 0 0;
    }

    .table-row {
      background: var(--pl-card-bg);
      transition: var(--transition-pro);
      align-items: start;
      border-left: 1px solid var(--color-border);
      border-right: 1px solid var(--color-border);
    }
    
    .table-row:last-child {
      border-radius: 0 0 4px 4px;
    }

    .table-row:hover {
      background: #F9F9F9;
      box-shadow: var(--shadow-pro);
      z-index: 10;
      position: relative;
    }

    .table-row.critical { border-left: 4px solid var(--pl-alert-red); }
    .table-row.warning { border-left: 4px solid var(--pl-warning-orange); }
    .table-row.info { border-left: 4px solid var(--color-info); }

    .branch-name { font-weight: 600; color: var(--color-text); font-size: 0.95rem; }
    .trend {
      font-weight: 600;
      font-size: 0.9rem;
    }
    .trend.up { color: var(--pl-alert-red); }
    .trend.down { color: var(--pl-warning-orange); }

    .reason { display: flex; flex-direction: column; gap: 8px; }
    .alert-msg { font-size: 0.9rem; color: var(--color-text-secondary); line-height: 1.5; }

    .risk-tags { display: flex; gap: 6px; flex-wrap: wrap; }
    .risk-badge { 
      font-size: 0.75rem; 
      background: var(--color-bg); 
      padding: 3px 8px; 
      border-radius: 4px; 
      border: 1px solid var(--color-border); 
      color: var(--color-text-secondary);
      font-weight: 600;
    }

    .actions-cell {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .btn-pro {
      font-family: var(--font-pro);
      font-weight: 600;
      padding: 6px 12px;
      border-radius: 4px;
      font-size: 0.85rem;
      cursor: pointer;
      transition: var(--transition-pro);
      text-align: center;
    }

    .btn-pro.primary {
      background: var(--pl-dark-green);
      color: white;
      border: 1px solid var(--pl-dark-green);
    }
    .btn-pro.primary:hover { background: #1F3D1C; border-color: #1F3D1C; }

    .btn-pro.outline {
      background: transparent;
      color: var(--color-text-secondary);
      border: 1px solid var(--color-border);
    }
    .btn-pro.outline:hover { background: var(--color-bg); }
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
  telegramConnected = false;
  testingTelegram = false;
  telegramTestResult: any = null;
  suggestionModal: any = null;
  suggestionLoading = false;
  copiedIndex: number | null = null;

  constructor(private api: ApiService) { }

  ngOnInit() {
    this.loadQueue();
    this.loadHistory();
    this.checkTelegram();
  }

  checkTelegram() {
    this.api.getTelegramStatus().subscribe({
      next: data => this.telegramConnected = data.configured,
      error: () => this.telegramConnected = false,
    });
  }

  testTelegram() {
    this.testingTelegram = true;
    this.telegramTestResult = null;
    this.api.testTelegramNotify().subscribe({
      next: result => {
        this.telegramTestResult = result;
        this.testingTelegram = false;
      },
      error: err => {
        this.telegramTestResult = { success: false, error: err.message };
        this.testingTelegram = false;
      },
    });
  }

  openSuggestion(alert: any) {
    this.suggestionModal = { reviewText: alert.text, categories: [], suggestions: [] };
    this.suggestionLoading = true;
    this.copiedIndex = null;
    const reviewId = alert.reviewId || alert.alertId;
    this.api.getSuggestions(reviewId).subscribe({
      next: data => {
        this.suggestionModal = data;
        this.suggestionLoading = false;
      },
      error: () => {
        this.suggestionModal.suggestions = [{ category: 'Chung', text: 'Phúc Long cảm ơn bạn đã dành thời gian chia sẻ trải nghiệm. Chúng tôi ghi nhận và sẽ cải thiện dịch vụ để phục vụ bạn tốt hơn.' }];
        this.suggestionModal.categories = ['Chung'];
        this.suggestionLoading = false;
      },
    });
  }

  copySuggestion(text: string, index: number) {
    navigator.clipboard.writeText(text);
    this.copiedIndex = index;
    setTimeout(() => this.copiedIndex = null, 2000);
  }

  loadQueue() {
    this.api.getAlerts(50).subscribe({
      next: (data: any) => {
        this.alerts = data.data || [];
        this.summary = data.summary || this.summary;
      },
      error: (err: any) => console.error('Queue load error:', err),
    });
  }

  loadHistory() {
    const params: any = {};
    if (this.historyFilter) params.status = this.historyFilter;
    this.api.getAlertHistory(params).subscribe({
      next: (data: any) => {
        this.historyAlerts = data.data || [];
        this.statusCounts = data.statusCounts || this.statusCounts;
      },
      error: (err: any) => console.error('History load error:', err),
    });
  }

  runTriggerScan() {
    this.scanning = true;
    this.api.runAlertScan().subscribe({
      next: (result: any) => {
        this.scanResult = result;
        this.scanning = false;
        this.loadHistory();
      },
      error: (err: any) => {
        console.error('Scan error:', err);
        this.scanning = false;
      },
    });
  }

  updateStatus(alertId: string, status: string) {
    this.api.updateAlertStatus(alertId, status).subscribe({
      next: () => this.loadHistory(),
      error: (err: any) => console.error('Status update error:', err),
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

