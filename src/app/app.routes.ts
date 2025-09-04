import { Routes } from '@angular/router';
import { routes as appRoutes } from './app-routing-module'; // Import routes from AppRoutingModule

// app.routes.ts
import { HomePageComponent } from './pages/home/home.component';
import { SearchPageComponent } from './pages/search/search.component';
import { LoginComponent } from './auth/login/login';
import { RegisterComponent } from './auth/register/register';

export const routes: Routes = [
  { path: '', component: HomePageComponent },
  { path: 'search', component: SearchPageComponent },
  { path: 'login', component: LoginComponent },
  {path:'register',component:RegisterComponent}

];
 // Export the imported routes
