import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { Doctor } from '../models/doctor';
import { Ville } from '../models/ville';

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
  private readonly apiUrl = 'http://localhost:8081/api/getnearest';

  constructor(private http: HttpClient) {}
  private readonly fallbackDoctors: Doctor[] = [
    { 
      id: 1, 
      nom: 'Dr. A.', 
      prenom: 'Ali', 
      specialite: { id: 1, nom: 'Généraliste' },
      drivingDuration: 'N/A',
      walkingDuration: 'N/A'
    },
    { 
      id: 2, 
      nom: 'Dr. B.', 
      prenom: 'Sara', 
      specialite: { id: 2, nom: 'Pédiatre' },
      drivingDuration: 'N/A',
      walkingDuration: 'N/A'
    }
  ];


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

  getMedecins(): Observable<Doctor[]> {
    return this.http.get<Doctor[]>(this.apiUrl).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('API Error:', error.message);
        console.log('Using fallback data');
        return of(this.fallbackDoctors);
      })
    );
  }

  getCities(): Observable<Ville[]> {
    return this.http.get<Ville[]>(`${this.apiUrl}/cities`).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('Erreur lors du chargement des villes:', error.message);
        return of([]);
      })
    );
  }

  getNearbyMedecins(lat: number, lng: number, query?: string, limit: number = 10, radius: number = 50): Observable<Doctor[]> {
    let url = `${this.apiUrl}/nearest?lat=${lat}&lng=${lng}&limit=${limit}&radius=${radius}`;
    if (query && query.trim()) {
      url += `&query=${encodeURIComponent(query)}`;
    }
    return this.http.get<Doctor[]>(url).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('API Error on nearest:', error.message);
        console.log('Using fallback data');
        return of(this.fallbackDoctors);
      })
    );
  }
}