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
    <div class="kv-wrapper">
      <!-- TOP ACTION BAR -->
      <div class="kv-header-row">
        <div class="kv-title-area">
          <h2>Phân tích</h2>
        </div>
        <div class="kv-top-actions">
          <div class="search-wrap">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" x2="16.65" y1="21" y2="16.65"/></svg>
            <input type="text" placeholder="Theo quận, từ khóa, chỉ số">
          </div>
          <button class="btn-outline">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Xuất file
          </button>
          <div class="settings-icons">
            <button class="icon-btn"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg></button>
            <button class="icon-btn"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg></button>
          </div>
        </div>
      </div>

      <div class="kv-body-row">
        <!-- SIDEBAR -->
        <div class="kv-sidebar">
          <div class="filter-box">
            <div class="filter-title">Chế độ xem <a class="filter-link">Tạo mới</a></div>
            <div class="filter-content">
              <label class="radio-label active">
                <input type="radio" name="view" checked> Tổng quan hệ thống
              </label>
            </div>
          </div>

          <div class="filter-box">
            <div class="filter-title">Phân tích Xu hướng</div>
            <div class="filter-content">
              <select [(ngModel)]="trendMetric" (change)="renderTrendChart()">
                <option value="negativeRate">Tỷ lệ rủi ro (%)</option>
                <option value="total">Lượng review</option>
                <option value="avgStars">Điểm trung bình sao</option>
              </select>
            </div>
          </div>

          <div class="filter-box">
            <div class="filter-title">Bản đồ nhiệt</div>
            <div class="filter-content">
              <div class="legend-row">
                <span class="legend-label">Chất lượng:</span>
                <span class="legend-dot good"></span> Tốt
                <div class="legend-gradient quality"></div>
                <span class="legend-dot bad"></span> Xấu
              </div>
              <div class="legend-row">
                <span class="legend-label">Khối lượng:</span>
                <div class="legend-gradient volume"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- CONTENT AREA -->
        <div class="kv-content-area">
          <!-- Heatmap Panel -->
          <div class="panel">
            <div class="panel-header">
              <h3 class="panel-title">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0070f4" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2"/><rect width="3" height="9" x="7" y="7"/><rect width="3" height="5" x="14" y="7"/></svg>
                Bản đồ nhiệt rủi ro theo Quận
              </h3>
            </div>
            <div class="heatmap-wrap" *ngIf="districts.length > 0; else distLoading">
              <div class="heatmap-grid" [style.grid-template-columns]="'140px repeat(' + heatmapMetrics.length + ', 1fr)'">
                <div class="hm-corner">Quận ▾</div>
                @for (m of heatmapMetrics; track m.key) {
                  <div class="hm-col-header">{{ m.label }}</div>
                }
                @for (d of districts; track d.district) {
                  <div class="hm-row-label" [class.low-sample]="d.lowSample">
                    {{ d.district }}
                    <span class="low-icon" *ngIf="d.lowSample" title="Mẫu nhỏ (< 20)">⚠</span>
                  </div>
                  @for (m of heatmapMetrics; track m.key) {
                    <div class="hm-cell"
                      [class]="getCellClass(d[m.key], m.key, d.lowSample)"
                      [style.opacity]="d.lowSample ? '0.55' : '1'"
                      [title]="getCellTooltip(d, m)">
                      {{ formatCellValue(d[m.key], m.key) }}
                    </div>
                  }
                }
              </div>
              <p class="heatmap-footnote">
                ⚠ Quận đánh dấu có ít hơn 20 review. Sắp xếp theo <strong>Risk Score</strong> = Neg Rate × log₂(Reviews).
              </p>
            </div>
            <ng-template #distLoading><p class="loading">Đang tải...</p></ng-template>
          </div>

          <!-- Grid 2-col: Keywords + Trend -->
          <div class="panel-grid">
            <div class="panel">
              <div class="panel-header">
                <h3 class="panel-title">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc3545" stroke-width="2"><path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"/><path d="M7 7h.01"/></svg>
                  Từ khóa phàn nàn
                </h3>
                <span class="panel-desc">{{ totalNegativeReviews }} review rủi ro</span>
              </div>
              <div class="keyword-list" *ngIf="keywords.length > 0; else kwLoading">
                @for (kw of keywords; track kw.keyword) {
                  <div class="kw-row">
                    <span class="kw-label">{{ kw.keyword }}</span>
                    <div class="kw-bar-bg"><div class="kw-bar-fill" [style.width.%]="getBarWidth(kw.count)"></div></div>
                    <span class="kw-count">{{ kw.count }}</span>
                  </div>
                }
              </div>
              <ng-template #kwLoading><p class="loading">Đang tải...</p></ng-template>
            </div>

            <div class="panel">
              <div class="panel-header">
                <h3 class="panel-title">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
                  Phân tích Xu hướng
                </h3>
              </div>
              <div class="chart-container">
                <canvas #trendCanvas></canvas>
              </div>
            </div>
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
    .kv-title-area { width: 200px; flex-shrink: 0; display: flex; align-items: center; }
    .kv-title-area h2 { font-size: 1.15rem; font-weight: 700; color: #333; margin: 0; }
    .kv-top-actions { flex: 1; display: flex; align-items: center; gap: 10px; }

    .search-wrap {
      flex: 1; max-width: 380px;
      display: flex; align-items: center;
      background: #fff; border: 1px solid #ced4da; border-radius: 4px; padding: 0 10px;
    }
    .search-wrap svg { color: #888; flex-shrink: 0; }
    .search-wrap input { border: none; outline: none; padding: 7px 8px; width: 100%; font-size: 13px; }

    .btn-outline {
      background: #fff; color: #333; border: 1px solid #ced4da; border-radius: 4px;
      padding: 6px 12px; font-size: 13px; font-weight: 600; cursor: pointer;
      display: flex; align-items: center; gap: 6px;
    }
    .btn-outline:hover { background: #f8f9fa; }

    .settings-icons { margin-left: auto; display: flex; gap: 6px; }
    .icon-btn {
      background: #fff; border: 1px solid #ced4da; padding: 5px; border-radius: 4px;
      cursor: pointer; color: #555; display: flex; align-items: center; justify-content: center;
    }
    .icon-btn:hover { background: #f0f0f0; }

    /* BODY ROW */
    .kv-body-row { display: flex; flex: 1; padding: 0 16px 16px 16px; gap: 16px; align-items: flex-start; }

    /* SIDEBAR — same 200px width */
    .kv-sidebar { width: 200px; flex-shrink: 0; display: flex; flex-direction: column; gap: 12px; }
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

    /* Legends in sidebar */
    .legend-row { display: flex; align-items: center; gap: 4px; font-size: 11px; color: #666; flex-wrap: wrap; }
    .legend-dot { width: 8px; height: 8px; border-radius: 50%; }
    .legend-dot.good { background: #22c55e; }
    .legend-dot.bad { background: #ef4444; }
    .legend-gradient { width: 50px; height: 10px; border-radius: 4px; border: 1px solid #e0e4eb; }
    .legend-gradient.quality { background: linear-gradient(90deg, #22c55e, #facc15, #ef4444); }
    .legend-gradient.volume { background: linear-gradient(90deg, #e0e7ff, #4f46e5); }

    /* CONTENT AREA */
    .kv-content-area {
      flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 16px;
    }

    /* Panels — compact, bordered, same as KV table-area feel */
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

    .panel-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    @media (max-width: 900px) { .panel-grid { grid-template-columns: 1fr; } }

    /* HEATMAP — compact */
    .heatmap-wrap { padding: 0 12px 12px 12px; overflow-x: auto; overflow-y: auto; max-height: 420px; }
    .heatmap-grid { display: grid; gap: 2px; min-width: 600px; }

    .hm-corner {
      font-size: 11px; font-weight: 700; color: #888; text-transform: uppercase;
      padding: 6px 8px; display: flex; align-items: flex-end;
      position: sticky; top: 0; left: 0; z-index: 20;
      background: #f0f0f0; border-bottom: 2px solid #bbb; border-right: 1px solid #ddd;
    }
    .hm-col-header {
      background: #f0f0f0; border-bottom: 2px solid #bbb;
      font-size: 11px; font-weight: 700; color: #444; text-transform: uppercase;
      text-align: center; padding: 6px 4px;
      position: sticky; top: 0; z-index: 10;
    }
    .hm-row-label {
      font-size: 12px; font-weight: 600; color: #333; padding: 5px 8px;
      display: flex; align-items: center; gap: 3px; white-space: nowrap;
      position: sticky; left: 0; z-index: 10; background: #fff; border-right: 1px solid #eee;
    }
    .hm-row-label.low-sample { font-style: italic; color: #888; }
    .low-icon { font-size: 10px; }

    .hm-cell {
      display: flex; align-items: center; justify-content: center;
      font-size: 12px; font-variant-numeric: tabular-nums;
      padding: 5px 2px; border-radius: 2px; min-height: 28px; cursor: default;
    }
    .hm-cell.risk-high { background: #C62828; color: #fff; font-weight: 700; }
    .hm-cell.risk-medium { background: #F9A825; color: #333; font-weight: 600; }
    .hm-cell.risk-low { background: #E8F5E9; color: #2E7D32; font-weight: 500; }
    .hm-cell.volume-high { background: #4f46e5; color: #fff; font-weight: 700; }
    .hm-cell.volume-mid { background: #818cf8; color: #fff; font-weight: 600; }
    .hm-cell.volume-low { background: #e0e7ff; color: #312e81; font-weight: 500; }
    .hm-cell:hover { outline: 1px solid #F9A825; z-index: 2; position: relative; }

    .heatmap-footnote { font-size: 11px; color: #888; padding: 8px 0 0; line-height: 1.4; }

    /* KEYWORD BARS — compact */
    .keyword-list { display: flex; flex-direction: column; gap: 8px; padding: 12px 16px; }
    .kw-row { display: flex; align-items: center; gap: 8px; }
    .kw-label { width: 90px; font-size: 12px; color: #333; font-weight: 500; text-align: right; }
    .kw-bar-bg { flex: 1; height: 20px; border-radius: 3px; background: #f0f0f0; overflow: hidden; }
    .kw-bar-fill { height: 100%; border-radius: 3px; background: linear-gradient(90deg, #dc3545, #f87171); transition: width 0.5s; }
    .kw-count { font-size: 12px; color: #555; font-weight: 700; min-width: 30px; }

    /* CHART — compact */
    .chart-container { height: 260px; position: relative; padding: 12px 16px; }

    .loading { color: #888; font-size: 13px; text-align: center; padding: 32px; }
  `]
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

  heatmapMetrics = [
    { key: 'riskScore', label: 'Risk Score', type: 'quality', invert: true },
    { key: 'negativeRate', label: 'Neg Rate %', type: 'quality', invert: true },
    { key: 'avgStars', label: 'Sao TB', type: 'quality', invert: false },
    { key: 'healthScore', label: 'Health', type: 'quality', invert: false },
    { key: 'totalReviews', label: 'Reviews', type: 'volume', invert: false },
  ];

  private metricRanges: Record<string, { min: number; max: number }> = {};

  constructor(private api: ApiService) { }

  ngOnInit() {
    this.loadDistricts();
    this.loadKeywords();
    this.loadTrends();
  }

  ngAfterViewInit() { }

  loadDistricts() {
    this.api.getDistrictHeatmap().subscribe({
      next: data => {
        this.districts = Array.isArray(data) ? data : [];
        this.computeMetricRanges();
      },
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

  private computeMetricRanges() {
    for (const m of this.heatmapMetrics) {
      const values = this.districts.map(d => Number(d[m.key]) || 0);
      this.metricRanges[m.key] = { min: Math.min(...values), max: Math.max(...values) };
    }
  }

  private getNorm(value: number, key: string): number {
    const range = this.metricRanges[key];
    if (!range || range.max === range.min) return 0.5;
    return Math.max(0, Math.min(1, (value - range.min) / (range.max - range.min)));
  }

  getCellClass(value: number, key: string, lowSample: boolean): string {
    const metric = this.heatmapMetrics.find(m => m.key === key);
    if (!metric) return '';
    const norm = this.getNorm(value, key);
    if (metric.type === 'volume') {
      if (norm > 0.6) return 'volume-high';
      if (norm > 0.2) return 'volume-mid';
      return 'volume-low';
    }
    let badness: number;
    if (metric.invert) { badness = norm; } else { badness = 1 - norm; }
    if (badness > 0.65) return 'risk-high';
    if (badness > 0.3) return 'risk-medium';
    return 'risk-low';
  }

  formatCellValue(value: number, key: string): string {
    if (key === 'negativeRate') return value + '%';
    if (key === 'avgStars' || key === 'healthScore') return value.toFixed(2);
    if (key === 'riskScore') return value.toFixed(0);
    return value.toString();
  }

  getCellTooltip(d: any, m: any): string {
    const val = this.formatCellValue(d[m.key], m.key);
    let tip = `${m.label}: ${val}`;
    if (d.lowSample) tip += ' ⚠ Mẫu nhỏ (< 20 reviews)';
    return tip;
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
    const gradient = ctx.createLinearGradient(0, 0, 0, 240);
    gradient.addColorStop(0, color + '20');
    gradient.addColorStop(1, 'transparent');

    this.trendChart = new Chart(this.trendCanvas.nativeElement, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label, data: dataValues,
          borderColor: color, backgroundColor: gradient,
          borderWidth: 2, pointRadius: 3, pointBackgroundColor: '#fff',
          pointBorderColor: color, pointBorderWidth: 2, tension: 0.4, fill: true,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: { color: '#475569', font: { size: 11, weight: '500' as any }, usePointStyle: true, pointStyle: 'circle' }
          },
          tooltip: {
            backgroundColor: '#fff', titleColor: '#0F172A', bodyColor: '#475569',
            borderColor: '#E2E8F0', borderWidth: 1, padding: 10, cornerRadius: 6,
          },
        },
        scales: {
          x: { ticks: { color: '#94A3B8', maxTicksLimit: 12, font: { size: 11 } }, grid: { color: '#F1F5F9' } },
          y: {
            ticks: {
              color: '#94A3B8', font: { size: 11 },
              callback: (v) => `${v}${metric === 'negativeRate' ? '%' : ''}`,
            },
            grid: { color: '#F1F5F9' },
          },
        },
      },
    });
  }
}
