import { Specialite } from './specialite';

export interface Doctor {
  id?: number;
  nom?: string;
  prenom?: string;
  adresseCabinet?: string; 
  lat?: number;
  lng?: number;
  bio?: string;
  specialite?: Specialite; // un seul objet
  disponibilites?: { [date: string]: string[] }; 
  rating?: number; 
  distance?: string; 

}
