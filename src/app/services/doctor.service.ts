import { Injectable } from '@angular/core';
import { Doctor } from '../models/doctor'; // Import the Doctor interface

@Injectable({
  providedIn: 'root' // Provides the service at the root level
})
export class DoctorService {

  private doctors: Doctor[] = [
    { name: 'Dr. A.', rating: 4, distance: '2,5 km', specialty: 'Généraliste' },
    { name: 'Dr. B.', rating: 5, distance: '0,8 km', specialty: 'Pédiatre' },
    { name: 'Dr. C.', rating: 3, distance: '1,2 km', specialty: 'Dentiste' },
    { name: 'Dr. D.', rating: 4, distance: '3,1 km', specialty: 'Dermatologue' },
    { name: 'Dr. E.', rating: 5, distance: '5,0 km', specialty: 'Généraliste' },
    { name: 'Dr. F.', rating: 4, distance: '1,5 km', specialty: 'Cardiologue' },
  ];

  constructor() { }

  getDoctors(): Doctor[] {
    return this.doctors;
  }

  searchDoctors(specialty: string): Doctor[] {
    return this.doctors.filter(doctor =>
      doctor.specialty.toLowerCase().includes(specialty.toLowerCase())
    );
  }
}
