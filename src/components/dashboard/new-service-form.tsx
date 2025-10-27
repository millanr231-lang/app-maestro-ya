
"use client";

import { useState, forwardRef } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Zap, ShieldAlert, Shield } from "lucide-react";
import { useFirestore, useUser } from "@/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { ScrollArea } from "../ui/scroll-area";
import { cn } from "@/lib/utils";
import { HelpTooltip } from "../ui/help-tooltip";

const formSchema = z.object({
  customerName: z.string().min(2, "El nombre debe tener al menos 2 caracteres."),
  customerEmail: z.string().email("Por favor, introduce un email válido.").optional().or(z.literal('')),
  customerPhone: z.string().min(7, "El teléfono debe tener al menos 7 dígitos.").optional().or(z.literal('')),
  customerOrigin: z.enum(["Web", "WhatsApp", "Llamada", "Email", "Referido", "Otro"]),
  serviceType: z.enum(["Plomería", "Electricidad", "Albañilería", "Aire Acondicionado", "Otro"]),
  location: z.string().min(5, "La dirección es obligatoria."),
  problemDescription: z.string().min(10, "La descripción debe tener al menos 10 caracteres."),
  urgency: z.enum(["low", "medium", "high"]),
});

type NewServiceFormValues = z.infer<typeof formSchema>;

interface NewServiceFormProps {
  onSuccess?: () => void;
}

const UrgencySelectItem = forwardRef<
  HTMLDivElement,
  { value: string; className?: string; children: React.ReactNode }
>(({ value, className, children, ...props }, ref) => (
  <SelectItem value={value} className={cn("flex items-center", className)} {...props} ref={ref}>
    {children}
  </SelectItem>
));
UrgencySelectItem.displayName = 'UrgencySelectItem';


export function NewServiceForm({ onSuccess }: NewServiceFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();

  const form = useForm<NewServiceFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      location: "",
      problemDescription: "",
      urgency: "medium",
      serviceType: "Plomería",
      customerOrigin: "Llamada",
    },
  });

  async function onSubmit(values: NewServiceFormValues) {
    if (!firestore || !user) {
        toast({ variant: 'destructive', title: 'Error', description: 'No se pudo conectar con la base de datos o no estás autenticado.' });
        return;
    }
    setIsLoading(true);
    try {
      // A simple way to generate a somewhat unique customer ID if one doesn't exist.
      // In a real app, you'd check if the customer exists first.
      const customerId = `CUST-${Date.now()}`;

      // 1. Create the service request document
      await addDoc(collection(firestore, 'serviceRequests'), {
          ...values,
          status: 'pending',
          createdAt: serverTimestamp(),
          customerId: customerId, // This should be linked to a real customer profile later
          technicianId: '', // To be assigned later
      });
      
      // 2. If an email is provided, create the email document in the /mail collection
      if (values.customerEmail) {
        await addDoc(collection(firestore, 'mail'), {
          to: [values.customerEmail],
          message: {
            subject: 'MaestroYa - Solicitud de Servicio Recibida',
            text: `¡Hola ${values.customerName}! Hemos recibido tu solicitud de servicio. Nuestro equipo la está revisando y pronto te asignaremos un técnico. ¡Gracias por confiar en MaestroYa!`,
            html: `
              <p>¡Hola <b>${values.customerName}</b>!</p>
              <p>Hemos recibido tu solicitud de servicio. Nuestro equipo la está revisando y pronto te asignaremos un técnico.</p>
              <p><b>Detalles de tu solicitud:</b></p>
              <ul>
                <li>Servicio: ${values.serviceType}</li>
                <li>Descripción: ${values.problemDescription}</li>
              </ul>
              <p>¡Gracias por confiar en MaestroYa!</p>
            `,
          }
        });
      }

      toast({
        title: "Servicio Creado Exitosamente",
        description: `Se ha registrado el servicio para ${values.customerName}.`,
      });
      form.reset(); 
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error("Error creating service or email:", error);
      toast({
        variant: "destructive",
        title: "Error al crear servicio",
        description: error.message || "No se pudo crear el servicio o enviar la notificación. Revisa las reglas de Firestore.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const renderUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case 'high': return <Zap className="h-4 w-4 text-red-500" />;
      case 'medium': return <ShieldAlert className="h-4 w-4 text-yellow-500" />;
      case 'low': return <Shield className="h-4 w-4 text-green-500" />;
      default: return null;
    }
  };
  
  const FormLabelWithRequired = ({ label, tooltip }: { label: string, tooltip?: string }) => (
    <div className="flex items-center gap-2">
      <FormLabel>
        {label} <span className="text-destructive">*</span>
      </FormLabel>
      {tooltip && <HelpTooltip>{tooltip}</HelpTooltip>}
    </div>
  );

  return (
    <Form {...form}>
       <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <ScrollArea className="h-[65vh] pr-6">
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="customerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabelWithRequired label="Nombre del Cliente" />
                    <FormControl>
                      <Input placeholder="Ej: Juan Pérez" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="customerEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email del Cliente</FormLabel>
                      <FormControl>
                        <Input placeholder="ejemplo@email.com" {...field} />
                      </FormControl>
                      <FormDescription>Se enviará una confirmación a este correo.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="customerPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teléfono del Cliente</FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="0991234567" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

               <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="customerOrigin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabelWithRequired label="Origen del Cliente" />
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar origen" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Llamada">Llamada</SelectItem>
                            <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                            <SelectItem value="Web">Página Web</SelectItem>
                            <SelectItem value="Email">Email</SelectItem>
                            <SelectItem value="Referido">Referido</SelectItem>
                            <SelectItem value="Otro">Otro</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="urgency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabelWithRequired label="Nivel de Urgencia" tooltip="Define la prioridad para atender este servicio. 'Alta' es para emergencias."/>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                               <div className="flex items-center gap-2">
                                {renderUrgencyIcon(form.getValues('urgency'))}
                                <SelectValue placeholder="Seleccione la urgencia" />
                              </div>
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <UrgencySelectItem value="high">
                               <div className="flex items-center gap-2">
                                <Zap className="h-4 w-4 text-red-500" /> Alta
                              </div>
                            </UrgencySelectItem>
                            <UrgencySelectItem value="medium">
                               <div className="flex items-center gap-2">
                                <ShieldAlert className="h-4 w-4 text-yellow-500" /> Media
                              </div>
                            </UrgencySelectItem>
                            <UrgencySelectItem value="low">
                               <div className="flex items-center gap-2">
                                <Shield className="h-4 w-4 text-green-500" /> Baja
                              </div>
                            </UrgencySelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
               </div>

              <FormField
                control={form.control}
                name="serviceType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabelWithRequired label="Tipo de Servicio" />
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione un tipo de servicio" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Plomería">Plomería</SelectItem>
                        <SelectItem value="Electricidad">Electricidad</SelectItem>
                        <SelectItem value="Albañilería">Albañilería</SelectItem>
                        <SelectItem value="Aire Acondicionado">Aire Acondicionado</SelectItem>
                        <SelectItem value="Otro">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabelWithRequired label="Dirección" tooltip="La ubicación donde se realizará el servicio. Sea lo más específico posible."/>
                    <FormControl>
                      <Input placeholder="Ej: Av. Amazonas y República, Quito" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="problemDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabelWithRequired label="Descripción del Problema" tooltip="Detalle lo que el cliente reporta. Esta información es crucial para el técnico." />
                    <FormControl>
                      <Textarea
                        placeholder="Describa el problema en detalle..."
                        className="resize-none"
                        rows={5}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

            </div>
          </ScrollArea>
          <div className="flex items-center justify-end gap-4 mt-6">
              <HelpTooltip>
                Al guardar, se creará una nueva solicitud con estado 'Pendiente'. El siguiente paso es crear una cotización para este servicio.
              </HelpTooltip>
              <Button type="submit" disabled={isLoading} className="text-lg py-6">
                {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                Crear Solicitud de Servicio
              </Button>
          </div>
      </form>
    </Form>
  );
}
