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
      <h2 class="page-title">📈 Insight Analytics</h2>
      <p class="page-subtitle">Phân tích chuyên sâu — Quận, từ khóa, xu hướng</p>

      <div class="grid-2">
        <!-- District Heatmap -->
        <div class="card">
          <h3 class="card-title">🗺️ Heatmap theo Quận</h3>
          <p class="card-desc">Tỷ lệ đánh giá tiêu cực theo khu vực</p>
          <div class="table-wrap" *ngIf="districts.length > 0; else distLoading">
            <table>
              <thead>
                <tr>
                  <th>Quận</th>
                  <th>Reviews</th>
                  <th>Neg Rate</th>
                  <th>⭐ TB</th>
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
          <h3 class="card-title">🏷️ Từ khóa phàn nàn</h3>
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
        <h3 class="card-title">📉 Xu hướng cảm xúc theo tháng</h3>
        <div class="chart-filters">
          <select [(ngModel)]="trendMetric" (change)="renderTrendChart()">
            <option value="negativeRate">Tỷ lệ tiêu cực (%)</option>
            <option value="total">Tổng review</option>
            <option value="avgStars">Điểm trung bình</option>
          </select>
        </div>
        <div class="chart-container">
          <canvas #trendCanvas></canvas>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .analytics { max-width: 1200px; }

    .page-title {
      font-size: 28px; font-weight: 700;
      background: linear-gradient(135deg, #f4f4f5, #a1a1aa);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    }
    .page-subtitle { color: #71717a; font-size: 14px; margin-top: 4px; margin-bottom: 24px; }

    .grid-2 {
      display: grid; grid-template-columns: 1fr 1fr; gap: 20px;
      margin-bottom: 20px;
    }
    @media (max-width: 900px) { .grid-2 { grid-template-columns: 1fr; } }

    .card {
      background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05);
      border-radius: 14px; padding: 22px;
    }
    .card.full-width { grid-column: 1 / -1; }

    .card-title { font-size: 16px; font-weight: 600; color: #e4e4e7; margin-bottom: 4px; }
    .card-desc { font-size: 12px; color: #71717a; margin-bottom: 16px; }

    /* District Table */
    .table-wrap { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    thead th {
      text-align: left; padding: 8px 10px; color: #71717a; font-weight: 500;
      border-bottom: 1px solid rgba(255,255,255,0.06);
    }
    tbody tr { border-bottom: 1px solid rgba(255,255,255,0.03); }
    tbody tr:hover { background: rgba(255,255,255,0.02); }
    td { padding: 10px; color: #d4d4d8; }
    .district-name { font-weight: 500; }
    .num { text-align: center; }

    .rate-badge {
      padding: 3px 8px; border-radius: 6px; font-size: 12px; font-weight: 600;
    }
    .high-risk { background: rgba(239,68,68,0.12); color: #ef4444; }
    .mid-risk { background: rgba(245,158,11,0.12); color: #f59e0b; }
    .low-risk { background: rgba(34,197,94,0.12); color: #22c55e; }

    .health-badge {
      padding: 3px 8px; border-radius: 6px; font-size: 12px; font-weight: 600;
    }
    .health-good { background: rgba(34,197,94,0.12); color: #22c55e; }
    .health-warn { background: rgba(245,158,11,0.12); color: #f59e0b; }
    .health-bad { background: rgba(239,68,68,0.12); color: #ef4444; }

    /* Keyword Bars */
    .keyword-list { display: flex; flex-direction: column; gap: 10px; }
    .keyword-bar-row { display: flex; align-items: center; gap: 10px; }
    .kw-label { width: 100px; font-size: 13px; color: #d4d4d8; font-weight: 500; text-align: right; }
    .kw-bar-bg {
      flex: 1; height: 22px; border-radius: 6px;
      background: rgba(255,255,255,0.04); overflow: hidden;
    }
    .kw-bar-fill {
      height: 100%; border-radius: 6px;
      background: linear-gradient(90deg, #3b82f6, #6366f1);
      transition: width 0.5s ease;
    }
    .kw-count { font-size: 13px; color: #a1a1aa; font-weight: 600; min-width: 40px; }

    /* Chart */
    .chart-filters { margin-bottom: 12px; }
    .chart-filters select {
      padding: 8px 14px; border-radius: 8px; font-size: 13px;
      background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
      color: #d4d4d8; cursor: pointer;
    }
    .chart-container { height: 300px; position: relative; }

    .loading { color: #71717a; font-size: 13px; text-align: center; padding: 20px; }
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

    ngAfterViewInit() {
        // Chart rendered after data loads
    }

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
        let yLabel: string;

        if (metric === 'negativeRate') {
            dataValues = this.trends.map(t => t.negativeRate);
            label = 'Tỷ lệ tiêu cực (%)';
            color = '#ef4444';
            yLabel = '%';
        } else if (metric === 'total') {
            dataValues = this.trends.map(t => t.total);
            label = 'Tổng review';
            color = '#3b82f6';
            yLabel = 'Reviews';
        } else {
            dataValues = this.trends.map(t => t.avgStars);
            label = 'Điểm TB';
            color = '#f59e0b';
            yLabel = 'Sao';
        }

        const ctx = this.trendCanvas.nativeElement.getContext('2d')!;
        const gradient = ctx.createLinearGradient(0, 0, 0, 280);
        gradient.addColorStop(0, color + '33');
        gradient.addColorStop(1, 'transparent');

        this.trendChart = new Chart(this.trendCanvas.nativeElement, {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label, data: dataValues,
                    borderColor: color, backgroundColor: gradient,
                    borderWidth: 2, pointRadius: 2, tension: 0.3, fill: true,
                }],
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: {
                    legend: { labels: { color: '#a1a1aa' } },
                },
                scales: {
                    x: { ticks: { color: '#52525b', maxTicksLimit: 12 }, grid: { color: 'rgba(255,255,255,0.03)' } },
                    y: {
                        ticks: { color: '#52525b', callback: (v) => `${v}${metric === 'negativeRate' ? '%' : ''}` },
                        grid: { color: 'rgba(255,255,255,0.03)' },
                    },
                },
            },
        });
    }
}
