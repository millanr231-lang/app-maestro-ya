
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useFirestore } from '@/firebase';
import { collection, query, where, getDocs, Timestamp, addDoc } from 'firebase/firestore';
import type { ServiceRequest, Payment } from '@/lib/types';
import { format, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { Download, FileText, Banknote, Send, Loader2, Megaphone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { KpiCard } from '@/components/dashboard/kpi-card';

interface EnrichedPayment extends Payment {
    serviceId: string;
    customerName: string;
    serviceType: string;
}

const TableSkeleton = () => (
    <div className="space-y-2">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
    </div>
);

const paymentMethodTranslations: { [key: string]: string } = {
    cash: 'Efectivo',
    transfer: 'Transferencia',
    card: 'Tarjeta',
};

export default function FacturacionPage() {
    const [servicesToInvoice, setServicesToInvoice] = useState<ServiceRequest[]>([]);
    const [servicesToCollect, setServicesToCollect] = useState<ServiceRequest[]>([]);
    const [paymentHistory, setPaymentHistory] = useState<EnrichedPayment[]>([]);
    const [loading, setLoading] = useState(true);
    const [sendingReminder, setSendingReminder] = useState<string | null>(null);
    const firestore = useFirestore();
    const { toast } = useToast();
    
    useEffect(() => {
        if (!firestore) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch services completed or with payments
                const allServicesQuery = query(collection(firestore, 'serviceRequests'));
                const allServicesSnapshot = await getDocs(allServicesQuery);
                
                const servicesData = allServicesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ServiceRequest));
                
                const toInvoice = servicesData.filter(s => s.status === 'completed' && s.paymentStatus === 'paid');
                const toCollect = servicesData.filter(s => (s.paymentStatus === 'pending' || s.paymentStatus === 'partially_paid') && s.remainingBalance && s.remainingBalance > 0);
                
                setServicesToInvoice(toInvoice);
                setServicesToCollect(toCollect);

                // Fetch all payments for history
                const allPayments: EnrichedPayment[] = [];
                servicesData.forEach(service => {
                    if (service.payments && service.payments.length > 0) {
                        service.payments.forEach(payment => {
                            if (payment && typeof payment === 'object' && payment.amount) {
                                allPayments.push({
                                    ...payment,
                                    serviceId: service.id,
                                    customerName: service.customerName,
                                    serviceType: service.serviceType,
                                });
                            }
                        });
                    }
                });
                
                allPayments.sort((a, b) => b.paidAt.toDate().getTime() - a.paidAt.toDate().getTime());
                setPaymentHistory(allPayments);

            } catch (error: any) {
                console.error("Error fetching billing data:", error);
                toast({
                    variant: "destructive",
                    title: "Error de Carga",
                    description: "No se pudieron cargar los datos de facturación."
                });
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [firestore, toast]);
    
    const totalToCollect = useMemo(() => {
        return servicesToCollect.reduce((sum, service) => sum + (service.remainingBalance || 0), 0);
    }, [servicesToCollect]);
    
    const handleSendReminder = async (service: ServiceRequest) => {
        if (!firestore || !service.customerEmail) {
            toast({ variant: 'destructive', title: 'Error', description: 'El cliente no tiene un email registrado.' });
            return;
        }
        
        setSendingReminder(service.id);
        
        try {
            // Este es el mismo patrón usado para otros correos transaccionales.
            // Al hacer clic, se crea un documento en la colección 'mail'.
            // La extensión "Trigger Email from Firestore" detecta este documento y envía el correo.
            
            // FUTURA MEJORA: Automatización con Cloud Functions
            // Esta misma lógica puede moverse a una Cloud Function que se ejecute con un cron-job (ej. cada día).
            // La función buscaría en `serviceRequests` donde `remainingBalance` > 0 y crearía los documentos en `/mail` automáticamente.
            // Esto elimina la necesidad del botón manual.
            await addDoc(collection(firestore, 'mail'), {
                to: [service.customerEmail],
                message: {
                    subject: `Recordatorio de Pago - Servicio ${service.id.substring(0, 7).toUpperCase()} - MaestroYa`,
                    html: `
                        <p>¡Hola <b>${service.customerName}</b>!</p>
                        <p>Te enviamos un recordatorio amistoso sobre el saldo pendiente para tu servicio de <b>${service.serviceType}</b>.</p>
                        <p><b>Detalles del Servicio:</b></p>
                        <ul>
                            <li>ID de Servicio: ${service.id.substring(0, 7).toUpperCase()}</li>
                            <li>Monto Total: $${(service.totalAmount || 0).toFixed(2)}</li>
                            <li><b>Saldo Pendiente: $${(service.remainingBalance || 0).toFixed(2)}</b></li>
                        </ul>
                        <p>Puedes realizar tu pago mediante transferencia o efectivo. Por favor, contáctanos si ya has realizado el pago o si tienes alguna pregunta.</p>
                        <p>¡Gracias por tu confianza en MaestroYa!</p>
                    `,
                }
            });

            toast({ title: 'Recordatorio Enviado', description: `Se ha enviado un correo de cobranza a ${service.customerName}.` });
        } catch (error: any) {
             console.error("Error sending reminder:", error);
             toast({ variant: 'destructive', title: 'Error', description: 'No se pudo enviar el recordatorio.' });
        } finally {
            setSendingReminder(null);
        }
    };

    const formatDate = (timestamp: Timestamp | undefined) => {
        if (!timestamp?.toDate) return 'Fecha inválida';
        return format(timestamp.toDate(), 'dd/MM/yyyy, HH:mm', { locale: es });
    };
    
    const getDaysOverdue = (timestamp: Timestamp | undefined): number => {
        if (!timestamp?.toDate) return 0;
        return differenceInDays(new Date(), timestamp.toDate());
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline text-3xl">Gestión de Facturación y Pagos</CardTitle>
                <CardDescription>
                    Supervisa las cuentas por cobrar, los servicios listos para facturar y el historial de pagos.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="collections" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="collections"><Megaphone className="mr-2 h-4 w-4"/>Cuentas por Cobrar</TabsTrigger>
                        <TabsTrigger value="invoicing"><FileText className="mr-2 h-4 w-4"/>Listos para Facturar</TabsTrigger>
                        <TabsTrigger value="payments"><Banknote className="mr-2 h-4 w-4"/>Historial de Pagos</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="collections" className="mt-4">
                        <Card>
                            <CardHeader>
                                <KpiCard
                                    title="Total por Cobrar"
                                    value={`$${totalToCollect.toFixed(2)}`}
                                    change={`En ${servicesToCollect.length} servicios con saldo pendiente.`}
                                    icon={<Banknote />}
                                />
                            </CardHeader>
                            <CardContent>
                                {loading ? <TableSkeleton /> : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Cliente</TableHead>
                                                <TableHead>Días de Retraso</TableHead>
                                                <TableHead className="text-right">Saldo Pendiente</TableHead>
                                                <TableHead className="text-right">Acción</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {servicesToCollect.map(service => {
                                                const daysOverdue = getDaysOverdue(service.completedAt);
                                                return (
                                                    <TableRow key={service.id} className={daysOverdue > 15 ? 'bg-red-50 dark:bg-red-900/20' : ''}>
                                                        <TableCell className="font-medium">{service.customerName}</TableCell>
                                                        <TableCell>
                                                            <Badge variant={daysOverdue > 7 ? 'destructive' : 'outline'}>{daysOverdue} días</Badge>
                                                        </TableCell>
                                                        <TableCell className="text-right font-semibold">${(service.remainingBalance || 0).toFixed(2)}</TableCell>
                                                        <TableCell className="text-right">
                                                            <Button 
                                                                variant="outline" 
                                                                size="sm"
                                                                onClick={() => handleSendReminder(service)}
                                                                disabled={!service.customerEmail || sendingReminder === service.id}
                                                            >
                                                                {sendingReminder === service.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Send className="mr-2 h-4 w-4"/>}
                                                                Enviar Recordatorio
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                )}
                                { !loading && servicesToCollect.length === 0 && (
                                     <div className="text-center py-12 text-muted-foreground">
                                        <p>¡Excelente! No hay cuentas pendientes por cobrar.</p>
                                     </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                    
                    <TabsContent value="invoicing" className="mt-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Servicios Listos para Facturar</CardTitle>
                                <CardDescription>Estos servicios están completados y totalmente pagados, listos para la emisión de la factura electrónica (SRI).</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {loading ? <TableSkeleton /> : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>ID Servicio</TableHead>
                                                <TableHead>Cliente</TableHead>
                                                <TableHead>Fecha Finalización</TableHead>
                                                <TableHead className="text-right">Monto Total</TableHead>
                                                <TableHead className="text-right">Acción</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {servicesToInvoice.map(service => (
                                                <TableRow key={service.id}>
                                                    <TableCell className="font-medium text-primary">{service.id.substring(0, 7).toUpperCase()}</TableCell>
                                                    <TableCell>{service.customerName}</TableCell>
                                                    <TableCell>{service.completedAt ? formatDate(service.completedAt) : 'N/A'}</TableCell>
                                                    <TableCell className="text-right font-semibold">${(service.totalAmount || 0).toFixed(2)}</TableCell>
                                                    <TableCell className="text-right">
                                                        {/* FUTURA MEJORA: Integración con API del SRI
                                                            Este botón llamaría a una Cloud Function segura que, a su vez,
                                                            se conectaría con la API del SRI o un proveedor de facturación
                                                            electrónica para emitir el comprobante fiscal.
                                                            La función recibiría el ID del servicio y obtendría los datos
                                                            necesarios de Firestore.
                                                        */}
                                                        <Button variant="outline" size="sm" disabled>
                                                            Generar Factura (SRI)
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                                { !loading && servicesToInvoice.length === 0 && (
                                     <div className="text-center py-12 text-muted-foreground">
                                        <p>No hay servicios listos para facturar.</p>
                                     </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                    
                    <TabsContent value="payments" className="mt-4">
                        <Card>
                             <CardHeader>
                                <CardTitle>Historial General de Pagos</CardTitle>
                                <CardDescription>Todos los pagos registrados en el sistema, ordenados por fecha.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {loading ? <TableSkeleton /> : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Cliente</TableHead>
                                                <TableHead>Servicio</TableHead>
                                                <TableHead>Fecha de Pago</TableHead>
                                                <TableHead>Método</TableHead>
                                                <TableHead className="text-right">Monto</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {paymentHistory.map((payment, index) => (
                                                <TableRow key={`${payment.serviceId}-${index}`}>
                                                    <TableCell className="font-medium">{payment.customerName}</TableCell>
                                                    <TableCell>{payment.serviceType}</TableCell>
                                                    <TableCell>{formatDate(payment.paidAt)}</TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline">{paymentMethodTranslations[payment.method] || payment.method}</Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right font-semibold">${payment.amount.toFixed(2)}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                                 { !loading && paymentHistory.length === 0 && (
                                     <div className="text-center py-12 text-muted-foreground">
                                        <p>No se han registrado pagos en el sistema.</p>
                                     </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}
