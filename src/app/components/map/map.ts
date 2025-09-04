import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-map',
  standalone: true,
  templateUrl: './map.html',
  styleUrls: ['./map.css']
})
export class MapComponent implements OnInit {

  private map: any;
  private centroid: [number, number] = [48.8566, 2.3522]; // Paris

  async ngOnInit(): Promise<void> {
    // On vérifie qu'on est bien dans le navigateur
    if (typeof window !== 'undefined') {
      // Import dynamique → évite l'exécution côté SSR
      const L = await import('leaflet');

      this.map = L.map('map', {
        center: this.centroid,
        zoom: 12
      });

      const tiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        minZoom: 10,
        attribution: '&copy; OpenStreetMap'
      });

      Array(5).fill(this.centroid).map(
        x => [x[0] + (Math.random() - 0.5) / 10, x[1] + (Math.random() - 0.5) / 10]
      ).map(
        x => L.marker(x as L.LatLngExpression)
      ).forEach(
        x => x.addTo(this.map)
      );

      tiles.addTo(this.map);
      setTimeout(() => {
         this.map.invalidateSize();
        }, 0);
    }
  }
}
