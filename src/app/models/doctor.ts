import { Specialite } from './specialite';

export interface Doctor {
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
  
