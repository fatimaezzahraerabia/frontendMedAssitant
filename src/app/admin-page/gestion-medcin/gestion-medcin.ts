import { Component, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { SelectionModel } from '@angular/cdk/collections';
import { DoctorService, MedecinRequest, Specialite } from '../../services/doctor.service';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatSortModule } from '@angular/material/sort';
import { Navbar } from '../navbar/navbar';

@Component({
  selector: 'app-gestion-medcin',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatCheckboxModule,
    MatChipsModule,
    MatSortModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    Navbar,
    MatIconModule,
    MatPaginatorModule
  ],
  templateUrl: './gestion-medcin.html',
  styleUrls: ['./gestion-medcin.css']
})
export class DoctorManagementComponent implements OnInit {
  dataSource = new MatTableDataSource<MedecinRequest>([]);
  selection = new SelectionModel<MedecinRequest>(true, []);
  doctorColumns: string[] = ['select', 'name', 'specialite', 'address', 'email', 'actions']; // Aligné avec le HTML
  specialties: Specialite[] = [];

  constructor(private doctorService: DoctorService) {}

  ngOnInit(): void {
    // Fetch doctors
    this.doctorService.getDoctors().subscribe({
      next: (doctors) => {
        console.log('Doctors fetched:', doctors);
        this.dataSource.data = doctors;
      },
      error: (error) => {
        console.error('Error fetching doctors:', error);
      }
    });

    // Fetch specialties for filter
    this.doctorService.listSpecialites().subscribe({
      next: (specialties) => {
        console.log('Specialties fetched:', specialties);
        this.specialties = specialties;
      },
      error: (error) => {
        console.error('Error fetching specialties:', error);
      }
    });
  }

  addDoctor(): void {
    console.log('Add doctor clicked');
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  filterBySpecialty(specialtyId: number): void {
    this.doctorService.getDoctors().subscribe({
      next: (doctors) => {
        this.dataSource.data = specialtyId
          ? doctors.filter(doctor => doctor.specialite?.id === specialtyId)
          : doctors;
      },
      error: (error) => {
        console.error('Error fetching doctors for filter:', error);
      }
    });
  }

  getUniqueSpecialties(): Specialite[] {
    return this.specialties;
  }

  deleteSelectedDoctors(): void {
    const selectedIds = this.selection.selected.map(doctor => doctor.id);
    selectedIds.forEach(id => {
      if (id) {
        this.doctorService.deleteDoctor(id).subscribe({
          next: () => {
            this.dataSource.data = this.dataSource.data.filter(doctor => doctor.id !== id);
            this.selection.clear();
          },
          error: (error) => {
            console.error('Error deleting doctor:', error);
          }
        });
      }
    });
  }

  sendEmailToSelected(): void {
    const selectedEmails = this.selection.selected.map(doctor => doctor.email);
    console.log('Send email to:', selectedEmails);
  }

  masterToggle(): void {
    this.isAllSelected()
      ? this.selection.clear()
      : this.dataSource.data.forEach(row => this.selection.select(row));
  }

  isAllSelected(): boolean {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  viewDoctor(doctor: MedecinRequest): void {
    console.log('View doctor:', doctor);
  }

  editDoctor(doctor: MedecinRequest): void {
    console.log('Edit doctor:', doctor);
  }

  deleteDoctor(doctor: MedecinRequest): void {
    if (doctor.id) {
      this.doctorService.deleteDoctor(doctor.id).subscribe({
        next: () => {
          this.dataSource.data = this.dataSource.data.filter(d => d.id !== doctor.id);
        },
        error: (error) => {
          console.error('Error deleting doctor:', error);
        }
      });
    }
  }

  getTotalDoctors(): number {
    return this.dataSource.data.length;
  }
}