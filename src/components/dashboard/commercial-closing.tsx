
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { ServiceRequest, Payment } from '@/lib/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, DollarSign, Loader2, Send, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useUser } from '@/firebase';
import { arrayUnion, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { Label } from '../ui/label';
import { ScrollArea } from '../ui/scroll-area';
import { HelpTooltip } from '../ui/help-tooltip';

interface CommercialClosingProps {
  service: ServiceRequest;
}

const paymentSchema = z.object({
  amount: z.coerce.number().positive("El monto debe ser mayor a cero."),
  method: z.enum(["cash", "transfer", "card"], { required_error: "Debe seleccionar un método de pago." }),
  paidAt: z.date({ required_error: "La fecha de pago es obligatoria." }),
  notes: z.string().optional(),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

export function CommercialClosing({ service }: CommercialClosingProps) {
  const [isRegisteringPayment, setIsRegisteringPayment] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [generatedMessage, setGeneratedMessage] = useState('');
  const [showGeneratedMessage, setShowGeneratedMessage] = useState(false);
  
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: service.remainingBalance || 0,
      method: "cash",
      paidAt: new Date(),
      notes: "",
    },
  });

  useEffect(() => {
    // Reset form with default values when the service data changes (especially remainingBalance)
    if (service.remainingBalance) {
        form.reset({
            amount: service.remainingBalance,
            method: "cash",
            paidAt: new Date(),
            notes: "",
        });
    }
  }, [service, form]);

  const handleRegisterPayment = async (values: PaymentFormValues) => {
    if (!firestore || !user || !service.id) {
        toast({ variant: 'destructive', title: 'Error', description: 'No se puede registrar el pago.'});
        return;
    }
    setIsRegisteringPayment(true);

    const newPayment: Payment = {
        amount: values.amount,
        method: values.method,
        paidAt: values.paidAt as any,
        registeredBy: user.uid,
        notes: values.notes || "",
    };
    
    const newRemainingBalance = Math.max(0, (service.remainingBalance || 0) - values.amount);
    const newPaymentStatus = newRemainingBalance <= 0 ? 'paid' : 'partially_paid';

    try {
        await updateDoc(doc(firestore, 'serviceRequests', service.id), {
            payments: arrayUnion(newPayment),
            remainingBalance: newRemainingBalance,
            paymentStatus: newPaymentStatus,
            updatedAt: serverTimestamp(),
        });

        toast({
            title: "Pago Registrado Exitosamente",
            description: `Se registró un pago de $${values.amount.toFixed(2)}.`,
        });
        setIsPaymentDialogOpen(false);
        form.reset();

    } catch (error: any) {
        console.error('Error registering payment:', error);
        toast({ variant: 'destructive', title: 'Error', description: 'No se pudo registrar el pago.' });
    } finally {
        setIsRegisteringPayment(false);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    if (isNaN(date.getTime())) return "Fecha inválida";
    return format(date, "PPP", { locale: es });
  };
  
  const paymentStatusMap = {
      pending: { text: "Pendiente de Pago", className: "bg-red-500/20 text-red-700 border-red-500/30" },
      partially_paid: { text: "Parcialmente Pagado", className: "bg-yellow-500/20 text-yellow-700 border-yellow-500/30" },
      paid: { text: "Pagado", className: "bg-green-500/20 text-green-700 border-green-500/30" },
  }

  const statusInfo = service.paymentStatus ? paymentStatusMap[service.paymentStatus] : paymentStatusMap['pending'];

  const handleGenerateClosingMessage = () => {
    const message = `
✅ *SERVICIO COMPLETADO*

Estimado/a ${service.customerName},

Su servicio N° ${service.id.substring(0, 7).toUpperCase()} ha sido completado exitosamente.

📍 *Servicio realizado:* ${service.serviceType}
📅 *Fecha de finalización:* ${service.completedAt ? formatDate(service.completedAt) : 'N/A'}
⏱️ *Tiempo trabajado:* ${service.hoursWorked || 'No especificado'} horas

💵 *RESUMEN DE PAGO:*
Total del servicio: $${(service.totalAmount || 0).toFixed(2)}
Anticipo pagado: $${(service.advancePayment || 0).toFixed(2)}
*SALDO PENDIENTE: $${(service.remainingBalance || 0).toFixed(2)}*

💳 *Formas de pago:*
- Efectivo
- Transferencia: [Datos bancarios]

🛡️ *GARANTÍA:*
Este servicio cuenta con garantía de ${service.warrantyDays || 0} días.
Válida hasta: ${service.warrantyExpiresAt ? formatDate(service.warrantyExpiresAt) : 'N/A'}

📝 *Notas del técnico:*
${service.completionNotes}

¿Tiene alguna pregunta sobre el servicio?

¡Gracias por confiar en nosotros!
    `.trim();
    
    setGeneratedMessage(message);
    setShowGeneratedMessage(true);
  };
  
  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(generatedMessage).then(() => {
        toast({ title: 'Mensaje copiado al portapapeles' });
    }, () => {
        toast({ variant: 'destructive', title: 'Error al copiar' });
    });
  };

  const handleSendWhatsApp = () => {
    const phone = service.customerPhone?.replace(/[^0-9]/g, '');
    if (!phone) {
        toast({ variant: 'destructive', title: 'Teléfono no válido', description: 'No hay un número de teléfono válido para este cliente.'});
        return;
    }
    const whatsappNumber = phone.startsWith('593') ? phone : (phone.length === 10 ? `593${phone.substring(1)}` : `593${phone}`);
    const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(generatedMessage)}`;
    window.open(url, '_blank');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-6 h-6"/> 
            Cierre Comercial
            <HelpTooltip>Paso Final: Registra el pago del saldo pendiente para finalizar el ciclo del servicio.</HelpTooltip>
        </CardTitle>
        <CardDescription>Gestión de pagos y garantía del servicio completado.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="border rounded-lg p-4 space-y-2 bg-muted/40">
           <div className="flex justify-between items-center font-semibold">
              <span>Total del Servicio:</span>
              <span>$${(service.totalAmount || 0).toFixed(2)}</span>
           </div>
           <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Anticipo Pagado:</span>
              <span>$${(service.advancePayment || 0).toFixed(2)}</span>
           </div>
           <div className="flex justify-between items-center font-bold text-lg text-primary">
              <span>Saldo Pendiente:</span>
              <span>$${(service.remainingBalance || 0).toFixed(2)}</span>
           </div>
           <div className="flex justify-between items-center text-sm pt-2">
              <div className='flex items-center gap-2'>
                <span>Estado del Pago:</span>
                <HelpTooltip>El estado cambia a 'Pagado' cuando el saldo pendiente es cero.</HelpTooltip>
              </div>
              <Badge className={statusInfo.className}>{statusInfo.text}</Badge>
           </div>
        </div>
        <div className="border rounded-lg p-4 space-y-2 text-sm">
            <p>🛡️ <strong>Garantía:</strong> ${service.warrantyDays || 0} días</p>
            <p className="text-muted-foreground">Válida hasta: ${formatDate(service.warrantyExpiresAt)}</p>
        </div>

        {showGeneratedMessage && (
            <div className="space-y-2 pt-2">
                <Label>Mensaje de Cierre Generado</Label>
                <Textarea value={generatedMessage} readOnly rows={12} className="bg-slate-100 dark:bg-slate-800" />
            </div>
        )}

         <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2">
              <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
                  <DialogTrigger asChild>
                      <Button disabled={service.paymentStatus === 'paid'}>
                          <DollarSign className="mr-2 h-4 w-4"/> Registrar Pago del Saldo
                      </Button>
                  </DialogTrigger>
                  <DialogContent>
                      <DialogHeader>
                          <DialogTitle>Registrar Pago</DialogTitle>
                          <DialogDescription>Completa los detalles del pago recibido.</DialogDescription>
                      </DialogHeader>
                      <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleRegisterPayment)} className="space-y-4">
                          <ScrollArea className="max-h-[70vh]">
                            <div className="space-y-4 pr-6 py-4">
                                <FormField control={form.control} name="amount" render={({ field }) => (
                                    <FormItem><FormLabel>Monto Recibido</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                                <FormField control={form.control} name="method" render={({ field }) => (
                                    <FormItem><FormLabel>Método de Pago</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="cash">Efectivo</SelectItem>
                                        <SelectItem value="transfer">Transferencia</SelectItem>
                                        <SelectItem value="card">Tarjeta</SelectItem>
                                    </SelectContent></Select><FormMessage /></FormItem>
                                )}/>
                                <FormField control={form.control} name="paidAt" render={({ field }) => (
                                     <FormItem className="flex flex-col"><FormLabel>Fecha de Pago</FormLabel><Popover>
                                        <PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                            {field.value ? format(field.value, "PPP", {locale: es}) : <span>Seleccionar fecha</span>}
                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button></FormControl></PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent>
                                     </Popover><FormMessage /></FormItem>
                                )}/>
                                 <FormField control={form.control} name="notes" render={({ field }) => (
                                    <FormItem><FormLabel>Notas (Opcional)</FormLabel><FormControl><Textarea placeholder="Ej: Pago realizado por el cliente en persona..." {...field} /></FormControl></FormItem>
                                )}/>
                             </div>
                          </ScrollArea>
                          <DialogFooter>
                              <Button type="button" variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>Cancelar</Button>
                              <Button type="submit" disabled={isRegisteringPayment}>
                                  {isRegisteringPayment && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                  Guardar Pago
                              </Button>
                          </DialogFooter>
                        </form>
                      </Form>
                  </DialogContent>
              </Dialog>
            {showGeneratedMessage ? (
                <>
                    <Button variant="secondary" onClick={handleSendWhatsApp}>
                        <Send className="mr-2 h-4 w-4"/> Enviar por WhatsApp
                    </Button>
                    <Button variant="outline" onClick={handleCopyToClipboard} className="md:col-span-2">
                        <Copy className="mr-2 h-4 w-4"/> Copiar Mensaje
                    </Button>
                </>
            ) : (
                <Button variant="outline" onClick={handleGenerateClosingMessage}>
                    <Send className="mr-2 h-4 w-4"/> Generar Mensaje de Cierre
                </Button>
            )}
         </div>
      </CardContent>
    </Card>
  );
}
