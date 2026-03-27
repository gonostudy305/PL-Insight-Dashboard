import { Component, OnInit, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

@Component({
  selector: 'app-branch-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="page-container">
      <div class="filter-sidebar">
        <h3 class="filter-sidebar-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
          Chi nhánh
        </h3>
        <div class="filter-group" style="margin-bottom: 16px;">
          <label style="display: block; font-size: 13px; font-weight: 600; color: var(--color-text-muted); margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.05em;">Khoảng thời gian</label>
          <select [(ngModel)]="daysFilter" (change)="onFilterChange()" style="width: 100%; padding: 10px 12px; border: 1px solid var(--color-border); border-radius: 6px; background-color: var(--pl-surface); color: var(--color-text); font-size: 14px; appearance: none; background-image: url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23475569%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E'); background-repeat: no-repeat; background-position: right 12px center; background-size: 16px; cursor: pointer;">
            <option [ngValue]="7">7 ngày qua</option>
            <option [ngValue]="30">30 ngày qua</option>
            <option [ngValue]="90">90 ngày qua</option>
            <option [ngValue]="null">Tất cả thời gian</option>
          </select>
        </div>
        <div class="filter-group">
          <label style="display: block; font-size: 13px; font-weight: 600; color: var(--color-text-muted); margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.05em;">Điều hướng</label>
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <a routerLink="/map" style="padding: 10px; border-radius: 4px; border: 1px solid var(--color-border); background: var(--pl-surface); color: var(--color-text); text-decoration: none; display: flex; align-items: center; gap: 8px; font-weight: 500;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0Z"/><circle cx="12" cy="10" r="3"/></svg>
              Xem trên Bản đồ
            </a>
            <a routerLink="/dashboard" style="padding: 10px; border-radius: 4px; border: 1px solid var(--color-border); background: var(--pl-surface); color: var(--color-text); text-decoration: none; display: flex; align-items: center; gap: 8px; font-weight: 500;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
              Về Dashboard
            </a>
          </div>
        </div>
      </div>
      
      <div class="data-content">
        <div class="branch-detail" *ngIf="branch; else loading">
          <!-- Header -->
          <div class="header-row">
            <h2 class="branch-name" style="margin-bottom: 0;">
             {{ branch.branchAddress }}
            </h2>
          </div>
          <p class="branch-sub">{{ branch.district }} — {{ branch.placeId }}</p>

          <!-- KPI Cards -->
          <div class="kpi-grid">
            <div class="kpi-card">
              <span class="kpi-value">{{ branch.totalReviews }}</span>
              <span class="kpi-label">Tổng review</span>
            </div>
            <div class="kpi-card">
              <span class="kpi-value">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="var(--color-accent)" stroke="var(--color-accent)" stroke-width="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                {{ branch.avgStars }}
              </span>
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
              <div class="card-header-inner">
                <h3 class="card-title">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-danger)" stroke-width="2"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
                  Xu hướng theo tháng
                </h3>
              </div>
              <div class="chart-container">
                <canvas #trendCanvas></canvas>
              </div>
            </div>

            <!-- Star Distribution -->
            <div class="card">
              <div class="card-header-inner">
                <h3 class="card-title">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                  Phân bố sao
                </h3>
              </div>
              <div class="star-bars" *ngIf="branch.starDistribution">
                @for (star of [5,4,3,2,1]; track star) {
                  <div class="star-row">
                    <span class="star-label">{{ star }} sao</span>
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
              <div class="card-header-inner">
                <h3 class="card-title">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-warning)" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>
                  Vấn đề phổ biến
                </h3>
                <span class="issue-count-label">Từ {{ branch.negativeCount }} review tiêu cực</span>
              </div>
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
            
            <!-- Session Risk Heatmap -->
            <div class="card full-width" *ngIf="branch.sessionRisk">
              <div class="card-header-inner">
                <h3 class="card-title">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-warning)" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  Đánh giá Rủi ro theo Buổi (Session Risk)
                </h3>
              </div>
              <div class="session-risk-wrapper">
                <div class="session-block" *ngFor="let s of ['Sáng', 'Trưa', 'Chiều', 'Tối']">
                  <div class="session-name">{{ s }}</div>
                  <div class="session-box" 
                    [style.background-color]="getSessionColor(branch.sessionRisk[s]?.negativeRate || 0)">
                    <div class="session-rate">
                      {{ (branch.sessionRisk[s]?.negativeRate || 0).toFixed(1) }}%
                    </div>
                    <div class="session-count">
                      {{ branch.sessionRisk[s]?.negative || 0 }} tiêu cực / {{ branch.sessionRisk[s]?.total || 0 }} review
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- AI Actionable Recommendations -->
            <div class="card full-width" *ngIf="branch.topIssues?.length > 0">
              <div class="card-header-inner">
                <h3 class="card-title">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" stroke-width="2"><path d="M12 2v4"/><path d="M12 18v4"/><path d="M4.93 4.93l2.83 2.83"/><path d="M16.24 16.24l2.83 2.83"/><path d="M2 12h4"/><path d="M18 12h4"/><path d="M4.93 19.07l2.83-2.83"/><path d="M16.24 7.76l2.83-2.83"/></svg>
                  Gợi ý Hành động từ AI
                </h3>
              </div>
              <div style="padding: var(--space-4) var(--space-5);">
                <div style="display: flex; flex-direction: column; gap: 12px;">
                  <div *ngFor="let issue of branch.topIssues.slice(0, 3)" style="padding: 12px; background: rgba(59, 130, 246, 0.05); border-left: 3px solid var(--color-primary); border-radius: 4px;">
                    <div style="font-weight: 600; color: var(--color-text); font-size: 14px; margin-bottom: 4px;">
                      Vấn đề: {{ issue.issue }}
                    </div>
                    <div style="font-size: 13px; color: var(--color-text-secondary); line-height: 1.5;">
                      {{ getAIAdvice(issue.issue) }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Recent Reviews -->
          <div class="card full-width" style="margin-top: var(--space-5);">
            <div class="card-header-inner">
              <h3 class="card-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" stroke-width="2"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>
                Review gần đây
              </h3>
            </div>
            <div class="review-list" *ngIf="branch.recentReviews?.length > 0; else noReviews">
              @for (r of branch.recentReviews; track r.reviewId) {
                <div class="review-item" [class.neg]="r.label === 0" [class.pos]="r.label === 1">
                  <div class="review-header">
                    <span class="review-stars">
                      @for (s of getStarsArray(r.stars); track s) {
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="var(--color-accent)" stroke="var(--color-accent)" stroke-width="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                      }
                    </span>
                    <span class="review-label"
                      [class.label-neg]="r.label === 0"
                      [class.label-pos]="r.label === 1">
                      {{ r.label === 1 ? 'Tích cực' : 'Tiêu cực' }}
                    </span>
                    <span class="review-ai" *ngIf="r.aiSentimentSummary">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>
                      {{ r.aiSentimentSummary }}
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
      </div>

    <ng-template #loading>
      <div class="loading-state">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
        <p>Đang tải dữ liệu chi nhánh...</p>
      </div>
    </ng-template>
  `,
  styles: [`
    .branch-detail {
      width: 100%;
      animation: fadeInUp 0.4s ease-out;
    }

    .header-row { margin-bottom: var(--space-2); }

    .back-link {
      color: var(--color-text-muted);
      font-size: var(--font-size-sm);
      text-decoration: none;
      transition: color var(--transition-fast);
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }

    .back-link:hover { color: var(--color-primary); }

    .branch-name {
      font-size: var(--font-size-2xl);
      font-weight: 800;
      color: var(--color-text);
      letter-spacing: -0.03em;
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }

    .branch-sub {
      color: var(--color-text-muted);
      font-size: var(--font-size-sm);
      margin-bottom: var(--space-6);
    }

    /* KPI Grid */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: var(--space-4);
      margin-bottom: var(--space-6);
    }

    @media (max-width: 900px) {
      .kpi-grid { grid-template-columns: repeat(3, 1fr); }
    }

    .kpi-card {
      text-align: center;
      padding: var(--space-5) var(--space-3);
      border-radius: var(--radius-lg);
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      transition: box-shadow var(--transition-base);
    }

    .kpi-card:hover { box-shadow: var(--shadow-sm); }
    .kpi-card.risk { border-bottom: 3px solid var(--color-danger); }
    .kpi-card.good { border-bottom: 3px solid var(--color-success); }

    .kpi-value {
      font-size: var(--font-size-xl);
      font-weight: 800;
      color: var(--color-text);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
    }

    .kpi-label {
      font-size: var(--font-size-xs);
      color: var(--color-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    /* Grid */
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--space-5);
      margin-bottom: var(--space-5);
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

    .card-header-inner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--space-4) var(--space-5);
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

    .issue-count-label {
      font-size: var(--font-size-xs);
      color: var(--color-text-muted);
    }

    .chart-container {
      height: 220px;
      position: relative;
      padding: var(--space-4);
    }

    /* Star Distribution */
    .star-bars {
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
      padding: var(--space-4) var(--space-5);
    }

    .star-row { display: flex; align-items: center; gap: var(--space-3); }

    .star-label {
      width: 50px;
      font-size: var(--font-size-sm);
      color: var(--color-text-secondary);
      text-align: right;
      font-weight: 500;
    }

    .star-bar-bg {
      flex: 1;
      height: 22px;
      border-radius: var(--radius-sm);
      background: var(--color-bg);
      overflow: hidden;
    }

    .star-bar-fill {
      height: 100%;
      border-radius: var(--radius-sm);
      transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .star-high { background: linear-gradient(90deg, var(--pl-green), var(--pl-green-light)); }
    .star-mid { background: linear-gradient(90deg, var(--color-warning), #fbbf24); }
    .star-low { background: linear-gradient(90deg, var(--color-danger), #f87171); }

    .star-count {
      min-width: 40px;
      font-size: var(--font-size-sm);
      color: var(--color-text-secondary);
      font-weight: 700;
    }

    /* Top Issues */
    .issue-list {
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
      padding: var(--space-4) var(--space-5);
    }

    .issue-row { display: flex; align-items: center; gap: var(--space-3); }

    .issue-rank {
      font-size: var(--font-size-xs);
      color: var(--color-warning);
      font-weight: 700;
      min-width: 24px;
    }

    .issue-name {
      width: 80px;
      font-size: var(--font-size-sm);
      color: var(--color-text);
      font-weight: 500;
      text-align: right;
    }

    .issue-bar-bg {
      flex: 1;
      height: 20px;
      border-radius: var(--radius-sm);
      background: var(--color-bg);
      overflow: hidden;
    }

    .issue-bar-fill {
      height: 100%;
      border-radius: var(--radius-sm);
      background: linear-gradient(90deg, var(--color-danger), #fb923c);
      transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .issue-count {
      min-width: 30px;
      font-size: var(--font-size-sm);
      color: var(--color-text-secondary);
      font-weight: 700;
    }

    /* Review List */
    .review-list {
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
      max-height: 500px;
      overflow-y: auto;
      padding: var(--space-4) var(--space-5);
    }

    .review-item {
      padding: var(--space-4);
      border-radius: var(--radius-md);
      background: var(--color-bg);
      border: 1px solid var(--color-border-light);
      transition: all var(--transition-fast);
    }

    .review-item:hover { border-color: var(--color-border); }
    .review-item.neg { border-left: 3px solid var(--color-danger); }
    .review-item.pos { border-left: 3px solid var(--color-success); }

    .review-header {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      margin-bottom: var(--space-2);
      flex-wrap: wrap;
    }

    .review-stars { display: flex; gap: 1px; }

    .review-label {
      font-size: 11px;
      padding: 2px 8px;
      border-radius: var(--radius-full);
      font-weight: 600;
    }

    .label-pos { background: var(--color-success-bg); color: var(--color-success); }
    .label-neg { background: var(--color-danger-bg); color: var(--color-danger); }

    .review-ai {
      font-size: 11px;
      color: var(--color-text-muted);
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .review-date { font-size: 11px; color: var(--color-text-muted); margin-left: auto; }

    .review-text {
      font-size: var(--font-size-sm);
      color: var(--color-text);
      line-height: 1.6;
      max-height: 60px;
      overflow: hidden;
    }

    .loading-state {
      text-align: center;
      padding: var(--space-12);
      color: var(--color-text-muted);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-4);
    }

    .loading-state svg {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    .empty {
      color: var(--color-text-muted);
      text-align: center;
      padding: var(--space-6);
    }

    /* Session Risk */
    .session-risk-wrapper {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: var(--space-4);
      padding: var(--space-5);
    }
    
    @media (max-width: 768px) {
      .session-risk-wrapper { grid-template-columns: repeat(2, 1fr); }
    }

    .session-block {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }

    .session-name {
      font-size: var(--font-size-sm);
      font-weight: 600;
      color: var(--color-text-secondary);
      text-align: center;
    }

    .session-box {
      border-radius: var(--radius-md);
      padding: var(--space-4) var(--space-2);
      text-align: center;
      color: white;
      transition: transform var(--transition-fast);
    }
    
    .session-box:hover {
      transform: translateY(-2px);
    }

    .session-rate {
      font-size: var(--font-size-xl);
      font-weight: 800;
      margin-bottom: 4px;
      text-shadow: 0 1px 2px rgba(0,0,0,0.2);
    }

    .session-count {
      font-size: 11px;
      opacity: 0.9;
    }
  `],
})
export class BranchDetailComponent implements OnInit, AfterViewInit {
  @ViewChild('trendCanvas') trendCanvas!: ElementRef<HTMLCanvasElement>;

  branch: any = null;
  private trendChart: Chart | null = null;
  private maxStars = 0;
  private maxIssues = 0;
  daysFilter: number | null = null;
  placeId: string = '';

  constructor(private api: ApiService, private route: ActivatedRoute) { }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const pId = params.get('placeId');
      if (pId) {
        this.placeId = pId;
        this.loadBranch();
      }
    });
  }

  ngAfterViewInit() { }

  onFilterChange() {
    this.loadBranch();
  }

  loadBranch() {
    if (!this.placeId) return;
    this.api.getBranchDetail(this.placeId, { days: this.daysFilter }).subscribe({
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

  getSessionColor(negativeRate: number): string {
    if (negativeRate === 0) return '#10B981'; // green for 0%
    if (negativeRate < 10) return '#34D399'; // light green
    if (negativeRate < 20) return '#FBBF24'; // yellow
    if (negativeRate < 30) return '#F59E0B'; // orange
    if (negativeRate < 50) return '#EF4444'; // red
    return '#B91C1C'; // dark red
  }

  getStarPercent(star: number): number {
    return ((this.branch?.starDistribution?.[star] || 0) / this.maxStars) * 100;
  }

  getIssuePercent(count: number): number {
    return (count / this.maxIssues) * 100;
  }

  getStarsArray(n: number): number[] { return Array(n).fill(0); }

  getAIAdvice(issueName: string): string {
    const issueMap: Record<string, string> = {
      'Thái độ': 'Cần tổ chức buổi đào tạo lại về thái độ phục vụ khách hàng. Yêu cầu nhân viên luôn giữ thái độ niềm nở và sẵn sàng hỗ trợ khách.',
      'Phục vụ chậm': 'Xem xét bổ sung nhân sự vào các khung giờ cao điểm (như buổi tối hoặc cuối tuần). Tối ưu hóa quy trình order và pha chế để giảm thời gian chờ.',
      'Không gian': 'Kiểm tra lại bố trí bàn ghế và âm thanh. Đảm bảo dọn dẹp thường xuyên vào giờ cao điểm để không gian luôn gọn gàng.',
      'Vệ sinh': 'Tăng cường tần suất dọn dẹp vệ sinh, đặc biệt là khu vực bàn khách và nhà vệ sinh. Rà soát quy trình quản lý côn trùng định kỳ.',
      'Giá cả': 'Rà soát lại chất lượng đồ uống/món ăn so với giá tiền. Cân nhắc tung ra các chương trình combo hoặc thẻ thành viên để tăng giá trị cảm nhận.',
      'Order sai': 'Nhấn mạnh việc nhân viên order phải nhắc lại đơn cho khách trước khi in bill. Dán nhãn rõ ràng lên từng món.',
      'Đồ uống': 'Kiểm tra lại công thức và tay nghề của barista. Đảm bảo nguyên liệu luôn tươi mới và tuân thủ đúng định lượng tiêu chuẩn.'
    };
    return issueMap[issueName] || 'Cần phân tích sâu hơn về nguyên nhân gốc rễ và làm việc trực tiếp với đội ngũ tại chi nhánh.';
  }

  renderTrendChart() {
    if (!this.trendCanvas?.nativeElement || !this.branch?.monthlyTrend?.length) return;
    if (this.trendChart) this.trendChart.destroy();

    const labels = this.branch.monthlyTrend.map((t: any) => t.period);
    const negRateData = this.branch.monthlyTrend.map((t: any) => t.negativeRate);
    const ctx = this.trendCanvas.nativeElement.getContext('2d')!;
    const gradient = ctx.createLinearGradient(0, 0, 0, 200);
    gradient.addColorStop(0, 'rgba(220, 38, 38, 0.15)');
    gradient.addColorStop(1, 'transparent');

    this.trendChart = new Chart(this.trendCanvas.nativeElement, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Tỷ lệ tiêu cực (%)',
          data: negRateData,
          borderColor: '#DC2626',
          backgroundColor: gradient,
          borderWidth: 2.5,
          pointRadius: 3,
          pointBackgroundColor: '#fff',
          pointBorderColor: '#DC2626',
          pointBorderWidth: 2,
          tension: 0.4,
          fill: true,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
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
            ticks: { color: '#94A3B8', maxTicksLimit: 8 },
            grid: { color: '#F1F5F9' },
          },
          y: {
            ticks: { color: '#94A3B8', callback: v => `${v}%` },
            grid: { color: '#F1F5F9' },
          },
        },
      },
    });
  }
}
