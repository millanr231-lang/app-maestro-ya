
'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { ServiceRequest } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { useEffect, useState } from "react";
import { useFirestore } from "@/firebase";
import { collection, query, orderBy, limit, getDocs, doc, getDoc, onSnapshot } from "firebase/firestore";
import { Skeleton } from "../ui/skeleton";
import { AlertCircle } from "lucide-react";

export interface RecentService {
    id: string;
    customerName: string;
    customerEmail: string;
    technicianName: string;
    status: ServiceRequest['status'];
    amount: number;
}

const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
};

const getStatusBadgeVariant = (status: ServiceRequest['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/20 text-green-700 border-green-500/30';
      case 'in_progress':
      case 'en_ruta':
        return 'bg-blue-500/20 text-blue-700 border-blue-500/30';
      case 'assigned':
      case 'scheduled':
        return 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30';
      case 'pending':
        return 'bg-gray-500/20 text-gray-700 border-gray-500/30';
      case 'cancelled':
        return 'bg-red-500/20 text-red-700 border-red-500/30';
      default:
        return 'outline';
    }
};

const statusTranslations: Record<ServiceRequest['status'], string> = {
  pending: 'Pendiente',
  assigned: 'Asignado',
  scheduled: 'Programado',
  in_progress: 'En Progreso',
  en_ruta: 'En Ruta',
  completed: 'Completado',
  cancelled: 'Cancelado',
};

const TableSkeleton = () => (
    <div className="space-y-2">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
    </div>
);

export function RecentServices() {
  const [services, setServices] = useState<RecentService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const firestore = useFirestore();

  useEffect(() => {
    if (!firestore) return;

    const q = query(
      collection(firestore, 'serviceRequests'),
      orderBy('createdAt', 'desc'),
      limit(5)
    );

    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
      try {
        setLoading(true);
        const servicesData: RecentService[] = [];
        
        for (const docSnapshot of querySnapshot.docs) {
          const service = docSnapshot.data() as ServiceRequest;

          let technicianName = 'No asignado';
          if (service.technicianId) {
            const techDoc = await getDoc(doc(firestore, 'users', service.technicianId));
            if (techDoc.exists()) {
              technicianName = techDoc.data().displayName || 'Técnico';
            }
          }
          
          servicesData.push({
            id: docSnapshot.id,
            customerName: service.customerName,
            customerEmail: service.customerEmail || '',
            technicianName,
            status: service.status || 'pending',
            amount: service.totalAmount || 0,
          });
        }
        
        setServices(servicesData);
        setError(null);
      } catch (err: any) {
        console.error('Error processing recent services:', err);
        setError('No se pudieron procesar los servicios recientes.');
        setServices([]);
      } finally {
        setLoading(false);
      }
    }, (err) => {
        console.error('Error fetching recent services:', err);
        setError('No se pudieron cargar los servicios recientes.');
        setLoading(false);
    });

    return () => unsubscribe();
  }, [firestore]);


  if (loading) {
    return <TableSkeleton />;
  }

  if (error) {
    return (
        <div className="flex flex-col items-center justify-center h-40 text-center text-red-500">
            <AlertCircle className="h-8 w-8 mb-2" />
            <p className="font-semibold">Error al cargar</p>
            <p className="text-sm">{error}</p>
        </div>
    );
  }

  if (services.length === 0) {
      return (
        <div className="flex items-center justify-center h-40 text-center text-muted-foreground">
            <p>No hay servicios recientes para mostrar.</p>
        </div>
      );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Cliente</TableHead>
          <TableHead>Técnico</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead className="text-right">Monto</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {services.map((service) => (
          <TableRow key={service.id}>
            <TableCell>
              <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                      <AvatarImage src={''} alt={service.customerName || 'Avatar'} />
                      <AvatarFallback>{getInitials(service.customerName)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{service.customerName}</div>
                    <div className="text-sm text-muted-foreground">{service.customerEmail}</div>
                  </div>
              </div>
            </TableCell>
            <TableCell>{service.technicianName}</TableCell>
            <TableCell>
               <Badge 
                className={getStatusBadgeVariant(service.status)}
               >
                 {statusTranslations[service.status] || service.status}
                </Badge>
            </TableCell>
            <TableCell className="text-right">${service.amount.toFixed(2)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
