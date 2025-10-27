
export type Service = {
  id: string;
  customerName: string;
  customerEmail: string;
  technician: string;
  status: 'Completado' | 'En Progreso' | 'Pendiente' | 'Cancelado';
  amount: number;
  date: string;
};

export const services: Service[] = [
  {
    id: "SRV001",
    customerName: "Juan Pérez",
    customerEmail: "juan.perez@example.com",
    technician: "Carlos Gómez",
    status: "Completado",
    amount: 150.0,
    date: "2023-10-26",
  },
  {
    id: "SRV002",
    customerName: "Ana López",
    customerEmail: "ana.lopez@example.com",
    technician: "Luis Fernández",
    status: "En Progreso",
    amount: 200.5,
    date: "2023-10-25",
  },
  {
    id: "SRV003",
    customerName: "Pedro Ramírez",
    customerEmail: "pedro.ramirez@example.com",
    technician: "Sofía Torres",
    status: "Pendiente",
    amount: 75.0,
    date: "2023-10-25",
  },
  {
    id: "SRV004",
    customerName: "María García",
    customerEmail: "maria.garcia@example.com",
    technician: "Carlos Gómez",
    status: "Completado",
    amount: 300.0,
    date: "2023-10-24",
  },
  {
    id: "SRV005",
    customerName: "José Martínez",
    customerEmail: "jose.martinez@example.com",
    technician: "Luis Fernández",
    status: "Cancelado",
    amount: 50.0,
    date: "2023-10-23",
  },
   {
    id: "SRV006",
    customerName: "Elena Sanchez",
    customerEmail: "elena.sanchez@example.com",
    technician: "Sofía Torres",
    status: "Completado",
    amount: 120.75,
    date: "2023-10-22",
  },
  {
    id: "SRV007",
    customerName: "Miguel Rodriguez",
    customerEmail: "miguel.rodriguez@example.com",
    technician: "Carlos Gómez",
    status: "En Progreso",
    amount: 450.0,
    date: "2023-10-21",
  },
];

export type Technician = {
    id: string;
    name: string;
    specialty: string;
    status: 'Disponible' | 'En Servicio' | 'Inactivo';
    rating: number;
};

export const technicians: Technician[] = [
    { id: 'TEC01', name: 'Carlos Gómez', specialty: 'Plomería', status: 'Disponible', rating: 4.8 },
    { id: 'TEC02', name: 'Luis Fernández', specialty: 'Electricidad', status: 'En Servicio', rating: 4.9 },
    { id: 'TEC03', name: 'Sofía Torres', specialty: 'Aire Acondicionado', status: 'Disponible', rating: 4.7 },
    { id: 'TEC04', name: 'Javier Morales', specialty: 'Plomería', status: 'Inactivo', rating: 4.5 },
];
