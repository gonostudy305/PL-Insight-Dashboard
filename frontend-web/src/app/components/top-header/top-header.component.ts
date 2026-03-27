import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { I18nService } from '../../services/i18n.service';
import { NotificationService, NotificationItem } from '../../services/notification.service';

@Component({
  selector: 'app-top-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <header class="top-header">
      <div class="header-left">
        <div class="logo-area">
          <img src="logo.ico" alt="Phúc Long" class="logo-img">
          <span class="logo-text">PL-Insight</span>
        </div>
        <nav class="top-nav">
          <a routerLink="/dashboard" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">{{ t('nav.dashboard') }}</a>
          <a routerLink="/live-monitor" routerLinkActive="active">{{ t('nav.liveMonitor') }}</a>
          <a routerLink="/analytics" routerLinkActive="active">{{ t('nav.analytics') }}</a>
          <a routerLink="/reviews" routerLinkActive="active">{{ t('nav.reviews') }}</a>
          <a routerLink="/alerts" routerLinkActive="active">{{ t('nav.alerts') }}</a>
          <a routerLink="/map" routerLinkActive="active">{{ t('nav.map') }}</a>
        </nav>
      </div>

      <div class="header-right">
        <!-- Branch Context Badge -->
        <div class="header-action item-branch">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          {{ t('header.allSystem') }} ▾
        </div>

        <!-- Language Switcher -->
        <div class="header-action lang-toggle" (click)="toggleLangMenu($event)">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
          {{ t('header.language') }} ▾
        </div>
        <div class="dropdown-menu lang-menu" *ngIf="showLangMenu">
          <button class="dropdown-item" [class.active-item]="currentLang === 'vi'" (click)="setLang('vi')">
            🇻🇳 Tiếng Việt
          </button>
          <button class="dropdown-item" [class.active-item]="currentLang === 'en'" (click)="setLang('en')">
            🇬🇧 English
          </button>
        </div>

        <!-- Theme Toggle -->
        <div class="header-action icon-btn" (click)="toggleTheme()" [title]="t('header.theme')">
          <svg *ngIf="currentTheme === 'light'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
          <svg *ngIf="currentTheme === 'dark'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
        </div>

        <!-- Notification Bell -->
        <div class="notif-container">
          <div class="header-action icon-btn" [title]="t('header.notifications')" (click)="toggleNotifMenu($event)">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            <span class="notif-badge" *ngIf="unreadCount > 0">{{ unreadCount > 9 ? '9+' : unreadCount }}</span>
          </div>
          <div class="dropdown-menu notif-menu" *ngIf="showNotifMenu">
            <div class="notif-header">
              <span class="notif-title">{{ t('header.notifications') }}</span>
              <button class="notif-mark-read" *ngIf="unreadCount > 0" (click)="markAllRead()">{{ t('header.markAllRead') }}</button>
            </div>
            <div class="notif-list" *ngIf="notifications.length > 0; else emptyNotif">
              <div class="notif-item" *ngFor="let n of notifications" [class]="'severity-' + n.severity">
                <div class="notif-item-title">{{ n.title }}</div>
                <div class="notif-item-msg">{{ n.message }}</div>
                <div class="notif-item-time">{{ n.timestamp | date:'dd/MM HH:mm' }}</div>
              </div>
            </div>
            <ng-template #emptyNotif>
              <div class="notif-empty">{{ t('header.noNotifications') }}</div>
            </ng-template>
          </div>
        </div>

        <!-- User Dropdown -->
        <div class="user-dropdown-container">
          <div class="user-profile" (click)="toggleUserMenu($event)">
            <div class="user-avatar">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </div>
            <span class="user-name">{{ currentUser?.displayName || 'User' }} ▾</span>
          </div>
          <div class="dropdown-menu user-menu" *ngIf="showUserMenu">
            <a routerLink="/profile" (click)="showUserMenu = false" class="dropdown-item">{{ t('header.profile') }}</a>
            <button (click)="onLogout()" class="dropdown-item item-danger">{{ t('header.logout') }}</button>
          </div>
        </div>
      </div>
    </header>
  `,
  styles: [`
    .top-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 52px;
      background: var(--pl-primary);
      color: #fff;
      padding: 0 16px;
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 1000;
      box-shadow: 0 1px 4px rgba(0,0,0,0.15);
    }

    .header-left {
      display: flex;
      align-items: center;
      height: 100%;
    }

    .logo-area {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-right: 32px;
    }

    .logo-img {
      width: 24px;
      height: 24px;
      object-fit: contain;
      filter: brightness(0) invert(1);
    }

    .logo-text {
      font-weight: 700;
      font-size: 1.125rem;
      letter-spacing: -0.02em;
    }

    .top-nav {
      display: flex;
      height: 100%;
    }

    .top-nav a {
      display: flex;
      align-items: center;
      padding: 0 16px;
      color: rgba(255, 255, 255, 0.85);
      text-decoration: none;
      font-size: 0.875rem;
      font-weight: 500;
      transition: all 0.2s;
      border-bottom: 3px solid transparent;
      height: 100%;
    }

    .top-nav a:hover {
      background: rgba(255, 255, 255, 0.1);
      color: #fff;
    }

    .top-nav a.active {
      color: #fff;
      font-weight: 600;
      border-bottom-color: #fff;
      background: rgba(255, 255, 255, 0.15);
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 6px;
      height: 100%;
      position: relative;
    }

    .header-action {
      display: flex;
      align-items: center;
      font-size: 0.8125rem;
      color: rgba(255, 255, 255, 0.9);
      cursor: pointer;
      white-space: nowrap;
    }
    
    .header-action:hover {
      color: #fff;
    }

    .item-branch {
      gap: 6px;
      font-weight: 500;
      padding: 4px 8px;
      border-radius: 4px;
      background: rgba(0,0,0,0.1);
    }

    .lang-toggle {
      gap: 6px;
      font-weight: 500;
      padding: 4px 10px;
      border-radius: 4px;
      transition: background 0.15s;
    }

    .lang-toggle:hover {
      background: rgba(255, 255, 255, 0.15);
    }

    .icon-btn {
      padding: 6px;
      border-radius: 50%;
      transition: background 0.2s;
    }

    .icon-btn:hover {
      background: rgba(255, 255, 255, 0.2);
    }

    /* Shared Dropdown */
    .dropdown-menu {
      position: absolute;
      top: calc(100% + 4px);
      right: 0;
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      box-shadow: 0 4px 16px rgba(0,0,0,0.12);
      min-width: 160px;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      z-index: var(--z-dropdown);
    }

    .lang-menu {
      right: auto;
      left: 0;
      min-width: 150px;
    }

    .dropdown-item {
      padding: 10px 16px;
      color: var(--color-text);
      text-decoration: none;
      font-size: 0.875rem;
      font-weight: 500;
      border: none;
      background: none;
      text-align: left;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: background 0.15s;
      width: 100%;
    }

    .dropdown-item:hover {
      background: var(--color-surface-hover);
    }

    .dropdown-item.active-item {
      background: var(--color-success-bg);
      color: var(--color-success);
      font-weight: 600;
    }

    .dropdown-item.item-danger {
      color: var(--color-danger);
      border-top: 1px solid var(--color-border-light);
    }

    .dropdown-item.item-danger:hover {
      background: var(--color-danger-bg);
    }

    /* User */
    .user-profile {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 4px;
      transition: background 0.2s;
    }

    .user-profile:hover {
      background: rgba(255, 255, 255, 0.1);
    }

    .user-avatar {
      width: 24px;
      height: 24px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .user-name { font-size: 0.8125rem; font-weight: 500; }

    .user-dropdown-container {
      position: relative;
    }

    .user-menu {
      right: 0;
      left: auto;
    }

    /* Notification */
    .notif-container {
      position: relative;
    }

    .notif-badge {
      position: absolute;
      top: 0;
      right: 0;
      background: #DC2626;
      color: #fff;
      font-size: 10px;
      font-weight: 700;
      min-width: 16px;
      height: 16px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 4px;
      line-height: 1;
      pointer-events: none;
    }

    .notif-menu {
      right: 0;
      left: auto;
      width: 340px;
      max-height: 420px;
      display: flex;
      flex-direction: column;
    }

    .notif-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      border-bottom: 1px solid var(--color-border-light);
    }

    .notif-title {
      font-weight: 700;
      font-size: 0.875rem;
      color: var(--color-text);
    }

    .notif-mark-read {
      border: none;
      background: none;
      color: var(--color-primary);
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
    }

    .notif-mark-read:hover {
      text-decoration: underline;
    }

    .notif-list {
      overflow-y: auto;
      max-height: 340px;
    }

    .notif-item {
      padding: 10px 16px;
      border-bottom: 1px solid var(--color-border-light);
      cursor: pointer;
      transition: background 0.15s;
    }

    .notif-item:hover {
      background: var(--color-surface-hover);
    }

    .notif-item:last-child {
      border-bottom: none;
    }

    .notif-item.severity-critical {
      border-left: 3px solid var(--color-danger);
    }

    .notif-item.severity-warning {
      border-left: 3px solid var(--color-warning);
    }

    .notif-item.severity-info {
      border-left: 3px solid var(--color-info);
    }

    .notif-item-title {
      font-weight: 600;
      font-size: 0.8125rem;
      color: var(--color-text);
      margin-bottom: 2px;
    }

    .notif-item-msg {
      font-size: 0.75rem;
      color: var(--color-text-secondary);
      line-height: 1.4;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .notif-item-time {
      font-size: 0.6875rem;
      color: var(--color-text-muted);
      margin-top: 4px;
    }

    .notif-empty {
      padding: 24px 16px;
      text-align: center;
      color: var(--color-text-muted);
      font-size: 0.8125rem;
    }
  `]
})
export class TopHeaderComponent implements OnDestroy {
  currentUser: any = null;
  showUserMenu = false;
  showLangMenu = false;
  showNotifMenu = false;
  currentTheme: string = 'light';
  currentLang: string = 'vi';
  notifications: NotificationItem[] = [];
  unreadCount = 0;

  private subs: Subscription[] = [];

  constructor(
    private authService: AuthService,
    private themeService: ThemeService,
    private i18n: I18nService,
    private notifService: NotificationService,
  ) {
    this.currentUser = this.authService.getUser();

    this.subs.push(
      this.themeService.currentTheme$.subscribe(t => this.currentTheme = t),
      this.i18n.currentLang$.subscribe(l => this.currentLang = l),
      this.notifService.notifications$.subscribe(n => this.notifications = n),
      this.notifService.unreadCount$.subscribe(c => this.unreadCount = Math.max(0, c)),
    );
  }

  ngOnDestroy() {
    this.subs.forEach(s => s.unsubscribe());
  }

  /** Delegate to i18n — single source of truth */
  t(key: string): string {
    return this.i18n.t(key);
  }

  toggleTheme() {
    this.themeService.toggle();
  }

  setLang(lang: 'vi' | 'en') {
    this.i18n.setLang(lang);
    this.showLangMenu = false;
    document.removeEventListener('click', this.closeLangMenu);
  }

  toggleLangMenu(event: Event) {
    event.stopPropagation();
    this.showLangMenu = !this.showLangMenu;
    this.showUserMenu = false;
    this.showNotifMenu = false;
    if (this.showLangMenu) {
      setTimeout(() => document.addEventListener('click', this.closeLangMenu));
    }
  }

  closeLangMenu = () => {
    this.showLangMenu = false;
    document.removeEventListener('click', this.closeLangMenu);
  };

  toggleNotifMenu(event: Event) {
    event.stopPropagation();
    this.showNotifMenu = !this.showNotifMenu;
    this.showLangMenu = false;
    this.showUserMenu = false;
    if (this.showNotifMenu) {
      setTimeout(() => document.addEventListener('click', this.closeNotifMenu));
    }
  }

  closeNotifMenu = () => {
    this.showNotifMenu = false;
    document.removeEventListener('click', this.closeNotifMenu);
  };

  markAllRead() {
    this.notifService.markAllRead();
  }

  toggleUserMenu(event: Event) {
    event.stopPropagation();
    this.showUserMenu = !this.showUserMenu;
    this.showLangMenu = false;
    this.showNotifMenu = false;
    if (this.showUserMenu) {
      setTimeout(() => document.addEventListener('click', this.closeUserMenu));
    }
  }

  closeUserMenu = () => {
    this.showUserMenu = false;
    document.removeEventListener('click', this.closeUserMenu);
  };

  onLogout() {
    this.authService.logout();
  }
}
