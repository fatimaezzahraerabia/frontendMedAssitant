import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Doctor } from '../../models/doctor'; // Import the Doctor interface

@Component({
  selector: 'app-doctor-card',
  standalone: true,
  imports: [CommonModule], // Import CommonModule for ngFor and other directives
  templateUrl: './doctor-card.component.html',
  styleUrl: './doctor-card.component.css'
})
export class DoctorCardComponent {
  @Input() doctor: Doctor | undefined; // Input property to receive doctor data
  isLiked: boolean = false;

  getStars(rating: number): number[] {
    return Array(rating).fill(0);
  }

  toggleLike(): void {
    this.isLiked = !this.isLiked;
    // In a real application, you would emit an event or call a service here
    console.log('Doctor liked:', this.isLiked);
  }
}
