import { Specialite } from './specialite';
import { Ville } from './ville';

export interface Doctor {
  id?: number;
  nom?: string;
  prenom?: string;
  adresseCabinet?: string; 
  lat?: number;
  lng?: number;
  bio?: string;
  specialite?: Specialite; 
  ville?: Ville;
  disponibilites?: { [date: string]: string[] }; 
  rating?: number; 
  distance?: number; 
  email?: string;  
  drivingDuration?: string; // min en voiture
  walkingDuration?: string; // min à pied

}
