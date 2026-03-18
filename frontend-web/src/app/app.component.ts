import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { AuthService } from './services/auth.service';
import { filter } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <!-- Login page: no sidebar -->
    <div *ngIf="isLoginPage" class="login-layout">
      <router-outlet />
    </div>

    <!-- Dashboard pages: with sidebar -->
    <div *ngIf="!isLoginPage" class="app-layout">
      <nav class="sidebar">
        <div class="sidebar-header">
          <div class="logo-mark">
            <img src="logo.ico" alt="Phúc Long" style="width: 48px; height: 48px; object-fit: contain;">
          </div>
          <div>
            <h1 class="logo">PL-Insight</h1>
            <p class="subtitle">Phúc Long Dashboard</p>
          </div>
        </div>
        <ul class="nav-links">
          <li>
            <a routerLink="/dashboard" routerLinkActive="active">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>
              Tổng quan
            </a>
          </li>
          <li>
            <a routerLink="/live-monitor" routerLinkActive="active">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
              Live Monitor
            </a>
          </li>
          <li>
            <a routerLink="/analytics" routerLinkActive="active">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
              Phân tích
            </a>
          </li>
          <li>
            <a routerLink="/reviews" routerLinkActive="active">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>
              Đánh giá
            </a>
          </li>
          <li>
            <a routerLink="/alerts" routerLinkActive="active">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
              Cảnh báo
            </a>
          </li>
          <li>
            <a routerLink="/map" routerLinkActive="active">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
              Bản đồ
            </a>
          </li>
        </ul>
        <div class="sidebar-footer">
          <div class="user-block" *ngIf="currentUser">
            <div class="user-avatar">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </div>
            <div class="user-info">
              <span class="user-name">{{ currentUser.displayName }}</span>
              <span class="user-role">{{ currentUser.role }}</span>
            </div>
            <button class="btn-logout" (click)="onLogout()" title="Đăng xuất">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
            </button>
          </div>
          <div class="sidebar-brand">Phúc Long Coffee & Tea</div>
        </div>
      </nav>
      <main class="main-content">
        <router-outlet />
      </main>
    </div>
  `,
  styles: [`
    * { margin: 0; padding: 0; box-sizing: border-box; }

    .login-layout { min-height: 100vh; }

    .app-layout {
      display: flex;
      min-height: 100vh;
      background: var(--color-bg);
      color: var(--color-text);
      font-family: var(--font-family);
    }

    .sidebar {
      width: 260px;
      background: var(--color-surface);
      border-right: 1px solid var(--color-border);
      padding: 24px 16px;
      display: flex;
      flex-direction: column;
      position: sticky;
      top: 0;
      height: 100vh;
      overflow-y: auto;
      box-shadow: var(--shadow-sm);
      z-index: var(--z-sticky);
    }

    .sidebar-header {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 0 8px 24px;
      background: transparent;
      border-bottom: 1px solid var(--color-border-light);
      margin-bottom: 24px;
    }

    .logo-mark {
      width: 48px;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: transparent;
      border-radius: var(--radius-md);
      flex-shrink: 0;
    }

    .logo {
      font-size: 26px;
      font-weight: 800;
      color: var(--pl-green);
      letter-spacing: -0.04em;
      line-height: 1.1;
    }

    .subtitle {
      font-size: 13px;
      color: var(--pl-green-dark);
      margin-top: 4px;
      letter-spacing: 0.02em;
      font-weight: 500;
    }

    .nav-links {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 4px;
      flex: 1;
    }

    .nav-links a {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 11px 14px;
      border-radius: var(--radius-md);
      color: var(--color-text-secondary);
      text-decoration: none;
      font-size: var(--font-size-base);
      font-weight: 500;
      transition: all var(--transition-base);
      cursor: pointer;
    }

    .nav-links a:hover {
      background: var(--pl-green-50);
      color: var(--pl-green-dark);
    }

    .nav-links a.active {
      background: var(--pl-green-50);
      color: var(--pl-green-dark);
      font-weight: 600;
      box-shadow: inset 3px 0 0 var(--pl-green);
    }

    .nav-links a svg {
      flex-shrink: 0;
      opacity: 0.75;
      transition: opacity var(--transition-fast);
    }

    .nav-links a:hover svg,
    .nav-links a.active svg {
      opacity: 1;
    }

    .sidebar-footer {
      margin-top: auto;
      padding-top: 16px;
      border-top: 1px solid var(--color-border-light);
    }

    .user-block {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 8px;
      margin-bottom: 12px;
      border-radius: var(--radius-md);
      background: var(--color-bg);
      border: 1px solid var(--color-border-light);
    }

    .user-avatar {
      width: 34px;
      height: 34px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--pl-green-50);
      border-radius: 50%;
      color: var(--pl-green);
      flex-shrink: 0;
    }

    .user-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .user-name {
      font-size: 13px;
      font-weight: 600;
      color: var(--color-text);
    }

    .user-role {
      font-size: 11px;
      color: var(--color-text-secondary);
      text-transform: capitalize;
    }

    .btn-logout {
      background: none;
      border: none;
      color: var(--color-text-secondary);
      cursor: pointer;
      padding: 6px;
      border-radius: var(--radius-sm);
      transition: all 0.15s ease;
      display: flex;
      align-items: center;
    }

    .btn-logout:hover {
      color: var(--color-danger);
      background: var(--color-danger-bg);
    }

    .sidebar-brand {
      font-size: 11px;
      color: var(--color-text-muted);
      text-align: center;
      letter-spacing: 0.04em;
    }

    .main-content {
      flex: 1;
      padding: var(--space-8);
      overflow-y: auto;
      min-height: 100vh;
    }
  `],
})
export class AppComponent {
  isLoginPage = true;
  currentUser: any = null;

  constructor(private authService: AuthService, private router: Router) {
    this.currentUser = this.authService.getUser();

    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe((e: any) => {
      this.isLoginPage = e.urlAfterRedirects === '/login';
      this.currentUser = this.authService.getUser();
    });
  }

  onLogout() {
    this.authService.logout();
  }
}
