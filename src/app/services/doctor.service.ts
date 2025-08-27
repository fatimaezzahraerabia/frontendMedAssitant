import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { Doctor } from '../models/doctor';

@Injectable({
  providedIn: 'root'
})
export class DoctorService {
  private readonly apiUrl = 'http://localhost:8080/api/medecins';
  private readonly fallbackDoctors: Doctor[] = [
    { id: 1, nom: 'Dr. A.', prenom: 'Ali', specialite: { id: 1, nom: 'Généraliste' } },
    { id: 2, nom: 'Dr. B.', prenom: 'Sara', specialite: { id: 2, nom: 'Pédiatre' } }
  ];

  constructor(private http: HttpClient) {}

  getMedecins(): Observable<Doctor[]> {
    return this.http.get<Doctor[]>(this.apiUrl).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('API Error:', error.message);
        console.log('Using fallback data');
        return of(this.fallbackDoctors);
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
