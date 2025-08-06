import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomePageComponent } from './pages/home/home.component';
import { SearchPageComponent } from './pages/search/search.component';

export const routes: Routes = [ // Exporting routes
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: HomePageComponent },
  { path: 'search', component: SearchPageComponent },
  // Add other routes here if neededC:\Users\Dell\Desktop\medfinder-app\src\app\app-routing-module.ts
];

@NgModule({
  declarations: [],
  imports: [
    RouterModule.forRoot(routes)
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
