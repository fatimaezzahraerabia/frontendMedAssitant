import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router'; // Removed unused RouterOutlet


@Component({
  selector: 'app-home',
  standalone: true,
  imports: [FormsModule, CommonModule ,RouterLink], // Removed unused RouterOutlet

  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomePageComponent {
  searchTerm: string = ''; // ← propriété liée à ton input

  
}