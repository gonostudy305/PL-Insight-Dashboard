import { Routes } from '@angular/router';

export const routes: Routes = [
    { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
    {
        path: 'dashboard',
        loadComponent: () =>
            import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
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
