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
            <input type="text" placeholder="Theo chi nhánh, nội dung đánh giá" [(ngModel)]="searchText" (keyup.enter)="loadPage(1)">
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
            <div class="filter-title">Khoảng thời gian</div>
            <div class="filter-content">
              <select [(ngModel)]="selectedDays" (change)="loadPage(1)">
                <option value="">Toàn bộ</option>
                <option value="7">7 ngày gần nhất</option>
                <option value="30">30 ngày gần nhất</option>
                <option value="90">90 ngày gần nhất</option>
              </select>
            </div>
          </div>

          <div class="filter-box">
            <div class="filter-title">Chi nhánh</div>
            <div class="filter-content">
              <select [(ngModel)]="selectedDistrict" (change)="loadPage(1)">
                <option value="all">Tất cả chi nhánh</option>
                <option *ngFor="let d of districtOptions" [value]="d">{{ d }}</option>
              </select>
            </div>
          </div>

          <div class="filter-box">
            <div class="filter-title">Sắp xếp theo</div>
            <div class="filter-content">
              <select [(ngModel)]="sortMethod" (change)="loadPage(1)">
                <option value="newest">Mới nhất</option>
                <option value="oldest">Cũ nhất</option>
                <option value="lowest">Sao thấp nhất</option>
                <option value="highest">Sao cao nhất</option>
              </select>
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
                <th class="col-sentiment" title="Phân loại cảm xúc bởi PhoBERT AI">Cảm xúc (AI)<sup class="hint-q">?</sup></th>
                <th class="col-stars-h">Sao</th>
                <th class="col-branch">Chi nhánh</th>
                <th class="col-text">Nội dung đánh giá</th>
                <th class="col-session">Buổi</th>
                <th class="col-len">Độ dài</th>
                <th class="col-time">Thời gian tạo</th>
              </tr>
            </thead>
            <tbody>
              <ng-container *ngFor="let review of reviews; let i = index">
                <!-- Review Row -->
                <tr [class.row-negative]="review.label === 0"
                    [class.row-positive]="review.label === 1"
                    [class.row-selected]="expandedReviewId === review.id"
                    (click)="review.label === 0 && review.stars <= 3 ? toggleAIPanel(review) : null"
                    [style.cursor]="review.label === 0 && review.stars <= 3 ? 'pointer' : 'default'">
                  <td class="col-chk" (click)="$event.stopPropagation()"><input type="checkbox"></td>
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
                    <span *ngIf="review.label === 0 && review.stars <= 3" class="ai-badge" title="Click để xem gợi ý phản hồi AI">🤖</span>
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

                <!-- AI Response Expandable Panel -->
                <tr *ngIf="expandedReviewId === review.id" class="ai-panel-row">
                  <td colspan="10">
                    <div class="ai-panel" [@panelSlide]>
                      <div class="ai-panel-header">
                        <div class="ai-panel-title">
                          <span class="ai-icon">🤖</span>
                          <span>Gợi ý phản hồi AI</span>
                          <span class="ai-panel-subtitle" *ngIf="aiResult?.sentimentSummary">
                            — {{ aiResult.sentimentSummary }} ({{ (aiResult.confidence * 100).toFixed(1) }}%)
                          </span>
                        </div>
                        <button class="ai-close-btn" (click)="closeAIPanel($event)">✕</button>
                      </div>

                      <!-- Loading State -->
                      <div *ngIf="aiLoading" class="ai-loading">
                        <div class="ai-spinner"></div>
                        <span>Đang phân tích bằng PhoBERT AI...</span>
                      </div>

                      <!-- Error State -->
                      <div *ngIf="aiError" class="ai-error">
                        <span>⚠️ {{ aiError }}</span>
                        <button class="retry-btn" (click)="retryAI()">Thử lại</button>
                      </div>

                      <!-- AI Result -->
                      <div *ngIf="!aiLoading && !aiError && aiResult" class="ai-result">
                        <!-- Keywords chips -->
                        <div class="ai-keywords" *ngIf="aiResult.keywords?.length">
                          <span class="kw-label">Từ khóa AI:</span>
                          <span class="kw-chip" *ngFor="let kw of aiResult.keywords.slice(0, 8)">{{ kw }}</span>
                        </div>

                        <!-- Categories -->
                        <div class="ai-categories" *ngIf="aiResult.categories?.length">
                          <span class="cat-label">Vấn đề:</span>
                          <span class="cat-chip" *ngFor="let cat of aiResult.categories">{{ cat }}</span>
                        </div>

                        <!-- Negative Sentences -->
                        <div class="ai-neg-sentences" *ngIf="aiResult.negativeSentences?.length">
                          <div class="neg-title">Câu tiêu cực nhất:</div>
                          <div class="neg-item" *ngFor="let s of aiResult.negativeSentences">
                            <span class="neg-text">"{{ s.sentence }}"</span>
                            <span class="neg-score">{{ (s.score * 100).toFixed(0) }}%</span>
                          </div>
                        </div>

                        <div class="ai-divider"></div>

                        <!-- AI Response Text -->
                        <div class="ai-response-block">
                          <div class="response-label">📝 Câu phản hồi gợi ý:</div>
                          <div class="response-text-wrap">
                            <textarea
                              *ngIf="isEditing"
                              class="response-textarea"
                              [(ngModel)]="editedResponse"
                              rows="5"
                            ></textarea>
                            <div *ngIf="!isEditing" class="response-text">{{ editedResponse || aiResult.aiResponse }}</div>
                          </div>
                        </div>

                        <!-- Action Buttons -->
                        <div class="ai-actions">
                          <!-- Edit / Save Button -->
                          <button class="ai-btn ai-btn-edit" (click)="toggleEdit()" *ngIf="!isEditing">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                            Chỉnh sửa
                          </button>
                          <button class="ai-btn ai-btn-save" (click)="saveEdit()" *ngIf="isEditing">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
                            Lưu thay đổi
                          </button>
                          <button class="ai-btn ai-btn-cancel" (click)="cancelEdit()" *ngIf="isEditing">
                            Hủy
                          </button>

                          <!-- Copy Button -->
                          <button class="ai-btn ai-btn-copy" (click)="copyResponse()" [class.copied]="copySuccess">
                            <svg *ngIf="!copySuccess" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                            <svg *ngIf="copySuccess" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
                            {{ copySuccess ? 'Đã copy!' : 'Copy' }}
                          </button>

                          <!-- Post (Simulated) Button -->
                          <button class="ai-btn ai-btn-post" (click)="postResponse()" [class.posted]="postSuccess" [disabled]="postSuccess">
                            <svg *ngIf="!postSuccess" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                            <svg *ngIf="postSuccess" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
                            {{ postSuccess ? 'Đã đăng trên Google Maps!' : 'Đăng phản hồi' }}
                          </button>
                        </div>

                        <!-- Post Success Toast -->
                        <div *ngIf="postSuccess" class="ai-post-toast">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                          <span>Phản hồi đã được gửi lên Google Maps thành công! <em>(Giả lập)</em></span>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              </ng-container>

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
      flex-shrink: 0;
      background: #f4f5f7;
      z-index: 10;
    }
    .kv-title-area {
      width: 240px;
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
      min-height: 0;
    }

    /* SIDEBAR */
    .kv-sidebar {
      width: 240px; flex-shrink: 0; display: flex; flex-direction: column; gap: 12px;
      padding-right: 4px;
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
    .row-selected { background: #f0f4ff !important; }

    /* Columns */
    .col-chk, .col-star { width: 32px; text-align: center; }
    .col-id { width: 75px; }
    .col-sentiment { width: 80px; }
    .hint-q { font-size: 9px; color: #999; cursor: help; margin-left: 1px; }
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

    .ai-badge {
      display: inline-block; margin-left: 4px; font-size: 13px;
      cursor: pointer; animation: aiPulse 2s infinite;
    }
    @keyframes aiPulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    .stars-inline { display: flex; gap: 1px; }

    .col-branch svg { vertical-align: -2px; margin-right: 3px; }

    .tbl-text {
      display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
      overflow: hidden; line-height: 1.45; color: #333;
    }

    .empty-tr td { text-align: center; color: #888; padding: 32px; font-style: italic; }

    /* ─── AI RESPONSE PANEL ─── */
    .ai-panel-row td {
      padding: 0 !important;
      border-bottom: 2px solid #e0e4eb !important;
    }

    .ai-panel {
      margin: 0 16px 12px 16px;
      background: linear-gradient(135deg, #f8f9ff 0%, #f0f4ff 100%);
      border: 1px solid #c7d2fe;
      border-top: 3px solid;
      border-image: linear-gradient(90deg, #7c3aed, #2563eb) 1;
      border-radius: 0 0 8px 8px;
      padding: 16px 20px;
      animation: panelSlideDown 0.3s ease-out;
    }
    @keyframes panelSlideDown {
      from { opacity: 0; max-height: 0; transform: translateY(-8px); }
      to { opacity: 1; max-height: 800px; transform: translateY(0); }
    }

    .ai-panel-header {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 12px;
    }
    .ai-panel-title {
      font-size: 14px; font-weight: 700; color: #4338ca;
      display: flex; align-items: center; gap: 6px;
    }
    .ai-icon { font-size: 18px; }
    .ai-panel-subtitle { font-size: 12px; font-weight: 400; color: #6366f1; }
    .ai-close-btn {
      background: none; border: none; font-size: 16px; color: #999;
      cursor: pointer; padding: 4px 8px; border-radius: 4px;
    }
    .ai-close-btn:hover { background: #e0e4eb; color: #333; }

    /* Loading */
    .ai-loading {
      display: flex; align-items: center; gap: 10px; padding: 16px 0;
      color: #6366f1; font-size: 13px;
    }
    .ai-spinner {
      width: 20px; height: 20px; border: 2px solid #c7d2fe;
      border-top-color: #6366f1; border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* Error */
    .ai-error {
      display: flex; align-items: center; gap: 10px;
      padding: 10px 14px; background: #fef2f2; border-radius: 6px;
      color: #dc2626; font-size: 13px;
    }
    .retry-btn {
      background: #fff; border: 1px solid #dc2626; color: #dc2626;
      padding: 4px 10px; border-radius: 4px; font-size: 12px; cursor: pointer;
    }
    .retry-btn:hover { background: #fef2f2; }

    /* Keywords + Categories */
    .ai-keywords, .ai-categories {
      display: flex; align-items: center; flex-wrap: wrap; gap: 6px;
      margin-bottom: 8px;
    }
    .kw-label, .cat-label {
      font-size: 12px; font-weight: 600; color: #555;
    }
    .kw-chip {
      background: #ede9fe; color: #6d28d9; padding: 2px 8px;
      border-radius: 10px; font-size: 11px; font-weight: 500;
    }
    .cat-chip {
      background: #fef3c7; color: #92400e; padding: 2px 8px;
      border-radius: 10px; font-size: 11px; font-weight: 500;
    }

    /* Negative sentences */
    .ai-neg-sentences { margin-bottom: 10px; }
    .neg-title { font-size: 12px; font-weight: 600; color: #dc2626; margin-bottom: 4px; }
    .neg-item {
      display: flex; justify-content: space-between; align-items: flex-start;
      padding: 4px 8px; background: #fff1f2; border-radius: 4px; margin-bottom: 3px;
    }
    .neg-text { font-size: 12px; color: #7f1d1d; font-style: italic; flex: 1; white-space: normal; }
    .neg-score { font-size: 11px; font-weight: 700; color: #ef4444; margin-left: 8px; flex-shrink: 0; }

    .ai-divider {
      height: 1px; background: linear-gradient(90deg, transparent, #c7d2fe, transparent);
      margin: 12px 0;
    }

    /* AI Response */
    .ai-response-block { margin-bottom: 14px; }
    .response-label {
      font-size: 13px; font-weight: 700; color: #1e40af; margin-bottom: 6px;
    }
    .response-text {
      font-size: 13px; line-height: 1.65; color: #1e293b;
      background: #fff; padding: 12px 16px; border-radius: 8px;
      border: 1px solid #e2e8f0;
      white-space: pre-wrap;
    }
    .response-textarea {
      width: 100%; font-size: 13px; line-height: 1.65; color: #1e293b;
      background: #fff; padding: 12px 16px; border-radius: 8px;
      border: 2px solid #6366f1; outline: none; resize: vertical;
      font-family: inherit;
      min-height: 100px;
    }
    .response-textarea:focus {
      border-color: #4338ca; box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
    }

    /* Action Buttons */
    .ai-actions {
      display: flex; gap: 8px; flex-wrap: wrap;
    }
    .ai-btn {
      display: flex; align-items: center; gap: 5px;
      padding: 7px 14px; border-radius: 6px; font-size: 12px; font-weight: 600;
      cursor: pointer; border: 1px solid; transition: all 0.2s;
    }
    .ai-btn:active { transform: scale(0.97); }

    .ai-btn-edit {
      background: #fff; color: #6366f1; border-color: #6366f1;
    }
    .ai-btn-edit:hover { background: #eef2ff; }

    .ai-btn-save {
      background: #6366f1; color: #fff; border-color: #6366f1;
    }
    .ai-btn-save:hover { background: #4f46e5; }

    .ai-btn-cancel {
      background: #fff; color: #888; border-color: #ccc;
    }
    .ai-btn-cancel:hover { background: #f5f5f5; }

    .ai-btn-copy {
      background: #fff; color: #059669; border-color: #059669;
    }
    .ai-btn-copy:hover { background: #ecfdf5; }
    .ai-btn-copy.copied { background: #059669; color: #fff; }

    .ai-btn-post {
      background: linear-gradient(135deg, #2563eb, #7c3aed); color: #fff;
      border-color: transparent;
    }
    .ai-btn-post:hover { opacity: 0.9; }
    .ai-btn-post.posted {
      background: linear-gradient(135deg, #059669, #10b981);
    }
    .ai-btn-post:disabled { opacity: 0.7; cursor: not-allowed; }

    /* Post Success Toast */
    .ai-post-toast {
      display: flex; align-items: center; gap: 8px;
      margin-top: 10px; padding: 8px 14px;
      background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 6px;
      font-size: 12px; color: #065f46;
      animation: toastIn 0.3s ease-out;
    }
    .ai-post-toast em { color: #9ca3af; font-size: 11px; }
    @keyframes toastIn {
      from { opacity: 0; transform: translateY(-4px); }
      to { opacity: 1; transform: translateY(0); }
    }

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
  searchText = '';

  // New filters
  selectedDays = '';
  selectedDistrict = 'all';
  districtOptions: string[] = [];
  sortMethod = 'newest'; // newest, oldest, lowest, highest

  // AI Panel state
  expandedReviewId: string | null = null;
  aiLoading = false;
  aiError: string | null = null;
  aiResult: any = null;
  isEditing = false;
  editedResponse = '';
  copySuccess = false;
  postSuccess = false;
  private currentReview: any = null;

  constructor(private api: ApiService) { }

  ngOnInit() {
    this.loadDistricts();
    this.loadPage(1);
  }

  loadDistricts() {
    this.api.getDistrictHeatmap().subscribe({
      next: data => {
        this.districtOptions = (Array.isArray(data) ? data : [])
          .map((d: any) => d.district)
          .filter((d: string) => d && d !== 'Khác')
          .sort();
      },
      error: (e) => console.error('Failed to load districts:', e)
    });
  }

  loadPage(page: number) {
    if (page < 1) return;
    const params: any = { page, limit: 15 };

    // Date/Time filter
    if (this.selectedDays) params.days = this.selectedDays;

    // Branch/District filter
    if (this.selectedDistrict && this.selectedDistrict !== 'all') {
      params.branch = this.selectedDistrict;
    }

    // Sort
    if (this.sortMethod === 'newest') { params.sort = 'publishedAtDate'; params.order = 'desc'; }
    else if (this.sortMethod === 'oldest') { params.sort = 'publishedAtDate'; params.order = 'asc'; }
    else if (this.sortMethod === 'lowest') { params.sort = 'stars'; params.order = 'asc'; }
    else if (this.sortMethod === 'highest') { params.sort = 'stars'; params.order = 'desc'; }

    if (this.sentimentFilter) params.sentiment = this.sentimentFilter;
    if (this.starFilter) params.stars = this.starFilter;
    if (this.searchText.trim()) params.search = this.searchText.trim();

    this.api.getReviews(params).subscribe(data => {
      this.reviews = data.data;
      this.currentPage = data.page;
      this.totalPages = data.totalPages;
      // Close AI panel when page changes
      this.closeAIPanelSilent();
    });
  }

  // ── AI Panel Methods ──

  toggleAIPanel(review: any) {
    if (this.expandedReviewId === review.id) {
      this.closeAIPanelSilent();
      return;
    }
    this.expandedReviewId = review.id;
    this.currentReview = review;
    this.aiResult = null;
    this.aiError = null;
    this.aiLoading = true;
    this.isEditing = false;
    this.editedResponse = '';
    this.copySuccess = false;
    this.postSuccess = false;

    const reviewId = review.reviewId || review.id;
    this.api.getAIResponse(reviewId).subscribe({
      next: (result) => {
        this.aiResult = result;
        this.editedResponse = result.aiResponse || '';
        this.aiLoading = false;
      },
      error: (err) => {
        this.aiError = err.error?.error?.message || 'Không thể kết nối với AI server.';
        this.aiLoading = false;
      },
    });
  }

  closeAIPanel(event?: Event) {
    event?.stopPropagation();
    this.closeAIPanelSilent();
  }

  closeAIPanelSilent() {
    this.expandedReviewId = null;
    this.aiResult = null;
    this.aiError = null;
    this.aiLoading = false;
    this.isEditing = false;
    this.editedResponse = '';
    this.copySuccess = false;
    this.postSuccess = false;
    this.currentReview = null;
  }

  retryAI() {
    if (this.currentReview) {
      this.aiError = null;
      this.toggleAIPanel(this.currentReview);
    }
  }

  // ── Edit ──

  toggleEdit() {
    this.isEditing = true;
    if (!this.editedResponse && this.aiResult) {
      this.editedResponse = this.aiResult.aiResponse;
    }
  }

  saveEdit() {
    this.isEditing = false;
    // editedResponse is already bound to textarea via ngModel
  }

  cancelEdit() {
    this.isEditing = false;
    this.editedResponse = this.aiResult?.aiResponse || '';
  }

  // ── Copy ──

  copyResponse() {
    const text = this.editedResponse || this.aiResult?.aiResponse || '';
    navigator.clipboard.writeText(text).then(() => {
      this.copySuccess = true;
      setTimeout(() => this.copySuccess = false, 2000);
    });
  }

  // ── Post (Simulated) ──

  postResponse() {
    // Simulate posting to Google Maps with a delay
    this.postSuccess = false;
    setTimeout(() => {
      this.postSuccess = true;
      // Reset after 5 seconds
      setTimeout(() => this.postSuccess = false, 5000);
    }, 800);
  }

  // ── Table Helpers ──

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
