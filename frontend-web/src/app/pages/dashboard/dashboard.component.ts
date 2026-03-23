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
    <div class="kv-wrapper">
      <!-- TOP ACTION BAR -->
      <div class="kv-header-row">
        <div class="kv-title-area">
          <h2>Tổng quan</h2>
        </div>
        <div class="kv-top-actions">
          <!-- Status Strip (compact, in header row) -->
          <div class="status-strip">
            <span class="kpi-pill">
              <strong>{{ overview?.sentimentScore || '—' }}%</strong> Sentiment
            </span>
            <span class="kpi-sep">|</span>
            <span class="kpi-pill warn">
              <strong>{{ overview?.negativeCount || '0' }}</strong> Cảnh báo
            </span>
            <span class="kpi-sep">|</span>
            <span class="kpi-pill">
              <strong>{{ overview?.avgStars || '—' }}★</strong> TB
            </span>
          </div>
          <button class="btn-outline" routerLink="/alerts">
            Xem cảnh báo →
          </button>
          <div class="report-dropdown">
            <button class="btn-outline" (click)="showReportMenu = !showReportMenu">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Xuất báo cáo
            </button>
            <div class="report-menu" *ngIf="showReportMenu">
              <a class="report-item" (click)="downloadReport('weekly', 'pdf'); showReportMenu = false">Báo cáo Tuần (PDF)</a>
              <a class="report-item" (click)="downloadReport('weekly', 'xlsx'); showReportMenu = false">Báo cáo Tuần (Excel)</a>
              <a class="report-item" (click)="downloadReport('monthly', 'pdf'); showReportMenu = false">Báo cáo Tháng (PDF)</a>
              <a class="report-item" (click)="downloadReport('monthly', 'xlsx'); showReportMenu = false">Báo cáo Tháng (Excel)</a>
            </div>
          </div>
          <div class="settings-icons">
            <button class="icon-btn"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg></button>
          </div>
        </div>
      </div>

      <div class="kv-body-row">
        <!-- SIDEBAR -->
        <div class="kv-sidebar">
          <div class="filter-box">
            <div class="filter-title">Thời gian</div>
            <div class="filter-content">
              <select>
                <option>Hôm nay</option>
                <option>Hôm qua</option>
                <option>Tuần này</option>
                <option>Tháng này</option>
              </select>
            </div>
          </div>

          <div class="filter-box">
            <div class="filter-title">Khu vực <a class="filter-link">Tạo mới</a></div>
            <div class="filter-content">
              <label class="radio-label active">
                <input type="radio" name="region" checked> Toàn hệ thống Hà Nội
              </label>
            </div>
          </div>

          <div class="filter-box">
            <div class="filter-title">Thông tin nhanh</div>
            <div class="filter-content">
              <div class="stat-row"><span class="s-label">Tổng đánh giá</span><span class="s-val">{{ overview?.totalReviews | number }}</span></div>
              <div class="stat-row"><span class="s-label">Tích cực</span><span class="s-val green">{{ overview?.positiveCount | number }}</span></div>
              <div class="stat-row"><span class="s-label">Tiêu cực</span><span class="s-val red">{{ overview?.negativeCount | number }}</span></div>
              <div class="stat-row"><span class="s-label">Phản hồi</span><span class="s-val">{{ overview?.responseRate }}%</span></div>
            </div>
          </div>

          <div class="filter-box">
            <div class="filter-title">Cập nhật</div>
            <div class="filter-content">
              <span style="font-size: 12px; color: #888;">Lần cuối: Hôm nay</span>
            </div>
          </div>
        </div>

        <!-- CONTENT AREA -->
        <div class="kv-content-area">
          <!-- KPI Row — compact cards -->
          <div class="kpi-row">
            <div class="kpi-card">
              <div class="kpi-icon" style="background: #def7ec; color: #03543f;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>
              </div>
              <div class="kpi-body">
                <span class="kpi-value">{{ overview?.sentimentScore || '—' }}<small>%</small></span>
                <span class="kpi-label">Sentiment Score</span>
              </div>
              <span class="kpi-trend good" *ngIf="overview?.sentimentScore >= 70">▲ Tốt</span>
            </div>

            <div class="kpi-card">
              <div class="kpi-icon" style="background: #fef3c7; color: #92400e;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              </div>
              <div class="kpi-body">
                <span class="kpi-value">{{ overview?.avgStars || '—' }}</span>
                <span class="kpi-label">Điểm TB</span>
              </div>
            </div>

            <div class="kpi-card danger">
              <div class="kpi-icon" style="background: #fde8e8; color: #c81e1e;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m21 21-6-6m6 6v-4.8m0 4.8h-4.8"/><path d="M3 16.2V21m0 0h4.8M3 21l6-6"/><path d="M21 7.8V3m0 0h-4.8M21 3l-6 6"/><path d="M3 7.8V3m0 0h4.8M3 3l6 6"/></svg>
              </div>
              <div class="kpi-body">
                <span class="kpi-value">{{ overview?.negativeRate || '—' }}<small>%</small></span>
                <span class="kpi-label">Tỷ lệ tiêu cực</span>
              </div>
              <span class="kpi-trend bad" *ngIf="overview?.negativeRate > 20">▼ Cao</span>
            </div>

            <div class="kpi-card">
              <div class="kpi-icon" style="background: #e0e7ff; color: #4338ca;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
              </div>
              <div class="kpi-body">
                <span class="kpi-value">{{ overview?.healthScore || '—' }}</span>
                <span class="kpi-label">Health Score</span>
              </div>
            </div>
          </div>

          <!-- Insight Narrative Block -->
          <div class="insight-panel" *ngIf="insightsLoaded">
            <div class="insight-header">
              <span class="insight-title">📊 Insight tự động</span>
              <span class="insight-badge" [class.conf-high]="true">AI-generated</span>
            </div>
            <div class="insight-list" *ngIf="insights.length > 0; else insightEmpty">
              <div class="insight-item" *ngFor="let ins of insights">
                <span class="insight-icon">{{ ins.icon }}</span>
                <span class="insight-text">{{ ins.text }}</span>
                <span class="conf-badge" [class.conf-high]="ins.confidence==='high'" [class.conf-medium]="ins.confidence==='medium'" [class.conf-low]="ins.confidence==='low'">{{ ins.confidence }}</span>
              </div>
            </div>
            <ng-template #insightEmpty>
              <div class="insight-empty">
                <span>⚠️</span>
                <span>{{ insightsError ? 'Không thể tải insight. Vui lòng thử lại sau.' : 'Chưa đủ dữ liệu để sinh insight tự động.' }}</span>
              </div>
            </ng-template>
          </div>

          <!-- Charts Grid -->
          <div class="panel-grid">
            <!-- Trend Chart -->
            <div class="panel chart-panel">
              <div class="panel-header">
                <h3 class="panel-title">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0070f4" stroke-width="2"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
                  Xu hướng tỷ lệ tiêu cực
                </h3>
              </div>
              <div class="chart-container" *ngIf="trendData.length > 0; else emptyChart">
                <canvas #trendCanvas></canvas>
              </div>
              <ng-template #emptyChart>
                <div class="empty-state">
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#aaa" stroke-width="1.5"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>
                  <p>Chưa có dữ liệu xu hướng.</p>
                </div>
              </ng-template>
            </div>

            <!-- Star Distribution -->
            <div class="panel">
              <div class="panel-header">
                <h3 class="panel-title">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                  Phân phối sao
                </h3>
              </div>
              <div class="dist-bars">
                @for (item of distribution; track item.stars) {
                  <div class="bar-row">
                    <span class="bar-label">{{ item.stars }} sao</span>
                    <div class="bar-track">
                      <div class="bar-fill"
                        [class.bar-pos]="item.stars >= 4"
                        [class.bar-neg]="item.stars <= 3"
                        [style.width.%]="getBarWidth(item.count)"></div>
                    </div>
                    <span class="bar-count">{{ item.count }}</span>
                  </div>
                }
              </div>
            </div>
          </div>

          <!-- Branch Ranking -->
          <div class="panel" style="margin-top: 16px;">
            <div class="panel-header">
              <h3 class="panel-title">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc3545" stroke-width="2"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
                Xếp hạng chi nhánh
              </h3>
              <span class="panel-desc">Health Score — Thấp → Cao</span>
            </div>
            <table class="branch-table">
              <thead>
                <tr>
                  <th class="col-rank">#</th>
                  <th class="col-name">Chi nhánh</th>
                  <th class="col-score">Health</th>
                  <th class="col-stars">Sao TB</th>
                </tr>
              </thead>
              <tbody>
                @for (branch of branches?.data?.slice(0, 10); track branch.placeId; let i = $index) {
                  <tr class="branch-row-tr" [routerLink]="['/branches', branch.placeId]">
                    <td class="col-rank">
                      <span class="rank-badge" [class.rank-danger]="i < 3" [class.rank-warn]="i >= 3 && i < 5">{{ i + 1 }}</span>
                    </td>
                    <td class="col-name">{{ branch.branchAddress }}</td>
                    <td class="col-score" [class.score-low]="branch.healthScore < 2" [class.score-good]="branch.healthScore >= 3">{{ branch.healthScore }}</td>
                    <td class="col-stars">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" stroke-width="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                      {{ branch.avgStars }}
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* ─── KV SYSTEM LAYOUT ─── */
    .kv-wrapper {
      background: #f4f5f7;
      min-height: calc(100vh - 52px);
      display: flex; flex-direction: column;
      font-family: Arial, Helvetica, sans-serif;
    }

    /* TOP BAR — identical to /reviews */
    .kv-header-row { display: flex; padding: 12px 16px; gap: 16px; }
    .kv-title-area { width: 240px; flex-shrink: 0; display: flex; align-items: center; }
    .kv-title-area h2 { font-size: 1.15rem; font-weight: 700; color: #333; margin: 0; }
    .kv-top-actions { flex: 1; display: flex; align-items: center; gap: 10px; }

    .status-strip {
      display: flex; align-items: center; gap: 8px;
      background: #0C713D; color: white; padding: 5px 14px; border-radius: 4px;
      font-size: 13px;
    }
    .kpi-pill strong { font-size: 14px; font-weight: 700; }
    .kpi-pill.warn strong { color: #FFD54F; }
    .kpi-sep { opacity: 0.4; font-size: 12px; }

    .btn-outline {
      background: #fff; color: #333; border: 1px solid #ced4da; border-radius: 4px;
      padding: 6px 12px; font-size: 13px; font-weight: 600; cursor: pointer;
      display: flex; align-items: center; gap: 6px; text-decoration: none;
    }
    .btn-outline:hover { background: #f8f9fa; }

    .settings-icons { margin-left: auto; display: flex; gap: 6px; }
    .icon-btn {
      background: #fff; border: 1px solid #ced4da; padding: 5px; border-radius: 4px;
      cursor: pointer; color: #555; display: flex; align-items: center; justify-content: center;
    }
    .icon-btn:hover { background: #f0f0f0; }

    .report-dropdown { position: relative; }
    .report-menu {
      position: absolute; top: 100%; right: 0; margin-top: 4px;
      background: white; border: 1px solid #e0e4eb; border-radius: 4px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1); min-width: 200px; z-index: 50; overflow: hidden;
    }
    .report-item {
      display: block; padding: 9px 14px; font-size: 13px; color: #333; cursor: pointer;
    }
    .report-item:hover { background: #f0f4ff; color: #0070f4; }

    /* BODY ROW */
    .kv-body-row { display: flex; flex: 1; padding: 0 16px 16px 16px; gap: 16px; align-items: flex-start; }

    /* SIDEBAR — same 200px width */
    .kv-sidebar { width: 240px; flex-shrink: 0; display: flex; flex-direction: column; gap: 12px; }
    .filter-box {
      background: #fff; border-radius: 4px; box-shadow: 0 1px 2px rgba(0,0,0,0.04);
      border: 1px solid #e0e4eb;
    }
    .filter-title {
      padding: 10px 12px; font-size: 13px; font-weight: 700; color: #333;
      display: flex; justify-content: space-between; align-items: center;
    }
    .filter-link { font-size: 11px; color: #0070f4; cursor: pointer; font-weight: 400; }
    .filter-content {
      padding: 0 12px 12px 12px; display: flex; flex-direction: column; gap: 6px;
    }
    .filter-content select {
      width: 100%; padding: 7px 10px; border: 1px solid #ced4da; border-radius: 3px;
      font-size: 13px; background: #fff; cursor: pointer;
    }
    .radio-label {
      font-size: 13px; color: #444; display: flex; align-items: center; gap: 6px; cursor: pointer;
      padding: 4px 6px; border-radius: 3px; transition: 0.15s;
    }
    .radio-label:hover { background: #f0f4ff; }
    .radio-label.active { color: #0070f4; font-weight: 600; }

    .stat-row { display: flex; justify-content: space-between; font-size: 13px; color: #555; padding: 2px 0; }
    .s-val { font-weight: 700; color: #333; }
    .s-val.green { color: #059669; }
    .s-val.red { color: #dc3545; }

    /* CONTENT AREA */
    .kv-content-area { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 16px; }

    /* KPI ROW — compact, horizontal */
    .kpi-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
    .kpi-card {
      background: #fff; border: 1px solid #e0e4eb; border-radius: 4px;
      padding: 14px 16px; display: flex; align-items: center; gap: 12px;
      box-shadow: 0 1px 2px rgba(0,0,0,0.04); transition: 0.15s;
    }
    .kpi-card:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .kpi-card.danger { border-top: 3px solid #dc3545; }
    .kpi-icon {
      width: 40px; height: 40px; border-radius: 4px;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .kpi-body { display: flex; flex-direction: column; flex: 1; }
    .kpi-value { font-size: 1.5rem; font-weight: 800; color: #333; line-height: 1.1; }
    .kpi-value small { font-size: 0.875rem; color: #888; margin-left: 1px; }
    .kpi-label { font-size: 12px; color: #888; margin-top: 2px; }
    .kpi-trend { font-size: 11px; font-weight: 700; padding: 2px 6px; border-radius: 3px; }
    .kpi-trend.good { background: #def7ec; color: #03543f; }
    .kpi-trend.bad { background: #fde8e8; color: #c81e1e; }

    /* PANELS — compact, bordered */
    .panel {
      background: #fff; border-radius: 4px; border: 1px solid #e0e4eb;
      box-shadow: 0 1px 2px rgba(0,0,0,0.04); overflow: hidden;
    }
    .panel-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 10px 16px; border-bottom: 1px solid #eee; background: #fafafa;
    }
    .panel-title {
      font-size: 13px; font-weight: 700; color: #333; margin: 0;
      display: flex; align-items: center; gap: 6px;
    }
    .panel-desc { font-size: 11px; color: #888; }

    .panel-grid { display: grid; grid-template-columns: 1.5fr 1fr; gap: 16px; }
    @media (max-width: 1024px) { .panel-grid { grid-template-columns: 1fr; } }

    .chart-container { height: 280px; position: relative; padding: 12px 16px; }
    .empty-state { padding: 32px; text-align: center; color: #888; display: flex; flex-direction: column; align-items: center; gap: 8px; }
    .empty-state p { font-size: 13px; }

    /* Star Distribution — compact */
    .dist-bars { padding: 12px 16px; }
    .bar-row { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
    .bar-row:last-child { margin-bottom: 0; }
    .bar-label { width: 44px; font-size: 12px; color: #555; font-weight: 500; }
    .bar-track { flex: 1; height: 22px; background: #f0f0f0; border-radius: 3px; overflow: hidden; }
    .bar-fill { height: 100%; border-radius: 3px; transition: width 0.6s; }
    .bar-pos { background: linear-gradient(90deg, #059669, #34d399); }
    .bar-neg { background: linear-gradient(90deg, #dc3545, #f87171); }
    .bar-count { width: 40px; text-align: right; font-size: 12px; font-weight: 700; color: #555; }

    /* Branch Ranking TABLE — proper KV-style table */
    .branch-table { width: 100%; border-collapse: collapse; }
    .branch-table th, .branch-table td {
      padding: 9px 10px; text-align: left; font-size: 13px; border-bottom: 1px solid #f0f0f0;
    }
    .branch-table th {
      background: #e9eaec; font-weight: 700; color: #333;
      border-bottom: 1px solid #ccc; font-size: 12px; text-transform: uppercase;
    }
    .branch-row-tr { cursor: pointer; transition: background 0.15s; }
    .branch-row-tr:hover { background: #f8fafd; }
    .col-rank { width: 50px; text-align: center; }
    .col-score { width: 70px; text-align: center; font-weight: 700; }
    .col-stars { width: 70px; text-align: center; }
    .col-stars svg { vertical-align: -1px; margin-right: 2px; }
    .rank-badge {
      display: inline-flex; align-items: center; justify-content: center;
      width: 24px; height: 24px; border-radius: 3px; font-size: 12px; font-weight: 700;
      background: #f0f0f0; color: #888;
    }
    .rank-danger { background: #fde8e8; color: #c81e1e; }
    .rank-warn { background: #fef3c7; color: #92400e; }
    .score-low { color: #dc3545; }
    .score-good { color: #059669; }

    /* INSIGHT NARRATIVE */
    .insight-panel {
      background: #fff; border: 1px solid #e0e4eb; border-radius: 4px;
      margin-bottom: 16px; overflow: hidden;
    }
    .insight-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 10px 14px; background: #f0f9ff; border-bottom: 1px solid #e0e4eb;
    }
    .insight-title { font-size: 13px; font-weight: 700; color: #1e40af; }
    .insight-badge {
      font-size: 10px; padding: 2px 8px; border-radius: 10px;
      background: #dbeafe; color: #1e40af; font-weight: 600;
    }
    .insight-list { padding: 10px 14px; display: flex; flex-direction: column; gap: 8px; }
    .insight-item {
      display: flex; align-items: flex-start; gap: 8px; font-size: 13px; color: #333;
      padding: 6px 8px; border-radius: 4px; background: #fafbfc;
    }
    .insight-icon { font-size: 16px; flex-shrink: 0; }
    .insight-text { flex: 1; line-height: 1.45; }
    .conf-badge {
      font-size: 10px; padding: 2px 6px; border-radius: 8px;
      font-weight: 600; flex-shrink: 0; white-space: nowrap;
    }
    .conf-high { background: #def7ec; color: #03543f; }
    .conf-medium { background: #fef3c7; color: #92400e; }
    .conf-low { background: #fde8e8; color: #c81e1e; }
    .insight-empty {
      padding: 16px 14px; font-size: 13px; color: #888;
      display: flex; align-items: center; gap: 8px;
    }

    @media (max-width: 768px) {
      .kpi-row { grid-template-columns: repeat(2, 1fr); }
    }
  `]
})
export class DashboardComponent implements OnInit {
  @ViewChild('trendCanvas') trendCanvas!: ElementRef<HTMLCanvasElement>;

  overview: any = null;
  distribution: any[] = [];
  branches: any = null;
  trendData: any[] = [];
  insights: any[] = [];
  insightsLoaded = false;
  insightsError = false;

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
    this.api.getInsights().subscribe({
      next: data => {
        this.insights = data?.insights || [];
        this.insightsLoaded = true;
      },
      error: () => {
        this.insightsError = true;
        this.insightsLoaded = true;
      },
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

    if (this.trendChart) { this.trendChart.destroy(); }

    const labels = this.trendData.map((t: any) => t.period);
    const negativeRates = this.trendData.map((t: any) => t.negativeRate);

    const gradient = ctx.createLinearGradient(0, 0, 0, 260);
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
          borderWidth: 2, pointRadius: 3,
          pointBackgroundColor: '#fff',
          pointBorderColor: '#DC2626',
          pointBorderWidth: 2,
          fill: true, tension: 0.4,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: {
            labels: { color: '#475569', font: { size: 11, weight: '500' as any }, usePointStyle: true, pointStyle: 'circle' }
          },
          tooltip: {
            backgroundColor: '#fff', titleColor: '#0F172A', bodyColor: '#475569',
            borderColor: '#E2E8F0', borderWidth: 1, padding: 10, cornerRadius: 6,
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
          x: { ticks: { color: '#94A3B8', font: { size: 11 }, maxTicksLimit: 20 }, grid: { color: '#F1F5F9' } },
          y: {
            min: 0, max: 100,
            ticks: { color: '#94A3B8', font: { size: 11 }, callback: (value) => value + '%', stepSize: 20 },
            grid: { color: '#F1F5F9' },
          },
        },
      },
    });
  }
}
