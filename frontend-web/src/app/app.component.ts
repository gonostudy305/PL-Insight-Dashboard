import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { AuthService } from './services/auth.service';
import { filter } from 'rxjs';
import { TopHeaderComponent } from './components/top-header/top-header.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, TopHeaderComponent],
  template: `
    <!-- Login page -->
    <div *ngIf="isLoginPage" class="login-layout">
      <router-outlet />
    </div>

    <!-- Main App Layout (KiotViet ERP Style) -->
    <div *ngIf="!isLoginPage" class="erp-layout">
      <!-- 1. Top Navigation -->
      <app-top-header></app-top-header>
      
      <!-- 2. Main Body (Page content) -->
      <main class="main-body">
        <router-outlet />
      </main>
    </div>
  `,
  styles: [`
    * { margin: 0; padding: 0; box-sizing: border-box; }

    .login-layout { min-height: 100vh; }

    .erp-layout {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      background: var(--color-bg);
      font-family: var(--font-family);
    }

    .main-body {
      flex: 1;
      display: flex;
      flex-direction: column;
      width: 100%;
    }

    /* ─── Standard ERP Page Layout Classes (Global) ─── */
    /* To be used by child components to structure their layout */
    ::ng-deep .page-container {
      display: flex;
      flex: 1;
      height: calc(100vh - 52px); /* 52px is top-header height */
      overflow: hidden;
    }

    ::ng-deep .filter-sidebar {
      width: 280px;
      background: var(--color-surface);
      border-right: 1px solid var(--color-border);
      display: flex;
      flex-direction: column;
      height: 100%;
      overflow-y: auto;
      flex-shrink: 0;
      padding: var(--space-4);
      /* Note: hidden on mobile by default, handled later */
    }

    ::ng-deep .filter-sidebar-title {
      font-size: var(--font-size-md);
      font-weight: 700;
      color: var(--color-text);
      margin-bottom: var(--space-4);
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }
    
    ::ng-deep .filter-group {
      margin-bottom: var(--space-4);
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }

    ::ng-deep .filter-group label {
      font-size: var(--font-size-sm);
      font-weight: 600;
      color: var(--color-text-secondary);
    }

    ::ng-deep .filter-group select,
    ::ng-deep .filter-group input {
      padding: 8px 12px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--color-border);
      background: var(--color-surface);
      font-size: var(--font-size-sm);
      color: var(--color-text);
      transition: all var(--transition-base);
    }

    ::ng-deep .filter-group select:focus,
    ::ng-deep .filter-group input:focus {
      outline: none;
      border-color: var(--color-primary);
      box-shadow: 0 0 0 2px rgba(27, 94, 32, 0.1);
    }

    ::ng-deep .data-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow-y: auto;
      padding: var(--space-5) var(--space-6);
      background: var(--color-bg);
    }

    ::ng-deep .page-header {
      /* Shared header for title and global actions at the top of data-content */
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: var(--space-5);
      background: transparent;
    }

    /* Responsive Design for Filter Sidebar */
    @media (max-width: 900px) {
      ::ng-deep .page-container {
        flex-direction: column;
        height: auto;
        min-height: calc(100vh - 52px);
      }
      
      ::ng-deep .filter-sidebar {
        width: 100%;
        height: auto;
        border-right: none;
        border-bottom: 1px solid var(--color-border);
        flex-shrink: 0;
      }

      ::ng-deep .data-content {
        padding: var(--space-4);
        overflow-y: visible;
      }
      
      ::ng-deep .page-header {
        flex-direction: column;
        gap: var(--space-3);
      }
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
