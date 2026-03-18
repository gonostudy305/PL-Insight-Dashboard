import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="dashboard">
      <div class="director-header">
        <div class="status-bar">
          <span class="kpi-inline">
            <strong>{{ overview?.sentimentScore || '—' }}%</strong> Sentiment
          </span>
          <span class="divider">|</span>
          <span class="kpi-inline negative">
            <strong>{{ overview?.negativeCount || '0' }}</strong> Cảnh báo today
          </span>
          <span class="divider">|</span>
          <span class="kpi-inline">
            <strong>{{ overview?.avgStars || '—' }}★</strong> Điểm TB
          </span>
          <span class="cta">
            <button class="btn-action" routerLink="/alerts">Xem chi tiết →</button>
          </span>
        </div>
      </div>

      <!-- Page Header -->
      <div class="page-header">
        <div>
          <h2 class="page-title">Tổng quan hệ thống</h2>
          <p class="page-subtitle">Phúc Long Coffee & Tea — Khu vực Hà Nội</p>
        </div>
        <div class="header-actions">
          <div class="header-badge">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <span>Cập nhật lần cuối: Hôm nay</span>
          </div>
          <div class="report-dropdown">
            <button class="report-btn" (click)="showReportMenu = !showReportMenu">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
              Xuất báo cáo
            </button>
            <div class="report-menu" *ngIf="showReportMenu">
              <a class="report-item" (click)="downloadReport('weekly', 'pdf'); showReportMenu = false">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
                Báo cáo Tuần (PDF)
              </a>
              <a class="report-item" (click)="downloadReport('weekly', 'xlsx'); showReportMenu = false">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="17"/><line x1="16" y1="13" x2="8" y2="17"/></svg>
                Báo cáo Tuần (Excel)
              </a>
              <a class="report-item" (click)="downloadReport('monthly', 'pdf'); showReportMenu = false">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
                Báo cáo Tháng (PDF)
              </a>
              <a class="report-item" (click)="downloadReport('monthly', 'xlsx'); showReportMenu = false">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="17"/><line x1="16" y1="13" x2="8" y2="17"/></svg>
                Báo cáo Tháng (Excel)
              </a>
            </div>
          </div>
        </div>
      </div>

      <!-- KPI Cards -->
      <div class="kpi-grid">
        <div class="kpi-card" style="--kpi-accent: var(--color-success);">
          <div class="kpi-icon-wrap" style="background: var(--color-success-bg); color: var(--color-success);">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>
          </div>
          <div class="kpi-content">
            <span class="kpi-value">{{ overview?.sentimentScore || '—' }}<small>%</small></span>
            <span class="kpi-label">Sentiment Score</span>
          </div>
          <div class="kpi-trend positive" *ngIf="overview?.sentimentScore >= 70">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="18 15 12 9 6 15"/></svg>
            Tốt
          </div>
        </div>

        <div class="kpi-card" style="--kpi-accent: var(--color-accent);">
          <div class="kpi-icon-wrap" style="background: var(--color-accent-light); color: var(--color-warning);">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          </div>
          <div class="kpi-content">
            <span class="kpi-value">{{ overview?.avgStars || '—' }}</span>
            <span class="kpi-label">Điểm TB</span>
          </div>
        </div>

        <div class="kpi-card" style="--kpi-accent: var(--color-danger);">
          <div class="kpi-icon-wrap" style="background: var(--color-danger-bg); color: var(--color-danger);">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21 21-6-6m6 6v-4.8m0 4.8h-4.8"/><path d="M3 16.2V21m0 0h4.8M3 21l6-6"/><path d="M21 7.8V3m0 0h-4.8M21 3l-6 6"/><path d="M3 7.8V3m0 0h4.8M3 3l6 6"/></svg>
          </div>
          <div class="kpi-content">
            <span class="kpi-value">{{ overview?.negativeRate || '—' }}<small>%</small></span>
            <span class="kpi-label">Tỷ lệ tiêu cực</span>
          </div>
          <div class="kpi-trend negative" *ngIf="overview?.negativeRate > 20">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
            Cao
          </div>
        </div>

        <div class="kpi-card" style="--kpi-accent: var(--color-primary);">
          <div class="kpi-icon-wrap" style="background: var(--pl-green-50); color: var(--pl-green);">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
          </div>
          <div class="kpi-content">
            <span class="kpi-value">{{ overview?.healthScore || '—' }}</span>
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
          <span class="stat-number" style="color: var(--color-success);">{{ overview?.positiveCount | number }}</span>
          <span class="stat-label">Tích cực</span>
        </div>
        <div class="stat-box">
          <span class="stat-number" style="color: var(--color-danger);">{{ overview?.negativeCount | number }}</span>
          <span class="stat-label">Tiêu cực</span>
        </div>
        <div class="stat-box">
          <span class="stat-number" style="color: var(--color-primary);">{{ overview?.responseRate }}%</span>
          <span class="stat-label">Tỷ lệ phản hồi</span>
        </div>
      </div>

      <!-- Charts Grid -->
      <div class="charts-grid">
        <!-- Negative Rate Trend Chart -->
        <div class="card card-wide">
          <div class="card-header">
            <h3 class="card-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
              Xu hướng tỷ lệ tiêu cực theo tháng
            </h3>
          </div>
          <div class="chart-container" *ngIf="trendData.length > 0; else emptyChart">
            <canvas #trendCanvas></canvas>
          </div>
          <ng-template #emptyChart>
            <div class="empty-state">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>
              <p>Chưa có dữ liệu xu hướng. Vui lòng kiểm tra kết nối API.</p>
            </div>
          </ng-template>
        </div>

        <!-- Star Distribution -->
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              Phân phối mức sao
            </h3>
          </div>
          <div class="distribution-bars">
            @for (item of distribution; track item.stars) {
              <div class="bar-row">
                <span class="bar-label">{{ item.stars }} sao</span>
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
      </div>

      <!-- Branch Ranking -->
      <div class="card" style="margin-top: var(--space-6);">
        <div class="card-header">
          <h3 class="card-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-danger)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
            Xếp hạng chi nhánh
          </h3>
          <span class="card-subtitle">Health Score — Thấp → Cao</span>
        </div>
        <div class="branch-table">
          <div class="branch-table-header">
            <span class="col-rank">#</span>
            <span class="col-name">Chi nhánh</span>
            <span class="col-score">Health</span>
            <span class="col-stars">Sao TB</span>
          </div>
          @for (branch of branches?.data?.slice(0, 10); track branch.placeId; let i = $index) {
            <a class="branch-row" [routerLink]="['/branches', branch.placeId]">
              <span class="col-rank">
                <span class="rank-badge" [class.rank-danger]="i < 3" [class.rank-warning]="i >= 3 && i < 5">{{ i + 1 }}</span>
              </span>
              <span class="col-name">{{ branch.branchAddress }}</span>
              <span class="col-score" [class.score-low]="branch.healthScore < 2" [class.score-good]="branch.healthScore >= 3">{{ branch.healthScore }}</span>
              <span class="col-stars">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--color-accent)" stroke="var(--color-accent)" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                {{ branch.avgStars }}
              </span>
            </a>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard {
      max-width: 1200px;
      animation: fadeInUp 0.4s ease-out;
    }

    /* ─── Director Sticky Status Bar ─── */
    .status-bar {
      position: sticky;
      top: 0;
      z-index: 100;
      background: var(--pl-primary);
      color: white;
      padding: 0.625rem var(--spacing-lg);
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
      font-size: 0.9375rem;
      border-radius: var(--radius-md);
      margin-bottom: var(--space-6);
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    
    .status-bar .kpi-inline strong { font-size: 1.125rem; font-family: var(--font-mono); }
    .status-bar .kpi-inline.negative strong { color: #FFB74D; }
    .status-bar .divider { opacity: 0.4; }
    
    .status-bar .cta {
      margin-left: auto;
    }

    .status-bar .btn-action {
      background: rgba(255,255,255,0.15);
      color: white;
      border: 1px solid rgba(255,255,255,0.3);
      border-radius: var(--radius-sm);
      padding: 0.375rem 0.875rem;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: var(--transition);
    }
    
    .status-bar .btn-action:hover { background: rgba(255,255,255,0.25); }

    /* ─── Page Header ─── */
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

    .header-badge {
      display: flex;
      align-items: center;
      gap: 6px;
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-full);
      padding: 6px 14px;
      font-size: var(--font-size-xs);
      color: var(--color-text-muted);
    }

    /* ─── KPI Cards (Pro Layout) ─── */
    .kpi-grid {
      display: grid;
      grid-template-columns: 1.4fr 1fr 1.2fr 0.9fr;
      gap: 1.25rem;
      margin-bottom: var(--space-6);
    }

    .kpi-card {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: var(--space-5);
      display: flex;
      align-items: center;
      gap: var(--space-4);
      transition: all var(--transition-base);
      cursor: pointer;
      position: relative;
      overflow: hidden;
    }

    /* Sentiment Score (1st card) */
    .kpi-card:nth-child(1) {
      padding: 2rem 1.75rem;
      border-top: 4px solid var(--pl-dark-green);
    }
    .kpi-card:nth-child(1) .kpi-value {
      font-size: 3rem;
      font-weight: 800;
      letter-spacing: -1px;
    }
    .kpi-card:nth-child(1) .kpi-label {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: #666;
    }

    /* Tiêu cực (3rd card) */
    .kpi-card:nth-child(3) {
      padding: 1.5rem 1.25rem;
      border-top: 4px solid #C62828;
      background: #FFF8F8;
    }
    .kpi-card:nth-child(3) .kpi-value {
      font-size: 2.25rem;
      color: #C62828;
    }
    .kpi-card:nth-child(3) .kpi-icon-wrap {
      background: transparent !important;
    }

    /* Health Score (4th card) */
    .kpi-card:nth-child(4) {
      padding: 1.25rem 1rem;
      border-top: 3px solid #888;
    }
    .kpi-card:nth-child(4) .kpi-value {
      font-size: 1.875rem;
    }

    .kpi-card:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-card-hover);
      border-color: transparent;
    }

    .kpi-icon-wrap {
      width: 48px;
      height: 48px;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .kpi-content {
      display: flex;
      flex-direction: column;
      flex: 1;
    }

    .kpi-value {
      font-size: var(--font-size-xl);
      font-weight: 800;
      color: var(--color-text);
      letter-spacing: -0.02em;
      line-height: 1.1;
    }

    .kpi-value small {
      font-size: var(--font-size-md);
      font-weight: 600;
      color: var(--color-text-muted);
      margin-left: 1px;
    }

    .kpi-label {
      font-size: var(--font-size-sm);
      color: var(--color-text-secondary);
      margin-top: var(--space-1);
    }

    .kpi-trend {
      display: flex;
      align-items: center;
      gap: 3px;
      font-size: var(--font-size-xs);
      font-weight: 600;
      padding: 3px 8px;
      border-radius: var(--radius-full);
    }

    .kpi-trend.positive {
      background: var(--color-success-bg);
      color: var(--color-success);
    }

    .kpi-trend.negative {
      background: var(--color-danger-bg);
      color: var(--color-danger);
    }

    /* ─── Stats Row ─── */
    .stats-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: var(--space-4);
      margin-bottom: var(--space-6);
    }

    .stat-box {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      padding: var(--space-4) var(--space-5);
      text-align: center;
      transition: box-shadow var(--transition-base);
    }

    .stat-box:hover {
      box-shadow: var(--shadow-sm);
    }

    .stat-number {
      display: block;
      font-size: var(--font-size-xl);
      font-weight: 700;
      color: var(--color-text);
    }

    .stat-label {
      font-size: var(--font-size-xs);
      color: var(--color-text-muted);
      margin-top: 2px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    /* ─── Cards ─── */
    .card {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      overflow: hidden;
    }

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

    .card-subtitle {
      font-size: var(--font-size-xs);
      color: var(--color-text-muted);
      background: var(--color-bg);
      padding: 3px 10px;
      border-radius: var(--radius-full);
    }

    /* ─── Charts Grid ─── */
    .charts-grid {
      display: grid;
      grid-template-columns: 1.5fr 1fr;
      gap: var(--space-6);
    }

    .card-wide {
      grid-column: 1;
    }

    /* ─── Chart Container ─── */
    .chart-container {
      padding: var(--space-6);
      position: relative;
      height: 320px;
    }

    .empty-state {
      padding: var(--space-12) var(--space-6);
      text-align: center;
      color: var(--color-text-muted);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-3);
    }

    .empty-state p {
      font-size: var(--font-size-base);
    }

    /* ─── Star Distribution ─── */
    .distribution-bars {
      padding: var(--space-5) var(--space-6);
    }

    .bar-row {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      margin-bottom: var(--space-3);
    }

    .bar-row:last-child {
      margin-bottom: 0;
    }

    .bar-label {
      width: 48px;
      font-size: var(--font-size-sm);
      color: var(--color-text-secondary);
      font-weight: 500;
    }

    .bar-track {
      flex: 1;
      height: 28px;
      background: var(--color-bg);
      border-radius: var(--radius-sm);
      overflow: hidden;
    }

    .bar-fill {
      height: 100%;
      border-radius: var(--radius-sm);
      transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .bar-positive {
      background: linear-gradient(90deg, var(--pl-green), var(--pl-green-light));
    }

    .bar-negative {
      background: linear-gradient(90deg, #ef4444, #f87171);
    }

    .bar-count {
      width: 50px;
      text-align: right;
      font-size: var(--font-size-sm);
      font-weight: 600;
      color: var(--color-text-secondary);
    }

    /* ─── Branch Ranking Table ─── */
    .branch-table {
      padding: 0;
    }

    .branch-table-header {
      display: grid;
      grid-template-columns: 56px 1fr 80px 80px;
      padding: var(--space-3) var(--space-6);
      background: var(--color-bg);
      font-size: var(--font-size-xs);
      font-weight: 600;
      color: var(--color-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .branch-row {
      display: grid;
      grid-template-columns: 56px 1fr 80px 80px;
      align-items: center;
      padding: var(--space-3) var(--space-6);
      border-top: 1px solid var(--color-border-light);
      transition: background var(--transition-fast);
      text-decoration: none;
      color: inherit;
      cursor: pointer;
    }

    .branch-row:hover {
      background: var(--color-surface-hover);
    }

    .rank-badge {
      width: 28px;
      height: 28px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--radius-sm);
      font-size: var(--font-size-sm);
      font-weight: 700;
      background: var(--color-bg);
      color: var(--color-text-muted);
    }

    .rank-danger {
      background: var(--color-danger-bg);
      color: var(--color-danger);
    }

    .rank-warning {
      background: var(--color-warning-bg);
      color: var(--color-warning);
    }

    .col-name {
      font-size: var(--font-size-base);
      color: var(--color-text);
      font-weight: 500;
    }

    .col-score {
      font-size: var(--font-size-base);
      font-weight: 700;
      color: var(--color-text);
      text-align: center;
    }

    .score-low {
      color: var(--color-danger);
    }

    .score-good {
      color: var(--color-success);
    }

    .col-stars {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: var(--font-size-sm);
      color: var(--color-text-secondary);
      justify-content: center;
    }

    /* ─── Responsive ─── */
    @media (max-width: 1024px) {
      .charts-grid {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 768px) {
      .kpi-grid {
        grid-template-columns: repeat(2, 1fr);
      }
      .stats-row {
        grid-template-columns: repeat(2, 1fr);
      }
      .page-header {
        flex-direction: column;
        gap: var(--space-3);
      }
      .branch-table-header,
      .branch-row {
        grid-template-columns: 44px 1fr 64px 64px;
      }
    }

    .header-actions { display: flex; align-items: center; gap: var(--space-3); }

    .report-dropdown { position: relative; }

    .report-btn {
      display: flex; align-items: center; gap: 8px;
      padding: 8px 16px; border-radius: var(--radius-md);
      border: 1px solid var(--color-border); background: white;
      color: var(--color-text); font-size: var(--font-size-sm);
      font-weight: 600; cursor: pointer;
      transition: all var(--transition-base);
    }
    .report-btn:hover { border-color: var(--color-primary); color: var(--color-primary); }

    .report-menu {
      position: absolute; top: 100%; right: 0; margin-top: 4px;
      background: white; border: 1px solid var(--color-border);
      border-radius: var(--radius-md); box-shadow: var(--shadow-lg);
      min-width: 200px; z-index: 50; overflow: hidden;
    }

    .report-item {
      display: flex; align-items: center; gap: 10px;
      padding: 10px 16px; font-size: 13px; font-weight: 500;
      color: var(--color-text); cursor: pointer;
      transition: background var(--transition-fast);
    }
    .report-item:hover { background: var(--color-bg); color: var(--color-primary); }
  `],
})
export class DashboardComponent implements OnInit {
  @ViewChild('trendCanvas') trendCanvas!: ElementRef<HTMLCanvasElement>;

  overview: any = null;
  distribution: any[] = [];
  branches: any = null;
  trendData: any[] = [];

  private trendChart: Chart | null = null;

  constructor(private api: ApiService, private auth: AuthService) { }

  showReportMenu = false;

  ngOnInit() {
    this.api.getOverview().subscribe(data => this.overview = data);
    this.api.getDistribution().subscribe(data => this.distribution = data);
    this.api.getBranches().subscribe(data => this.branches = data);
    this.api.getTrends().subscribe(data => {
      this.trendData = data || [];
      setTimeout(() => this.renderTrendChart(), 100);
    });
  }

  downloadReport(type: 'weekly' | 'monthly', format: 'pdf' | 'xlsx' = 'pdf') {
    const token = this.auth.getToken();
    const url = `http://localhost:3000/api/reports/${type}.${format}`;
    const xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.responseType = 'blob';
    xhr.onload = () => {
      if (xhr.status === 200) {
        const mimeType = format === 'pdf'
          ? 'application/pdf'
          : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        const blob = new Blob([xhr.response], { type: mimeType });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `PL-Insight_${type}_${new Date().toISOString().slice(0, 10)}.${format}`;
        a.click();
        URL.revokeObjectURL(a.href);
      }
    };
    xhr.send();
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

    // Brand-themed gradient fill
    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, 'rgba(220, 38, 38, 0.15)');
    gradient.addColorStop(1, 'rgba(220, 38, 38, 0.01)');

    this.trendChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Tỷ lệ tiêu cực (%)',
          data: negativeRates,
          borderColor: '#DC2626',
          backgroundColor: gradient,
          borderWidth: 2.5,
          pointRadius: 3,
          pointHoverRadius: 7,
          pointBackgroundColor: '#fff',
          pointBorderColor: '#DC2626',
          pointBorderWidth: 2,
          pointHoverBackgroundColor: '#DC2626',
          pointHoverBorderColor: '#fff',
          pointHoverBorderWidth: 2,
          fill: true,
          tension: 0.4,
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
              color: '#475569',
              font: { size: 12, weight: '500' as any },
              padding: 16,
              usePointStyle: true,
              pointStyle: 'circle',
            },
          },
          tooltip: {
            backgroundColor: '#fff',
            titleColor: '#0F172A',
            bodyColor: '#475569',
            borderColor: '#E2E8F0',
            borderWidth: 1,
            padding: 14,
            cornerRadius: 10,
            titleFont: { size: 13, weight: '600' as any },
            bodyFont: { size: 12 },
            boxPadding: 4,
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
              color: '#94A3B8',
              font: { size: 11 },
              maxRotation: 45,
              autoSkip: true,
              maxTicksLimit: 20,
            },
            grid: {
              color: '#F1F5F9',
            },
          },
          y: {
            min: 0,
            max: 100,
            ticks: {
              color: '#94A3B8',
              font: { size: 11 },
              callback: (value) => value + '%',
              stepSize: 20,
            },
            grid: {
              color: '#F1F5F9',
            },
          },
        },
      },
    });
  }
}
