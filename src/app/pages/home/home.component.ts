import { Component } from '@angular/core';
import { RouterLink } from '@angular/router'; // Removed unused RouterOutlet

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink], // Removed unused RouterOutlet
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomePageComponent {
  // No complex logic needed for the home page component itself
}
