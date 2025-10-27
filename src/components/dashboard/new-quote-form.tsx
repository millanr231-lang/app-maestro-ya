
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, PlusCircle, Trash2, CalendarIcon } from 'lucide-react';
import { useFirestore, useUser } from '@/firebase';
import { addDoc, collection, serverTimestamp, Timestamp } from 'firebase/firestore';
import type { ServiceRequest } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar } from '../ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Separator } from '../ui/separator';
import { HelpTooltip } from '../ui/help-tooltip';

const quoteItemSchema = z.object({
  description: z.string().min(1, 'La descripción es requerida.'),
  quantity: z.coerce.number().min(0.1, 'La cantidad debe ser mayor a 0.'),
  price: z.coerce.number().min(0, 'El precio no puede ser negativo.'),
});

const formSchema = z.object({
  serviceRequestId: z.string(),
  customerName: z.string(),
  customerId: z.string(),
  customerPhone: z.string().optional(),
  customerEmail: z.string().optional(),
  serviceAddress: z.string(),
  description: z.string().min(10, 'Añade una descripción detallada del servicio a cotizar.'),
  items: z.array(quoteItemSchema).min(1, 'Debe haber al menos un ítem.'),
  notes: z.string().optional(),
  vatPercentage: z.coerce.number().min(0).max(100).default(15),
  discountAmount: z.coerce.number().min(0).default(0),
  validUntil: z.date(),
  // For data propagation to quote details
  problemDescription: z.string().optional(),
  serviceType: z.string().optional(),
  urgency: z.string().optional(),
});

type NewQuoteFormValues = z.infer<typeof formSchema>;

interface NewQuoteFormProps {
  onSuccess: () => void;
  serviceRequest?: ServiceRequest;
}

export function NewQuoteForm({ onSuccess, serviceRequest }: NewQuoteFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();

  const defaultValidUntil = new Date();
  defaultValidUntil.setDate(defaultValidUntil.getDate() + 15); // Default 15 days validity

  const form = useForm<NewQuoteFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      serviceRequestId: serviceRequest?.id || '',
      customerName: serviceRequest?.customerName || '',
      customerId: serviceRequest?.customerId || '',
      customerPhone: serviceRequest?.customerPhone || '',
      customerEmail: serviceRequest?.customerEmail || '',
      serviceAddress: serviceRequest?.location || '',
      description: `Servicio de ${serviceRequest?.serviceType || ''} para atender: "${serviceRequest?.problemDescription || ''}"`,
      items: [{ description: '', quantity: 1, price: 0 }],
      notes: '',
      vatPercentage: 15,
      discountAmount: 0,
      validUntil: defaultValidUntil,
      // Pass through service request details
      problemDescription: serviceRequest?.problemDescription,
      serviceType: serviceRequest?.serviceType,
      urgency: serviceRequest?.urgency,
    },
  });
  
  useEffect(() => {
    const defaultValidUntilOnReset = new Date();
    defaultValidUntilOnReset.setDate(defaultValidUntilOnReset.getDate() + 15);
    form.reset({
      serviceRequestId: serviceRequest?.id || '',
      customerName: serviceRequest?.customerName || '',
      customerId: serviceRequest?.customerId || '',
      customerPhone: serviceRequest?.customerPhone || '',
      customerEmail: serviceRequest?.customerEmail || '',
      serviceAddress: serviceRequest?.location || '',
      description: `Servicio de ${serviceRequest?.serviceType || ''} para atender: "${serviceRequest?.problemDescription || ''}"`,
      items: [{ description: '', quantity: 1, price: 0 }],
      notes: '',
      vatPercentage: 15,
      discountAmount: 0,
      validUntil: defaultValidUntilOnReset,
      problemDescription: serviceRequest?.problemDescription,
      serviceType: serviceRequest?.serviceType,
      urgency: serviceRequest?.urgency,
    });
  }, [serviceRequest, form]);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });
  
  const watchedItems = form.watch('items');
  const watchedVatPercentage = form.watch('vatPercentage');
  const watchedDiscountAmount = form.watch('discountAmount');

  const calculations = useMemo(() => {
    const subtotal = watchedItems.reduce((acc, item) => acc + (item.quantity || 0) * (item.price || 0), 0);
    const vat = subtotal * (watchedVatPercentage / 100);
    const total = subtotal + vat - watchedDiscountAmount;
    return { subtotal, vat, total };
  }, [watchedItems, watchedVatPercentage, watchedDiscountAmount]);

  async function onSubmit(values: NewQuoteFormValues) {
    if (!firestore || !user) {
        toast({ variant: 'destructive', title: 'Error', description: 'No se pudo conectar con la base de datos.' });
        return;
    }
    setIsLoading(true);

    try {
      const quoteData = {
        ...values,
        totalAmount: calculations.total,
        subtotal: calculations.subtotal,
        vatAmount: calculations.vat,
        technicianId: user.uid,
        status: 'draft' as const,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        history: [{
          status: 'draft',
          timestamp: new Date(),
          actorId: user.uid,
        }],
      };
      
      await addDoc(collection(firestore, 'quotes'), quoteData);

      toast({
        title: 'Cotización Creada',
        description: 'La nueva cotización ha sido guardada como borrador.',
      });
      onSuccess();
    } catch (error: any) {
      console.error('Error creating quote:', error);
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'No se pudo crear la cotización.' });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
        
        {/* Customer Info */}
        <div className="p-4 border rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold">Información del Cliente y Servicio</h3>
            <HelpTooltip>
                Paso 1 de 3: Verifica los datos del cliente y el servicio, luego detalla los costos. La cotización se guardará como 'Borrador'.
            </HelpTooltip>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div><strong>Cliente:</strong> {form.getValues('customerName')}</div>
            <div><strong>Email:</strong> {form.getValues('customerEmail')}</div>
            <div><strong>Teléfono:</strong> {form.getValues('customerPhone')}</div>
            <div><strong>Dirección:</strong> {form.getValues('serviceAddress')}</div>
          </div>
        </div>

        {/* Service Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center gap-2">
                <FormLabel>Descripción General del Servicio</FormLabel>
                <HelpTooltip>Un resumen del trabajo a realizar que aparecerá en la cotización.</HelpTooltip>
              </div>
              <FormControl>
                <Textarea placeholder="Detalle el trabajo a realizar..." rows={3} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Items Table */}
        <div>
          <div className="flex items-center gap-2">
            <FormLabel>Ítems de la Cotización</FormLabel>
            <HelpTooltip>Detalla cada material o mano de obra con su cantidad y precio. Debes añadir al menos un ítem.</HelpTooltip>
          </div>
          <div className="mt-2 border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-1/2">Descripción</TableHead>
                  <TableHead>Cant.</TableHead>
                  <TableHead>Precio U.</TableHead>
                  <TableHead>Subtotal</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fields.map((field, index) => (
                  <TableRow key={field.id}>
                    <TableCell>
                      <FormField control={form.control} name={`items.${index}.description`} render={({ field }) => <Input placeholder="Material o servicio" {...field} />} />
                    </TableCell>
                    <TableCell>
                      <FormField control={form.control} name={`items.${index}.quantity`} render={({ field }) => <Input type="number" {...field} />} />
                    </TableCell>
                    <TableCell>
                      <FormField control={form.control} name={`items.${index}.price`} render={({ field }) => <Input type="number" step="0.01" {...field} />} />
                    </TableCell>
                    <TableCell className="text-right">
                      ${((form.watch(`items.${index}.quantity`) || 0) * (form.watch(`items.${index}.price`) || 0)).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length <= 1}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => append({ description: '', quantity: 1, price: 0 })} className="mt-2">
            <PlusCircle className="mr-2 h-4 w-4" /> Añadir Ítem
          </Button>
           {form.formState.errors.items && <p className="text-sm font-medium text-destructive">{form.formState.errors.items.message || (form.formState.errors.items as any)?.root?.message}</p>}
        </div>
        
        <Separator/>

        {/* Totals Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            <div className="space-y-2">
                 <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Notas Técnicas (Opcional)</FormLabel>
                        <FormControl>
                            <Textarea placeholder="Comentarios para el equipo técnico o el cliente..." rows={3} {...field} />
                        </FormControl>
                        </FormItem>
                    )}
                    />
                 <FormField
                    control={form.control}
                    name="validUntil"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <FormLabel>Vigencia de la Cotización</FormLabel>
                          <HelpTooltip>Fecha hasta la cual los precios de esta cotización son válidos.</HelpTooltip>
                        </div>
                        <Popover>
                            <PopoverTrigger asChild>
                            <FormControl>
                                <Button
                                variant={"outline"}
                                className={cn("w-[240px] pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                                >
                                {field.value ? format(field.value, "PPP") : <span>Seleccionar fecha</span>}
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
            </div>
            <div className="space-y-2 rounded-md bg-muted p-4">
                <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span className="font-medium">${calculations.subtotal.toFixed(2)}</span>
                </div>

                <div className="flex justify-between items-center text-sm">
                    <FormLabel htmlFor="vatPercentage" className="text-muted-foreground">IVA (%):</FormLabel>
                    <FormField control={form.control} name="vatPercentage" render={({ field }) => <Input type="number" className="w-20 h-8" {...field} />} />
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Monto IVA:</span>
                    <span className="font-medium">${calculations.vat.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2">
                    <FormLabel htmlFor="discountAmount" className="text-muted-foreground">Descuento ($):</FormLabel>
                    <HelpTooltip>Monto fijo que se restará del total.</HelpTooltip>
                  </div>
                     <FormField control={form.control} name="discountAmount" render={({ field }) => <Input type="number" step="0.01" className="w-20 h-8" {...field} />} />
                </div>

                <Separator className="my-2" />
                <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span>${calculations.total.toFixed(2)}</span>
                </div>
            </div>
        </div>

        <Button type="submit" disabled={isLoading || !serviceRequest} className="w-full text-base py-6">
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Guardar Cotización
        </Button>
      </form>
    </Form>
  );
}
