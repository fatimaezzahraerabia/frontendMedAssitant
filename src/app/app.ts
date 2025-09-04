import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './components/header/header.component';
// Removed unused imports for HomePageComponent and SearchPageComponent as they are handled by routing

@Component({
  selector: 'app-root',
  standalone: true, // Mark as standalone component
  imports: [RouterOutlet, HeaderComponent], // Keep RouterOutlet and HeaderComponent
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('medfinder-app');
}
