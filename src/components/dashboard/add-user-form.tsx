
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useFirestore } from '@/firebase';
import { collection, serverTimestamp, query, where, getDocs, doc, setDoc } from 'firebase/firestore';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
import { HelpTooltip } from '../ui/help-tooltip';

const userSchema = z.object({
  userType: z.enum(['Cliente', 'Técnico']),
  // Personal Info
  displayName: z.string().min(3, 'El nombre debe tener al menos 3 caracteres.'),
  email: z.string().email('Por favor, introduce un email válido.'),
  phoneNumber: z.string().min(7, 'El teléfono debe tener al menos 7 dígitos.'),
  
  // Technician-specific fields
  specialty: z.string().optional(),
  initialStatus: z.enum(['available', 'unavailable']).default('available'),
  idNumber: z.string().optional(),
  
  // Client-specific fields
  address: z.string().optional(),
  customerOrigin: z.string().optional(),
  notes: z.string().optional(),
  photo: z.any().optional(),

}).refine(data => {
    if (data.userType === 'Técnico' && !data.specialty) {
        return false;
    }
    return true;
}, {
    message: "La especialidad es requerida para un técnico.",
    path: ["specialty"],
});

type UserFormValues = z.infer<typeof userSchema>;

interface AddUserFormProps {
  onSuccess?: () => void;
}

const FormLabelWithRequired = ({ label, tooltip }: { label: string, tooltip?: string }) => (
  <div className="flex items-center gap-2">
    <FormLabel>{label} <span className="text-destructive">*</span></FormLabel>
    {tooltip && <HelpTooltip>{tooltip}</HelpTooltip>}
  </div>
);

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <>
    <h3 className="text-lg font-semibold mt-4 pt-4 border-t">{children}</h3>
    <Separator className="mb-4" />
  </>
);


export function AddUserForm({ onSuccess }: AddUserFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      userType: 'Cliente',
      displayName: '',
      email: '',
      phoneNumber: '',
      specialty: 'Plomería',
      initialStatus: 'available',
      idNumber: '',
      address: '',
      customerOrigin: 'Llamada',
      notes: '',
    },
  });

  const userType = form.watch('userType');

  async function onSubmit(values: UserFormValues) {
    if (!firestore) {
      toast({ variant: 'destructive', title: 'Error de conexión' });
      return;
    }
    setIsLoading(true);

    try {
      const usersRef = collection(firestore, 'users');
      const q = query(usersRef, where('email', '==', values.email));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        toast({
          variant: 'destructive',
          title: 'Email ya registrado',
          description: 'Este email ya está en uso. Por favor, utiliza otro.',
        });
        setIsLoading(false);
        return;
      }
      
      const newUid = doc(collection(firestore, 'users')).id;

      let userData: any = {
        uid: newUid,
        displayName: values.displayName,
        email: values.email,
        phoneNumber: values.phoneNumber,
        notes: values.notes || '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        photoURL: null, // Placeholder for photo upload logic
      };

      if (values.userType === 'Técnico') {
        userData = {
          ...userData,
          roles: [values.specialty], // Role is the specialty itself e.g., "Plomería"
          specialty: values.specialty,
          status: values.initialStatus,
          rating: 5.0,
          idNumber: values.idNumber || '',
        };
      } else { // Cliente
        userData = {
          ...userData,
          roles: ['Cliente'],
          address: values.address || '',
          customerOrigin: values.customerOrigin,
        };
      }
      
      await setDoc(doc(firestore, 'users', newUid), userData);
      
      toast({
        title: `${values.userType} creado exitosamente`,
        description: `El perfil para ${values.displayName} ha sido creado.`,
      });

      form.reset();
      if (onSuccess) {
        onSuccess();
      }

    } catch (error: any) {
      console.error('Error creando usuario:', error);
      toast({
        variant: 'destructive',
        title: 'Error al crear usuario',
        description: error.message || 'No se pudo crear el usuario.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <ScrollArea className="h-[65vh] pr-6">
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="userType"
              render={({ field }) => (
                <FormItem>
                  <FormLabelWithRequired 
                    label="Tipo de Usuario"
                    tooltip="'Cliente' es para quienes reciben servicios. 'Técnico' es para el personal que realiza los trabajos."
                  />
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="Cliente">Cliente</SelectItem>
                      <SelectItem value="Técnico">Técnico/Maestro</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <SectionTitle>Información Personal</SectionTitle>

            <FormField control={form.control} name="displayName" render={({ field }) => (
                <FormItem><FormLabelWithRequired label="Nombre Completo" /><FormControl><Input placeholder="Ej: Maria Rivas" {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
            
            <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem><FormLabelWithRequired label="Email" tooltip="Este email se usará para notificaciones. Debe ser único." /><FormControl><Input placeholder="usuario@email.com" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="phoneNumber" render={({ field }) => (
                    <FormItem><FormLabelWithRequired label="Teléfono" /><FormControl><Input type="tel" placeholder="0987654321" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
            </div>

            {userType === 'Técnico' && (
              <>
                <SectionTitle>Información Profesional</SectionTitle>
                <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="specialty" render={({ field }) => (
                        <FormItem><FormLabelWithRequired label="Especialidad" tooltip="Esta será la habilidad principal del técnico y se usará como su 'rol' en el sistema." /><Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                            <SelectContent>
                                <SelectItem value="Plomería">Plomería</SelectItem>
                                <SelectItem value="Electricidad">Electricidad</SelectItem>
                                <SelectItem value="Albañilería">Albañilería</SelectItem>
                                <SelectItem value="Maestro General">Maestro General</SelectItem>
                                <SelectItem value="Aire Acondicionado">Aire Acondicionado</SelectItem>
                                <SelectItem value="Carpintería">Carpintería</SelectItem>
                            </SelectContent>
                        </Select><FormMessage /></FormItem>
                    )}/>
                     <FormField control={form.control} name="initialStatus" render={({ field }) => (
                        <FormItem><FormLabelWithRequired label="Estado Inicial" /><Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                            <SelectContent>
                                <SelectItem value="available">Disponible</SelectItem>
                                <SelectItem value="unavailable">No Disponible</SelectItem>
                            </SelectContent>
                        </Select><FormMessage /></FormItem>
                    )}/>
                </div>
                 <SectionTitle>Documentación (Opcional)</SectionTitle>
                 <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="idNumber" render={({ field }) => (
                        <FormItem><FormLabel>Número de Cédula</FormLabel><FormControl><Input placeholder="1712345678" {...field} /></FormControl></FormItem>
                    )}/>
                     <FormField control={form.control} name="photo" render={({ field }) => (
                        <FormItem><FormLabel>Foto de Perfil</FormLabel><FormControl><Input type="file" accept="image/*" /></FormControl></FormItem>
                    )}/>
                 </div>
              </>
            )}

            {userType === 'Cliente' && (
              <>
                <SectionTitle>Información de Cliente</SectionTitle>
                <FormField control={form.control} name="address" render={({ field }) => (
                    <FormItem><FormLabel>Dirección</FormLabel><FormControl><Input placeholder="Av. Principal 123, Quito" {...field} /></FormControl></FormItem>
                )}/>
                 <FormField control={form.control} name="customerOrigin" render={({ field }) => (
                    <FormItem><FormLabelWithRequired label="Origen del Cliente" tooltip="¿Cómo llegó este cliente a nosotros? Útil para reportes." /><Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                            <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                            <SelectItem value="Llamada">Llamada Telefónica</SelectItem>
                            <SelectItem value="Referido">Referido</SelectItem>
                            <SelectItem value="Redes Sociales">Redes Sociales</SelectItem>
                             <SelectItem value="Sitio Web">Sitio Web</SelectItem>
                            <SelectItem value="Otro">Otro</SelectItem>
                        </SelectContent>
                    </Select><FormMessage /></FormItem>
                )}/>
              </>
            )}

            <SectionTitle>Notas Adicionales (Opcional)</SectionTitle>
             <FormField control={form.control} name="notes" render={({ field }) => (
                <FormItem><FormControl><Textarea placeholder="Información adicional relevante sobre este usuario..." {...field} /></FormControl></FormItem>
            )}/>

          </div>
        </ScrollArea>
        <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onSuccess}>Cancelar</Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Crear Usuario
            </Button>
        </div>
      </form>
    </Form>
  );
}
