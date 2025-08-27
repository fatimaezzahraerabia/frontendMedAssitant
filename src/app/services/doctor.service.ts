import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface MedecinRequest {
  id?: number;
  nom: string;
  prenom: string;
  email?: string;  // si tu as l'email dans le backend
  motDePasse?: string;
  adresseCabinet?: string;
  lat?: number;
  lng?: number;
  bio?: string;
  specialite?: {
    id: number;
    nom: string;
  };
}


export interface Specialite {
  id: number;
  nom: string;
}

@Injectable({ providedIn: 'root' })
export class DoctorService {
  private readonly baseUrl = 'http://localhost:8081/api';

  constructor(private http: HttpClient) {}

  createMedecin(payload: MedecinRequest): Observable<MedecinRequest> {
    return this.http.post<MedecinRequest>(`${this.baseUrl}/medecins`, payload);
  }

  listSpecialites(): Observable<Specialite[]> {
    return this.http.get<Specialite[]>(`${this.baseUrl}/specialites`);
  }

  getDoctors(): Observable<MedecinRequest[]> {
    return this.http.get<MedecinRequest[]>(`${this.baseUrl}/medecins`);
  }

  getDoctorName(doctor: MedecinRequest): string {
    return doctor.nom + ' ' + doctor.prenom;
  }
  
  getDoctorSpecialty(doctor: MedecinRequest): string {
    return doctor.specialite?.nom || '';
  }
  
  getDoctorAddress(doctor: MedecinRequest): string {
    return doctor.adresseCabinet || '';
  }
  
  deleteDoctor(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/medecins/${id}`);
  }
}