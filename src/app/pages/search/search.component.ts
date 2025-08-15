import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common'; // Import CommonModule for ngFor, etc.
import { FormsModule } from '@angular/forms'; // Import FormsModule for ngModel
import { Router } from '@angular/router';


import { Doctor } from '../../models/doctor'; // Import the Doctor interface
import { DoctorService } from '../../services/doctor.service'; // Import DoctorService
import { DoctorCardComponent } from '../../shared/doctor-card/doctor-card.component'; // Import DoctorCardComponent
import { MapComponent } from '../../components/map/map'; // Import the MapComponent

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, DoctorCardComponent, MapComponent], // Added DoctorCardComponent to imports
  templateUrl: './search.component.html',
  styleUrl: './search.component.css'
})
export class SearchPageComponent implements OnInit {
  doctors: Doctor[] = [];
  filteredDoctors: Doctor[] = [];
  searchTerm: string = '';

  constructor(private doctorService: DoctorService, private router: Router) {} 
  onSearchSubmit(): void {
    // Filtrage
    if (!this.searchTerm.trim()) {
      this.filteredDoctors = [...this.doctors];
    } else {
      this.filteredDoctors = this.doctors.filter(doctor =>
        doctor.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        doctor.specialty.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }
  
    // Navigation vers la page de résultats
    this.router.navigate(['/search'], {
      queryParams: { q: this.searchTerm } // on passe le terme de recherche dans l'URL
    });
  }
  // Service is injected here

  ngOnInit(): void {
    this.doctors = this.doctorService.getDoctors();
    this.filteredDoctors = [...this.doctors]; // Initialize filtered list
  }

  // Correctly defined onSearchSubmit method




}
