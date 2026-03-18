import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type ThemeMode = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
    private readonly STORAGE_KEY = 'pl-insight-theme';
    private themeSubject: BehaviorSubject<ThemeMode>;

    readonly currentTheme$;

    constructor() {
        const saved = (localStorage.getItem(this.STORAGE_KEY) as ThemeMode) || 'light';
        this.themeSubject = new BehaviorSubject<ThemeMode>(saved);
        this.currentTheme$ = this.themeSubject.asObservable();
        this.applyTheme(saved);
    }

    get current(): ThemeMode {
        return this.themeSubject.value;
    }

    toggle(): void {
        const next: ThemeMode = this.current === 'light' ? 'dark' : 'light';
        this.applyTheme(next);
        this.themeSubject.next(next);
        localStorage.setItem(this.STORAGE_KEY, next);
    }

    private applyTheme(mode: ThemeMode): void {
        document.documentElement.setAttribute('data-theme', mode);
    }
}
