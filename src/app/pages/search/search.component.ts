import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common'; // Import CommonModule for ngFor, etc.
import { FormsModule } from '@angular/forms'; // Import FormsModule for ngModel

import { Doctor } from '../../models/doctor'; // Import the Doctor interface
import { DoctorService } from '../../services/doctor.service'; // Import DoctorService
import { DoctorCardComponent } from '../../shared/doctor-card/doctor-card.component'; // Import DoctorCardComponent

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, DoctorCardComponent], // Added DoctorCardComponent to imports
  templateUrl: './search.component.html',
  styleUrl: './search.component.css'
})
export class SearchPageComponent implements OnInit {
  doctors: Doctor[] = [];
  filteredDoctors: Doctor[] = [];
  searchTerm: string = '';

  constructor(private doctorService: DoctorService) {} // Service is injected here

  ngOnInit(): void {
    this.doctors = this.doctorService.getDoctors();
    this.filteredDoctors = [...this.doctors]; // Initialize filtered list
  }

  // Correctly defined onSearchSubmit method
  onSearchSubmit(): void {
    if (!this.searchTerm.trim()) {
      this.filteredDoctors = [...this.doctors]; // Show all if search term is empty
      return;
    }
    this.filteredDoctors = this.doctors.filter(doctor =>
      doctor.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      doctor.specialty.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }
}
