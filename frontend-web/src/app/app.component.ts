import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="app-layout">
      <nav class="sidebar">
        <div class="sidebar-header">
          <div class="logo-mark">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/><line x1="6" x2="6" y1="2" y2="4"/><line x1="10" x2="10" y1="2" y2="4"/><line x1="14" x2="14" y1="2" y2="4"/>
            </svg>
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
        </ul>
        <div class="sidebar-footer">
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

    .app-layout {
      display: flex;
      min-height: 100vh;
      background: var(--color-bg);
      color: var(--color-text);
      font-family: var(--font-family);
    }

    .sidebar {
      width: 260px;
      background: linear-gradient(180deg, var(--sidebar-bg) 0%, var(--sidebar-bg-dark) 100%);
      padding: 24px 16px;
      display: flex;
      flex-direction: column;
      position: sticky;
      top: 0;
      height: 100vh;
      overflow-y: auto;
    }

    .sidebar-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 0 8px 24px;
      border-bottom: 1px solid var(--sidebar-border);
      margin-bottom: 24px;
    }

    .logo-mark {
      width: 44px;
      height: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255,255,255,0.15);
      border-radius: var(--radius-md);
      color: #fff;
      flex-shrink: 0;
    }

    .logo {
      font-size: 20px;
      font-weight: 800;
      color: #fff;
      letter-spacing: -0.03em;
    }

    .subtitle {
      font-size: 11px;
      color: var(--sidebar-text-muted);
      margin-top: 2px;
      letter-spacing: 0.02em;
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
      color: var(--sidebar-text-muted);
      text-decoration: none;
      font-size: var(--font-size-base);
      font-weight: 500;
      transition: all var(--transition-base);
      cursor: pointer;
    }

    .nav-links a:hover {
      background: var(--sidebar-hover);
      color: #fff;
    }

    .nav-links a.active {
      background: var(--sidebar-active);
      color: #fff;
      font-weight: 600;
      box-shadow: inset 3px 0 0 #fff;
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
      border-top: 1px solid var(--sidebar-border);
    }

    .sidebar-brand {
      font-size: 11px;
      color: var(--sidebar-text-muted);
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
export class AppComponent { }
