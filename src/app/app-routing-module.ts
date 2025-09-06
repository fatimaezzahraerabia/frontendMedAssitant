import { DoctorManagementComponent } from './admin-page/gestion-medcin/gestion-medcin';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomePageComponent } from './pages/home/home.component';
import { SearchPageComponent } from './pages/search/search.component';
import { LoginComponent } from './auth/login/login';
import { RegisterComponent } from './auth/register/register';
import { AdminComponent } from './admin-page/admin/admin';


export const routes: Routes = [ // Exporting routes
  { path: '', component: HomePageComponent },
  { path: 'search', component: SearchPageComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'admin', component: AdminComponent },
  { path: 'admin/medcin-gestion', component: DoctorManagementComponent },


  { path: '', redirectTo: '/', pathMatch: 'full' },

  

  // Add other routes here if neededC:\Users\Dell\Desktop\medfinder-app\src\app\app-routing-module.ts
];

@NgModule({
  declarations: [],
  imports: [
    RouterModule.forRoot(routes),
  ],
  exports: [RouterModule],

})
export class AppRoutingModule { }
