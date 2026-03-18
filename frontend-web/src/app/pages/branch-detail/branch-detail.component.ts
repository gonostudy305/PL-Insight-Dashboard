import { Component, OnInit, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

@Component({
    selector: 'app-branch-detail',
    standalone: true,
    imports: [CommonModule, RouterModule],
    template: `
    <div class="branch-detail" *ngIf="branch; else loading">
      <!-- Header -->
      <div class="header-row">
        <a routerLink="/dashboard" class="back-link">← Quay lại</a>
      </div>
      <h2 class="branch-name">📍 {{ branch.branchAddress }}</h2>
      <p class="branch-sub">{{ branch.district }} — {{ branch.placeId }}</p>

      <!-- KPI Cards -->
      <div class="kpi-grid">
        <div class="kpi-card">
          <span class="kpi-value">{{ branch.totalReviews }}</span>
          <span class="kpi-label">Tổng review</span>
        </div>
        <div class="kpi-card">
          <span class="kpi-value">⭐ {{ branch.avgStars }}</span>
          <span class="kpi-label">Sao trung bình</span>
        </div>
        <div class="kpi-card" [class.risk]="branch.negativeRate > 30">
          <span class="kpi-value">{{ branch.negativeRate }}%</span>
          <span class="kpi-label">Tỷ lệ tiêu cực</span>
        </div>
        <div class="kpi-card">
          <span class="kpi-value">{{ branch.responseRate }}%</span>
          <span class="kpi-label">Tỷ lệ phản hồi</span>
        </div>
        <div class="kpi-card" [class.good]="branch.healthScore >= 3">
          <span class="kpi-value">{{ branch.healthScore }}</span>
          <span class="kpi-label">Health Score</span>
        </div>
      </div>

      <div class="grid-2">
        <!-- Monthly Trend -->
        <div class="card">
          <h3 class="card-title">📉 Xu hướng theo tháng</h3>
          <div class="chart-container">
            <canvas #trendCanvas></canvas>
          </div>
        </div>

        <!-- Star Distribution -->
        <div class="card">
          <h3 class="card-title">⭐ Phân bố sao</h3>
          <div class="star-bars" *ngIf="branch.starDistribution">
            @for (star of [5,4,3,2,1]; track star) {
              <div class="star-row">
                <span class="star-label">{{ star }} ⭐</span>
                <div class="star-bar-bg">
                  <div class="star-bar-fill"
                    [style.width.%]="getStarPercent(star)"
                    [class.star-high]="star >= 4"
                    [class.star-mid]="star === 3"
                    [class.star-low]="star <= 2">
                  </div>
                </div>
                <span class="star-count">{{ branch.starDistribution[star] }}</span>
              </div>
            }
          </div>
        </div>

        <!-- Top Issues -->
        <div class="card" *ngIf="branch.topIssues?.length > 0">
          <h3 class="card-title">⚠️ Vấn đề phổ biến</h3>
          <p class="card-desc">Từ {{ branch.negativeCount }} review tiêu cực</p>
          <div class="issue-list">
            @for (issue of branch.topIssues; track issue.issue; let i = $index) {
              <div class="issue-row">
                <span class="issue-rank">#{{ i + 1 }}</span>
                <span class="issue-name">{{ issue.issue }}</span>
                <div class="issue-bar-bg">
                  <div class="issue-bar-fill" [style.width.%]="getIssuePercent(issue.count)"></div>
                </div>
                <span class="issue-count">{{ issue.count }}</span>
              </div>
            }
          </div>
        </div>
      </div>

      <!-- Recent Reviews -->
      <div class="card full-width">
        <h3 class="card-title">💬 Review gần đây</h3>
        <div class="review-list" *ngIf="branch.recentReviews?.length > 0; else noReviews">
          @for (r of branch.recentReviews; track r.reviewId) {
            <div class="review-item" [class.neg]="r.label === 0" [class.pos]="r.label === 1">
              <div class="review-header">
                <span class="review-stars">
                  @for (s of getStarsArray(r.stars); track s) { ⭐ }
                </span>
                <span class="review-label"
                  [class.label-neg]="r.label === 0"
                  [class.label-pos]="r.label === 1">
                  {{ r.label === 1 ? 'Tích cực' : 'Tiêu cực' }}
                </span>
                <span class="review-ai" *ngIf="r.aiSentimentSummary">
                  🤖 {{ r.aiSentimentSummary }}
                </span>
                <span class="review-date">{{ r.publishedAtDate | date:'dd/MM/yyyy' }}</span>
              </div>
              <p class="review-text">{{ r.text }}</p>
            </div>
          }
        </div>
        <ng-template #noReviews>
          <p class="empty">Không có review nào.</p>
        </ng-template>
      </div>
    </div>

    <ng-template #loading>
      <div class="loading-state">
        <p>⏳ Đang tải dữ liệu chi nhánh...</p>
      </div>
    </ng-template>
  `,
    styles: [`
    .branch-detail { max-width: 1200px; }

    .header-row { margin-bottom: 8px; }
    .back-link {
      color: #71717a; font-size: 13px; text-decoration: none;
      transition: color 0.2s;
    }
    .back-link:hover { color: #f59e0b; }

    .branch-name {
      font-size: 26px; font-weight: 700;
      background: linear-gradient(135deg, #f4f4f5, #a1a1aa);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    }
    .branch-sub { color: #71717a; font-size: 13px; margin-bottom: 20px; }

    /* KPI Grid */
    .kpi-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 14px; margin-bottom: 20px; }
    @media (max-width: 900px) { .kpi-grid { grid-template-columns: repeat(3, 1fr); } }
    .kpi-card {
      text-align: center; padding: 18px 12px; border-radius: 12px;
      background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06);
    }
    .kpi-card.risk { border-bottom: 3px solid #ef4444; }
    .kpi-card.good { border-bottom: 3px solid #22c55e; }
    .kpi-value { font-size: 24px; font-weight: 700; color: #f4f4f5; display: block; }
    .kpi-label { font-size: 12px; color: #71717a; }

    /* Grid */
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
    @media (max-width: 900px) { .grid-2 { grid-template-columns: 1fr; } }

    .card {
      background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05);
      border-radius: 14px; padding: 20px;
    }
    .card.full-width { grid-column: 1 / -1; }
    .card-title { font-size: 16px; font-weight: 600; color: #e4e4e7; margin-bottom: 14px; }
    .card-desc { font-size: 12px; color: #71717a; margin-top: -8px; margin-bottom: 14px; }

    .chart-container { height: 220px; position: relative; }

    /* Star Distribution */
    .star-bars { display: flex; flex-direction: column; gap: 10px; }
    .star-row { display: flex; align-items: center; gap: 10px; }
    .star-label { width: 50px; font-size: 13px; color: #d4d4d8; text-align: right; }
    .star-bar-bg { flex: 1; height: 20px; border-radius: 6px; background: rgba(255,255,255,0.04); overflow: hidden; }
    .star-bar-fill { height: 100%; border-radius: 6px; transition: width 0.5s ease; }
    .star-high { background: linear-gradient(90deg, #22c55e, #16a34a); }
    .star-mid { background: linear-gradient(90deg, #f59e0b, #d97706); }
    .star-low { background: linear-gradient(90deg, #ef4444, #dc2626); }
    .star-count { min-width: 40px; font-size: 13px; color: #a1a1aa; font-weight: 600; }

    /* Top Issues */
    .issue-list { display: flex; flex-direction: column; gap: 10px; }
    .issue-row { display: flex; align-items: center; gap: 10px; }
    .issue-rank { font-size: 12px; color: #f59e0b; font-weight: 700; min-width: 24px; }
    .issue-name { width: 80px; font-size: 13px; color: #d4d4d8; font-weight: 500; text-align: right; }
    .issue-bar-bg { flex: 1; height: 18px; border-radius: 6px; background: rgba(255,255,255,0.04); overflow: hidden; }
    .issue-bar-fill { height: 100%; border-radius: 6px; background: linear-gradient(90deg, #ef4444, #f97316); transition: width 0.5s ease; }
    .issue-count { min-width: 30px; font-size: 13px; color: #a1a1aa; font-weight: 600; }

    /* Review List */
    .review-list { display: flex; flex-direction: column; gap: 10px; max-height: 500px; overflow-y: auto; }
    .review-item {
      padding: 14px; border-radius: 10px;
      background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.04);
    }
    .review-item.neg { border-left: 3px solid #ef4444; }
    .review-item.pos { border-left: 3px solid #22c55e; }
    .review-header { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; flex-wrap: wrap; }
    .review-stars { font-size: 12px; }
    .review-label { font-size: 11px; padding: 2px 8px; border-radius: 6px; font-weight: 600; }
    .label-pos { background: rgba(34,197,94,0.12); color: #22c55e; }
    .label-neg { background: rgba(239,68,68,0.12); color: #ef4444; }
    .review-ai { font-size: 11px; color: #71717a; }
    .review-date { font-size: 11px; color: #52525b; margin-left: auto; }
    .review-text { font-size: 13px; color: #d4d4d8; line-height: 1.5; max-height: 60px; overflow: hidden; }

    .loading-state { text-align: center; padding: 60px; color: #71717a; }
    .empty { color: #71717a; text-align: center; padding: 20px; }
  `],
})
export class BranchDetailComponent implements OnInit, AfterViewInit {
    @ViewChild('trendCanvas') trendCanvas!: ElementRef<HTMLCanvasElement>;

    branch: any = null;
    private trendChart: Chart | null = null;
    private maxStars = 0;
    private maxIssues = 0;

    constructor(private api: ApiService, private route: ActivatedRoute) { }

    ngOnInit() {
        this.route.paramMap.subscribe(params => {
            const placeId = params.get('placeId');
            if (placeId) this.loadBranch(placeId);
        });
    }

    ngAfterViewInit() { }

    loadBranch(placeId: string) {
        this.api.getBranchDetail(placeId).subscribe({
            next: data => {
                this.branch = data;
                this.maxStars = Math.max(
                    ...Object.values(data.starDistribution || {}).map((v: any) => v as number), 1
                );
                this.maxIssues = Math.max(
                    ...(data.topIssues || []).map((i: any) => i.count), 1
                );
                setTimeout(() => this.renderTrendChart(), 100);
            },
            error: err => console.error('Branch load error:', err),
        });
    }

    getStarPercent(star: number): number {
        return ((this.branch?.starDistribution?.[star] || 0) / this.maxStars) * 100;
    }

    getIssuePercent(count: number): number {
        return (count / this.maxIssues) * 100;
    }

    getStarsArray(n: number): number[] { return Array(n).fill(0); }

    renderTrendChart() {
        if (!this.trendCanvas?.nativeElement || !this.branch?.monthlyTrend?.length) return;
        if (this.trendChart) this.trendChart.destroy();

        const labels = this.branch.monthlyTrend.map((t: any) => t.period);
        const negRateData = this.branch.monthlyTrend.map((t: any) => t.negativeRate);
        const ctx = this.trendCanvas.nativeElement.getContext('2d')!;
        const gradient = ctx.createLinearGradient(0, 0, 0, 200);
        gradient.addColorStop(0, 'rgba(239,68,68,0.2)');
        gradient.addColorStop(1, 'transparent');

        this.trendChart = new Chart(this.trendCanvas.nativeElement, {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: 'Tỷ lệ tiêu cực (%)',
                    data: negRateData,
                    borderColor: '#ef4444',
                    backgroundColor: gradient,
                    borderWidth: 2, pointRadius: 1.5, tension: 0.3, fill: true,
                }],
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { labels: { color: '#a1a1aa' } } },
                scales: {
                    x: { ticks: { color: '#52525b', maxTicksLimit: 8 }, grid: { color: 'rgba(255,255,255,0.03)' } },
                    y: { ticks: { color: '#52525b', callback: v => `${v}%` }, grid: { color: 'rgba(255,255,255,0.03)' } },
                },
            },
        });
    }
}
