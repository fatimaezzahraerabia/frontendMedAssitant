import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ChatResponse { // Export the interface
  message?: string;
  diagnoses?: any[]; // Adjust this type based on your actual diagnosis response structure
  requires_more_info?: boolean; // Ajouter ce
  next_question?: string; // Ajouter cette propriété pour la prochaine question
}

@Injectable({
  providedIn: 'root'
})
export class RagService {

  private diagnosisApiUrl = 'api/diagnose'; // URL for diagnosis
  private adviceApiUrl = 'api/advice'; // URL for advice
  private generalApiUrl = 'api/general'; // URL for general queries

  constructor(private http: HttpClient) {
    console.log('RagService initialized');
  }

  getDiagnosis(symptoms: string[], sessionId: string): Observable<ChatResponse> {
    return this.http.post<ChatResponse>(this.diagnosisApiUrl, { symptoms, session_id: sessionId });
  }

  getAdvice(query: string): Observable<ChatResponse> {
    return this.http.post<ChatResponse>(this.adviceApiUrl, { message: query });
  }

  getGeneralResponse(query: string): Observable<ChatResponse> {
    return this.http.post<ChatResponse>(this.generalApiUrl, { query });
  }
}
