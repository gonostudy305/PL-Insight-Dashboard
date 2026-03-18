import { Routes } from '@angular/router';

export const routes: Routes = [
    { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
    {
        path: 'dashboard',
        loadComponent: () =>
            import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
    },
    {
        path: 'live-monitor',
        loadComponent: () =>
            import('./pages/live-monitor/live-monitor.component').then(m => m.LiveMonitorComponent),
    },
    {
        path: 'analytics',
        loadComponent: () =>
            import('./pages/analytics/analytics.component').then(m => m.AnalyticsComponent),
    },
    {
        path: 'branches/:placeId',
        loadComponent: () =>
            import('./pages/branch-detail/branch-detail.component').then(m => m.BranchDetailComponent),
    },
    {
        path: 'reviews',
        loadComponent: () =>
            import('./pages/reviews/reviews.component').then(m => m.ReviewsComponent),
    },
    {
        path: 'alerts',
        loadComponent: () =>
            import('./pages/alerts/alerts.component').then(m => m.AlertsComponent),
    },
];
