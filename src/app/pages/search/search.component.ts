import { Component, OnInit, ViewChild, AfterViewInit, NgZone, Inject, PLATFORM_ID } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { Doctor } from '../../models/doctor';
import { DoctorService, MedecinRequest } from '../../services/doctor.service';
import { DoctorCardComponent } from '../../shared/doctor-card/doctor-card.component';
import { MapComponent } from '../../components/map/map';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, DoctorCardComponent, MapComponent],
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.css']
})
export class SearchPageComponent implements OnInit, AfterViewInit {
  @ViewChild('mapComp') mapComp!: MapComponent;

  filteredDoctors: Doctor[] = [];
  searchTerm: string = '';
  userLocation: { lat: number; lng: number } | null = null;
  locating = false;
  locationGranted = false;
  locationError: string | null = null;
  
  constructor(
    private doctorService: DoctorService,
    private router: Router,
    private ngZone: NgZone,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    this.filteredDoctors = [];
  }

  ngAfterViewInit(): void {}

  onPlaceClick(): void {
    if (this.userLocation || this.locating) return;
    this.requestLocation();
  }

  private getCurrentPositionPromise(options?: PositionOptions): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      if (!isPlatformBrowser(this.platformId) || !('geolocation' in navigator)) {
        reject(new Error('Géolocalisation non supportée par ce navigateur.'));
        return;
      }
      navigator.geolocation.getCurrentPosition(resolve, reject, options);
    });
  }

  async requestLocation(): Promise<void> {
    this.locating = true;
    this.locationError = null;

    try {
      if (isPlatformBrowser(this.platformId) && 'permissions' in navigator) {
        try {
          const status = await (navigator as any).permissions.query({ name: 'geolocation' });
          if (status.state === 'denied') {
            this.locating = false;
            this.locationError = 'Accès à la localisation refusé (paramètres du navigateur).';
            return;
          }
        } catch {
          // Ignore si Permissions API non disponible
        }
      }

      const pos = await this.getCurrentPositionPromise({ enableHighAccuracy: true, timeout: 10000 });

      this.ngZone.run(() => {
        this.userLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        this.locationGranted = true;
        this.locating = false;
        this.locationError = null;

        if (isPlatformBrowser(this.platformId)) {
          try {
            if (this.mapComp && typeof this.mapComp.showLocation === 'function') {
              this.mapComp.showLocation(this.userLocation.lat, this.userLocation.lng, 'Vous êtes ici', 13);
            }
          } catch (e) {
            console.warn('Impossible d\'appeler showLocation sur mapComp', e);
            this.locationError = 'Erreur lors de l\'affichage de la localisation sur la carte.';
          }

          this.loadNearbyDoctors();
        }
      });
    } catch (err: any) {
      this.ngZone.run(() => {
        this.locating = false;
        if (err && err.code === 1) {
          this.locationError = 'Permission refusée pour la localisation.';
        } else if (err && err.code === 3) {
          this.locationError = 'La demande de localisation a expiré. Réessayez.';
        } else {
          this.locationError = err?.message || 'Impossible d’obtenir la localisation.';
        }
      });
    }
  }

  private loadNearbyDoctors(): void {
    if (!this.userLocation || !isPlatformBrowser(this.platformId)) return;

    const query = this.searchTerm.trim();
    this.doctorService.getNearbyMedecins(this.userLocation.lat, this.userLocation.lng, query, 10, 50)
      .subscribe({
        next: (doctors: Doctor[]) => {
          console.log('Doctors from API:', doctors); // Debug
          this.filteredDoctors = doctors.map(d => {
            if (this.userLocation && d.lat != null && d.lng != null) {
              const dist = this.calculateDistance(this.userLocation.lat, this.userLocation.lng, d.lat, d.lng);
              d.distance = dist.toFixed(2) + ' km';
            }
            return d;
          });

          if (this.filteredDoctors.length === 0) {
            this.locationError = 'Aucun médecin trouvé pour cette recherche. Essayez un terme plus large.';
          }

          const locations = this.filteredDoctors
            .filter(d => d.lat != null && d.lng != null)
            .map(d => ({
              lat: d.lat!,
              lng: d.lng!,
              label: `${d.nom} ${d.prenom} — ${d.specialite?.nom } (${d.distance})`,
              isUser: false
            }));

          if (this.userLocation) {
            locations.push({
              lat: this.userLocation.lat,
              lng: this.userLocation.lng,
              label: 'Vous êtes ici',
              isUser: true
            });
          }

          if (this.mapComp) {
            try {
              this.mapComp.showLocations(locations);
            } catch (e) {
              console.warn('Erreur lors de l\'affichage des marqueurs:', e);
            }
          }
        },
        error: (err) => {
          console.error('Erreur lors de la recherche des médecins:', err);
          this.locationError = 'Erreur lors de la recherche des médecins. Veuillez réessayer.';
        }
      });
  }

  onSearchSubmit(): void {
    if (!this.userLocation) {
      this.locationError = 'Veuillez autoriser la localisation pour rechercher les médecins les plus proches.';
      this.requestLocation();
      return;
    }
    this.loadNearbyDoctors();
  }

  selectDoctor(d: Doctor): void {
    if (d.lat != null && d.lng != null && isPlatformBrowser(this.platformId)) {
      if (this.mapComp && typeof this.mapComp.showLocation === 'function') {
        this.mapComp.showLocation(d.lat as number, d.lng as number, `${d.nom} ${d.prenom} — ${d.specialite?.nom ?? d.specialite}`);
      } else {
        alert('La carte n\'est pas encore prête. Réessayez dans un instant.');
      }
    } else {
      alert('Coordonnées absentes pour ce médecin. Impossible de centrer la carte.');
    }
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}