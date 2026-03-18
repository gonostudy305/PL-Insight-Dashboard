import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';

@Component({
    selector: 'app-reviews',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="reviews-page">
      <h2 class="page-title">💬 Đánh giá khách hàng</h2>
      <p class="page-subtitle">Danh sách các đánh giá mới nhất từ Google Maps</p>

      <div class="reviews-list">
        @for (review of reviews; track review._id) {
          <div class="review-card" [class.negative-card]="review.label === 0">
            <div class="review-header">
              <span class="review-stars">
                @for (s of getStarsArray(review.stars); track s) { ⭐ }
              </span>
              <span class="review-badge" [class.badge-positive]="review.label === 1" [class.badge-negative]="review.label === 0">
                {{ review.label === 1 ? 'Tích cực' : 'Tiêu cực' }}
              </span>
              <span class="review-branch">📍 {{ review.branch_address }}</span>
            </div>
            <p class="review-text">{{ review.text }}</p>
            <div class="review-meta">
              <span>🕐 {{ review.session }} · {{ review.day_of_week }}</span>
              <span>📝 {{ review.text_length_group }}</span>
            </div>
          </div>
        }
      </div>

      <div class="pagination">
        <button (click)="loadPage(currentPage - 1)" [disabled]="currentPage <= 1">← Trước</button>
        <span>Trang {{ currentPage }} / {{ totalPages }}</span>
        <button (click)="loadPage(currentPage + 1)" [disabled]="currentPage >= totalPages">Sau →</button>
      </div>
    </div>
  `,
    styles: [`
    .reviews-page { max-width: 900px; }
    .page-title { font-size: 24px; font-weight: 700; color: #f4f4f5; }
    .page-subtitle { color: #71717a; font-size: 14px; margin: 4px 0 24px; }

    .review-card {
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 12px;
      transition: transform 0.15s;
    }
    .review-card:hover { transform: translateX(4px); }
    .negative-card { border-left: 3px solid #ef4444; }

    .review-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
      flex-wrap: wrap;
    }

    .review-badge {
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
    }
    .badge-positive { background: rgba(34,197,94,0.15); color: #22c55e; }
    .badge-negative { background: rgba(239,68,68,0.15); color: #ef4444; }

    .review-branch { font-size: 12px; color: #71717a; }
    .review-text { font-size: 14px; color: #d4d4d8; line-height: 1.6; margin-bottom: 12px; }
    .review-meta { display: flex; gap: 16px; font-size: 12px; color: #52525b; }

    .pagination {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 16px;
      margin-top: 24px;
    }
    .pagination button {
      padding: 8px 16px;
      border-radius: 8px;
      border: 1px solid rgba(255,255,255,0.1);
      background: rgba(255,255,255,0.04);
      color: #d4d4d8;
      cursor: pointer;
      transition: background 0.2s;
    }
    .pagination button:hover:not(:disabled) { background: rgba(255,255,255,0.08); }
    .pagination button:disabled { opacity: 0.3; cursor: not-allowed; }
    .pagination span { font-size: 14px; color: #71717a; }
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
