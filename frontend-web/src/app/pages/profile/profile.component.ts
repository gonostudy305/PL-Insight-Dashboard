import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-profile',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="erp-page-container">
      <!-- Mặc dù có Sidebar ở layout ERP, trang Profile KiotViet full grid, ta wrap trong content centered -->
      <div class="profile-layout">
        
        <div class="page-title-row">
          <h2 class="page-title">Tài khoản</h2>
        </div>

        <div class="profile-card">
          <div class="card-header">
            <h3>Thông tin người dùng</h3>
            <button class="btn-outline-pro">Chỉnh sửa</button>
          </div>
          
          <div class="info-grid">
            <div class="info-group">
              <label>Tên hiển thị</label>
              <div class="info-value">{{ currentUser?.displayName || 'HuynhVu' }}</div>
            </div>
            <div class="info-group">
              <label>Tên đăng nhập</label>
              <div class="info-value">{{ currentUser?.username || 'Vuhuynh' }}</div>
            </div>
            <div class="info-group">
              <label>Điện thoại</label>
              <div class="info-value empty">Chưa có</div>
            </div>
            
            <div class="info-group">
              <label>Email</label>
              <div class="info-value empty">Chưa có</div>
            </div>
            <div class="info-group">
              <label>Sinh nhật</label>
              <div class="info-value empty">Chưa có</div>
            </div>
            <div class="info-group" style="grid-column: 2 / 4">
              <!-- Empty spacer to match KiotViet layout -->
            </div>

            <div class="info-group full-width">
              <label>Địa chỉ</label>
              <div class="info-value empty">Chưa có</div>
            </div>
          </div>
          
          <div class="note-section">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
            <span class="empty">Chưa có ghi chú</span>
          </div>
        </div>

        <div class="profile-card">
          <div class="card-header">
            <h3>Đăng nhập và bảo mật</h3>
          </div>
          
          <div class="security-row">
            <div class="sec-left">
              <div class="sec-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 18v3c0 .6.4 1 1 1h4v-3h3v-3h2l1.4-1.4a6.5 6.5 0 1 0-4-4Z"/><circle cx="16.5" cy="7.5" r=".5" fill="currentColor"/></svg>
              </div>
              <div class="sec-info">
                <h4>Mật khẩu</h4>
                <p>Để bảo mật tài khoản tốt hơn, hãy sử dụng mật khẩu mạnh và thay đổi định kỳ 6 tháng/lần.<br>
                Hệ thống sẽ tự động đăng xuất tài khoản khỏi tất cả thiết bị trước khi đổi mật khẩu thành công.</p>
              </div>
            </div>
            <div class="sec-right">
              <button class="btn-outline-pro">Đổi mật khẩu</button>
            </div>
          </div>
        </div>

      </div>
    </div>
  `,
    styles: [`
    /* Replicate KiotViet Pro Profile Layout */
    .erp-page-container {
      background: var(--pl-bg-pro, #F8F9FA);
      min-height: calc(100vh - 52px);
      padding: 32px 16px;
      display: flex;
      justify-content: center;
      align-items: flex-start;
    }

    .profile-layout {
      width: 100%;
      max-width: 900px; /* Căn giữa như KV */
    }

    .page-title-row {
      margin-bottom: 24px;
      text-align: center;
    }
    .page-title {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--color-text);
    }

    .profile-card {
      background: var(--color-surface, #fff);
      border-radius: var(--radius-sm, 6px);
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
      border: 1px solid var(--color-border);
      margin-bottom: 24px;
      padding: 24px;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      border-bottom: 1px solid var(--color-border-light);
      padding-bottom: 12px;
    }
    
    .card-header h3 {
      font-size: 1rem;
      font-weight: 700;
      color: var(--color-text);
      margin: 0;
    }

    .btn-outline-pro {
      background: transparent;
      border: 1px solid var(--color-border);
      color: var(--color-text-secondary);
      padding: 6px 16px;
      border-radius: 4px;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-outline-pro:hover {
      background: var(--color-surface-hover);
      border-color: var(--color-text-muted);
    }

    /* Grid thông tin */
    .info-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px 24px;
      margin-bottom: 24px;
      padding-bottom: 24px;
      border-bottom: 1px dashed var(--color-border);
    }

    .info-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .info-group.full-width {
      grid-column: 1 / -1;
    }

    .info-group label {
      font-size: 0.8125rem;
      color: var(--color-text-muted, #94A3B8);
    }

    .info-value {
      font-size: 0.9375rem;
      color: var(--color-text, #333);
      font-weight: 500;
      min-height: 20px;
    }
    .info-value.empty, .empty {
      color: var(--color-text-muted, #94A3B8);
      font-weight: 400;
      font-style: italic;
    }

    .note-section {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.875rem;
      color: var(--color-text-secondary);
    }

    /* Đăng nhập và bảo mật */
    .security-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 24px;
    }

    .sec-left {
      display: flex;
      gap: 16px;
      align-items: flex-start;
    }

    .sec-icon {
      color: var(--color-text-muted);
      margin-top: 2px;
    }

    .sec-info h4 {
      font-size: 0.9375rem;
      font-weight: 700;
      margin: 0 0 6px 0;
      color: var(--color-text);
    }
    .sec-info p {
      font-size: 0.875rem;
      color: var(--color-text-muted);
      line-height: 1.5;
      margin: 0;
    }

  `]
})
export class ProfileComponent implements OnInit {
    currentUser: any = null;

    constructor(private authService: AuthService) {
        this.currentUser = this.authService.getUser();
    }

    ngOnInit(): void {
    }
}
