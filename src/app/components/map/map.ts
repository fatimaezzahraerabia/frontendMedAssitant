import { Component, OnInit, OnDestroy, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { DoctorService } from '../../services/doctor.service';

@Component({
  selector: 'app-map',
  standalone: true,
  templateUrl: './map.html',
  styleUrls: ['./map.css']
})
export class MapComponent implements OnInit, OnDestroy {
  private map: any;
  private L: any;
  private markerLayer: any;
  private marocBounds: [[number, number], [number, number]] = [
    [21.4200, -17.0200], // Sud-Ouest
    [35.9300, -1.0000]   // Nord-Est
  ];
  private userIcon: any;
  private doctorIcon: any;

  constructor(
    private doctorService: DoctorService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  async ngOnInit(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;

    this.L = await import('leaflet');

    this.userIcon = this.L.icon({
      iconUrl: '/assets/images/pin.png',
      iconSize: [38, 38],
      iconAnchor: [19, 38],
      popupAnchor: [0, -38]
    });

    this.doctorIcon = this.L.icon({
      iconUrl: '/assets/images/location.png',
      iconSize: [38, 38],
      iconAnchor: [19, 38],
      popupAnchor: [0, -38]
    });

    this.map = this.L.map('map');
    this.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '&copy; OpenStreetMap'
    }).addTo(this.map);

    this.markerLayer = this.L.layerGroup().addTo(this.map);
    this.map.fitBounds(this.marocBounds);
    setTimeout(() => this.map.invalidateSize(), 0);
  }

  ngOnDestroy(): void {
    if (this.map && isPlatformBrowser(this.platformId)) {
      this.map.remove();
    }
  }

  public showLocation(lat: number, lng: number, label?: string, zoom = 14): void {
    if (!this.map || !this.L || !isPlatformBrowser(this.platformId)) return;
    this.markerLayer.clearLayers();
    const marker = this.L.marker([lat, lng] as any, { icon: this.userIcon });
    if (label) marker.bindPopup(label).openPopup();
    marker.addTo(this.markerLayer);
    this.map.setView([lat, lng], zoom);
  }

  public showLocations(locations: { lat: number; lng: number; label?: string; isUser?: boolean }[]): void {
    if (!this.map || !this.L || !isPlatformBrowser(this.platformId)) return;
    this.markerLayer.clearLayers();
    console.log('Locations to display:', locations); // Debug

    locations.forEach(loc => {
      const icon = loc.isUser ? this.userIcon : this.doctorIcon;
      const m = this.L.marker([loc.lat, loc.lng] as any, { icon });
      if (loc.label) m.bindPopup(loc.label);
      m.addTo(this.markerLayer);
    });

    if (locations.length === 0) {
      this.map.fitBounds(this.marocBounds); // 0 → Maroc
    } else if (locations.length === 1) {
      this.map.setView([locations[0].lat, locations[0].lng], 14);
    } else {
      const group = this.L.featureGroup(this.markerLayer.getLayers());
      this.map.fitBounds(group.getBounds().pad(0.2));
    }
  }
}