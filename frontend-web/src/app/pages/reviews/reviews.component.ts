import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-reviews',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="kv-wrapper">
      <!-- TOP ACTION BAR -->
      <div class="kv-header-row">
        <div class="kv-title-area">
          <h2>Đánh giá</h2>
        </div>
        <div class="kv-top-actions">
          <div class="search-wrap">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" x2="16.65" y1="21" y2="16.65"/></svg>
            <input type="text" placeholder="Theo chi nhánh, nội dung đánh giá">
          </div>
          <button class="btn-outline">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Xuất file
          </button>
          <div class="settings-icons">
            <button class="icon-btn" title="Dạng danh sách"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg></button>
            <button class="icon-btn" title="Cài đặt cột"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg></button>
            <button class="icon-btn" title="Toàn màn hình"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg></button>
          </div>
        </div>
      </div>

      <div class="kv-body-row">
        <!-- Left Sidebar Filter -->
        <div class="kv-sidebar">
          <div class="filter-box">
            <div class="filter-title">Mức độ Hài lòng <a class="filter-link">Tạo mới</a></div>
            <div class="filter-content">
              <label class="radio-label" [class.active]="sentimentFilter === ''">
                <input type="radio" name="sentiment" [checked]="sentimentFilter === ''" (change)="sentimentFilter = ''; loadPage(1)"> Tất cả đánh giá
              </label>
              <label class="radio-label" [class.active]="sentimentFilter === 'positive'">
                <input type="radio" name="sentiment" [checked]="sentimentFilter === 'positive'" (change)="sentimentFilter = 'positive'; loadPage(1)"> Đánh giá tích cực
              </label>
              <label class="radio-label" [class.active]="sentimentFilter === 'negative'">
                <input type="radio" name="sentiment" [checked]="sentimentFilter === 'negative'" (change)="sentimentFilter = 'negative'; loadPage(1)"> Đánh giá tiêu cực
              </label>
            </div>
          </div>

          <div class="filter-box">
            <div class="filter-title">Xếp hạng Sao</div>
            <div class="filter-content">
              <select [(ngModel)]="starFilter" (change)="loadPage(1)">
                <option value="">Tất cả sao</option>
                <option value="5">5 sao</option>
                <option value="4">4 sao</option>
                <option value="3">3 sao</option>
                <option value="2">2 sao</option>
                <option value="1">1 sao</option>
              </select>
            </div>
          </div>

          <div class="filter-box">
            <div class="filter-title">Tồn kho</div>
            <div class="filter-search">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" x2="16.65" y1="21" y2="16.65"/></svg>
              <input type="text" placeholder="Tìm kiếm chi nhánh">
            </div>
            <div class="filter-content">
              <label class="radio-label"><input type="radio" name="br" checked> Tất cả chi nhánh</label>
            </div>
          </div>
        </div>

        <!-- MAIN TABLE AREA -->
        <div class="kv-table-area">
          <table class="kv-table">
            <thead>
              <tr>
                <th class="col-chk"><input type="checkbox"></th>
                <th class="col-star">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                </th>
                <th class="col-id">Mã ĐG</th>
                <th class="col-sentiment">Sắc thái</th>
                <th class="col-stars-h">Sao</th>
                <th class="col-branch">Chi nhánh</th>
                <th class="col-text">Nội dung đánh giá</th>
                <th class="col-session">Buổi</th>
                <th class="col-len">Độ dài</th>
                <th class="col-time">Thời gian tạo</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let review of reviews; let i = index"
                  [class.row-negative]="review.label === 0"
                  [class.row-positive]="review.label === 1">
                <td class="col-chk"><input type="checkbox"></td>
                <td class="col-star">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                </td>
                <td class="col-id">
                  <span class="link">REV-{{(currentPage - 1) * 15 + i + 1}}</span>
                </td>
                <td class="col-sentiment">
                  <span class="st-badge" [class.positive]="review.label === 1" [class.negative]="review.label === 0">
                    {{ review.label === 1 ? 'Tích cực' : 'Tiêu cực' }}
                  </span>
                </td>
                <td class="col-stars-h">
                  <span class="stars-inline">
                    <svg *ngFor="let s of getStarsArray(review.stars)" width="12" height="12" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" stroke-width="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                  </span>
                </td>
                <td class="col-branch">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                  {{ review.branchAddress }}
                </td>
                <td class="col-text">
                  <div class="tbl-text">{{ review.text }}</div>
                </td>
                <td class="col-session">{{ review.session || '---' }}</td>
                <td class="col-len">{{ review.textLengthGroup || '---' }}</td>
                <td class="col-time">{{ review.publishedAtDate ? formatTime(review.publishedAtDate) : '---' }}</td>
              </tr>
              <tr *ngIf="reviews.length === 0" class="empty-tr">
                <td colspan="10">Không có đánh giá nào phù hợp với bộ lọc.</td>
              </tr>
            </tbody>
          </table>

          <!-- Pagination Bar -->
          <div class="table-pager">
            <div class="pager-info">Hiển thị trang {{ currentPage }} / {{ totalPages }}</div>
            <div class="pager-btns">
              <button (click)="loadPage(currentPage - 1)" [disabled]="currentPage <= 1">&lt;</button>
              <button *ngFor="let p of getPagerArray()" [class.active]="p === currentPage" (click)="loadPage(p)">{{ p }}</button>
              <button (click)="loadPage(currentPage + 1)" [disabled]="currentPage >= totalPages">&gt;</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* ─── KiotViet Table Layout ─── */
    .kv-wrapper {
      background: #f4f5f7;
      min-height: calc(100vh - 52px);
      display: flex;
      flex-direction: column;
      font-family: Arial, Helvetica, sans-serif;
    }

    /* TOP BAR */
    .kv-header-row {
      display: flex;
      padding: 12px 16px;
      gap: 16px;
    }
    .kv-title-area {
      width: 200px;
      flex-shrink: 0;
      display: flex;
      align-items: center;
    }
    .kv-title-area h2 { font-size: 1.15rem; font-weight: 700; color: #333; margin: 0; }

    .kv-top-actions {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 10px;
    }

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
    .kv-body-row {
      display: flex; flex: 1; padding: 0 16px 16px 16px; gap: 16px; align-items: flex-start;
    }

    /* SIDEBAR */
    .kv-sidebar {
      width: 200px; flex-shrink: 0; display: flex; flex-direction: column; gap: 12px;
    }
    .filter-box {
      background: #fff; border-radius: 4px; box-shadow: 0 1px 2px rgba(0,0,0,0.04);
      border: 1px solid #e0e4eb;
    }
    .filter-title {
      padding: 10px 12px; font-size: 13px; font-weight: 700; color: #333;
      display: flex; justify-content: space-between; align-items: center;
    }
    .filter-link { font-size: 11px; color: #0070f4; cursor: pointer; font-weight: 400; }
    .filter-search {
      margin: 0 10px 8px 10px; display: flex; align-items: center;
      border: 1px solid #ced4da; border-radius: 3px; padding: 0 6px; background: #f8f9fa;
    }
    .filter-search svg { color: #888; margin-right: 4px; }
    .filter-search input { border: none; background: transparent; padding: 5px 0; width: 100%; font-size: 12px; outline: none; }

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

    /* TABLE */
    .kv-table-area {
      flex: 1; background: #fff; border-radius: 4px;
      box-shadow: 0 1px 2px rgba(0,0,0,0.04); border: 1px solid #e0e4eb;
      min-width: 0; overflow-x: auto; display: flex; flex-direction: column;
    }
    .kv-table { width: 100%; border-collapse: collapse; min-width: 950px; }
    .kv-table th, .kv-table td {
      padding: 9px 10px; text-align: left; font-size: 13px; border-bottom: 1px solid #f0f0f0;
      white-space: nowrap;
    }
    .kv-table th {
      background: #e9eaec; font-weight: 700; color: #333;
      position: sticky; top: 0; z-index: 5; border-bottom: 1px solid #ccc;
    }
    .kv-table tbody tr { transition: background 0.15s; }
    .kv-table tbody tr:hover { background: #f8fafd; }

    /* Row tinting */
    .row-negative { border-left: 3px solid #dc3545; }
    .row-positive { border-left: 3px solid #28a745; }

    /* Columns */
    .col-chk, .col-star { width: 32px; text-align: center; }
    .col-id { width: 75px; }
    .col-sentiment { width: 80px; }
    .col-stars-h { width: 90px; }
    .col-branch { width: 15%; }
    .col-text { width: 35%; white-space: normal !important; }
    .col-session { width: 60px; }
    .col-len { width: 75px; }
    .col-time { width: 120px; }

    .link { color: #0070f4; cursor: pointer; font-weight: 500; }
    .link:hover { text-decoration: underline; }

    .st-badge {
      display: inline-block; padding: 2px 8px; border-radius: 12px;
      font-size: 11px; font-weight: 600; white-space: nowrap;
    }
    .st-badge.positive { background: #def7ec; color: #03543f; }
    .st-badge.negative { background: #fde8e8; color: #c81e1e; }

    .stars-inline { display: flex; gap: 1px; }

    .col-branch svg { vertical-align: -2px; margin-right: 3px; }

    .tbl-text {
      display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
      overflow: hidden; line-height: 1.45; color: #333;
    }

    .empty-tr td { text-align: center; color: #888; padding: 32px; font-style: italic; }

    /* PAGINATION */
    .table-pager {
      display: flex; justify-content: space-between; align-items: center;
      padding: 10px 16px; border-top: 1px solid #eee; background: #fff;
      border-radius: 0 0 4px 4px; margin-top: auto;
    }
    .pager-info { font-size: 13px; color: #666; }
    .pager-btns { display: flex; gap: 3px; }
    .pager-btns button {
      background: white; border: 1px solid #ced4da; border-radius: 3px;
      padding: 3px 9px; font-size: 13px; cursor: pointer; color: #555;
    }
    .pager-btns button.active { background: #0070f4; color: white; border-color: #0070f4; }
    .pager-btns button:disabled { opacity: 0.4; cursor: not-allowed; }
  `]
})
export class ReviewsComponent implements OnInit {
  reviews: any[] = [];
  currentPage = 1;
  totalPages = 1;
  sentimentFilter = '';
  starFilter = '';

  constructor(private api: ApiService) { }

  ngOnInit() { this.loadPage(1); }

  loadPage(page: number) {
    if (page < 1) return;
    this.api.getReviews({ page, limit: 15, sort: 'publishedAtDate', order: 'desc' }).subscribe(data => {
      this.reviews = data.data;
      this.currentPage = data.page;
      this.totalPages = data.totalPages;
    });
  }

  getStarsArray(n: number): number[] { return Array(n).fill(0); }

  getPagerArray(): number[] {
    const pages: number[] = [];
    const start = Math.max(1, this.currentPage - 2);
    const end = Math.min(this.totalPages, start + 4);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }

  formatTime(date: string): string {
    if (!date) return '---';
    return new Date(date).toLocaleString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }
}
