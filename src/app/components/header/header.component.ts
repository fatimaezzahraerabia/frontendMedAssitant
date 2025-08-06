import { Component } from '@angular/core';
import { RouterLink } from '@angular/router'; // Removed unused RouterOutlet

@Component({
  selector: 'app-header',
  standalone: true, // Mark as standalone component
  imports: [RouterLink], // Removed unused RouterOutlet
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {
  // No complex logic needed for the header component itself
}
