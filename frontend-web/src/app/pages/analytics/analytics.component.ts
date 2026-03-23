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
    <div class="analytics-page">
      <!-- HEADER BAR -->
      <div class="page-header">
        <h1 class="page-title">Phân tích</h1>
        <div class="header-filters">
          <div class="filter-chip">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            <select>
              <option>30 ngày gần nhất</option>
              <option>7 ngày gần nhất</option>
              <option>90 ngày gần nhất</option>
              <option>Toàn bộ</option>
            </select>
          </div>
          <div class="filter-chip">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            <select>
              <option>Tất cả khu vực</option>
              <option>Hai Bà Trưng</option>
              <option>Cầu Giấy</option>
              <option>Hoàng Mai</option>
              <option>Đống Đa</option>
            </select>
          </div>
          <select class="metric-select" [(ngModel)]="trendMetric" (change)="renderTrendChart()">
            <option value="negativeRate">Xu hướng: Tỷ lệ tiêu cực</option>
            <option value="total">Xu hướng: Lượng review</option>
            <option value="avgStars">Xu hướng: Điểm sao TB</option>
          </select>
          <button class="btn-export">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Xuất
          </button>
        </div>
      </div>

      <!-- TIER 1: INSIGHT HERO -->
      <div class="insight-hero" *ngIf="insightsLoaded">
        <div class="hero-badge">INSIGHT TỰ ĐỘNG</div>
        <div class="insight-grid" *ngIf="insights.length > 0; else insightEmpty">
          <div class="insight-card-item" *ngFor="let ins of insights">
            <div class="ici-top">
              <span class="ici-conf" [class.c-high]="ins.confidence==='high'" [class.c-med]="ins.confidence==='medium'" [class.c-low]="ins.confidence==='low'">{{ ins.confidence }}</span>
            </div>
            <p class="ici-text">{{ ins.text }}</p>
          </div>
        </div>
        <ng-template #insightEmpty>
          <p class="empty-msg">{{ insightsError ? 'Không thể tải insight.' : 'Chưa đủ dữ liệu để sinh insight.' }}</p>
        </ng-template>
      </div>

      <!-- TIER 2: TREND + TOP RISK -->
      <div class="tier tier-2">
        <div class="card card-trend">
          <div class="card-head">
            <h3>Xu hướng theo thời gian</h3>
          </div>
          <div class="chart-wrap-tall">
            <canvas #trendCanvas></canvas>
          </div>
        </div>

        <div class="card card-rank">
          <div class="card-head">
            <h3>Top quận rủi ro</h3>
            <span class="card-sub">Risk = Neg% × log₂(n)</span>
          </div>
          <div class="rank-table" *ngIf="districts.length > 0; else distLoading">
            <div class="rank-header">
              <span class="rh-idx">#</span>
              <span class="rh-name">Quận</span>
              <span class="rh-val">Risk</span>
              <span class="rh-val">Neg%</span>
              <span class="rh-val">Reviews</span>
            </div>
            <div class="rank-row" *ngFor="let d of districts.slice(0, 10); let i = index"
              [class.top-row]="i < 3"
              [title]="'⭐ Sao TB: ' + d.avgStars?.toFixed(2) + '  |  🏥 Health: ' + d.healthScore?.toFixed(2)">
              <span class="rank-idx">
                <span class="rank-badge" *ngIf="i < 3" [class.b1]="i===0" [class.b2]="i===1" [class.b3]="i===2">{{ i + 1 }}</span>
                <span *ngIf="i >= 3" class="rank-num">{{ i + 1 }}</span>
              </span>
              <span class="rank-name">{{ d.district }}</span>
              <span class="rank-risk">
                <span class="risk-bar" [style.width.px]="getRiskBarW(d.riskScore)"></span>
                {{ d.riskScore?.toFixed(0) }}
              </span>
              <span class="rank-neg" [class.neg-hot]="d.negativeRate > 35">{{ d.negativeRate }}%</span>
              <span class="rank-rev">{{ d.totalReviews }}</span>
            </div>
          </div>
          <ng-template #distLoading><p class="empty-msg">Đang tải...</p></ng-template>
        </div>
      </div>

      <!-- TIER 3: HEATMAP + SESSION -->
      <div class="tier tier-3">
        <div class="card card-heatmap">
          <div class="card-head">
            <h3>Bản đồ rủi ro Giờ × Ngày</h3>
            <div class="hm-legend">
              <span class="leg-label">Neg rate:</span>
              <span class="leg-swatch s1"></span><span class="leg-txt">0%</span>
              <span class="leg-swatch s2"></span>
              <span class="leg-swatch s3"></span>
              <span class="leg-swatch s4"></span>
              <span class="leg-swatch s5"></span><span class="leg-txt">50%+</span>
            </div>
          </div>
          <div class="thm-wrap" *ngIf="timeHeatmapReady; else heatmapLoading">
            <div class="thm-grid">
              <div class="thm-corner"></div>
              <div class="thm-col-h" *ngFor="let day of dayLabels">{{ day }}</div>
              <ng-container *ngFor="let hour of hourLabels; let h = index">
                <div class="thm-row-h">{{ hour }}</div>
                <div class="thm-cell" *ngFor="let day of dayLabels; let d = index"
                  [style.background]="getTimeHeatColor(timeHeatmapGrid[h][d])"
                  [title]="hour + ' ' + day + '  ▸  Neg: ' + timeHeatmapGrid[h][d].toFixed(1) + '%'">
                </div>
              </ng-container>
            </div>
          </div>
          <ng-template #heatmapLoading>
            <p class="empty-msg">{{ heatmapError ? '⚠️ Không thể tải.' : 'Đang tải...' }}</p>
          </ng-template>
        </div>

        <div class="card card-session">
          <div class="card-head">
            <h3>Phân bố theo Ca</h3>
          </div>
          <div class="session-summary" *ngIf="sessionSummary">
            <div class="ss-item" *ngFor="let s of sessionSummary">
              <span class="ss-name">{{ s.session }}</span>
              <span class="ss-total">{{ s.total }}</span>
              <span class="ss-neg">{{ s.negative }} neg</span>
            </div>
          </div>
          <div class="chart-wrap-session" *ngIf="sessionLoaded; else sessionLoading">
            <canvas #sessionCanvas></canvas>
          </div>
          <ng-template #sessionLoading>
            <p class="empty-msg">{{ sessionError ? '⚠️ Không thể tải.' : 'Đang tải...' }}</p>
          </ng-template>
        </div>
      </div>

      <!-- TIER 4: KEYWORDS — single row, top 8 -->
      <div class="tier tier-4">
        <div class="card">
          <div class="card-head">
            <h3>Top từ khóa phàn nàn</h3>
            <span class="card-sub">{{ totalNegativeReviews }} review rủi ro</span>
          </div>
          <div class="kw-strip" *ngIf="keywords.length > 0; else kwLoading">
            <div class="kw-item" *ngFor="let kw of keywords.slice(0, 8)">
              <div class="kw-bar-wrap">
                <div class="kw-bar-fill" [style.height.%]="getBarWidth(kw.count)"></div>
              </div>
              <span class="kw-count">{{ kw.count }}</span>
              <span class="kw-label">{{ kw.keyword }}</span>
            </div>
          </div>
          <ng-template #kwLoading><p class="empty-msg">Đang tải...</p></ng-template>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* ── PAGE ── */
    .analytics-page {
      background: #f8f9fb; min-height: calc(100vh - 52px);
      padding: 20px 28px 32px; font-family: 'Segoe UI', -apple-system, Arial, sans-serif;
    }

    /* ── HEADER ── */
    .page-header {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 18px;
    }
    .page-title { font-size: 22px; font-weight: 800; color: #111827; margin: 0; letter-spacing: -0.3px; }
    .header-filters { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }

    .filter-chip {
      display: flex; align-items: center; gap: 5px;
      background: #fff; border: 1px solid #e5e7eb; border-radius: 8px;
      padding: 0 4px 0 10px; font-size: 13px; color: #374151;
    }
    .filter-chip svg { flex-shrink: 0; color: #9ca3af; }
    .filter-chip select { border: none; outline: none; padding: 7px 6px; font-size: 13px; background: transparent; cursor: pointer; color: #374151; }

    .metric-select {
      padding: 7px 12px; border: 1px solid #e5e7eb; border-radius: 8px;
      font-size: 13px; background: #fff; color: #374151; cursor: pointer;
    }
    .btn-export {
      display: flex; align-items: center; gap: 5px;
      padding: 7px 14px; border: 1px solid #e5e7eb; border-radius: 8px;
      background: #fff; font-size: 13px; font-weight: 600; color: #374151; cursor: pointer;
    }
    .btn-export:hover { background: #f3f4f6; }

    /* ── TIERS ── */
    .tier { margin-bottom: 18px; }
    .tier-2 { display: flex; gap: 18px; }
    .tier-3 { display: flex; gap: 18px; }
    .card-trend { flex: 5; min-width: 0; }
    .card-rank { flex: 3; min-width: 0; }
    .card-heatmap { flex: 5; min-width: 0; }
    .card-session { flex: 3; min-width: 0; display: flex; flex-direction: column; }
    @media (max-width: 960px) { .tier-2, .tier-3 { flex-direction: column; } }

    /* ── CARD ── */
    .card {
      background: #fff; border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05), 0 2px 8px rgba(0,0,0,0.03);
      overflow: hidden;
    }
    .card-head {
      display: flex; align-items: center; justify-content: space-between;
      padding: 14px 20px; border-bottom: 1px solid #f3f4f6;
    }
    .card-head h3 { font-size: 14px; font-weight: 800; color: #111827; margin: 0; letter-spacing: -0.2px; }
    .card-sub { font-size: 11px; color: #9ca3af; font-weight: 500; }

    .empty-msg { color: #9ca3af; font-size: 13px; text-align: center; padding: 32px 16px; }

    /* ── INSIGHT HERO ── */
    .insight-hero {
      background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 40%, #fefce8 100%);
      border: 1px solid #d1fae5; border-radius: 14px;
      padding: 18px 22px 20px; margin-bottom: 18px;
    }
    .hero-badge {
      font-size: 10px; font-weight: 800; color: #065f46; letter-spacing: 1px;
      margin-bottom: 14px; text-transform: uppercase;
    }
    .insight-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
    @media (max-width: 1200px) { .insight-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 600px) { .insight-grid { grid-template-columns: 1fr; } }
    .insight-card-item {
      background: rgba(255,255,255,0.85); border-radius: 10px;
      padding: 14px 16px; backdrop-filter: blur(4px);
      border: 1px solid rgba(209,250,229,0.6);
      transition: transform 0.15s, box-shadow 0.15s;
    }
    .insight-card-item:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.06); }
    .ici-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
    .ici-icon { font-size: 22px; }
    .ici-conf {
      font-size: 9px; padding: 2px 8px; border-radius: 10px;
      font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;
    }
    .c-high { background: #dcfce7; color: #166534; }
    .c-med { background: #fef9c3; color: #854d0e; }
    .c-low { background: #fee2e2; color: #991b1b; }
    .ici-text { font-size: 13px; color: #1f2937; line-height: 1.55; font-weight: 500; margin: 0; }

    /* ── CHART ── */
    .chart-wrap-tall { height: 320px; position: relative; padding: 14px 18px 10px; }
    .chart-wrap-session { flex: 1; min-height: 200px; position: relative; padding: 10px 18px 14px; }

    /* ── RANK TABLE ── */
    .rank-table { padding: 0; }
    .rank-header {
      display: grid; grid-template-columns: 30px 1fr 65px 55px 55px;
      padding: 8px 16px; font-size: 10px; font-weight: 800; color: #9ca3af;
      text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #f3f4f6;
    }
    .rh-val { text-align: right; }
    .rank-row {
      display: grid; grid-template-columns: 30px 1fr 65px 55px 55px;
      padding: 8px 16px; font-size: 13px; color: #374151; align-items: center;
      border-bottom: 1px solid #fafafa; transition: background 0.12s;
    }
    .rank-row:hover { background: #f9fafb; }
    .rank-row.top-row { background: #fefce8; }
    .rank-row.top-row:hover { background: #fef9c3; }

    .rank-idx { display: flex; align-items: center; }
    .rank-badge {
      width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
      font-size: 10px; font-weight: 800; color: #fff;
    }
    .rank-badge.b1 { background: #dc2626; }
    .rank-badge.b2 { background: #ea580c; }
    .rank-badge.b3 { background: #d97706; }
    .rank-num { font-size: 12px; color: #9ca3af; font-weight: 600; }
    .rank-name { font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #1f2937; }

    .rank-risk {
      text-align: right; font-weight: 900; font-variant-numeric: tabular-nums; color: #111827;
      font-size: 14px; position: relative; display: flex; align-items: center; justify-content: flex-end; gap: 6px;
    }
    .risk-bar {
      height: 4px; border-radius: 2px; background: linear-gradient(90deg, #fbbf24, #ef4444);
      display: inline-block; max-width: 30px;
    }
    .rank-neg { text-align: right; font-variant-numeric: tabular-nums; color: #9ca3af; font-size: 12px; font-weight: 500; }
    .rank-neg.neg-hot { color: #dc2626; font-weight: 700; font-size: 13px; }
    .rank-rev { text-align: right; font-variant-numeric: tabular-nums; color: #d1d5db; font-size: 11px; font-weight: 500; }

    /* ── HEATMAP ── */
    .thm-wrap { padding: 14px 20px 18px; overflow-x: auto; }
    .thm-grid {
      display: grid; grid-template-columns: 36px repeat(7, 1fr);
      gap: 3px; font-size: 11px;
    }
    .thm-corner { }
    .thm-col-h {
      text-align: center; font-weight: 800; font-size: 11px; color: #6b7280;
      padding: 4px 0;
    }
    .thm-row-h {
      font-size: 10px; color: #9ca3af; display: flex; align-items: center;
      justify-content: center; font-weight: 700;
    }
    .thm-cell {
      border-radius: 3px; min-height: 18px; cursor: default;
      transition: transform 0.12s, box-shadow 0.12s;
    }
    .thm-cell:hover { transform: scale(1.4); box-shadow: 0 2px 10px rgba(0,0,0,0.18); z-index: 5; position: relative; }

    .hm-legend { display: flex; align-items: center; gap: 3px; font-size: 10px; color: #9ca3af; }
    .leg-label { font-weight: 600; margin-right: 4px; }
    .leg-txt { margin: 0 2px; }
    .leg-swatch { width: 16px; height: 10px; border-radius: 2px; }
    .leg-swatch.s1 { background: #dcfce7; }
    .leg-swatch.s2 { background: #bbf7d0; }
    .leg-swatch.s3 { background: #fef9c3; }
    .leg-swatch.s4 { background: #fca5a5; }
    .leg-swatch.s5 { background: #ef4444; }

    /* ── SESSION SUMMARY ── */
    .session-summary {
      display: grid; grid-template-columns: repeat(4, 1fr); gap: 0;
      border-bottom: 1px solid #f3f4f6;
    }
    .ss-item {
      display: flex; flex-direction: column; align-items: center; padding: 12px 6px;
      border-right: 1px solid #f3f4f6;
    }
    .ss-item:last-child { border-right: none; }
    .ss-name { font-size: 10px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.3px; }
    .ss-total { font-size: 18px; font-weight: 800; color: #111827; margin: 2px 0; }
    .ss-neg { font-size: 10px; color: #ef4444; font-weight: 600; }

    /* ── KEYWORDS STRIP ── */
    .kw-strip {
      display: flex; gap: 0; padding: 16px 12px 20px; justify-content: center;
    }
    .kw-item {
      flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px;
      max-width: 90px;
    }
    .kw-bar-wrap {
      width: 28px; height: 80px; background: #f3f4f6; border-radius: 6px;
      display: flex; align-items: flex-end; overflow: hidden;
    }
    .kw-bar-fill {
      width: 100%; border-radius: 6px;
      background: linear-gradient(0deg, #ef4444, #f87171); transition: height 0.5s;
    }
    .kw-count { font-size: 12px; font-weight: 800; color: #374151; }
    .kw-label { font-size: 10px; color: #6b7280; font-weight: 600; text-align: center; line-height: 1.2; }
  `]
})
export class AnalyticsComponent implements OnInit, AfterViewInit {
  @ViewChild('trendCanvas') trendCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('sessionCanvas') sessionCanvas!: ElementRef<HTMLCanvasElement>;

  districts: any[] = [];
  keywords: any[] = [];
  trends: any[] = [];
  insights: any[] = [];
  insightsLoaded = false;
  insightsError = false;
  totalNegativeReviews = 0;
  trendMetric = 'negativeRate';
  private trendChart: Chart | null = null;
  private sessionChart: Chart | null = null;
  private maxKeywordCount = 0;
  sessionSummary: any[] | null = null;

  // Hour×Day heatmap
  timeHeatmapGrid: number[][] = Array.from({ length: 24 }, () => Array(7).fill(0));
  timeHeatmapReady = false;
  heatmapError = false;
  sessionLoaded = false;
  sessionError = false;
  dayLabels = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  hourLabels = Array.from({ length: 24 }, (_, i) => `${i}h`);

  private maxRisk = 1;

  constructor(private api: ApiService) { }

  ngOnInit() {
    this.loadInsights();
    this.loadDistricts();
    this.loadKeywords();
    this.loadTrends();
    this.loadTimeHeatmap();
    this.loadSessionChart();
  }

  ngAfterViewInit() { }

  loadInsights() {
    this.api.getInsights().subscribe({
      next: data => { this.insights = data?.insights || []; this.insightsLoaded = true; },
      error: () => { this.insightsError = true; this.insightsLoaded = true; },
    });
  }

  loadDistricts() {
    this.api.getDistrictHeatmap().subscribe({
      next: data => {
        this.districts = Array.isArray(data) ? data : [];
        this.maxRisk = Math.max(...this.districts.map(d => d.riskScore || 0), 1);
      },
      error: err => console.error('District load error:', err),
    });
  }

  getRiskBarW(risk: number): number {
    return Math.round((risk / this.maxRisk) * 30);
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
    let dataValues: number[], label: string, color: string;

    if (metric === 'negativeRate') {
      dataValues = this.trends.map(t => t.negativeRate); label = 'Tỷ lệ tiêu cực (%)'; color = '#DC2626';
    } else if (metric === 'total') {
      dataValues = this.trends.map(t => t.total); label = 'Tổng review'; color = '#0C713D';
    } else {
      dataValues = this.trends.map(t => t.avgStars); label = 'Điểm TB'; color = '#D97706';
    }

    const ctx = this.trendCanvas.nativeElement.getContext('2d')!;
    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, color + '15');
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
            position: 'top', align: 'end',
            labels: { color: '#6b7280', font: { size: 11, weight: '600' as any }, usePointStyle: true, pointStyle: 'circle', padding: 16 }
          },
          tooltip: {
            backgroundColor: '#111827', titleColor: '#fff', bodyColor: '#d1d5db',
            padding: 10, cornerRadius: 8, displayColors: false,
          },
        },
        scales: {
          x: {
            ticks: { color: '#9ca3af', maxTicksLimit: 10, font: { size: 10, weight: '500' as any } },
            grid: { color: '#f3f4f6' },
          },
          y: {
            ticks: {
              color: '#9ca3af', font: { size: 10 },
              callback: (v) => `${v}${metric === 'negativeRate' ? '%' : ''}`,
            },
            grid: { color: '#f3f4f6' },
          },
        },
      },
    });
  }

  // ── Heatmap ──
  loadTimeHeatmap() {
    this.api.getHeatmap().subscribe({
      next: (data: any[]) => {
        this.timeHeatmapGrid = Array.from({ length: 24 }, () => Array(7).fill(0));
        for (const item of data) {
          const h = item.hour; const d = item.dayOfWeek;
          if (h >= 0 && h < 24 && d >= 0 && d < 7) {
            this.timeHeatmapGrid[h][d] = item.negativeRate || 0;
          }
        }
        this.timeHeatmapReady = true;
      },
      error: err => { console.error('Heatmap load error:', err); this.heatmapError = true; },
    });
  }

  getTimeHeatColor(rate: number): string {
    if (rate === 0) return '#f9fafb';
    if (rate < 10) return '#dcfce7';
    if (rate < 20) return '#bbf7d0';
    if (rate < 30) return '#fef9c3';
    if (rate < 40) return '#fca5a5';
    if (rate < 55) return '#f87171';
    return '#ef4444';
  }

  // ── Session ──
  private readonly SESSION_ORDER = ['Sáng', 'Trưa', 'Chiều', 'Tối'];

  loadSessionChart() {
    this.api.getBySession().subscribe({
      next: (data: any[]) => {
        const sorted = this.SESSION_ORDER.map(s =>
          data.find(d => d.session === s) || { session: s, total: 0, negative: 0, avgStars: 0 }
        );
        this.sessionSummary = sorted;
        this.sessionLoaded = true;
        setTimeout(() => this.renderSessionChart(sorted), 200);
      },
      error: err => { console.error('Session load error:', err); this.sessionError = true; },
    });
  }

  private renderSessionChart(sessions: any[]) {
    if (!this.sessionCanvas?.nativeElement) return;
    if (this.sessionChart) this.sessionChart.destroy();

    this.sessionChart = new Chart(this.sessionCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels: sessions.map(s => s.session),
        datasets: [
          { label: 'Tổng', data: sessions.map(s => s.total), backgroundColor: '#0C713D', borderRadius: 6 },
          { label: 'Tiêu cực', data: sessions.map(s => s.negative), backgroundColor: '#DC2626', borderRadius: 6 },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top', align: 'end',
            labels: { color: '#6b7280', font: { size: 10, weight: '600' as any }, usePointStyle: true, pointStyle: 'circle', padding: 12 }
          },
          tooltip: {
            backgroundColor: '#111827', titleColor: '#fff', bodyColor: '#d1d5db',
            padding: 10, cornerRadius: 8, displayColors: false,
          },
        },
        scales: {
          x: { ticks: { color: '#6b7280', font: { size: 11, weight: '700' as any } }, grid: { display: false } },
          y: { ticks: { color: '#9ca3af', font: { size: 10 } }, grid: { color: '#f3f4f6' } },
        },
      },
    });
  }
}
