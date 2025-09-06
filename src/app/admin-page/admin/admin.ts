import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms'; // For ngModel and ngForm
import { MatTableDataSource } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { Navbar } from '../navbar/navbar';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-admin',
  standalone: true, // Make it standalone to import modules directly here
  imports: [
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatTableModule,
    MatIconModule,
    CommonModule,
    Navbar,
    RouterLink,
    // Add NavbarComponent and StatsComponent if they are standalone, or import their module
    // For now, assuming they are declared elsewhere; if not, generate and import them
  ],
  templateUrl: './admin.html'
})
export class AdminComponent {
  newDoctor = { name: '', specialty: '', address: '', phone: '', email: '' };
  doctors = new MatTableDataSource<any>([
    { name: 'Dr. Jean Dupont', specialty: 'Cardiologue', address: '123 Rue', phone: '061234', email: 'jean@email.com' }
  ]);
  doctorColumns = ['name', 'specialty', 'address', 'phone', 'email', 'actions'];

  newPatient = { name: '', email: '', age: '', phone: '' };
  patients = new MatTableDataSource<any>([
    { name: 'Marie Curie', email: 'marie@email.com', age: 35, phone: '061234' }
  ]);
  patientColumns = ['name', 'email', 'age', 'phone', 'actions'];

  addDoctor() {
    this.doctors.data = [...this.doctors.data, { ...this.newDoctor }];
    this.newDoctor = { name: '', specialty: '', address: '', phone: '', email: '' };
  }

  addPatient() {
    this.patients.data = [...this.patients.data, { ...this.newPatient }];
    this.newPatient = { name: '', email: '', age: '', phone: '' };
  }
}