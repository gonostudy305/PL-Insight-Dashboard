import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subscription, timer } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { ApiService } from './api.service';

export interface NotificationItem {
    id: string;
    title: string;
    message: string;
    severity: 'critical' | 'warning' | 'info';
    timestamp: Date;
}

/**
 * Notification feed derived from alerts.
 * This is NOT a full notification system — it's a client-side feed
 * with local/session-level read state.
 */
@Injectable({ providedIn: 'root' })
export class NotificationService implements OnDestroy {
    private readonly SESSION_KEY = 'pl-insight-notif-read-ts';
    private notificationsSubject = new BehaviorSubject<NotificationItem[]>([]);
    private unreadCountSubject = new BehaviorSubject<number>(0);
    private pollSub: Subscription | null = null;

    readonly notifications$ = this.notificationsSubject.asObservable();
    readonly unreadCount$ = this.unreadCountSubject.asObservable();

    constructor(private api: ApiService) {
        this.startPolling();
    }

    ngOnDestroy() {
        this.pollSub?.unsubscribe();
    }

    /** Poll alerts every 60s, transform into notification items */
    private startPolling() {
        this.pollSub = timer(0, 60_000).pipe(
            switchMap(() => this.api.getAlerts(10).pipe(
                catchError(err => {
                    console.warn('[NotificationService] Alert fetch failed, bell stays stable:', err);
                    return of({ data: [] });
                })
            ))
        ).subscribe(res => {
            const alerts: any[] = res?.data || res || [];
            const items: NotificationItem[] = alerts.slice(0, 10).map((a: any) => ({
                id: a._id || a.alertId || String(Math.random()),
                title: a.branchAddress || a.placeId || 'Chi nhánh',
                message: a.reason || a.message || 'Cảnh báo mới',
                severity: this.mapSeverity(a.priority),
                timestamp: new Date(a.createdAt || Date.now()),
            }));

            this.notificationsSubject.next(items);

            // Calculate unread based on session read timestamp
            const lastReadTs = Number(sessionStorage.getItem(this.SESSION_KEY) || '0');
            const unread = items.filter(n => n.timestamp.getTime() > lastReadTs).length;
            this.unreadCountSubject.next(Math.max(0, unread));
        });
    }

    markAllRead(): void {
        sessionStorage.setItem(this.SESSION_KEY, String(Date.now()));
        this.unreadCountSubject.next(0);
    }

    private mapSeverity(priority: number | undefined): 'critical' | 'warning' | 'info' {
        if (!priority) return 'info';
        if (priority >= 3) return 'critical';
        if (priority >= 2) return 'warning';
        return 'info';
    }
}
