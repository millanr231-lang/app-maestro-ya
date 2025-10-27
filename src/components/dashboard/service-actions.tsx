
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { ServiceRequest, ServiceRequestHistory } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useUser } from '@/firebase';
import { arrayUnion, doc, getDoc, serverTimestamp, updateDoc, writeBatch, Timestamp, collection, where, query, getDocs } from 'firebase/firestore';
import { CommercialClosing } from './commercial-closing';
import { HelpTooltip } from '../ui/help-tooltip';

interface ServiceActionsProps {
  service: ServiceRequest;
}

const scheduleSchema = z.object({
  scheduledDate: z.date({ required_error: 'La fecha es requerida.' }),
  scheduledTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido (HH:MM).'),
  notes: z.string().optional(),
});

const completeSchema = z.object({
  notes: z.string().min(10, { message: "Las notas deben tener al menos 10 caracteres."}),
  hoursWorked: z.coerce.number().positive({ message: "Las horas deben ser un número positivo." }).optional().or(z.literal('')),
  photos: z.any().optional(), // File validation will be handled later
});


type ScheduleFormValues = z.infer<typeof scheduleSchema>;
type CompleteFormValues = z.infer<typeof completeSchema>;

// Helper function to safely create a Date object from various sources
const safeNewDate = (dateSource: any): Date => {
    if (!dateSource) return new Date();
    // Check if it's a Firestore Timestamp
    if (dateSource && typeof dateSource.toDate === 'function') {
        return dateSource.toDate();
    }
    // Check if it's already a Date object
    if (dateSource instanceof Date) {
        return dateSource;
    }
    // Try to parse it, this might fail for some formats
    const parsedDate = new Date(dateSource);
    if (!isNaN(parsedDate.getTime())) {
        return parsedDate;
    }
    // Fallback to now
    return new Date();
};


export function ServiceActions({ service }: ServiceActionsProps) {
  const [isScheduling, setIsScheduling] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false);
  
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();
  const router = useRouter();

  const scheduleForm = useForm<ScheduleFormValues>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      scheduledDate: safeNewDate(service.scheduledAt),
      scheduledTime: service.scheduledAt ? format(safeNewDate(service.scheduledAt), 'HH:mm') : '09:00',
      notes: '',
    },
  });

  const completeForm = useForm<CompleteFormValues>({
    resolver: zodResolver(completeSchema),
    defaultValues: {
      notes: '',
      hoursWorked: 1,
    }
  });


  const handleScheduleSubmit = async (values: ScheduleFormValues) => {
    if (!firestore || !user) return;
    setIsScheduling(true);

    const [hours, minutes] = values.scheduledTime.split(':').map(Number);
    const scheduledAt = new Date(values.scheduledDate);
    scheduledAt.setHours(hours, minutes);
    
    const newHistoryEntry: ServiceRequestHistory = {
        status: 'scheduled',
        timestamp: new Date().toISOString(),
        actorId: user.uid,
        notes: values.notes || 'Servicio programado.',
    };

    try {
      const serviceRef = doc(firestore, 'serviceRequests', service.id);
      const updatedData = {
        scheduledAt,
        status: 'scheduled' as const,
        updatedAt: serverTimestamp(),
        history: arrayUnion(newHistoryEntry),
      };
      await updateDoc(serviceRef, updatedData as any);
      
      toast({
        title: 'Servicio Programado',
        description: `El servicio ha sido programado para el ${format(scheduledAt, 'PPP p', { locale: es })}.`,
      });
      setIsScheduleDialogOpen(false);
    } catch (error: any) {
      console.error('Error scheduling service:', error);
      toast({
        variant: 'destructive',
        title: 'Error al programar',
        description: error.message || 'No se pudo programar el servicio.',
      });
    } finally {
      setIsScheduling(false);
    }
  };

  const handleStartWork = async () => {
    if (!firestore || !user) return;
    setIsUpdatingStatus(true);

    const newHistoryEntry: ServiceRequestHistory = {
        status: 'en_ruta',
        timestamp: new Date().toISOString(),
        actorId: user.uid,
        notes: 'El técnico ha iniciado el trabajo y está en ruta.',
    };

    try {
        const serviceRef = doc(firestore, 'serviceRequests', service.id);
        await updateDoc(serviceRef, {
            status: 'en_ruta',
            startedAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            history: arrayUnion(newHistoryEntry)
        });

        toast({
            title: 'Trabajo Iniciado',
            description: 'El estado del servicio es ahora "En Ruta".'
        });

    } catch (error: any) {
        console.error('Error starting work:', error);
        toast({
            variant: 'destructive',
            title: 'Error al iniciar trabajo',
            description: error.message || 'No se pudo actualizar el estado del servicio.',
        });
    } finally {
        setIsUpdatingStatus(false);
    }
  };

 const handleCompleteWork = async (values: CompleteFormValues) => {
    if (!firestore || !user) {
        toast({ variant: 'destructive', title: 'Error de autenticación' });
        return;
    }
    setIsCompleting(true);

    try {
        // 1. Get the approved quote to determine the totalAmount
        if (!service.quoteId) {
            throw new Error("No hay una cotización aprobada asociada a este servicio.");
        }
        const quoteRef = doc(firestore, "quotes", service.quoteId);
        const quoteSnap = await getDoc(quoteRef);

        if (!quoteSnap.exists()) {
            throw new Error("La cotización asociada no fue encontrada.");
        }
        const quoteData = quoteSnap.data();
        const totalAmount = quoteData.totalAmount || 0;
        
        // 2. Calculate warranty
        const warrantyDays = 30; // Default warranty
        const completedAt = new Date();
        const warrantyExpiresAt = new Date();
        warrantyExpiresAt.setDate(completedAt.getDate() + warrantyDays);

        // 3. Prepare photo URLs (placeholder for now)
        const photoUrls: string[] = []; // TODO: Implement actual photo upload

        // 4. Prepare history entry
        const newHistoryEntry: ServiceRequestHistory = {
            status: 'completed',
            timestamp: completedAt.toISOString(),
            actorId: user.uid,
            notes: `Trabajo completado. ${values.notes}`,
        };
        
        // 5. Update service document with all commercial fields
        const serviceRef = doc(firestore, 'serviceRequests', service.id);
        await updateDoc(serviceRef, {
            status: 'completed' as const,
            completedAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            completionNotes: values.notes,
            hoursWorked: values.hoursWorked || 0,
            evidencePhotos: photoUrls,
            history: arrayUnion(newHistoryEntry),
            
            // Critical: Add payment and warranty fields
            totalAmount: totalAmount,
            advancePayment: 0, // Default, can be adjusted later
            remainingBalance: totalAmount,
            paymentStatus: 'pending' as const,
            warrantyDays: warrantyDays,
            warrantyExpiresAt: Timestamp.fromDate(warrantyExpiresAt),
            payments: [], // Initialize empty payments array
        });

        toast({
            title: '¡Trabajo Completado!',
            description: 'El servicio ha sido marcado como completado exitosamente.'
        });
        setIsCompleteDialogOpen(false);
        // We might not want to redirect immediately, so the user can see the commercial closing section
        // router.push('/dashboard/servicios');
    } catch (error: any) {
        console.error('Error completing work:', error);
        toast({
            variant: 'destructive',
            title: 'Error al completar trabajo',
            description: error.message || 'No se pudo actualizar el estado del servicio.',
        });
    } finally {
        setIsCompleting(false);
    }
  };
  
  const renderActions = () => {
    switch (service.status) {
      case 'assigned':
        return (
          <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full text-base py-6">Programar Trabajo</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  Programar Servicio
                  <HelpTooltip>
                    Paso 4: Define la fecha y hora de la visita. Esto cambiará el estado a 'Programado'.
                  </HelpTooltip>
                </DialogTitle>
                <DialogDescription>Seleccione la fecha y hora para realizar el trabajo.</DialogDescription>
              </DialogHeader>
              <Form {...scheduleForm}>
                <form onSubmit={scheduleForm.handleSubmit(handleScheduleSubmit)} className="space-y-4">
                  <FormField
                    control={scheduleForm.control}
                    name="scheduledDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Fecha</FormLabel>
                        <Popover>
                            <PopoverTrigger asChild>
                            <FormControl>
                                <Button
                                variant={"outline"}
                                className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                                >
                                {field.value ? format(field.value, "PPP", {locale: es}) : <span>Seleccionar fecha</span>}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                            </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                            <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                            </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={scheduleForm.control}
                    name="scheduledTime"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Hora (formato 24h)</FormLabel>
                            <FormControl>
                                <Input type="time" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                   />
                   <FormField
                    control={scheduleForm.control}
                    name="notes"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Notas de Programación (Opcional)</FormLabel>
                            <FormControl>
                                <Textarea placeholder="Ej: Confirmar con el cliente una hora antes..." {...field} />
                            </FormControl>
                        </FormItem>
                    )}
                    />
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsScheduleDialogOpen(false)}>Cancelar</Button>
                    <Button type="submit" disabled={isScheduling}>
                      {isScheduling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Guardar Programación
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        );
      case 'scheduled':
        return (
          <div className="flex items-center gap-2">
            <Button onClick={handleStartWork} disabled={isUpdatingStatus} className="w-full text-base py-6">
                {isUpdatingStatus && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Iniciar Trabajo (En Ruta)
            </Button>
            <HelpTooltip>Paso 5: El técnico presiona este botón al salir hacia el domicilio del cliente. El estado cambia a 'En Ruta'.</HelpTooltip>
          </div>
        );
      case 'en_ruta':
        return (
          <Dialog open={isCompleteDialogOpen} onOpenChange={setIsCompleteDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full text-base py-6">Completar Trabajo</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      Completar Servicio
                      <HelpTooltip>Paso 6: Al finalizar, llena este reporte. Esto cambiará el estado a 'Completado' y habilitará las opciones de cobro.</HelpTooltip>
                    </DialogTitle>
                    <DialogDescription>Añade los detalles finales para cerrar el servicio.</DialogDescription>
                </DialogHeader>
                <Form {...completeForm}>
                  <form onSubmit={completeForm.handleSubmit(handleCompleteWork)} className="space-y-4">
                    <FormField
                      control={completeForm.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notas Finales del Técnico</FormLabel>
                          <FormControl>
                            <Textarea rows={4} placeholder="Descripción del trabajo realizado, problemas encontrados, etc." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={completeForm.control}
                      name="hoursWorked"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tiempo Real Trabajado (Horas)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.5" placeholder="Ej: 2.5" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={completeForm.control}
                      name="photos"
                      render={({ field }) => (
                          <FormItem>
                              <FormLabel>Fotos de Evidencia (Máx. 5)</FormLabel>
                              <FormControl>
                                  <Input type="file" accept="image/*" multiple {...completeForm.register('photos')} />
                              </FormControl>
                                <FormMessage />
                          </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsCompleteDialogOpen(false)}>Cancelar</Button>
                      <Button type="submit" disabled={isCompleting}>
                          {isCompleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Completar Trabajo
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
            </DialogContent>
          </Dialog>
        );
      case 'completed':
        return <CommercialClosing service={service} />;
      default:
        return <p className="text-sm text-muted-foreground text-center">No hay acciones disponibles para este estado.</p>;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row justify-between items-center">
        <CardTitle>Acciones</CardTitle>
        <HelpTooltip>
          Dependiendo del estado del servicio ('Asignado', 'Programado', etc.), aquí aparecerá la siguiente acción disponible para avanzar en el proceso.
        </HelpTooltip>
      </CardHeader>
      <CardContent>
        {renderActions()}
      </CardContent>
    </Card>
  );
}
