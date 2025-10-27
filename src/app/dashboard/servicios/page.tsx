
'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useFirestore } from "@/firebase";
import { Loader2, PlusCircle, FileText, Calendar, Play, Check, Eye, Trash2 } from "lucide-react";
import type { ServiceRequest } from "@/lib/types";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { NewQuoteForm } from "@/components/dashboard/new-quote-form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { NewServiceForm } from '@/components/dashboard/new-service-form';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DeleteConfirmationDialog } from '@/components/dashboard/delete-confirmation-dialog';
import { collection, deleteDoc, doc, getDocs, query, writeBatch, where, onSnapshot } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';


const statusTranslations: Record<ServiceRequest['status'], string> = {
  pending: 'Pendiente',
  assigned: 'Asignado',
  scheduled: 'Programado',
  in_progress: 'En Progreso',
  en_ruta: 'En Ruta',
  completed: 'Completado',
  cancelled: 'Cancelado',
};

const statusOrder: ServiceRequest['status'][] = ['pending', 'assigned', 'scheduled', 'in_progress', 'en_ruta', 'completed', 'cancelled'];

const TableSkeleton = () => (
    <div className="space-y-2">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
    </div>
);


export default function ServiciosPage() {
  const [isNewSheetOpen, setIsNewSheetOpen] = useState(false);
  const [selectedServiceRequest, setSelectedServiceRequest] = useState<ServiceRequest | null>(null);
  const [isNewServiceDialogOpen, setIsNewServiceDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [serviceToDelete, setServiceToDelete] = useState<ServiceRequest | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const firestore = useFirestore();
  const { toast } = useToast();
  
  useEffect(() => {
    if (!firestore) return;

    setLoading(true);
    const servicesQuery = query(collection(firestore, 'serviceRequests'));
    
    const unsubscribe = onSnapshot(servicesQuery, (snapshot) => {
      const servicesData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as ServiceRequest));
      setServiceRequests(servicesData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching services:", error);
      toast({
        variant: "destructive",
        title: "Error de Carga",
        description: "No se pudieron cargar los servicios. Revisa la consola para más detalles.",
      });
      setLoading(false);
    });

    return () => unsubscribe();
  }, [firestore, toast]);


  const filteredServices = useMemo(() => {
    if (!serviceRequests) return [];
    const sortedServices = [...serviceRequests].sort((a, b) => {
        const dateA = a.createdAt?.seconds ? new Date(a.createdAt.seconds * 1000) : new Date(0);
        const dateB = b.createdAt?.seconds ? new Date(b.createdAt.seconds * 1000) : new Date(0);
        return dateB.getTime() - dateA.getTime();
    });

    if (statusFilter === 'all') {
      return sortedServices;
    }
    return sortedServices.filter(service => service.status === statusFilter);
  }, [serviceRequests, statusFilter]);

  const handleCreateQuote = (serviceRequest: ServiceRequest) => {
    setSelectedServiceRequest(serviceRequest);
    setIsNewSheetOpen(true);
  };
  
  const handleNewQuoteSuccess = () => {
    setIsNewSheetOpen(false);
    setSelectedServiceRequest(null);
  }
  
  const handleNewServiceSuccess = () => {
    setIsNewServiceDialogOpen(false);
  }

  const handleDeleteService = async () => {
    if (!serviceToDelete || !firestore) return;

    if (serviceToDelete.status !== 'pending' && serviceToDelete.status !== 'cancelled') {
        toast({ variant: "destructive", title: "Eliminación no permitida", description: "Solo se pueden eliminar servicios pendientes o cancelados."});
        setServiceToDelete(null);
        return;
    }
    
    if (serviceToDelete.payments && serviceToDelete.payments.length > 0) {
        toast({ variant: "destructive", title: "Eliminación no permitida", description: "No se pueden eliminar servicios con pagos registrados."});
        setServiceToDelete(null);
        return;
    }

    setIsDeleting(true);
    try {
        const batch = writeBatch(firestore);

        const quotesQuery = query(
            collection(firestore, 'quotes'),
            where('serviceRequestId', '==', serviceToDelete.id)
        );
        const quotesSnapshot = await getDocs(quotesQuery);
        quotesSnapshot.forEach(quoteDoc => {
            batch.delete(quoteDoc.ref);
        });

        const serviceRef = doc(firestore, 'serviceRequests', serviceToDelete.id);
        batch.delete(serviceRef);
        
        await batch.commit();

        toast({
            title: "Servicio Eliminado",
            description: `El servicio ${serviceToDelete.id.substring(0,7).toUpperCase()} y sus cotizaciones han sido eliminados.`,
        });

    } catch (error: any) {
        console.error("Error deleting service:", error);
        toast({ variant: "destructive", title: "Error al eliminar", description: error.message || "No se pudo eliminar el servicio." });
    } finally {
        setIsDeleting(false);
        setServiceToDelete(null);
    }
  };


  const getStatusBadgeVariant = (status: ServiceRequest['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/20 text-green-700 border-green-500/30 hover:bg-green-500/30';
      case 'in_progress':
      case 'en_ruta':
        return 'bg-blue-500/20 text-blue-700 border-blue-500/30 hover:bg-blue-500/30';
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
    if (!timestamp || !timestamp.seconds) return 'No programada';
    try {
      const date = new Date(timestamp.seconds * 1000);
      if (isNaN(date.getTime())) return "Fecha inválida";
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return 'Fecha inválida';
    }
  };

  const renderActionForService = (service: ServiceRequest) => {
    const canDelete = (service.status === 'pending' || service.status === 'cancelled') && (!service.payments || service.payments.length === 0);
    
    let mainAction;
    switch (service.status) {
      case 'pending':
        mainAction = (
          <Button variant="outline" size="sm" onClick={() => handleCreateQuote(service)}>
            <FileText className="mr-2 h-4 w-4" />
            Crear Cotización
          </Button>
        );
        break;
      case 'assigned':
         mainAction = (
            <Button size="sm" asChild>
                <Link href={`/dashboard/servicios/${service.id}`}>
                    <Calendar className="mr-2 h-4 w-4" />
                    Programar
                </Link>
            </Button>
        );
        break;
       case 'scheduled':
         mainAction = (
            <Button size="sm" asChild>
                <Link href={`/dashboard/servicios/${service.id}`}>
                    <Play className="mr-2 h-4 w-4" />
                    Iniciar
                </Link>
            </Button>
        );
        break;
      case 'en_ruta':
         mainAction = (
            <Button size="sm" asChild>
                <Link href={`/dashboard/servicios/${service.id}`}>
                    <Check className="mr-2 h-4 w-4" />
                    Completar
                </Link>
            </Button>
        );
        break;
      case 'completed':
      case 'cancelled':
      default:
        mainAction = (
          <Button variant="outline" size="sm" asChild>
            <Link href={`/dashboard/servicios/${service.id}`}>
              <Eye className="mr-2 h-4 w-4" />
              Ver Detalles
            </Link>
          </Button>
        );
        break;
    }
    
    return (
        <div className="flex items-center justify-end gap-2">
            {mainAction}
            {canDelete && (
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive/70 hover:text-destructive hover:bg-destructive/10" onClick={() => setServiceToDelete(service)}>
                    <Trash2 className="h-4 w-4"/>
                    <span className="sr-only">Eliminar Servicio</span>
                </Button>
            )}
        </div>
    );
  };


  return (
    <>
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle className="font-headline">Gestión de Servicios</CardTitle>
            <CardDescription>Visualiza y gestiona todas las solicitudes de servicio.</CardDescription>
          </div>
           <Dialog open={isNewServiceDialogOpen} onOpenChange={setIsNewServiceDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Nuevo Servicio
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                  <DialogTitle>Crear Nueva Solicitud de Servicio</DialogTitle>
                  <DialogDescription>
                    Complete los detalles a continuación para registrar un nuevo servicio.
                  </DialogDescription>
                </DialogHeader>
                <NewServiceForm onSuccess={handleNewServiceSuccess} />
              </DialogContent>
            </Dialog>
        </CardHeader>
        <CardContent>
          <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full">
            <TabsList className="mb-4 grid w-full grid-cols-8">
              <TabsTrigger value="all">Todos</TabsTrigger>
              {statusOrder.map(status => (
                 <TabsTrigger key={status} value={status}>{statusTranslations[status]}</TabsTrigger>
              ))}
            </TabsList>
            <div className="w-full overflow-x-auto">
              {loading ? (
                <TableSkeleton />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID Servicio</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Servicio</TableHead>
                      <TableHead>Fecha Creación</TableHead>
                      <TableHead>Fecha Prog.</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredServices.map((service) => (
                      <TableRow key={service.id}>
                        <TableCell className="font-medium">
                          <Link href={`/dashboard/servicios/${service.id}`} className="hover:underline text-primary">
                            {service.id.substring(0, 7).toUpperCase()}
                          </Link>
                        </TableCell>
                        <TableCell>{service.customerName}</TableCell>
                        <TableCell>{service.serviceType}</TableCell>
                        <TableCell>{formatDate(service.createdAt)}</TableCell>
                        <TableCell>{formatDate(service.scheduledAt)}</TableCell>
                        <TableCell>
                          <Badge className={getStatusBadgeVariant(service.status)}>
                            {statusTranslations[service.status] || service.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {renderActionForService(service)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </Tabs>
        </CardContent>
      </Card>
      
      <Sheet open={isNewSheetOpen} onOpenChange={setIsNewSheetOpen}>
        <SheetContent className="sm:max-w-4xl w-full overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Crear Nueva Cotización</SheetTitle>
            <SheetDescription>Completa los detalles para generar una nueva cotización para el servicio {selectedServiceRequest?.id.substring(0,7).toUpperCase()}.</SheetDescription>
          </SheetHeader>
          {selectedServiceRequest && (
            <NewQuoteForm 
              onSuccess={handleNewQuoteSuccess} 
              serviceRequest={selectedServiceRequest} 
            />
          )}
        </SheetContent>
      </Sheet>

      <DeleteConfirmationDialog
        isOpen={!!serviceToDelete}
        onClose={() => setServiceToDelete(null)}
        onConfirm={handleDeleteService}
        title="Eliminar Servicio"
        description={`¿Estás seguro de que quieres eliminar el servicio ${serviceToDelete?.id.substring(0,7).toUpperCase()}? También se eliminarán todas las cotizaciones asociadas. Esta acción no se puede deshacer.`}
        isLoading={isDeleting}
      />
    </>
  );
}

    