import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-alerts',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="alerts-page">
      <h2 class="page-title">🚨 Prioritized Negative Review Queue</h2>
      <p class="page-subtitle">Các đánh giá tiêu cực được phân loại theo mức độ ưu tiên</p>

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
  `,
  styles: [`
    .alerts-page { max-width: 900px; }
    .page-title { font-size: 24px; font-weight: 700; color: #f4f4f5; }
    .page-subtitle { color: #71717a; font-size: 14px; margin: 4px 0 24px; }

    .alert-summary {
      display: grid; grid-template-columns: repeat(3, 1fr);
      gap: 16px; margin-bottom: 28px;
    }

    .summary-item {
      text-align: center; padding: 20px; border-radius: 12px;
      background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06);
    }
    .summary-item.high { border-bottom: 3px solid #ef4444; }
    .summary-item.standard { border-bottom: 3px solid #f59e0b; }
    .summary-item.monitoring { border-bottom: 3px solid #3b82f6; }

    .summary-count { font-size: 32px; font-weight: 700; display: block; color: #f4f4f5; }
    .summary-label { font-size: 13px; color: #71717a; }

    .alert-card {
      display: flex; margin-bottom: 12px; border-radius: 12px; overflow: hidden;
      background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06);
      transition: transform 0.15s;
    }
    .alert-card:hover { transform: translateX(4px); }

    .alert-priority-bar { width: 4px; flex-shrink: 0; }
    .priority-1 .alert-priority-bar { background: #ef4444; }
    .priority-2 .alert-priority-bar { background: #f59e0b; }
    .priority-3 .alert-priority-bar { background: #3b82f6; }

    .alert-body { padding: 16px 20px; flex: 1; }

    .alert-header {
      display: flex; align-items: center; gap: 10px;
      margin-bottom: 10px; flex-wrap: wrap;
    }

    .priority-badge { padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }
    .priority-1 .priority-badge { background: rgba(239,68,68,0.15); color: #ef4444; }
    .priority-2 .priority-badge { background: rgba(245,158,11,0.15); color: #f59e0b; }
    .priority-3 .priority-badge { background: rgba(59,130,246,0.15); color: #3b82f6; }

    .alert-branch { font-size: 12px; color: #71717a; }
    .alert-text { font-size: 14px; color: #d4d4d8; line-height: 1.6; margin-bottom: 10px; }

    .alert-tags { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 8px; }
    .risk-tag {
      background: rgba(239,68,68,0.08); color: #fca5a5;
      padding: 3px 8px; border-radius: 6px; font-size: 11px;
    }

    .alert-meta { display: flex; gap: 16px; font-size: 12px; color: #52525b; }
  `],
})
export class AlertsComponent implements OnInit {
  alerts: any[] = [];
  summary = { high: 0, standard: 0, monitoring: 0 };

  constructor(private api: ApiService) { }

  ngOnInit() {
    this.api.getAlerts(50).subscribe(data => {
      this.alerts = data.data;
      this.summary = data.summary;
    });
  }

  getStarsArray(n: number): number[] { return Array(n).fill(0); }
}
