export interface Doctor {
    name: string;
    specialty: string;
    address: string;
    phone: string;
    email: string;
  }
  
  // Jeu de données de test
  const DOCTOR_DATA: Doctor[] = [
    { name: 'Dr. Ali', specialty: 'Cardiologue', address: 'Casablanca', phone: '0612345678', email: 'ali@example.com' },
    { name: 'Dr. Sara', specialty: 'Dermatologue', address: 'Rabat', phone: '0623456789', email: 'sara@example.com' },
    { name: 'Dr. Youssef', specialty: 'Pédiatre', address: 'Marrakech', phone: '0634567890', email: 'youssef@example.com' },
  ];
  