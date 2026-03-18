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
          <h1 class="logo">🍵 PL-Insight</h1>
          <p class="subtitle">Phúc Long Dashboard</p>
        </div>
        <ul class="nav-links">
          <li>
            <a routerLink="/dashboard" routerLinkActive="active">
              <span class="icon">📊</span> Tổng quan
            </a>
          </li>
          <li>
            <a routerLink="/live-monitor" routerLinkActive="active">
              <span class="icon">📡</span> Live Monitor
            </a>
          </li>
          <li>
            <a routerLink="/reviews" routerLinkActive="active">
              <span class="icon">💬</span> Đánh giá
            </a>
          </li>
          <li>
            <a routerLink="/alerts" routerLinkActive="active">
              <span class="icon">🚨</span> Cảnh báo
            </a>
          </li>
        </ul>
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
      background: #0f1117;
      color: #e4e4e7;
      font-family: 'Inter', 'Segoe UI', sans-serif;
    }

    .sidebar {
      width: 260px;
      background: linear-gradient(180deg, #1a1b23 0%, #13141b 100%);
      border-right: 1px solid rgba(255,255,255,0.06);
      padding: 24px 16px;
      display: flex;
      flex-direction: column;
    }

    .sidebar-header {
      padding: 0 8px 24px;
      border-bottom: 1px solid rgba(255,255,255,0.06);
      margin-bottom: 24px;
    }

    .logo {
      font-size: 22px;
      font-weight: 700;
      background: linear-gradient(135deg, #22c55e, #16a34a);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .subtitle {
      font-size: 12px;
      color: #71717a;
      margin-top: 4px;
    }

    .nav-links {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .nav-links a {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      border-radius: 10px;
      color: #a1a1aa;
      text-decoration: none;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.2s ease;
    }

    .nav-links a:hover {
      background: rgba(255,255,255,0.04);
      color: #e4e4e7;
    }

    .nav-links a.active {
      background: rgba(34, 197, 94, 0.1);
      color: #22c55e;
    }

    .icon { font-size: 18px; }

    .main-content {
      flex: 1;
      padding: 32px;
      overflow-y: auto;
    }
  `],
})
export class AppComponent { }
