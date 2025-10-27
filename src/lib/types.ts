
import type { DocumentData, Timestamp } from "firebase/firestore";

export interface ServiceRequestHistory {
  status: string;
  timestamp: string | Timestamp;
  actorId: string;
  notes?: string;
}

export interface Payment {
  amount: number;
  method: 'cash' | 'transfer' | 'card';
  paidAt: Timestamp;
  registeredBy: string;
  notes?: string;
}

export interface ServiceRequest extends DocumentData {
  id: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  customerOrigin: "Web" | "WhatsApp" | "Llamada" | "Email" | "Referido" | "Otro";
  serviceType: string;
  location: string;
  problemDescription: string;
  urgency: 'low' | 'medium' | 'high';
  status: 'pending' | 'assigned' | 'scheduled' | 'in_progress' | 'en_ruta' | 'completed' | 'cancelled';
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  scheduledAt?: Timestamp | Date;
  startedAt?: Timestamp;
  completedAt?: Timestamp;
  completionNotes?: string;
  hoursWorked?: number;
  evidencePhotos?: string[];
  customerId: string;
  technicianId?: string;
  history?: ServiceRequestHistory[];
  // Commercial Closing fields
  quoteId?: string;
  totalAmount?: number;
  advancePayment?: number;
  remainingBalance?: number;
  paymentStatus?: 'pending' | 'paid' | 'partially_paid';
  warrantyDays?: number;
  warrantyExpiresAt?: Timestamp;
  payments?: Payment[];
}
