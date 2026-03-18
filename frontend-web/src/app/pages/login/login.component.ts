import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="login-page">
      <div class="login-card">
        <div class="login-header">
          <div class="logo-icon">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/><line x1="6" x2="6" y1="2" y2="4"/><line x1="10" x2="10" y1="2" y2="4"/><line x1="14" x2="14" y1="2" y2="4"/>
            </svg>
          </div>
          <h1 class="login-title">PL-Insight</h1>
          <p class="login-subtitle">Đăng nhập để truy cập Dashboard</p>
        </div>

        <form (ngSubmit)="onLogin()" class="login-form">
          <div class="form-group">
            <label for="username">Tên đăng nhập</label>
            <div class="input-wrapper">
              <svg class="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              <input id="username" type="text" [(ngModel)]="username" name="username"
                     placeholder="admin" autocomplete="username" required />
            </div>
          </div>

          <div class="form-group">
            <label for="password">Mật khẩu</label>
            <div class="input-wrapper">
              <svg class="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              <input id="password" [type]="showPassword ? 'text' : 'password'"
                     [(ngModel)]="password" name="password"
                     placeholder="••••••••" autocomplete="current-password" required />
              <button type="button" class="toggle-pw" (click)="showPassword = !showPassword">
                <svg *ngIf="!showPassword" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                <svg *ngIf="showPassword" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>
              </button>
            </div>
          </div>

          <div class="error-msg" *ngIf="errorMessage">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
            {{ errorMessage }}
          </div>

          <button type="submit" class="btn-login" [disabled]="isLoading">
            <span *ngIf="!isLoading">Đăng nhập</span>
            <span *ngIf="isLoading" class="spinner"></span>
          </button>
        </form>

        <div class="login-footer">
          <p>Phúc Long Coffee & Tea — Hệ thống quản trị</p>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .login-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #0C713D 0%, #095c31 40%, #064424 100%);
      padding: 20px;
      position: relative;
      overflow: hidden;
    }

    .login-page::before {
      content: '';
      position: absolute;
      top: -50%;
      right: -30%;
      width: 80%;
      height: 150%;
      background: radial-gradient(ellipse, rgba(255,255,255,0.06) 0%, transparent 70%);
      pointer-events: none;
    }

    .login-card {
      width: 100%;
      max-width: 420px;
      background: #fff;
      border-radius: 20px;
      padding: 48px 40px 36px;
      box-shadow: 0 25px 60px rgba(0,0,0,0.3);
      animation: slideUp 0.5s ease-out;
      position: relative;
      z-index: 1;
    }

    @keyframes slideUp {
      from { opacity: 0; transform: translateY(30px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .login-header {
      text-align: center;
      margin-bottom: 36px;
    }

    .logo-icon {
      width: 64px;
      height: 64px;
      background: linear-gradient(135deg, #0C713D, #16a34a);
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      margin: 0 auto 16px;
      box-shadow: 0 8px 20px rgba(12,113,61,0.3);
    }

    .login-title {
      font-size: 28px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.03em;
    }

    .login-subtitle {
      font-size: 14px;
      color: #64748b;
      margin-top: 6px;
    }

    .login-form {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .form-group label {
      display: block;
      font-size: 13px;
      font-weight: 600;
      color: #334155;
      margin-bottom: 8px;
    }

    .input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }

    .input-icon {
      position: absolute;
      left: 14px;
      color: #94a3b8;
      pointer-events: none;
      flex-shrink: 0;
    }

    .input-wrapper input {
      width: 100%;
      padding: 13px 14px 13px 44px;
      border: 2px solid #e2e8f0;
      border-radius: 12px;
      font-size: 15px;
      color: #0f172a;
      background: #f8fafc;
      transition: all 0.2s ease;
      outline: none;
      font-family: inherit;
    }

    .input-wrapper input:focus {
      border-color: #0C713D;
      background: #fff;
      box-shadow: 0 0 0 3px rgba(12,113,61,0.12);
    }

    .input-wrapper input::placeholder {
      color: #cbd5e1;
    }

    .toggle-pw {
      position: absolute;
      right: 12px;
      background: none;
      border: none;
      color: #94a3b8;
      cursor: pointer;
      padding: 4px;
      display: flex;
      align-items: center;
      transition: color 0.15s;
    }

    .toggle-pw:hover { color: #475569; }

    .error-msg {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 10px;
      color: #dc2626;
      font-size: 13px;
      font-weight: 500;
      animation: shake 0.4s ease;
    }

    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      20%, 60% { transform: translateX(-6px); }
      40%, 80% { transform: translateX(6px); }
    }

    .btn-login {
      width: 100%;
      padding: 14px;
      background: linear-gradient(135deg, #0C713D, #16a34a);
      color: #fff;
      border: none;
      border-radius: 12px;
      font-size: 15px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s ease;
      letter-spacing: 0.01em;
      margin-top: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 48px;
    }

    .btn-login:hover:not(:disabled) {
      background: linear-gradient(135deg, #095c31, #15803d);
      box-shadow: 0 6px 16px rgba(12,113,61,0.35);
      transform: translateY(-1px);
    }

    .btn-login:active:not(:disabled) {
      transform: translateY(0);
    }

    .btn-login:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }

    .spinner {
      width: 20px;
      height: 20px;
      border: 3px solid rgba(255,255,255,0.3);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .login-footer {
      text-align: center;
      margin-top: 28px;
      padding-top: 20px;
      border-top: 1px solid #f1f5f9;
    }

    .login-footer p {
      font-size: 12px;
      color: #94a3b8;
      letter-spacing: 0.02em;
    }
  `],
})
export class LoginComponent {
    username = '';
    password = '';
    errorMessage = '';
    isLoading = false;
    showPassword = false;

    constructor(private authService: AuthService, private router: Router) {
        // If already logged in, redirect to dashboard
        if (this.authService.isLoggedIn()) {
            this.router.navigate(['/dashboard']);
        }
    }

    onLogin() {
        if (!this.username || !this.password) {
            this.errorMessage = 'Vui lòng nhập đầy đủ thông tin';
            return;
        }

        this.isLoading = true;
        this.errorMessage = '';

        this.authService.login(this.username, this.password).subscribe({
            next: () => {
                this.router.navigate(['/dashboard']);
            },
            error: (err) => {
                this.isLoading = false;
                this.errorMessage = err.error?.error || 'Đăng nhập thất bại';
            },
        });
    }
}
