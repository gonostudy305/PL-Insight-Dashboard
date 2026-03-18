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
          <p class="page-subtitle">Phân tích chuyên sâu - Quận, từ khóa, xu hướng</p>
        </div>
      </div>

      <!-- Heatmap — full width -->
      <div class="card full-width" style="margin-bottom: var(--space-6);">
        <div class="card-header">
          <h3 class="card-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><rect width="3" height="9" x="7" y="7"/><rect width="3" height="5" x="14" y="7"/></svg>
            Bản đồ nhiệt rủi ro theo Quận
          </h3>
          <div class="heatmap-legends">
            <div class="legend-block">
              <span class="legend-label">Chất lượng:</span>
              <span class="legend-good-dot"></span><span class="legend-label">Tốt</span>
              <div class="legend-gradient quality-gradient"></div>
              <span class="legend-bad-dot"></span><span class="legend-label">Xấu</span>
            </div>
            <div class="legend-block">
              <span class="legend-label">Khối lượng:</span>
              <div class="legend-gradient volume-gradient"></div>
            </div>
          </div>
        </div>
        <div class="heatmap-wrap" *ngIf="districts.length > 0; else distLoading">
          <!-- Column headers -->
          <div class="heatmap-grid" [style.grid-template-columns]="'150px repeat(' + heatmapMetrics.length + ', 1fr)'">
            <div class="hm-corner">Quận ▾</div>
            @for (m of heatmapMetrics; track m.key) {
              <div class="hm-col-header">{{ m.label }}</div>
            }

            <!-- Data rows -->
            @for (d of districts; track d.district) {
              <div class="hm-row-label" [class.low-sample]="d.lowSample">
                {{ d.district }}
                <span class="low-sample-icon" *ngIf="d.lowSample" title="Mẫu nhỏ (< 20 reviews) — kết quả chưa đủ tin cậy">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--color-warning)" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>
                </span>
              </div>
              @for (m of heatmapMetrics; track m.key) {
                <div class="hm-cell"
                  [style.background]="getCellColor(d[m.key], m.key, d.lowSample)"
                  [style.color]="getCellTextColor(d[m.key], m.key, d.lowSample)"
                  [style.opacity]="d.lowSample ? '0.55' : '1'"
                  [title]="getCellTooltip(d, m)">
                  {{ formatCellValue(d[m.key], m.key) }}
                </div>
              }
            }
          </div>
          <p class="heatmap-footnote">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--color-warning)" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>
            Quận đánh dấu có ít hơn 20 review - dữ liệu mang tính tham khảo.
            <strong>Khác</strong> = các địa bàn ngoài Hà Nội hoặc không xác định rõ quận.
            Sắp xếp theo <strong>Risk Score</strong> (chỉ số ưu tiên nội bộ) = Neg Rate × log₂(Reviews) - ưu tiên nơi vừa nhiều review vừa tỷ lệ tiêu cực cao.
          </p>
        </div>
        <ng-template #distLoading><p class="loading">Đang tải...</p></ng-template>
      </div>

      <div class="grid-2">
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

        <!-- Trend Chart -->
        <div class="card">
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
      flex-wrap: wrap;
      gap: var(--space-3);
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

    /* ===== HEATMAP LEGENDS ===== */
    .heatmap-legends {
      display: flex;
      gap: var(--space-5);
      align-items: center;
    }

    .legend-block {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .legend-label {
      font-size: 11px;
      color: var(--color-text-muted);
      font-weight: 500;
    }

    .legend-good-dot {
      width: 10px; height: 10px; border-radius: 50%;
      background: #22c55e;
    }

    .legend-bad-dot {
      width: 10px; height: 10px; border-radius: 50%;
      background: #ef4444;
    }

    .legend-gradient {
      width: 80px;
      height: 12px;
      border-radius: 6px;
      border: 1px solid var(--color-border-light);
    }

    .quality-gradient {
      background: linear-gradient(90deg, #22c55e, #a3e635, #facc15, #fb923c, #ef4444);
    }

    .volume-gradient {
      background: linear-gradient(90deg, #e0e7ff, #818cf8, #4f46e5);
    }

    /* ===== GRID HEATMAP ===== */
    .heatmap-wrap {
      padding: var(--space-4) var(--space-5);
      overflow-x: auto;
    }

    .heatmap-grid {
      display: grid;
      gap: 3px;
      min-width: 650px;
    }

    .hm-corner {
      font-size: 11px;
      font-weight: 700;
      color: var(--color-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.06em;
      padding: 8px 10px;
      display: flex;
      align-items: flex-end;
    }

    .hm-col-header {
      font-size: 11px;
      font-weight: 700;
      color: var(--color-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.03em;
      text-align: center;
      padding: 8px 4px;
      display: flex;
      align-items: flex-end;
      justify-content: center;
    }

    .hm-row-label {
      font-size: 13px;
      font-weight: 600;
      color: var(--color-text);
      padding: 8px 10px;
      display: flex;
      align-items: center;
      gap: 4px;
      white-space: nowrap;
      border-radius: 6px 0 0 6px;
    }

    .hm-row-label.low-sample {
      font-style: italic;
      color: var(--color-text-muted);
    }

    .low-sample-icon { display: flex; align-items: center; }

    .hm-cell {
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 700;
      padding: 10px 4px;
      border-radius: 6px;
      transition: all 0.15s ease;
      cursor: default;
      min-height: 40px;
    }

    .hm-cell:hover {
      transform: scale(1.08);
      box-shadow: 0 2px 12px rgba(0,0,0,0.15);
      z-index: 2;
      position: relative;
    }

    .heatmap-footnote {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      color: var(--color-text-muted);
      padding: var(--space-3) 0 0;
      line-height: 1.5;
    }

    /* ===== KEYWORD BARS ===== */
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

    /* ===== CHART ===== */
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

  // Heatmap metrics:
  // - Quality metrics (negativeRate, avgStars, healthScore, riskScore) use green-to-red scale
  // - Volume metric (totalReviews) uses a neutral indigo scale
  heatmapMetrics = [
    { key: 'riskScore', label: 'Risk Score', type: 'quality', invert: true },
    { key: 'negativeRate', label: 'Neg Rate %', type: 'quality', invert: true },
    { key: 'avgStars', label: 'Sao TB', type: 'quality', invert: false },
    { key: 'healthScore', label: 'Health', type: 'quality', invert: false },
    { key: 'totalReviews', label: 'Reviews', type: 'volume', invert: false },
  ];

  // Min/max per metric for color interpolation
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

  // ── Heatmap helpers ──

  private computeMetricRanges() {
    for (const m of this.heatmapMetrics) {
      const values = this.districts.map(d => Number(d[m.key]) || 0);
      this.metricRanges[m.key] = {
        min: Math.min(...values),
        max: Math.max(...values),
      };
    }
  }

  /** Returns a 0–1 normalized value */
  private getNorm(value: number, key: string): number {
    const range = this.metricRanges[key];
    if (!range || range.max === range.min) return 0.5;
    return Math.max(0, Math.min(1, (value - range.min) / (range.max - range.min)));
  }

  /**
   * Quality scale: green (#22c55e) = good → red (#ef4444) = bad
   * - For "invert: true" metrics (negativeRate, riskScore): high value = bad = red
   * - For "invert: false" metrics (avgStars, healthScore): high value = good = green
   *
   * Volume scale: neutral indigo gradient (light → dark)
   */
  getCellColor(value: number, key: string, lowSample: boolean): string {
    const metric = this.heatmapMetrics.find(m => m.key === key);
    if (!metric) return '#f1f5f9';

    const norm = this.getNorm(value, key);

    if (metric.type === 'volume') {
      // Neutral indigo scale: light (#e0e7ff) → dark (#4f46e5)
      const r = Math.round(224 + (79 - 224) * norm);
      const g = Math.round(231 + (70 - 231) * norm);
      const b = Math.round(255 + (229 - 255) * norm);
      return `rgb(${r}, ${g}, ${b})`;
    }

    // Quality scale → map to "badness" (0 = good/green, 1 = bad/red)
    let badness: number;
    if (metric.invert) {
      badness = norm; // high negativeRate/riskScore = bad
    } else {
      badness = 1 - norm; // high avgStars/health = good
    }

    // 5-stop gradient: green → lime → yellow → orange → red
    const stops = [
      { pos: 0.0, r: 34, g: 197, b: 94 },   // green = good
      { pos: 0.25, r: 163, g: 230, b: 53 },  // lime
      { pos: 0.5, r: 250, g: 204, b: 21 },   // yellow
      { pos: 0.75, r: 251, g: 146, b: 60 },   // orange
      { pos: 1.0, r: 239, g: 68, b: 68 },    // red = bad
    ];

    let lower = stops[0], upper = stops[stops.length - 1];
    for (let i = 0; i < stops.length - 1; i++) {
      if (badness >= stops[i].pos && badness <= stops[i + 1].pos) {
        lower = stops[i];
        upper = stops[i + 1];
        break;
      }
    }

    const range = upper.pos - lower.pos || 1;
    const t = (badness - lower.pos) / range;

    const r = Math.round(lower.r + (upper.r - lower.r) * t);
    const g = Math.round(lower.g + (upper.g - lower.g) * t);
    const b = Math.round(lower.b + (upper.b - lower.b) * t);

    return `rgb(${r}, ${g}, ${b})`;
  }

  getCellTextColor(value: number, key: string, lowSample: boolean): string {
    const metric = this.heatmapMetrics.find(m => m.key === key);
    if (!metric) return '#1a1a1a';

    if (metric.type === 'volume') {
      const norm = this.getNorm(value, key);
      return norm > 0.5 ? '#fff' : '#312e81';
    }

    // Quality: dark text except at saturated ends
    let badness: number;
    const norm = this.getNorm(value, key);
    if (metric.invert) { badness = norm; } else { badness = 1 - norm; }
    return (badness < 0.15 || badness > 0.75) ? '#fff' : '#1a1a1a';
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

  // ── Other helpers ──

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
