
'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Send, CheckCircle, XCircle, Copy, Trash2 } from 'lucide-react';
import type { Quote, QuoteHistory, QuoteStatus } from '@/app/dashboard/cotizaciones/page';
import { useDashboard } from '@/app/dashboard/layout';
import { Separator } from '../ui/separator';
import { useFirestore, useDoc } from '@/firebase';
import { doc, updateDoc, serverTimestamp, Timestamp, writeBatch, deleteDoc } from 'firebase/firestore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import type { UserProfile } from '@/app/dashboard/layout';
import { DeleteConfirmationDialog } from './delete-confirmation-dialog';
import { HelpTooltip } from '../ui/help-tooltip';

interface QuoteDetailsProps {
  quote: Quote;
  onUpdate: (quote: Partial<Quote>) => void;
  onClose?: () => void;
}

const WhatsAppIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-4 w-4"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
);

const statusTranslations: Record<QuoteStatus, string> = {
  draft: 'Borrador',
  sent: 'Enviada',
  approved: 'Aprobada',
  rejected: 'Rechazada',
  expired: 'Vencida',
};

function useTechnicianName(technicianId: string) {
  const firestore = useFirestore();
  const userDocPath = useMemo(() => {
    if (!firestore || !technicianId) return null;
    return `users/${technicianId}`;
  }, [firestore, technicianId]);

  const { data: userProfile, loading } = useDoc<UserProfile>(userDocPath);

  return { name: userProfile?.displayName || technicianId, loading };
}

function ActorName({ actorId }: { actorId: string }) {
    const { name, loading } = useTechnicianName(actorId);
    if (loading) return <span className="text-xs">Cargando...</span>;
    return <>{name}</>;
}


export function QuoteDetails({ quote, onUpdate, onClose }: QuoteDetailsProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [generatedMessage, setGeneratedMessage] = useState(quote.generatedMessage || '');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const { toast } = useToast();
  const router = useRouter();
  const { userProfile } = useDashboard();
  const firestore = useFirestore();
  const { name: technicianName } = useTechnicianName(quote.technicianId);
  

  const handleGenerateMessage = async () => {
    if (!userProfile) return;
    setIsGenerating(true);

    const validUntilDate = quote.validUntil?.toDate ? quote.validUntil.toDate().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric'}) : 'No especificado';
    const message = `
🔧 *COTIZACIÓN DE SERVICIO*

Estimado/a ${quote.customerName || 'Cliente'},

Le presentamos la cotización solicitada para el servicio N° ${quote.serviceRequestId.substring(0, 7).toUpperCase()} con la siguiente información:

📍 *Dirección:* ${quote.serviceAddress || 'No especificada'}
⚙️ *Descripción del servicio:* ${quote.serviceType || 'No especificado'}
🚨 *Nivel de urgencia:* ${quote.urgency || 'No especificado'}
📝 *Problema reportado:* ${quote.problemDescription || 'No especificado'}

🛠️ *Detalle de cotización:*
${quote.items.map(item => `- ${item.quantity} x ${item.description} — $${item.price.toFixed(2)} cada uno — Subtotal: $${(item.quantity * item.price).toFixed(2)}`).join('\n')}

💵 *Resumen de montos:*
Subtotal: $${(quote.subtotal || 0).toFixed(2)}
IVA (${quote.vatPercentage}%): $${(quote.vatAmount || 0).toFixed(2)}
*TOTAL*: $${(quote.totalAmount || 0).toFixed(2)}

🗓️ *Vigencia de esta cotización:* ${validUntilDate}

✅ *Incluye garantía de satisfacción y materiales certificados.*
🔄 Si tiene dudas o desea hacer cambios, por favor comuníquese antes de la fecha de vigencia.

⚠️ *¿Cómo proceder?*
Responda este mismo mensaje para aprobar, rechazar o solicitar ajustes. Una vez aceptada, coordinaremos fecha y hora.

¡Gracias por confiar en MaestroYa CRM!
📞 Contacto técnico: ${technicianName || userProfile.displayName || 'Equipo MaestroYa'}

_MaestroYa CRM – Servicios Técnicos Garantizados_
    `.trim().replace(/^\s+/gm, '');

    setGeneratedMessage(message);
    
    if(firestore) {
      const quoteRef = doc(firestore, 'quotes', quote.id);
      const updatedData = { generatedMessage: message };
      await updateDoc(quoteRef, updatedData);
      onUpdate(updatedData);
    }
    
    toast({
        title: 'Mensaje generado',
        description: 'El mensaje para el cliente ha sido creado y guardado.',
    });
    setIsGenerating(false);
  };
  
  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(generatedMessage).then(() => {
        toast({ title: 'Mensaje copiado al portapapeles' });
    }, () => {
        toast({ variant: 'destructive', title: 'Error al copiar' });
    });
  };

  const handleSendWhatsApp = () => {
    const phone = quote.customerPhone?.replace(/[^0-9]/g, '');
    if (!phone) {
        toast({ variant: 'destructive', title: 'Teléfono no válido', description: 'No hay un número de teléfono válido para este cliente.'});
        return;
    }
    const whatsappNumber = phone.startsWith('593') ? phone : (phone.length === 10 ? `593${phone.substring(1)}` : `593${phone}`);
    const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(generatedMessage)}`;
    window.open(url, '_blank');
    if (quote.status === 'draft') {
      updateQuoteStatus('sent');
    }
  };

  const updateQuoteStatus = async (newStatus: QuoteStatus) => {
      if (!userProfile || !firestore) {
        toast({ variant: "destructive", title: "Error", description: "No se puede conectar a la base de datos." });
        return;
      }
      setIsUpdating(true);

      try {
        const batch = writeBatch(firestore);

        const quoteRef = doc(firestore, 'quotes', quote.id);
        const newHistoryEntry: QuoteHistory = {
          status: newStatus,
          timestamp: new Date().toISOString(),
          actorId: userProfile.uid
        };
        
        const currentHistory = Array.isArray(quote.history) ? quote.history : [];
        const updatedHistory = [...currentHistory, newHistoryEntry];
        
        const updatedQuoteData = {
          status: newStatus,
          history: updatedHistory,
          updatedAt: serverTimestamp(),
        };
        batch.update(quoteRef, updatedQuoteData as any);

        if (newStatus === 'approved') {
          if (!quote.serviceRequestId) {
            throw new Error("ID de la solicitud de servicio no encontrado en la cotización.");
          }
          const serviceRef = doc(firestore, 'serviceRequests', quote.serviceRequestId);
          batch.update(serviceRef, {
            status: 'assigned',
            quoteId: quote.id,
            updatedAt: serverTimestamp(),
          });
        }
        
        await batch.commit();

        if (newStatus === 'approved') {
            toast({
                title: '¡Actualización exitosa!',
                description: `El servicio ha sido marcado como asignado y ya puedes programar el trabajo.`,
            });
        } else {
             toast({
                title: 'Estado de la cotización actualizado',
                description: `La cotización ha sido marcada como "${statusTranslations[newStatus]}".`,
            });
        }
        
        onUpdate({ 
          status: newStatus,
          history: updatedHistory,
          updatedAt: new Date() as any 
        });

      } catch(error: any) {
        console.error("Error updating quote/service status:", error);
        toast({
          variant: "destructive",
          title: "Error de Actualización",
          description: error.message || "No se pudo actualizar el estado. Revisa la consola para más detalles.",
        });
      } finally {
        setIsUpdating(false);
      }
    };
    
    const handleDelete = async () => {
      if (!firestore) {
          toast({ variant: 'destructive', title: 'Error', description: 'No se pudo conectar a la base de datos.' });
          return;
      }
      
      const canDeleteQuote = quote.status === 'draft' || quote.status === 'rejected' || quote.status === 'expired';
      if (!canDeleteQuote) {
          toast({ variant: 'destructive', title: 'Acción no permitida', description: 'No se pueden eliminar cotizaciones aprobadas o enviadas.' });
          setIsDeleteDialogOpen(false);
          return;
      }
      setIsDeleting(true);
      try {
          await deleteDoc(doc(firestore, 'quotes', quote.id));
          toast({ title: 'Cotización Eliminada' });
          if(onClose) onClose();
          router.push(`/dashboard/servicios/${quote.serviceRequestId}`);

      } catch (error: any) {
          console.error("Error deleting quote:", error);
          toast({ variant: 'destructive', title: 'Error', description: 'No se pudo eliminar la cotización.' });
      } finally {
          setIsDeleting(false);
          setIsDeleteDialogOpen(false);
      }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Fecha inválida';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    if(isNaN(date.getTime())) return 'Fecha inválida';
    return date.toLocaleString('es-ES', {
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };
  
  const urgencyMap: Record<string, { text: string; className: string }> = {
    low: { text: 'Baja', className: 'text-green-600' },
    medium: { text: 'Media', className: 'text-yellow-600' },
    high: { text: 'Alta', className: 'text-red-600' },
  };

  const urgencyInfo = quote.urgency ? urgencyMap[quote.urgency] : { text: 'No especificada', className: '' };
  
  const canDeleteQuote = quote.status === 'draft' || quote.status === 'rejected' || quote.status === 'expired';

  return (
    <div className="grid gap-6 py-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
              <div>
                <CardTitle>Detalles del Cliente y Servicio</CardTitle>
                <CardDescription>ID de Servicio: {quote.serviceRequestId.substring(0,7).toUpperCase()}</CardDescription>
              </div>
              {canDeleteQuote && (
                <Button variant="destructive" size="icon" onClick={() => setIsDeleteDialogOpen(true)} disabled={isDeleting}>
                    <Trash2 className="h-4 w-4"/>
                    <span className="sr-only">Eliminar Cotización</span>
                </Button>
              )}
          </div>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
            <p><strong>Cliente:</strong> {quote.customerName || 'N/A'}</p>
            <p><strong>Técnico Asignado:</strong> {technicianName}</p>
            <p><strong>Fecha de Creación:</strong> {formatDate(quote.createdAt)}</p>
            <Separator className="my-2"/>
            <p><strong>Dirección:</strong> {quote.serviceAddress || 'No especificada'}</p>
            <p><strong>Tipo de Servicio:</strong> {quote.serviceType || 'No especificado'}</p>
            <p><strong>Urgencia:</strong> <span className={urgencyInfo.className}>{urgencyInfo.text}</span></p>
            <p className="pt-2"><strong>Problema Reportado:</strong></p>
            <p className="text-muted-foreground">{quote.problemDescription || 'No especificado'}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
            <CardTitle>Ítems de la Cotización</CardTitle>
        </CardHeader>
        <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descripción</TableHead>
                  <TableHead className="text-center">Cant.</TableHead>
                  <TableHead className="text-right">P. Unit.</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quote.items.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.description}</TableCell>
                      <TableCell className="text-center">{item.quantity}</TableCell>
                      <TableCell className="text-right">${item.price.toFixed(2)}</TableCell>
                      <TableCell className="text-right">${(item.quantity * item.price).toFixed(2)}</TableCell>
                    </TableRow>
                ))}
              </TableBody>
            </Table>
            <Separator className="my-4" />
             <div className="space-y-2 pr-4">
                <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span className="font-medium">${(quote.subtotal || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">IVA ({quote.vatPercentage}%):</span>
                    <span className="font-medium">${(quote.vatAmount || 0).toFixed(2)}</span>
                </div>
                 {quote.discountAmount > 0 && (
                    <div className="flex justify-between text-sm text-red-600">
                        <span className="text-muted-foreground">Descuento:</span>
                        <span className="font-medium">-${(quote.discountAmount || 0).toFixed(2)}</span>
                    </div>
                )}
                <Separator className="my-2" />
                <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>${quote.totalAmount.toFixed(2)}</span>
                </div>
             </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle>Mensaje para el Cliente</CardTitle>
            <HelpTooltip>Paso 2 de 3: Genera un mensaje formateado para enviar la cotización al cliente y poder cambiar el estado a 'Enviada'.</HelpTooltip>
          </div>
          <CardDescription>Genera un mensaje, revísalo y envíalo al cliente.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={handleGenerateMessage} disabled={isGenerating} className="w-full">
            {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {generatedMessage ? 'Volver a Generar Mensaje' : 'Generar Mensaje'}
          </Button>
          {generatedMessage && (
            <>
                <Textarea value={generatedMessage} readOnly rows={16} className="bg-muted/50 whitespace-pre-wrap font-mono text-xs" />
                 <div className="grid grid-cols-2 gap-2">
                    <Button variant="secondary" onClick={handleSendWhatsApp}>
                        <WhatsAppIcon />
                        Enviar por WhatsApp
                    </Button>
                    <Button variant="outline" onClick={handleCopyToClipboard}>
                        <Copy className="mr-2 h-4 w-4" />
                        Copiar Mensaje
                    </Button>
                 </div>
            </>
          )}
        </CardContent>
      </Card>

       <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle>Estado y Auditoría</CardTitle>
            <HelpTooltip>
                Paso 3 de 3: Una vez que el cliente responda, registra aquí su decisión. 'Aprobar' cambiará el estado del servicio a 'Asignado' y te permitirá programarlo.
            </HelpTooltip>
          </div>
        </CardHeader>
        <CardContent>
             <div className="flex items-center justify-between mb-4">
                 <p className="text-sm">Registrar respuesta del cliente:</p>
                 <div className="flex gap-2">
                     <Button size="sm" variant="outline" onClick={() => updateQuoteStatus('approved')} disabled={isUpdating || quote.status === 'approved'}>
                         {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                         <CheckCircle className="mr-2 h-4 w-4 text-green-600"/> Aprobar
                     </Button>
                     <Button size="sm" variant="outline" onClick={() => updateQuoteStatus('rejected')} disabled={isUpdating || quote.status === 'rejected'}>
                         {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                         <XCircle className="mr-2 h-4 w-4 text-red-600"/> Rechazar
                     </Button>
                 </div>
             </div>
             <Separator />
            <ul className="mt-4 space-y-2 text-xs text-muted-foreground">
                {quote.history.slice().reverse().map((entry, index) => (
                    <li key={index} className="flex justify-between items-center">
                        <span>Estado: <strong>{statusTranslations[entry.status as QuoteStatus]?.toUpperCase() || entry.status}</strong></span>
                        <div className="text-right">
                          <div>{formatDate(entry.timestamp)}</div>
                          <div className="text-xs">por <ActorName actorId={entry.actorId} /></div>
                        </div>
                    </li>
                ))}
            </ul>
        </CardContent>
      </Card>
      
      <DeleteConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Eliminar Cotización"
        description={`¿Estás seguro de que quieres eliminar la cotización ${quote.id.substring(0,7).toUpperCase()}? Esta acción no se puede deshacer.`}
        isLoading={isDeleting}
      />
    </div>
  );
}
