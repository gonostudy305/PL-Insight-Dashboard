import { Component, OnInit, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="analytics">
      <div class="page-header">
        <div>
          <h2 class="page-title">Insight Analytics</h2>
          <p class="page-subtitle">Phân tích chuyên sâu — Quận, từ khóa, xu hướng</p>
        </div>
      </div>

      <div class="grid-2">
        <!-- District Heatmap -->
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
              Heatmap theo Quận
            </h3>
          </div>
          <p class="card-desc">Tỷ lệ đánh giá tiêu cực theo khu vực</p>
          <div class="table-wrap" *ngIf="districts.length > 0; else distLoading">
            <table>
              <thead>
                <tr>
                  <th>Quận</th>
                  <th>Reviews</th>
                  <th>Neg Rate</th>
                  <th>Sao TB</th>
                  <th>Health</th>
                </tr>
              </thead>
              <tbody>
                @for (d of districts; track d.district) {
                  <tr>
                    <td class="district-name">{{ d.district }}</td>
                    <td class="num">{{ d.totalReviews }}</td>
                    <td>
                      <span class="rate-badge" [class.high-risk]="d.negativeRate > 40"
                        [class.mid-risk]="d.negativeRate >= 25 && d.negativeRate <= 40"
                        [class.low-risk]="d.negativeRate < 25">
                        {{ d.negativeRate }}%
                      </span>
                    </td>
                    <td class="num">{{ d.avgStars }}</td>
                    <td>
                      <span class="health-badge" [class.health-good]="d.healthScore >= 3"
                        [class.health-warn]="d.healthScore >= 2 && d.healthScore < 3"
                        [class.health-bad]="d.healthScore < 2">
                        {{ d.healthScore }}
                      </span>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
          <ng-template #distLoading><p class="loading">Đang tải...</p></ng-template>
        </div>

        <!-- Keyword Cloud -->
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-danger)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"/><path d="M7 7h.01"/></svg>
              Từ khóa phàn nàn
            </h3>
          </div>
          <p class="card-desc">Trích xuất từ {{ totalNegativeReviews }} review tiêu cực</p>
          <div class="keyword-list" *ngIf="keywords.length > 0; else kwLoading">
            @for (kw of keywords; track kw.keyword) {
              <div class="keyword-bar-row">
                <span class="kw-label">{{ kw.keyword }}</span>
                <div class="kw-bar-bg">
                  <div class="kw-bar-fill" [style.width.%]="getBarWidth(kw.count)"></div>
                </div>
                <span class="kw-count">{{ kw.count }}</span>
              </div>
            }
          </div>
          <ng-template #kwLoading><p class="loading">Đang tải...</p></ng-template>
        </div>
      </div>

      <!-- Trend Chart -->
      <div class="card full-width">
        <div class="card-header">
          <h3 class="card-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
            Xu hướng cảm xúc theo tháng
          </h3>
          <div class="chart-filters">
            <select [(ngModel)]="trendMetric" (change)="renderTrendChart()">
              <option value="negativeRate">Tỷ lệ tiêu cực (%)</option>
              <option value="total">Tổng review</option>
              <option value="avgStars">Điểm trung bình</option>
            </select>
          </div>
        </div>
        <div class="chart-container">
          <canvas #trendCanvas></canvas>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .analytics {
      max-width: 1200px;
      animation: fadeInUp 0.4s ease-out;
    }

    .page-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: var(--space-8);
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

    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--space-6);
      margin-bottom: var(--space-6);
    }

    @media (max-width: 900px) {
      .grid-2 { grid-template-columns: 1fr; }
    }

    .card {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      overflow: hidden;
    }

    .card.full-width { grid-column: 1 / -1; }

    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--space-5) var(--space-6);
      border-bottom: 1px solid var(--color-border-light);
    }

    .card-title {
      font-size: var(--font-size-md);
      font-weight: 700;
      color: var(--color-text);
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }

    .card-desc {
      font-size: var(--font-size-xs);
      color: var(--color-text-muted);
      padding: var(--space-2) var(--space-6) 0;
    }

    /* District Table */
    .table-wrap {
      overflow-x: auto;
      padding: 0 var(--space-6) var(--space-5);
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: var(--font-size-sm);
    }

    thead th {
      text-align: left;
      padding: var(--space-3) var(--space-3);
      color: var(--color-text-muted);
      font-weight: 600;
      font-size: var(--font-size-xs);
      text-transform: uppercase;
      letter-spacing: 0.04em;
      border-bottom: 1px solid var(--color-border);
    }

    tbody tr {
      border-bottom: 1px solid var(--color-border-light);
      transition: background var(--transition-fast);
    }

    tbody tr:hover { background: var(--color-surface-hover); }
    tbody tr:last-child { border-bottom: none; }

    td {
      padding: var(--space-3);
      color: var(--color-text);
    }

    .district-name { font-weight: 600; }
    .num { text-align: center; }

    .rate-badge {
      padding: 3px 10px;
      border-radius: var(--radius-full);
      font-size: var(--font-size-xs);
      font-weight: 600;
    }

    .high-risk { background: var(--color-danger-bg); color: var(--color-danger); }
    .mid-risk { background: var(--color-warning-bg); color: var(--color-warning); }
    .low-risk { background: var(--color-success-bg); color: var(--color-success); }

    .health-badge {
      padding: 3px 10px;
      border-radius: var(--radius-full);
      font-size: var(--font-size-xs);
      font-weight: 600;
    }

    .health-good { background: var(--color-success-bg); color: var(--color-success); }
    .health-warn { background: var(--color-warning-bg); color: var(--color-warning); }
    .health-bad { background: var(--color-danger-bg); color: var(--color-danger); }

    /* Keyword Bars */
    .keyword-list {
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
      padding: var(--space-4) var(--space-6) var(--space-5);
    }

    .keyword-bar-row {
      display: flex;
      align-items: center;
      gap: var(--space-3);
    }

    .kw-label {
      width: 100px;
      font-size: var(--font-size-sm);
      color: var(--color-text);
      font-weight: 500;
      text-align: right;
    }

    .kw-bar-bg {
      flex: 1;
      height: 24px;
      border-radius: var(--radius-sm);
      background: var(--color-bg);
      overflow: hidden;
    }

    .kw-bar-fill {
      height: 100%;
      border-radius: var(--radius-sm);
      background: linear-gradient(90deg, var(--color-danger), #f87171);
      transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .kw-count {
      font-size: var(--font-size-sm);
      color: var(--color-text-secondary);
      font-weight: 700;
      min-width: 40px;
    }

    /* Chart */
    .chart-filters { margin-left: auto; }

    .chart-filters select {
      padding: 7px 14px;
      border-radius: var(--radius-md);
      font-size: var(--font-size-sm);
      background: var(--color-bg);
      border: 1px solid var(--color-border);
      color: var(--color-text);
      cursor: pointer;
      transition: border-color var(--transition-fast);
    }

    .chart-filters select:focus {
      outline: none;
      border-color: var(--color-primary);
    }

    .chart-container {
      height: 300px;
      position: relative;
      padding: var(--space-6);
    }

    .loading {
      color: var(--color-text-muted);
      font-size: var(--font-size-sm);
      text-align: center;
      padding: var(--space-8);
    }
  `],
})
export class AnalyticsComponent implements OnInit, AfterViewInit {
  @ViewChild('trendCanvas') trendCanvas!: ElementRef<HTMLCanvasElement>;

  districts: any[] = [];
  keywords: any[] = [];
  trends: any[] = [];
  totalNegativeReviews = 0;
  trendMetric = 'negativeRate';
  private trendChart: Chart | null = null;
  private maxKeywordCount = 0;

  constructor(private api: ApiService) { }

  ngOnInit() {
    this.loadDistricts();
    this.loadKeywords();
    this.loadTrends();
  }

  ngAfterViewInit() { }

  loadDistricts() {
    this.api.getDistrictHeatmap().subscribe({
      next: data => this.districts = Array.isArray(data) ? data : [],
      error: err => console.error('District load error:', err),
    });
  }

  loadKeywords() {
    this.api.getKeywords().subscribe({
      next: data => {
        this.keywords = data.data || [];
        this.totalNegativeReviews = data.totalNegativeReviews || 0;
        this.maxKeywordCount = Math.max(...this.keywords.map((k: any) => k.count), 1);
      },
      error: err => console.error('Keywords load error:', err),
    });
  }

  loadTrends() {
    this.api.getTrends().subscribe({
      next: data => {
        this.trends = Array.isArray(data) ? data : data.value || [];
        setTimeout(() => this.renderTrendChart(), 100);
      },
      error: err => console.error('Trends load error:', err),
    });
  }

  getBarWidth(count: number): number {
    return (count / this.maxKeywordCount) * 100;
  }

  renderTrendChart() {
    if (!this.trendCanvas?.nativeElement || this.trends.length === 0) return;

    if (this.trendChart) this.trendChart.destroy();

    const labels = this.trends.map(t => t.period);
    const metric = this.trendMetric;

    let dataValues: number[];
    let label: string;
    let color: string;

    if (metric === 'negativeRate') {
      dataValues = this.trends.map(t => t.negativeRate);
      label = 'Tỷ lệ tiêu cực (%)';
      color = '#DC2626';
    } else if (metric === 'total') {
      dataValues = this.trends.map(t => t.total);
      label = 'Tổng review';
      color = '#0C713D';
    } else {
      dataValues = this.trends.map(t => t.avgStars);
      label = 'Điểm TB';
      color = '#D97706';
    }

    const ctx = this.trendCanvas.nativeElement.getContext('2d')!;
    const gradient = ctx.createLinearGradient(0, 0, 0, 280);
    gradient.addColorStop(0, color + '20');
    gradient.addColorStop(1, 'transparent');

    this.trendChart = new Chart(this.trendCanvas.nativeElement, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label, data: dataValues,
          borderColor: color, backgroundColor: gradient,
          borderWidth: 2.5, pointRadius: 3, pointBackgroundColor: '#fff',
          pointBorderColor: color, pointBorderWidth: 2, tension: 0.4, fill: true,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: {
              color: '#475569',
              font: { size: 12, weight: '500' as any },
              usePointStyle: true,
              pointStyle: 'circle',
            }
          },
          tooltip: {
            backgroundColor: '#fff',
            titleColor: '#0F172A',
            bodyColor: '#475569',
            borderColor: '#E2E8F0',
            borderWidth: 1,
            padding: 12,
            cornerRadius: 10,
          },
        },
        scales: {
          x: {
            ticks: { color: '#94A3B8', maxTicksLimit: 12 },
            grid: { color: '#F1F5F9' },
          },
          y: {
            ticks: {
              color: '#94A3B8',
              callback: (v) => `${v}${metric === 'negativeRate' ? '%' : ''}`,
            },
            grid: { color: '#F1F5F9' },
          },
        },
      },
    });
  }
}
