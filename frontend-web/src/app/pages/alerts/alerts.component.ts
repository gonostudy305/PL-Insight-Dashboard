import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-alerts',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="kv-wrapper">
      <!-- Headers -->
      <div class="kv-header-row">
        <div class="kv-title-area">
          <h2 class="page-title">Cảnh báo rủi ro</h2>
        </div>
        <div class="kv-top-actions">
          <div class="search-wrap">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" x2="16.65" y1="21" y2="16.65"/></svg>
            <input type="text" placeholder="Theo mã, chi nhánh, nội dung">
          </div>
          <button class="btn-primary" (click)="runTriggerScan()" [disabled]="scanning">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            {{ scanning ? 'Đang chạy quét...' : 'Kích hoạt Quét ▾' }}
          </button>
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
        <!-- Sidebar Filters -->
        <div class="kv-sidebar">
          
          <div class="filter-box">
            <div class="filter-title">
              Chế độ xem <a class="filter-link">Tạo mới</a>
            </div>
            <div class="filter-content">
              <label class="radio-label">
                <input type="radio" name="tabMode" [checked]="activeTab === 'queue'" (change)="activeTab = 'queue'"> 
                Hàng đợi ưu tiên ({{alerts.length}})
              </label>
              <label class="radio-label">
                <input type="radio" name="tabMode" [checked]="activeTab === 'history'" (change)="activeTab = 'history'; loadHistory()"> 
                Lịch sử cảnh báo <span class="badge" *ngIf="statusCounts.new > 0">{{statusCounts.new}}</span>
              </label>
            </div>
          </div>

          <div class="filter-box" *ngIf="activeTab === 'history'">
            <div class="filter-title">
              Trạng thái (Lịch sử)
            </div>
            <div class="filter-search">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" x2="16.65" y1="21" y2="16.65"/></svg>
              <input type="text" placeholder="Tìm kiếm trạng thái">
            </div>
            <div class="filter-content">
              <label class="radio-label"><input type="radio" name="st" [checked]="historyFilter === ''" (change)="historyFilter = ''; loadHistory()"> Tất cả trạng thái</label>
              <label class="radio-label"><input type="radio" name="st" [checked]="historyFilter === 'new'" (change)="historyFilter = 'new'; loadHistory()"> Mở mới</label>
              <label class="radio-label"><input type="radio" name="st" [checked]="historyFilter === 'acknowledged'" (change)="historyFilter = 'acknowledged'; loadHistory()"> Đã nhận</label>
              <label class="radio-label"><input type="radio" name="st" [checked]="historyFilter === 'resolved'" (change)="historyFilter = 'resolved'; loadHistory()"> Hoàn tất</label>
            </div>
          </div>

          <div class="filter-box telegram-box">
            <div class="filter-title">Trạng thái Telegram</div>
            <div class="filter-content">
              <div class="tg-status" [class.connected]="telegramConnected">
                <span class="tg-dot"></span> {{ telegramConnected ? 'Đã kết nối' : 'Đang ngắt kết nối' }}
              </div>
              <button class="btn-outline btn-block mt-2" *ngIf="telegramConnected" (click)="testTelegram()" [disabled]="testingTelegram">
                {{ testingTelegram ? 'Đang gửi...' : 'Test Gửi Cảnh Báo' }}
              </button>
            </div>
          </div>

        </div>

        <!-- Data Table -->
        <div class="kv-table-area">
          
          <div class="table-banner" *ngIf="scanResult">
            ✅ Trình quét hoàn tất: Tạo mới {{scanResult.created}} | Bỏ qua {{scanResult.skipped}} | Gửi TL: {{scanResult.alerts?.length || 0}}
            <button class="close-btn" (click)="scanResult = null">×</button>
          </div>
          <div class="table-banner tg-banner" *ngIf="telegramTestResult">
            {{ telegramTestResult.success ? '✅ Gửi Telegram thành công!' : '❌ Gửi Telegram thất bại' }}
            <button class="close-btn" (click)="telegramTestResult = null">×</button>
          </div>

          <table class="kv-table">
            <thead>
              <tr>
                <th class="col-chk"><input type="checkbox"></th>
                <th class="col-star"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg></th>
                <th class="col-id">Mã Cảnh báo</th>
                <th class="col-main">Nội dung rủi ro</th>
                <th class="col-branch">Chi nhánh</th>
                <th class="col-risk">Mức độ rủi ro</th>
                <th class="col-status">Trạng thái</th>
                <th class="col-time">T/g phát sinh</th>
                <th class="col-action">Thao tác</th>
              </tr>
            </thead>
            
            <!-- QUEUE ROWS -->
            <tbody *ngIf="activeTab === 'queue'">
              <tr *ngFor="let alert of alerts; let i = index">
                <td class="col-chk"><input type="checkbox"></td>
                <td class="col-star"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg></td>
                <td class="col-id"><span class="link">AL-Q{{alert.reviewId?.substring(0,4) || i}}</span></td>
                <td class="col-main">
                  <div class="tbl-text">{{ alert.text }}</div>
                  <div class="tbl-tags">
                    <span class="badg risk"*ngFor="let risk of alert.riskFactors">#{{risk}}</span>
                  </div>
                </td>
                <td class="col-branch">{{ alert.branchAddress }}</td>
                <td class="col-risk"><span class="dot-label" [class]="'r-'+alert.priorityLevel"></span> {{ alert.priorityLabel }}</td>
                <td class="col-status"><span class="st-badge new">Hàng đợi mới</span></td>
                <td class="col-time">{{ formatTime(alert.createdAt) }}</td>
                <td class="col-action">
                  <button class="tbl-btn" title="Gợi ý" (click)="openSuggestion(alert)"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></button>
                  <button class="tbl-btn" title="Xác nhận" (click)="updateStatus(alert.alertId, 'acknowledged')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg></button>
                </td>
              </tr>
              <tr *ngIf="alerts.length === 0" class="empty-tr">
                <td colspan="9">Không có cảnh báo mới trong hàng đợi do hệ thống ổn định.</td>
              </tr>
            </tbody>

            <!-- HISTORY ROWS -->
            <tbody *ngIf="activeTab === 'history'">
              <tr *ngFor="let h of historyAlerts">
                <td class="col-chk"><input type="checkbox"></td>
                <td class="col-star"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg></td>
                <td class="col-id"><span class="link">AL-H{{h.alertId?.substring(0,4)}}</span></td>
                <td class="col-main">
                   <div class="tbl-text">{{ h.triggerRule }}</div>
                   <div class="tbl-subtext">Đã phát hiện trong chu kỳ kiểm tra</div>
                </td>
                <td class="col-branch">{{ h.branchAddress }}</td>
                <td class="col-risk"><span class="dot-label r-3"></span> Cảnh báo hệ thống</td>
                <td class="col-status">
                  <span class="st-badge" [class.new]="h.status==='new'" [class.ack]="h.status==='acknowledged'" [class.res]="h.status==='resolved'">
                    {{ h.status === 'new' ? 'Mở mới' : (h.status === 'acknowledged' ? 'Đã nhận' : 'Hoàn tất') }}
                  </span>
                </td>
                <td class="col-time">{{ formatTime(h.createdAt) }}</td>
                <td class="col-action">
                  <button class="tbl-btn" *ngIf="h.status === 'new'" title="Nhận" (click)="updateStatus(h.alertId, 'acknowledged')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg></button>
                  <button class="tbl-btn green" *ngIf="h.status === 'acknowledged'" title="Hoàn tất" (click)="updateStatus(h.alertId, 'resolved')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg></button>
                </td>
              </tr>
              <tr *ngIf="historyAlerts.length === 0" class="empty-tr">
                <td colspan="9">Chưa có lịch sử cảnh báo theo bộ lọc này.</td>
              </tr>
            </tbody>
          </table>
          
          <div class="table-pager">
             <div class="pager-info">Hiển thị 1 - {{ activeTab === 'queue' ? alerts.length : historyAlerts.length }} trên tổng số</div>
             <div class="pager-btns">
                <button disabled>&lt;</button>
                <button class="active">1</button>
                <button disabled>&gt;</button>
             </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Suggestion Modal (Retained Original Logics) -->
    <div class="modal-backdrop" *ngIf="suggestionModal" (click)="suggestionModal = null"></div>
    <div class="suggestion-modal" *ngIf="suggestionModal">
       <div class="modal-header">
         <h3>Gợi ý phản hồi khách hàng</h3>
         <button class="close-modal" (click)="suggestionModal = null"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg></button>
       </div>
       <div class="modal-review">
         <div class="review-label">Nội dung review:</div>
         <p class="review-text">{{ suggestionModal.reviewText }}</p>
         <div class="review-cats">
           <span class="cat-tag" *ngFor="let c of suggestionModal.categories">{{ c }}</span>
         </div>
       </div>
       <div class="suggestion-loading" *ngIf="suggestionLoading">Đang tạo gợi ý xử lý...</div>
       <div class="suggestion-list" *ngIf="!suggestionLoading">
         <div class="suggestion-item" *ngFor="let s of suggestionModal.suggestions; let i = index">
           <div class="suggestion-header">
             <span class="suggestion-num">#{{ i + 1 }}</span>
             <span class="suggestion-cat">{{ s.category }}</span>
             <button class="copy-btn" (click)="copySuggestion(s.text, i)">{{ copiedIndex === i ? '✓ Đã copy' : 'Copy' }}</button>
           </div>
           <p class="suggestion-text">{{ s.text }}</p>
         </div>
       </div>
    </div>
  `,
  styles: [`
    /* Layout Variables KV */
    :root {
      --kv-blue: #0070f4;
      --kv-border: #e0e4eb;
      --kv-bg: #f5f6f8;
      --kv-txt: #333;
      --kv-txt-muted: #888;
    }

    .kv-wrapper {
      background: #f4f5f7;
      min-height: calc(100vh - 52px);
      display: flex;
      flex-direction: column;
      font-family: Arial, sans-serif; /* Clean font */
    }

    /* TOP HEADER ROW */
    .kv-header-row {
      display: flex;
      background: transparent;
      padding: 12px 16px;
      gap: 16px;
    }

    .kv-title-area {
      width: 240px; /* Match sidebar width */
      flex-shrink: 0;
      display: flex;
      align-items: center;
    }
    .page-title {
      font-size: 1.2rem;
      font-weight: 700;
      color: #333;
      margin: 0;
    }

    .kv-top-actions {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .search-wrap {
      flex: 1;
      max-width: 400px;
      position: relative;
      background: white;
      border: 1px solid #ced4da;
      border-radius: 4px;
      display: flex;
      align-items: center;
      padding: 0 10px;
    }
    .search-wrap svg { color: #888; }
    .search-wrap input {
      border: none;
      outline: none;
      padding: 8px;
      width: 100%;
      font-size: 13px;
    }

    .btn-primary {
      background: #fff;
      color: #0070f4;
      border: 1px solid #0070f4;
      border-radius: 4px;
      padding: 6px 12px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: 0.2s;
    }
    .btn-primary:hover { background: #f0f7ff; }
    
    .btn-outline {
      background: #fff;
      color: #333;
      border: 1px solid #ced4da;
      border-radius: 4px;
      padding: 6px 12px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .btn-outline:hover { background: #f8f9fa; }

    .settings-icons {
      margin-left: auto;
      display: flex;
      gap: 8px;
    }
    .icon-btn {
      background: #fff;
      border: 1px solid #ced4da;
      padding: 6px;
      border-radius: 4px;
      cursor: pointer;
      color: #555;
    }
    .icon-btn:hover { background: #f8f9fa; }

    /* BODY ROW (Sidebar + Content) */
    .kv-body-row {
      display: flex;
      flex: 1;
      padding: 0 16px 16px 16px;
      gap: 16px;
      align-items: flex-start;
    }

    /* SIDEBAR */
    .kv-sidebar {
      width: 240px;
      flex-shrink: 0;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .filter-box {
      background: #fff;
      border-radius: 4px;
      box-shadow: 0 1px 2px rgba(0,0,0,0.05);
      border: 1px solid #e0e4eb;
    }
    .filter-title {
      padding: 10px 12px;
      font-size: 13px;
      font-weight: 700;
      color: #333;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .filter-link {
      font-size: 11px;
      color: #0070f4;
      font-weight: 400;
      cursor: pointer;
    }
    .filter-search {
      margin: 0 12px 10px 12px;
      position: relative;
      display: flex;
      align-items: center;
      border: 1px solid #ced4da;
      border-radius: 3px;
      padding: 0 6px;
      background: #f8f9fa;
    }
    .filter-search svg { color: #888; margin-right: 4px; }
    .filter-search input {
      border: none; background: transparent; padding: 6px 0; width: 100%; font-size: 12px; outline: none;
    }
    .filter-content {
      padding: 0 12px 12px 12px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .radio-label {
      font-size: 13px; color: #444; display: flex; align-items: center; gap: 6px; cursor: pointer;
    }
    .badge {
      background: #dc3545; color: white; padding: 2px 6px; border-radius: 10px; font-size: 10px; font-weight: 700;
    }
    .mt-2 { margin-top: 8px; }
    .btn-block { width: 100%; justify-content: center; }
    .tg-status { font-size: 12px; font-weight: 600; color: #666; display: flex; align-items: center; gap: 6px; }
    .tg-status.connected { color: #059669; }
    .tg-dot { width: 8px; height: 8px; border-radius: 50%; background: #ccc; }
    .tg-status.connected .tg-dot { background: #10b981; }

    /* TABLE LAYOUT */
    .kv-table-area {
      flex: 1;
      background: #fff;
      border-radius: 4px;
      box-shadow: 0 1px 2px rgba(0,0,0,0.05);
      border: 1px solid #e0e4eb;
      min-width: 0; /* Important to prevent overflow */
      overflow-x: auto;
      display: flex;
      flex-direction: column;
    }

    .table-banner {
      padding: 10px 16px; background: #e6f3ff; border-bottom: 1px solid #b3d7ff;
      font-size: 13px; color: #004085; display: flex; align-items: center; justify-content: space-between;
    }
    .tg-banner { background: #d4edda; border-color: #c3e6cb; color: #155724; }
    .close-btn { background: none; border: none; font-size: 16px; cursor: pointer; color: inherit; opacity: 0.6; }
    .close-btn:hover { opacity: 1; }

    .kv-table {
      width: 100%; border-collapse: collapse; min-width: 900px;
    }
    .kv-table th, .kv-table td {
      padding: 10px 12px; text-align: left; font-size: 13px; border-bottom: 1px solid #f0f0f0;
    }
    .kv-table th {
      background: #e9eaec; font-weight: 700; color: #333; position: sticky; top: 0; border-bottom: 1px solid #ccc;
    }
    .kv-table tbody tr:hover { background: #fdfdfd; box-shadow: 0 1px 3px rgba(0,0,0,0.05); position: relative; z-index: 10; }

    /* Columns Config */
    .col-chk, .col-star { width: 30px; text-align: center; }
    .col-id { width: 90px; }
    .col-main { width: 35%; }
    .col-branch { width: 15%; }
    .col-risk { width: 110px; }
    .col-status { width: 100px; }
    .col-time { width: 120px; }
    .col-action { width: 70px; text-align: right; }

    .link { color: #0070f4; cursor: pointer; font-weight: 500;}
    .link:hover { text-decoration: underline; }

    .tbl-text { color: #333; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .tbl-subtext { font-size: 11px; color: #888; margin-top: 4px; }
    .tbl-tags { display: flex; gap: 4px; margin-top: 4px; flex-wrap: wrap;}
    .badg { font-size: 10px; background: #eee; padding: 2px 6px; border-radius: 2px; color: #555; }
    .badg.risk { background: #fde8e8; color: #c81e1e; }

    .dot-label { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 4px; }
    .r-1 { background: #dc3545; }
    .r-2 { background: #ffc107; }
    .r-3 { background: #17a2b8; }

    .st-badge { padding: 3px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; white-space: nowrap; }
    .st-badge.new { background: #fde8e8; color: #c81e1e; }
    .st-badge.ack { background: #fef08a; color: #a16207; }
    .st-badge.res { background: #def7ec; color: #03543f; }

    .empty-tr td {
      text-align: center; color: #888; padding: 24px; font-style: italic;
    }

    .tbl-btn {
      background: #f8f9fa; border: 1px solid #ced4da; border-radius: 3px;
      padding: 4px; cursor: pointer; color: #555; margin-left: 4px;
    }
    .tbl-btn:hover { background: #e2e6ea; }
    .tbl-btn.green { color: #059669; }

    /* Pagination Bar */
    .table-pager {
      display: flex; justify-content: space-between; align-items: center;
      padding: 12px 16px; border-top: 1px solid #eee; background: #fff; border-radius: 0 0 4px 4px;
      margin-top: auto;
    }
    .pager-info { font-size: 13px; color: #666; }
    .pager-btns { display: flex; gap: 4px; }
    .pager-btns button {
      background: white; border: 1px solid #ced4da; border-radius: 3px; padding: 2px 8px;
      font-size: 13px; cursor: pointer; color: #555;
    }
    .pager-btns button.active { background: #0070f4; color: white; border-color: #0070f4; }
    .pager-btns button:disabled { opacity: 0.5; cursor: not-allowed; }

    /* Modal Styling reused */
    .modal-backdrop {
      position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 100;
    }
    .suggestion-modal {
      position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
      background: white; border-radius: 6px; box-shadow: 0 10px 25px rgba(0,0,0,0.2);
      padding: 24px; width: 600px; max-width: 90vw; max-height: 80vh; overflow-y: auto; z-index: 101;
    }
    .modal-header {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 16px; border-bottom: 1px solid #eee; padding-bottom: 12px;
    }
    .modal-header h3 { font-size: 16px; font-weight: 700; margin: 0; }
    .close-modal { background: none; border: none; cursor: pointer; padding: 4px; }
    .review-label { font-size: 12px; font-weight: 700; color: #666; margin-bottom: 6px; }
    .review-text { font-size: 13px; background: #f8f9fa; padding: 12px; border-radius: 4px; }
    .cat-tag { padding: 2px 8px; background: #ecfdf5; color: #059669; border-radius: 12px; font-size: 11px; margin-right: 6px; }
    .suggestion-item { border: 1px solid #eee; border-radius: 4px; padding: 12px; margin-bottom: 12px; }
    .suggestion-header { display: flex; justify-content: space-between; margin-bottom: 8px; }
    .suggestion-num { font-weight: 700; color: #0070f4; font-size: 12px; }
    .copy-btn { border: 1px solid #ccc; background: #fff; padding: 2px 8px; border-radius: 3px; font-size: 11px; cursor: pointer; }
    .copy-btn:hover { background: #f0f0f0; }
    .suggestion-text { font-size: 13px; line-height: 1.5; color: #333; margin: 0; }
  `]
})
export class AlertsComponent implements OnInit {
  alerts: any[] = [];
  historyAlerts: any[] = [];
  summary = { high: 0, standard: 0, monitoring: 0 };
  statusCounts = { new: 0, acknowledged: 0, resolved: 0 };
  activeTab = 'queue';
  historyFilter = '';
  scanning = false;
  scanResult: any = null;
  telegramConnected = false;
  testingTelegram = false;
  telegramTestResult: any = null;
  suggestionModal: any = null;
  suggestionLoading = false;
  copiedIndex: number | null = null;

  constructor(private api: ApiService) { }

  ngOnInit() {
    this.loadQueue();
    this.loadHistory();
    this.checkTelegram();
  }

  checkTelegram() {
    this.api.getTelegramStatus().subscribe({
      next: data => this.telegramConnected = data.configured,
      error: () => this.telegramConnected = false,
    });
  }

  testTelegram() {
    this.testingTelegram = true;
    this.telegramTestResult = null;
    this.api.testTelegramNotify().subscribe({
      next: result => {
        this.telegramTestResult = result;
        this.testingTelegram = false;
      },
      error: err => {
        this.telegramTestResult = { success: false, error: err.message };
        this.testingTelegram = false;
      },
    });
  }

  openSuggestion(alert: any) {
    this.suggestionModal = { reviewText: alert.text, categories: [], suggestions: [] };
    this.suggestionLoading = true;
    this.copiedIndex = null;
    const reviewId = alert.reviewId || alert.alertId;
    this.api.getSuggestions(reviewId).subscribe({
      next: data => {
        this.suggestionModal = data;
        this.suggestionLoading = false;
      },
      error: () => {
        this.suggestionModal.suggestions = [{ category: 'Chung', text: 'Chân thành cảm ơn bạn đã đánh giá. Chúng tôi sẽ trích xuất thông tin để cải thiện.' }];
        this.suggestionModal.categories = ['Chung'];
        this.suggestionLoading = false;
      },
    });
  }

  copySuggestion(text: string, index: number) {
    navigator.clipboard.writeText(text);
    this.copiedIndex = index;
    setTimeout(() => this.copiedIndex = null, 2000);
  }

  loadQueue() {
    this.api.getAlerts(50).subscribe({
      next: (data: any) => {
        this.alerts = data.data || [];
        this.summary = data.summary || this.summary;
      },
      error: (err: any) => console.error('Queue load error:', err),
    });
  }

  loadHistory() {
    const params: any = {};
    if (this.historyFilter) params.status = this.historyFilter;
    this.api.getAlertHistory(params).subscribe({
      next: (data: any) => {
        this.historyAlerts = data.data || [];
        this.statusCounts = data.statusCounts || this.statusCounts;
      },
      error: (err: any) => console.error('History load error:', err),
    });
  }

  runTriggerScan() {
    this.scanning = true;
    this.api.runAlertScan().subscribe({
      next: (result: any) => {
        this.scanResult = result;
        this.scanning = false;
        this.loadHistory();
      },
      error: (err: any) => {
        console.error('Scan error:', err);
        this.scanning = false;
      },
    });
  }

  updateStatus(alertId: string, status: string) {
    this.api.updateAlertStatus(alertId, status).subscribe({
      next: () => this.loadHistory(),
      error: (err: any) => console.error('Status update error:', err),
    });
  }

  formatTime(date: string): string {
    if (!date) return '';
    return new Date(date).toLocaleString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }
}
