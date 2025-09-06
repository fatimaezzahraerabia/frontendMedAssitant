import { Component, OnInit, AfterViewInit, ViewChild, NgZone, Inject, PLATFORM_ID } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { Doctor } from '../../models/doctor';
import { DoctorService, MedecinRequest } from '../../services/doctor.service';
import { DoctorCardComponent } from '../../shared/doctor-card/doctor-card.component';
import { MapComponent } from '../../components/map/map';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { FormControl } from '@angular/forms';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { Ville } from '../../models/ville';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    ReactiveFormsModule,
    DoctorCardComponent,
    MapComponent,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule
  ],
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.css']
})
export class SearchPageComponent implements OnInit, AfterViewInit {
  @ViewChild(MapComponent) mapComp!: MapComponent;

  filteredDoctors: Doctor[] = [];
  searchTerm: string = '';
  userLocation: { lat: number; lng: number } | null = null;
  locationError: string | null = null;
  cities: Ville[] = [];
  cityControl = new FormControl();
  filteredCities!: Observable<Ville[]>;
  selectedCity: Ville | null = null;

  constructor(
    private doctorService: DoctorService,
    private router: Router,
    private ngZone: NgZone,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    this.loadCities();
    this.filteredCities = this.cityControl.valueChanges.pipe(
      startWith(''),
      map(value => typeof value === 'string' ? this._filterCities(value) : this.cities)
    );
  }

  ngAfterViewInit(): void {
    this.mapComp.locationRequested.subscribe((location: { lat: number; lng: number } | null) => {
      this.handleLocationRequested(location);
    });
  }

  private loadCities(): void {
    this.doctorService.getCities().subscribe({
      next: (cities: Ville[]) => {
        this.cities = cities;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des villes:', err);
        this.locationError = 'Impossible de charger les villes. Veuillez réessayer.';
      }
    });
  }

  private _filterCities(value: string): Ville[] {
    const filterValue = value.toLowerCase();
    return this.cities.filter(city => city.nom.toLowerCase().includes(filterValue));
  }

  displayCityFn(city: Ville): string {
    return city ? city.nom : '';
  }

  public handleLocationRequested(location: { lat: number; lng: number } | null): void {
    this.ngZone.run(() => {
      if (location) {
        this.userLocation = location;
        this.locationError = null;
        this.cityControl.reset();
        this.selectedCity = null;
        this.loadNearbyDoctors();
      } else {
        this.userLocation = null;
        this.locationError = 'Impossible d’obtenir la localisation. Veuillez choisir une ville.';
        this.applyErrorHighlight();
      }
    });
  }

  private applyErrorHighlight(): void {
    const input = document.querySelector('.searchbar-place mat-form-field');
    if (input) {
      input.classList.add('highlight-error');
      setTimeout(() => input.classList.remove('highlight-error'), 1000);
    }
  }

  public loadNearbyDoctors(): void {
    let lat: number | undefined;
    let lng: number | undefined;

    if (this.userLocation) {
      lat = this.userLocation.lat;
      lng = this.userLocation.lng;
    } else if (this.selectedCity) {
      lat = this.selectedCity.lat;
      lng = this.selectedCity.lng;
    } else {
      this.locationError = 'Veuillez autoriser la localisation ou sélectionner une ville.';
      this.applyErrorHighlight();
      return;
    }

    const query = this.searchTerm.trim();
    this.doctorService.getNearbyMedecins(lat, lng, query, 10, 50)
      .subscribe({
        next: (doctors: Doctor[]) => {
          console.log('Doctors from API:', doctors);
          this.filteredDoctors = doctors;

          if (this.filteredDoctors.length === 0) {
            this.locationError = 'Aucun médecin trouvé pour cette recherche. Essayez un terme plus large.';
          }

          const locations = this.filteredDoctors
            .filter(d => d.lat != null && d.lng != null)
            .map(d => ({
              lat: d.lat!,
              lng: d.lng!,
              label: `${d.nom} ${d.prenom} — ${d.specialite?.nom ?? 'N/A'} ` +
                     `(${d.distance?.toFixed(2) ?? 'N/A'} km, ` +
                     `${d.drivingDuration ?? 'N/A'} en voiture, ` +
                     `${d.walkingDuration ?? 'N/A'} à pied)`,
              isUser: false
            }));

          if (lat && lng) {
            locations.push({
              lat: lat,
              lng: lng,
              label: this.userLocation ? 'Vous êtes ici' : `Position: ${this.selectedCity!.nom}`,
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
    if (!this.userLocation && !this.selectedCity) {
      this.locationError = 'Veuillez autoriser la localisation ou sélectionner une ville.';
      this.applyErrorHighlight();
      return;
    }
    this.loadNearbyDoctors();
  }

  selectDoctor(d: Doctor): void {
    if (d.lat != null && d.lng != null && isPlatformBrowser(this.platformId)) {
      if (this.mapComp && typeof this.mapComp.showLocation === 'function') {
        this.mapComp.showLocation(d.lat as number, d.lng as number, `${d.nom} ${d.prenom} — ${d.specialite?.nom ?? 'N/A'}`);
      } else {
        alert('La carte n\'est pas encore prête. Réessayez dans un instant.');
      }
    } else {
      alert('Coordonnées absentes pour ce médecin. Impossible de centrer la carte.');
    }
  }

  onCitySelected(): void {
    if (this.selectedCity) {
      this.userLocation = null;
      this.loadNearbyDoctors();
    }
  }
}