import { Routes } from '@angular/router';
import { routes as appRoutes } from './app-routing-module'; // Import routes from AppRoutingModule

// app.routes.ts
import { HomePageComponent } from './pages/home/home.component';
import { SearchPageComponent } from './pages/search/search.component';

export const routes: Routes = [
  { path: '', component: HomePageComponent },
  { path: 'search', component: SearchPageComponent }
];
 // Export the imported routes
