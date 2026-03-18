import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="dashboard">
      <h2 class="page-title">Tổng quan hệ thống</h2>
      <p class="page-subtitle">Phúc Long Coffee & Tea — Khu vực Hà Nội</p>

      <!-- KPI Cards -->
      <div class="kpi-grid">
        <div class="kpi-card positive">
          <div class="kpi-icon">😊</div>
          <div class="kpi-content">
            <span class="kpi-value">{{ overview?.sentimentScore }}%</span>
            <span class="kpi-label">Sentiment Score</span>
          </div>
        </div>
        <div class="kpi-card neutral">
          <div class="kpi-icon">⭐</div>
          <div class="kpi-content">
            <span class="kpi-value">{{ overview?.avgStars }}</span>
            <span class="kpi-label">Điểm TB</span>
          </div>
        </div>
        <div class="kpi-card negative">
          <div class="kpi-icon">📉</div>
          <div class="kpi-content">
            <span class="kpi-value">{{ overview?.negativeRate }}%</span>
            <span class="kpi-label">Tỷ lệ tiêu cực</span>
          </div>
        </div>
        <div class="kpi-card info">
          <div class="kpi-icon">💚</div>
          <div class="kpi-content">
            <span class="kpi-value">{{ overview?.healthScore }}</span>
            <span class="kpi-label">Health Score</span>
          </div>
        </div>
      </div>

      <!-- Stats Row -->
      <div class="stats-row">
        <div class="stat-box">
          <span class="stat-number">{{ overview?.totalReviews | number }}</span>
          <span class="stat-label">Tổng đánh giá</span>
        </div>
        <div class="stat-box">
          <span class="stat-number positive-text">{{ overview?.positiveCount | number }}</span>
          <span class="stat-label">Tích cực</span>
        </div>
        <div class="stat-box">
          <span class="stat-number negative-text">{{ overview?.negativeCount | number }}</span>
          <span class="stat-label">Tiêu cực</span>
        </div>
        <div class="stat-box">
          <span class="stat-number">{{ overview?.responseRate }}%</span>
          <span class="stat-label">Tỷ lệ phản hồi</span>
        </div>
      </div>

      <!-- Negative Rate Trend Chart -->
      <div class="section">
        <h3 class="section-title">📈 Xu hướng tỷ lệ tiêu cực theo tháng</h3>
        <div class="chart-container" *ngIf="trendData.length > 0; else emptyChart">
          <canvas #trendCanvas></canvas>
        </div>
        <ng-template #emptyChart>
          <div class="empty-state">
            <span class="empty-icon">📊</span>
            <p>Chưa có dữ liệu xu hướng. Vui lòng kiểm tra kết nối API.</p>
          </div>
        </ng-template>
      </div>

      <!-- Star Distribution -->
      <div class="section">
        <h3 class="section-title">Phân phối mức sao</h3>
        <div class="distribution-bars">
          @for (item of distribution; track item.stars) {
            <div class="bar-row">
              <span class="bar-label">{{ item.stars }} ⭐</span>
              <div class="bar-track">
                <div
                  class="bar-fill"
                  [class.bar-negative]="item.stars <= 3"
                  [class.bar-positive]="item.stars >= 4"
                  [style.width.%]="getBarWidth(item.count)"
                ></div>
              </div>
              <span class="bar-count">{{ item.count }}</span>
            </div>
          }
        </div>
      </div>

      <!-- Branch Ranking -->
      <div class="section">
        <h3 class="section-title">Xếp hạng chi nhánh (Health Score — thấp → cao)</h3>
        <div class="branch-list">
          @for (branch of branches?.data?.slice(0, 10); track branch.placeId; let i = $index) {
            <a class="branch-item" [routerLink]="['/branches', branch.placeId]">
              <span class="branch-rank" [class.risk-rank]="i < 3">{{ i + 1 }}</span>
              <span class="branch-name">{{ branch.branchAddress }}</span>
              <span class="branch-score" [class.low-score]="branch.healthScore < 2">{{ branch.healthScore }}</span>
              <span class="branch-stars">⭐ {{ branch.avgStars }}</span>
            </a>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard { max-width: 1200px; }

    .page-title {
      font-size: 28px;
      font-weight: 700;
      background: linear-gradient(135deg, #f4f4f5, #a1a1aa);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .page-subtitle {
      color: #71717a;
      font-size: 14px;
      margin-top: 4px;
      margin-bottom: 32px;
    }

    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 20px;
      margin-bottom: 24px;
    }

    .kpi-card {
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 16px;
      padding: 24px;
      display: flex;
      align-items: center;
      gap: 16px;
      backdrop-filter: blur(10px);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .kpi-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 32px rgba(0,0,0,0.3);
    }

    .kpi-card.positive { border-left: 3px solid #22c55e; }
    .kpi-card.negative { border-left: 3px solid #ef4444; }
    .kpi-card.neutral { border-left: 3px solid #f59e0b; }
    .kpi-card.info { border-left: 3px solid #3b82f6; }

    .kpi-icon { font-size: 32px; }

    .kpi-content { display: flex; flex-direction: column; }

    .kpi-value { font-size: 28px; font-weight: 700; color: #f4f4f5; }

    .kpi-label { font-size: 13px; color: #71717a; margin-top: 2px; }

    .stats-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 32px;
    }

    .stat-box {
      background: rgba(255,255,255,0.02);
      border: 1px solid rgba(255,255,255,0.04);
      border-radius: 12px;
      padding: 16px;
      text-align: center;
    }

    .stat-number { display: block; font-size: 22px; font-weight: 600; color: #e4e4e7; }
    .stat-label { font-size: 12px; color: #71717a; }
    .positive-text { color: #22c55e !important; }
    .negative-text { color: #ef4444 !important; }

    .section { margin-bottom: 32px; }

    .section-title { font-size: 18px; font-weight: 600; color: #d4d4d8; margin-bottom: 16px; }

    /* Trend Chart */
    .chart-container {
      background: rgba(255,255,255,0.02);
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 12px;
      padding: 24px;
      position: relative;
      height: 320px;
    }

    .empty-state {
      background: rgba(255,255,255,0.02);
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 12px;
      padding: 48px;
      text-align: center;
      color: #71717a;
    }

    .empty-icon { font-size: 48px; display: block; margin-bottom: 12px; }

    /* Star Distribution */
    .distribution-bars {
      background: rgba(255,255,255,0.02);
      border: 1px solid rgba(255,255,255,0.04);
      border-radius: 12px;
      padding: 20px;
    }

    .bar-row { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; }
    .bar-label { width: 50px; font-size: 13px; color: #a1a1aa; }

    .bar-track {
      flex: 1; height: 24px;
      background: rgba(255,255,255,0.04);
      border-radius: 6px; overflow: hidden;
    }

    .bar-fill { height: 100%; border-radius: 6px; transition: width 0.6s ease; }
    .bar-positive { background: linear-gradient(90deg, #22c55e, #16a34a); }
    .bar-negative { background: linear-gradient(90deg, #ef4444, #dc2626); }
    .bar-count { width: 60px; text-align: right; font-size: 13px; color: #a1a1aa; }

    /* Branch Ranking */
    .branch-list {
      background: rgba(255,255,255,0.02);
      border: 1px solid rgba(255,255,255,0.04);
      border-radius: 12px; overflow: hidden;
    }

    .branch-item {
      display: flex; align-items: center; gap: 16px;
      padding: 14px 20px;
      border-bottom: 1px solid rgba(255,255,255,0.03);
      transition: background 0.15s;
      text-decoration: none; cursor: pointer;
    }

    .branch-item:hover { background: rgba(255,255,255,0.04); }
    .branch-item:last-child { border-bottom: none; }

    .branch-rank {
      width: 28px; height: 28px;
      display: flex; align-items: center; justify-content: center;
      border-radius: 8px; font-size: 13px; font-weight: 600;
      background: rgba(255,255,255,0.05); color: #a1a1aa;
    }

    .risk-rank { background: rgba(239, 68, 68, 0.15); color: #ef4444; }
    .branch-name { flex: 1; font-size: 14px; color: #d4d4d8; }
    .branch-score { font-size: 14px; font-weight: 600; color: #22c55e; }
    .low-score { color: #ef4444 !important; }
    .branch-stars { font-size: 13px; color: #a1a1aa; }
  `],
})
export class DashboardComponent implements OnInit {
  @ViewChild('trendCanvas') trendCanvas!: ElementRef<HTMLCanvasElement>;

  overview: any = null;
  distribution: any[] = [];
  branches: any = null;
  trendData: any[] = [];

  private trendChart: Chart | null = null;

  constructor(private api: ApiService) { }

  ngOnInit() {
    this.api.getOverview().subscribe(data => this.overview = data);
    this.api.getDistribution().subscribe(data => this.distribution = data);
    this.api.getBranches().subscribe(data => this.branches = data);
    this.api.getTrends().subscribe(data => {
      this.trendData = data || [];
      // Wait for NgIf to render the canvas
      setTimeout(() => this.renderTrendChart(), 100);
    });
  }

  getBarWidth(count: number): number {
    if (!this.distribution.length) return 0;
    const max = Math.max(...this.distribution.map((d: any) => d.count));
    return (count / max) * 100;
  }

  private renderTrendChart() {
    if (!this.trendCanvas || !this.trendData.length) return;

    const ctx = this.trendCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    // Destroy previous chart if exists
    if (this.trendChart) {
      this.trendChart.destroy();
    }

    const labels = this.trendData.map((t: any) => t.period);
    const negativeRates = this.trendData.map((t: any) => t.negativeRate);

    // Create gradient fill
    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, 'rgba(239, 68, 68, 0.25)');
    gradient.addColorStop(1, 'rgba(239, 68, 68, 0.01)');

    this.trendChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Tỷ lệ tiêu cực (%)',
          data: negativeRates,
          borderColor: '#ef4444',
          backgroundColor: gradient,
          borderWidth: 2,
          pointRadius: 2,
          pointHoverRadius: 6,
          pointBackgroundColor: '#ef4444',
          pointHoverBackgroundColor: '#fca5a5',
          fill: true,
          tension: 0.3,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          legend: {
            display: true,
            labels: {
              color: '#a1a1aa',
              font: { size: 12 },
            },
          },
          tooltip: {
            backgroundColor: 'rgba(24, 24, 27, 0.9)',
            titleColor: '#f4f4f5',
            bodyColor: '#d4d4d8',
            borderColor: 'rgba(255,255,255,0.1)',
            borderWidth: 1,
            padding: 12,
            callbacks: {
              label: (context) => {
                const idx = context.dataIndex;
                const trend = this.trendData[idx];
                return [
                  `Tỷ lệ tiêu cực: ${trend.negativeRate}%`,
                  `Tiêu cực: ${trend.negative} / ${trend.total} đánh giá`,
                  `Sao TB: ${trend.avgStars}`,
                ];
              },
            },
          },
        },
        scales: {
          x: {
            ticks: {
              color: '#71717a',
              font: { size: 10 },
              maxRotation: 45,
              autoSkip: true,
              maxTicksLimit: 20,
            },
            grid: {
              color: 'rgba(255,255,255,0.03)',
            },
          },
          y: {
            min: 0,
            max: 100,
            ticks: {
              color: '#71717a',
              font: { size: 11 },
              callback: (value) => value + '%',
              stepSize: 20,
            },
            grid: {
              color: 'rgba(255,255,255,0.05)',
            },
          },
        },
      },
    });
  }
}
