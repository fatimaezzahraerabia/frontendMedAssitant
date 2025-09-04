import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Router, NavigationEnd } from '@angular/router';


@Component({
  selector: 'app-header',
  standalone: true,
  templateUrl: './header.component.html',
  imports: [ RouterLink],            // ✅ tu ajoutes ici

  styleUrl: './header.component.css'
})
export class HeaderComponent {
  isMenuOpen = false;
  hideNavbar = false;


  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }
  constructor(private router: Router) {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        // masquer la navbar uniquement sur /login
        this.hideNavbar = event.url === '/login' || event.url === '/register';
      }
    });
}
}