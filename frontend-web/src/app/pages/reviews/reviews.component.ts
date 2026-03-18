import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-reviews',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="reviews-page">
      <div class="page-header">
        <div>
          <h2 class="page-title">Đánh giá khách hàng</h2>
          <p class="page-subtitle">Danh sách các đánh giá mới nhất từ Google Maps</p>
        </div>
      </div>

      <div class="reviews-list">
        @for (review of reviews; track review.reviewId) {
          <div class="review-card" 
               [class.negative-card]="review.label === 0" 
               [class.positive]="review.label === 1"
               [attr.data-length]="review.text?.length < 100 ? 'short' : 'long'">
            <div class="review-header">
              <span class="review-stars">
                @for (s of getStarsArray(review.stars); track s) {
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--color-accent)" stroke="var(--color-accent)" stroke-width="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                }
              </span>
              <span class="review-badge" [class.badge-positive]="review.label === 1" [class.badge-negative]="review.label === 0">
                {{ review.label === 1 ? 'Tích cực' : 'Tiêu cực' }}
              </span>
              <span class="review-branch">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                {{ review.branchAddress }}
              </span>
            </div>
            <p class="review-text">{{ review.text }}</p>
            <div class="review-meta">
              <span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                {{ review.session }} · {{ review.dayOfWeek }}
              </span>
              <span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
                {{ review.textLengthGroup }}
              </span>
            </div>
          </div>
        }
      </div>

      <div class="pagination">
        <button (click)="loadPage(currentPage - 1)" [disabled]="currentPage <= 1">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
          Trước
        </button>
        <span>Trang {{ currentPage }} / {{ totalPages }}</span>
        <button (click)="loadPage(currentPage + 1)" [disabled]="currentPage >= totalPages">
          Sau
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .reviews-page {
      max-width: 900px;
      animation: fadeInUp 0.4s ease-out;
    }

    .page-header {
      margin-bottom: var(--space-8);
    }

    .page-title {
      font-size: var(--font-size-2xl);
      font-weight: 800;
      color: var(--color-text);
      letter-spacing: -0.03em;
    }

    .page-subtitle {
      color: var(--color-text-secondary);
      font-size: var(--font-size-base);
      margin-top: var(--space-1);
    }

    .reviews-list {
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
    }

    .review-card {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: var(--space-5) var(--space-6);
      transition: all var(--transition-base);
      cursor: pointer;
    }

    .review-card[data-length="short"] {
      padding: 0.875rem 1.25rem;
      border-left-width: 3px;
    }

    .review-card[data-length="long"] {
      padding: 1.5rem 1.5rem;
      border-left-width: 5px;
      background: #FAFAFA;
    }

    .negative-card {
      border-left-color: #C62828 !important;
      background: #FFF8F8 !important;
    }

    .review-card.positive {
      border-left-color: #2E5C2A !important;
    }

    .review-card:hover {
      box-shadow: var(--shadow-card-hover);
      transform: translateY(-1px);
      border-color: transparent;
    }

    .review-header {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      margin-bottom: var(--space-3);
      flex-wrap: wrap;
    }

    .review-stars {
      display: flex;
      gap: 2px;
    }

    .review-badge {
      padding: 3px 10px;
      border-radius: 3px;
      font-size: var(--font-size-xs);
      font-weight: 700;
      letter-spacing: 0.5px;
    }

    .badge-positive { background: var(--color-success-bg); color: var(--color-success); }
    .badge-negative { background: var(--color-danger-bg); color: var(--color-danger); }

    .review-branch {
      font-size: var(--font-size-xs);
      color: var(--color-text-muted);
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .review-text {
      font-size: var(--font-size-base);
      color: var(--color-text);
      line-height: 1.65;
      margin-bottom: var(--space-3);
      text-align: justify;
      hyphens: auto;
    }

    .review-meta {
      display: flex;
      gap: var(--space-4);
      font-size: var(--font-size-xs);
      color: var(--color-text-muted);
    }

    .review-meta span {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .pagination {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--space-4);
      margin-top: var(--space-8);
    }

    .pagination button {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 18px;
      border-radius: var(--radius-md);
      border: 1px solid var(--color-border);
      background: var(--color-surface);
      color: var(--color-text);
      font-size: var(--font-size-sm);
      font-weight: 500;
      cursor: pointer;
      transition: all var(--transition-base);
    }

    .pagination button:hover:not(:disabled) {
      background: var(--color-primary);
      color: #fff;
      border-color: var(--color-primary);
    }

    .pagination button:disabled {
      opacity: 0.35;
      cursor: not-allowed;
    }

    .pagination span {
      font-size: var(--font-size-sm);
      color: var(--color-text-muted);
    }
  `],
})
export class ReviewsComponent implements OnInit {
  reviews: any[] = [];
  currentPage = 1;
  totalPages = 1;

  constructor(private api: ApiService) { }

  ngOnInit() { this.loadPage(1); }

  loadPage(page: number) {
    if (page < 1) return;
    this.api.getReviews({ page, limit: 15, sort: 'publishedAtDate', order: 'desc' }).subscribe(data => {
      this.reviews = data.data;
      this.currentPage = data.page;
      this.totalPages = data.totalPages;
    });
  }

  getStarsArray(n: number): number[] { return Array(n).fill(0); }
}
