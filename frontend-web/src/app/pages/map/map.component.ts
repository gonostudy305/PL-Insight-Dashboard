import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import * as L from 'leaflet';

// Static branch coordinate mapping — placeId → {lat, lng}
// Coordinates based on real Phuc Long Hanoi addresses
const BRANCH_COORDS: Record<string, { lat: number; lng: number }> = {
    'PL_HN_01': { lat: 21.0070, lng: 105.8012 },  // Hoàng Đạo Thúy, Cầu Giấy
    'PL_HN_02': { lat: 20.9718, lng: 105.7788 },  // Quang Trung, Hà Đông (2)
    'PL_HN_03': { lat: 21.0118, lng: 105.8199 },  // Thái Hà, Đống Đa
    'PL_HN_04': { lat: 20.9720, lng: 105.7760 },  // Quang Trung, Hà Đông
    'PL_HN_05': { lat: 21.0345, lng: 105.8530 },  // Nguyễn Hữu Huân, Hoàn Kiếm
    'PL_HN_06': { lat: 21.0285, lng: 105.7920 },  // Trần Quốc Hoàn, Cầu Giấy
    'PL_HN_07': { lat: 21.0466, lng: 105.8650 },  // Long Biên (Văn Quán branch)
    'PL_HN_08': { lat: 21.0172, lng: 105.7835 },  // Tôn Thất Thuyết, Cầu Giấy
    'PL_HN_09': { lat: 20.9940, lng: 105.8575 },  // Trương Định, Hoàng Mai
    'PL_HN_10': { lat: 21.0015, lng: 105.8470 },  // Tạ Quang Bửu, Hai Bà Trưng
    'PL_HN_11': { lat: 21.0650, lng: 105.8240 },  // Nguyễn Đình Thi, Tây Hồ
    'PL_HN_12': { lat: 21.0220, lng: 105.8130 },  // Nguyễn Chí Thanh, Đống Đa
    'PL_HN_13': { lat: 21.0080, lng: 105.8590 },  // Trần Xuân Soạn, Hai Bà Trưng
    'PL_HN_14': { lat: 21.0006, lng: 105.8445 },  // Trần Đại Nghĩa, Hai Bà Trưng
    'PL_HN_15': { lat: 20.9993, lng: 105.8100 },  // Nguyễn Trãi, Thanh Xuân
    'PL_HN_16': { lat: 21.0350, lng: 105.8520 },  // Hàng Điếu, Hoàn Kiếm
    'PL_HN_17': { lat: 21.0185, lng: 105.7640 },  // B3 Nam Từ Liêm (2)
    'PL_HN_18': { lat: 20.9670, lng: 105.7750 },  // Văn Quán, Hà Đông
    'PL_HN_19': { lat: 21.0170, lng: 105.7655 },  // B3 Nam Từ Liêm
    'PL_HN_20': { lat: 21.0040, lng: 105.8620 },  // Minh Khai, Hai Bà Trưng
    'PL_HN_21': { lat: 20.9660, lng: 105.7730 },  // Văn Quán, Hà Đông (duplicate)
    'PL_HN_22': { lat: 21.0100, lng: 105.7970 },  // Vincom Trần Duy Hưng, Cầu Giấy
    'PL_HN_23': { lat: 21.0000, lng: 105.8010 },  // Golden Palm Lê Văn Lương, Thanh Xuân
    'PL_HN_24': { lat: 21.0190, lng: 105.8210 },  // Green Diamond Láng Hạ
};

// Default Hanoi center
const HANOI_CENTER: [number, number] = [21.0285, 105.8342];

@Component({
    selector: 'app-map',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="map-page">
      <div class="page-header">
        <div>
          <h2 class="page-title">Bản đồ chi nhánh</h2>
          <p class="page-subtitle">Vị trí & chỉ số sức khỏe các chi nhánh Phúc Long — Hà Nội</p>
        </div>
        <div class="legend">
          <span class="legend-item"><span class="dot good"></span> Health ≥ 3</span>
          <span class="legend-item"><span class="dot warning"></span> Health 2-3</span>
          <span class="legend-item"><span class="dot danger"></span> Health < 2</span>
        </div>
      </div>
      <div id="map-container" class="map-container" role="application" aria-label="Bản đồ chi nhánh Phúc Long Hà Nội"></div>
    </div>
  `,
    styles: [`
    .map-page { padding: var(--space-6); }

    .page-header {
      display: flex; justify-content: space-between; align-items: flex-start;
      margin-bottom: var(--space-4);
    }

    .page-title { font-size: var(--font-size-2xl); font-weight: 800; color: var(--color-text); letter-spacing: -0.03em; }
    .page-subtitle { color: var(--color-text-secondary); font-size: var(--font-size-base); margin-top: var(--space-1); }

    .legend {
      display: flex; gap: 16px; align-items: center;
      padding: 8px 16px; background: white; border: 1px solid var(--color-border);
      border-radius: var(--radius-md); font-size: 12px; font-weight: 600;
    }
    .legend-item { display: flex; align-items: center; gap: 6px; }
    .dot { width: 10px; height: 10px; border-radius: 50%; }
    .dot.good { background: #22c55e; }
    .dot.warning { background: #f59e0b; }
    .dot.danger { background: #ef4444; }

    .map-container {
      width: 100%; height: calc(100vh - 200px); min-height: 500px;
      border-radius: var(--radius-lg); overflow: hidden;
      border: 1px solid var(--color-border);
      box-shadow: var(--shadow-md);
    }
  `],
})
export class MapComponent implements OnInit, AfterViewInit, OnDestroy {
    private map: L.Map | null = null;

    constructor(private api: ApiService, private router: Router) { }

    ngOnInit() {
        // Expose navigation function globally for Leaflet popups
        (window as any).__plNavigate = (placeId: string) => {
            this.router.navigate(['/branches', placeId]);
        };
    }

    ngAfterViewInit() {
        this.initMap();
        this.loadBranches();
    }

    ngOnDestroy() {
        this.map?.remove();
        delete (window as any).__plNavigate;
    }

    private initMap() {
        this.map = L.map('map-container', {
            center: HANOI_CENTER,
            zoom: 13,
            zoomControl: true,
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
            maxZoom: 19,
        }).addTo(this.map);
    }

    private loadBranches() {
        this.api.getBranches().subscribe({
            next: (res) => {
                const branches = res.data || res || [];
                console.log('[Map] Loaded branches:', branches.length, branches.map((b: any) => b.placeId));

                const markers: L.CircleMarker[] = [];
                let matched = 0;
                let unmatched = 0;

                for (const branch of branches) {
                    const coords = BRANCH_COORDS[branch.placeId];
                    if (!coords) {
                        unmatched++;
                        console.warn('[Map] No coords for placeId:', branch.placeId, branch.branchAddress);
                        continue;
                    }
                    matched++;

                    const color = this.getMarkerColor(branch.healthScore);
                    const healthLabel = branch.healthScore >= 3 ? 'Tốt' : branch.healthScore >= 2 ? 'Trung bình' : 'Cần chú ý';
                    const markerTitle = `${branch.branchAddress} (${branch.district || ''}) — Health: ${healthLabel}, Sao: ${branch.avgStars}`;

                    const marker = L.circleMarker([coords.lat, coords.lng], {
                        radius: Math.max(8, Math.min(16, branch.totalReviews / 50)),
                        fillColor: color,
                        color: '#fff',
                        weight: 2,
                        opacity: 1,
                        fillOpacity: 0.85,
                    });

                    marker.bindTooltip(markerTitle, {
                        permanent: false,
                        direction: 'top',
                        offset: L.point(0, -8),
                    });

                    marker.bindPopup(this.buildPopup(branch), {
                        maxWidth: 280,
                        className: 'pl-popup',
                    });

                    marker.on('click', () => marker.openPopup());
                    marker.addTo(this.map!);
                    markers.push(marker);
                }

                console.log(`[Map] Matched: ${matched}, Unmatched: ${unmatched}`);

                // Auto-fit bounds to show all markers
                if (markers.length > 0) {
                    const group = L.featureGroup(markers);
                    this.map!.fitBounds(group.getBounds().pad(0.1));
                }
            },
            error: (err) => console.error('[Map] Branch load error:', err),
        });
    }

    private getMarkerColor(healthScore: number): string {
        if (healthScore >= 3) return '#22c55e';
        if (healthScore >= 2) return '#f59e0b';
        return '#ef4444';
    }

    private buildPopup(branch: any): string {
        const healthColor = this.getMarkerColor(branch.healthScore);
        const stars = '★'.repeat(Math.round(branch.avgStars)) + '☆'.repeat(5 - Math.round(branch.avgStars));

        return `
      <div style="font-family:Inter,sans-serif;font-size:13px;line-height:1.5">
        <div style="font-weight:700;font-size:14px;margin-bottom:6px;color:#0f172a">${branch.branchAddress}</div>
        <div style="color:#64748b;font-size:12px;margin-bottom:8px">${branch.district || 'N/A'}</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">
          <div><span style="color:#94a3b8;font-size:11px">Sao TB</span><br><span style="color:#f59e0b;font-weight:700">${stars} ${branch.avgStars}</span></div>
          <div><span style="color:#94a3b8;font-size:11px">Reviews</span><br><span style="font-weight:700">${branch.totalReviews}</span></div>
          <div><span style="color:#94a3b8;font-size:11px">Neg Rate</span><br><span style="font-weight:700;color:${branch.negativeRate > 30 ? '#ef4444' : '#22c55e'}">${branch.negativeRate}%</span></div>
          <div><span style="color:#94a3b8;font-size:11px">Health</span><br><span style="font-weight:700;color:${healthColor}">${branch.healthScore}</span></div>
        </div>
        <a href="javascript:void(0)" onclick="window.__plNavigate && window.__plNavigate('${branch.placeId}')"
           style="display:block;text-align:center;margin-top:10px;padding:6px 0;background:#0C713D;color:white;border-radius:6px;font-weight:600;font-size:12px;text-decoration:none">
          Xem chi tiết →
        </a>
      </div>
    `;
    }
}
