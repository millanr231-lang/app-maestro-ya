
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
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
import { Mail, Send } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

const WhatsAppIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className="mr-2 h-5 w-5"
  >
    <path d="M16.6 14.2c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1-.2.2-.6.8-.8 1-.1.2-.3.2-.5.1-.3-.1-1.1-.4-2.1-1.3-.8-.7-1.3-1.5-1.5-1.8-.1-.2 0-.4.1-.5.1-.1.2-.2.4-.4.1-.1.2-.2.2-.3.1-.1.1-.3 0-.4-.1-.1-1.5-1.8-2-2.5-.5-.7-.9-.6-1.2-.6h-.5c-.3 0-.7.1-1 .3-.3.3-.9 1-.9 2.1s1 2.5 1.1 2.6c.1.2 1.8 2.8 4.4 3.9.7.3 1.2.4 1.6.5.7.1 1.3.1 1.8-.1.5-.2 1.5-1.2 1.7-1.5.2-.3.2-.5.1-.6zM12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8z" />
  </svg>
);


const formSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres.'),
  email: z.string().email('Por favor, introduce un email válido.'),
  phone: z.string().optional(),
  zone: z.enum(["Sur de Quito", "Norte de Quito", "Centro de Quito", "Valles"], {
    required_error: 'Por favor, selecciona tu zona.',
  }),
  message: z.string().min(10, 'Por favor, describe brevemente tu problema.'),
});

type FormValues = z.infer<typeof formSchema>;

interface DemoRequestFormProps {
  onSuccess?: () => void;
}

export function DemoRequestForm({ onSuccess }: DemoRequestFormProps) {
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      message: '',
    },
  });

  function onSubmit(values: FormValues) {
    const businessPhoneNumber = '593987531450'; // Tu número de WhatsApp
    
    const message = `
¡Hola MaestroYa! Quiero solicitar un servicio.

*Nombre:* ${values.name}
*Email:* ${values.email}
*Teléfono:* ${values.phone || 'No proporcionado'}
*Zona:* ${values.zone}

*Descripción del problema:*
${values.message}
    `.trim();

    const whatsappUrl = `https://wa.me/${businessPhoneNumber}?text=${encodeURIComponent(message)}`;
    
    window.open(whatsappUrl, '_blank');
    
    toast({
      title: 'Redirigiendo a WhatsApp',
      description: 'Se abrirá una nueva pestaña para que envíes tu solicitud.',
    });

    if (onSuccess) {
        onSuccess();
    }
  }


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full max-h-[80vh] md:max-h-full">
        <ScrollArea className="flex-1 pr-6 -mr-6">
          <div className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre Completo</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Alex Duran" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email de Contacto</FormLabel>
                      <FormControl>
                        <Input placeholder="tu@email.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>WhatsApp (Opcional)</FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="0991234567" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
             </div>
            <FormField
              control={form.control}
              name="zone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dirección / Zona</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona la zona donde necesitas el servicio" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Norte de Quito">Norte de Quito</SelectItem>
                      <SelectItem value="Centro de Quito">Centro de Quito</SelectItem>
                      <SelectItem value="Sur de Quito">Sur de Quito</SelectItem>
                      <SelectItem value="Valles">Valles (Cumbayá, Tumbaco, etc.)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Describe tu problema</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Ej: Tengo una fuga de agua en el baño, debajo del lavamanos."
                      {...field}
                      rows={4}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </ScrollArea>
        <div className="pt-6 border-t mt-4">
          <Button type="submit" className="w-full">
            <WhatsAppIcon /> Enviar por WhatsApp
          </Button>
        </div>
      </form>
    </Form>
  );
}
