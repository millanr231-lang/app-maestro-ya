
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useDoc, useFirestore } from '@/firebase';
import type { ServiceRequest } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { ServiceActions } from '@/components/dashboard/service-actions';

const statusTranslations: Record<string, string> = {
  pending: 'Pendiente',
  assigned: 'Asignado',
  scheduled: 'Programado',
  in_progress: 'En Progreso',
  en_ruta: 'En Ruta',
  completed: 'Completado',
  cancelled: 'Cancelado',
};

const getStatusBadgeVariant = (status: ServiceRequest['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/20 text-green-700 border-green-500/30 hover:bg-green-500/30';
      case 'in_progress':
        return 'bg-blue-500/20 text-blue-700 border-blue-500/30 hover:bg-blue-500/30';
       case 'en_ruta':
        return 'bg-orange-500/20 text-orange-700 border-orange-500/30 hover:bg-orange-500/30';
      case 'assigned':
      case 'scheduled':
        return 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30 hover:bg-yellow-500/30';
      case 'pending':
        return 'bg-gray-500/20 text-gray-700 border-gray-500/30 hover:bg-gray-500/30';
      case 'cancelled':
        return 'bg-red-500/20 text-red-700 border-red-500/30 hover:bg-red-500/30';
      default:
        return 'outline';
    }
};

const formatDate = (timestamp: any) => {
    if (!timestamp || !timestamp.seconds) return 'No especificada';
    try {
      const date = new Date(timestamp.seconds * 1000);
      if (isNaN(date.getTime())) return "Fecha inválida";
      return date.toLocaleString('es-ES', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Fecha inválida';
    }
};

const urgencyMap: Record<string, { text: string; className: string }> = {
    low: { text: 'Baja', className: 'text-green-600' },
    medium: { text: 'Media', className: 'text-yellow-600' },
    high: { text: 'Alta', className: 'text-red-600' },
};


export default function ServiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const serviceId = params.serviceId as string;
  const firestore = useFirestore();

  const serviceRequestDocPath = useMemo(() => {
    if (!firestore || !serviceId) return null;
    return `serviceRequests/${serviceId}`;
  }, [firestore, serviceId]);

  const { data: service, loading, error } = useDoc<ServiceRequest>(serviceRequestDocPath);
  
  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !service) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-destructive">Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p>No se pudo cargar el servicio solicitado. Por favor, verifica que el ID sea correcto o intenta de nuevo.</p>
          {error && <p className="text-sm text-muted-foreground mt-2">{error.message}</p>}
        </CardContent>
      </Card>
    );
  }
  
  const urgencyInfo = service.urgency ? urgencyMap[service.urgency] : { text: 'No especificada', className: '' };

  return (
    <div className="grid gap-6">
        <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Volver</span>
            </Button>
            <h1 className="font-headline text-2xl font-semibold">Detalle del Servicio</h1>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="font-headline text-2xl">Servicio - {service.id.substring(0,7).toUpperCase()}</CardTitle>
                                <CardDescription>Creado el {formatDate(service.createdAt)}</CardDescription>
                            </div>
                            <Badge className={getStatusBadgeVariant(service.status)}>
                                {statusTranslations[service.status] || service.status}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="grid md:grid-cols-2 gap-x-8 gap-y-4 text-sm">
                        <div>
                            <h3 className="font-semibold text-base mb-2">Información del Cliente</h3>
                            <p><strong>Nombre:</strong> {service.customerName}</p>
                            <p><strong>Email:</strong> {service.customerEmail || 'No especificado'}</p>
                            <p><strong>Teléfono:</strong> {service.customerPhone || 'No especificado'}</p>
                            <p><strong>Origen:</strong> {service.customerOrigin}</p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-base mb-2">Detalles del Trabajo</h3>
                            <p><strong>Dirección:</strong> {service.location}</p>
                            <p><strong>Tipo de Servicio:</strong> {service.serviceType}</p>
                            <p><strong>Nivel de Urgencia:</strong> <span className={urgencyInfo.className}>{urgencyInfo.text}</span></p>
                            <p><strong>Fecha Programada:</strong> <span className="font-semibold text-primary">{formatDate(service.scheduledAt)}</span></p>
                        </div>
                        <div className="md:col-span-2 pt-2">
                            <h3 className="font-semibold text-base mb-2">Problema Reportado</h3>
                            <p className="text-muted-foreground bg-slate-50 p-3 rounded-md border">{service.problemDescription}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
            <div className="md:col-span-1">
                 <ServiceActions service={service} />
            </div>
        </div>
    </div>
  );
}
