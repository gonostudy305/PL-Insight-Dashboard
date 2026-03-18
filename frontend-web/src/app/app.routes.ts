import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
    {
        path: 'login',
        loadComponent: () =>
            import('./pages/login/login.component').then(m => m.LoginComponent),
    },
    { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
    {
        path: 'dashboard',
        canActivate: [authGuard],
        loadComponent: () =>
            import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
    },
    {
        path: 'live-monitor',
        canActivate: [authGuard],
        loadComponent: () =>
            import('./pages/live-monitor/live-monitor.component').then(m => m.LiveMonitorComponent),
    },
    {
        path: 'analytics',
        canActivate: [authGuard],
        loadComponent: () =>
            import('./pages/analytics/analytics.component').then(m => m.AnalyticsComponent),
    },
    {
        path: 'branches/:placeId',
        canActivate: [authGuard],
        loadComponent: () =>
            import('./pages/branch-detail/branch-detail.component').then(m => m.BranchDetailComponent),
    },
    {
        path: 'reviews',
        canActivate: [authGuard],
        loadComponent: () =>
            import('./pages/reviews/reviews.component').then(m => m.ReviewsComponent),
    },
    {
        path: 'alerts',
        canActivate: [authGuard],
        loadComponent: () =>
            import('./pages/alerts/alerts.component').then(m => m.AlertsComponent),
    },
];
