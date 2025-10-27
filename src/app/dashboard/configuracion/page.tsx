
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useDashboard } from '../layout';
import { Loader2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { useTheme } from 'next-themes';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';


const profileFormSchema = z.object({
  displayName: z.string().min(3, 'El nombre debe tener al menos 3 caracteres.'),
  email: z.string().email('Email no válido.').readonly(),
  phoneNumber: z.string().optional(),
});

const notificationsFormSchema = z.object({
  serviceUpdates: z.boolean().default(true),
  quoteUpdates: z.boolean().default(true),
  marketingEmails: z.boolean().default(false),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;
type NotificationsFormValues = z.infer<typeof notificationsFormSchema>;

const themes = [
    { name: 'orange', label: 'Naranja', color: 'hsl(26 100% 65%)' },
    { name: 'blue', label: 'Azul', color: 'hsl(212 100% 65%)' },
    { name: 'green', label: 'Verde', color: 'hsl(142 71% 45%)' },
    { name: 'rose', label: 'Rosa', color: 'hsl(346 77% 58%)' },
];

export default function ConfiguracionPage() {
  const { userProfile, loadingProfile } = useDashboard();
  const { toast } = useToast();
  const { theme, setTheme, systemTheme } = useTheme();
  
  // State for theme management
  const [mounted, setMounted] = useState(false);
  const [activeTheme, setActiveTheme] = useState('orange');

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    values: {
        displayName: userProfile?.displayName || '',
        email: userProfile?.email || '',
        phoneNumber: userProfile?.phoneNumber || '',
    }
  });

  const notificationsForm = useForm<NotificationsFormValues>({
    resolver: zodResolver(notificationsFormSchema),
    defaultValues: {
        serviceUpdates: true,
        quoteUpdates: true,
        marketingEmails: false,
    }
  });

  useEffect(() => {
    setMounted(true);
    // You would fetch and set the active theme from user preferences here
    // For now, it defaults to 'orange'
    const currentTheme = themes.find(t => document.body.classList.contains(`theme-${t.name}`));
    if (currentTheme) {
        setActiveTheme(currentTheme.name);
    } else {
        document.body.classList.add(`theme-orange`);
    }
  }, []);

  const onProfileSubmit = (data: ProfileFormValues) => {
    toast({
      title: 'Función en desarrollo',
      description: 'La actualización del perfil se habilitará en una futura versión.',
    });
  };

  const onNotificationsSubmit = (data: NotificationsFormValues) => {
    toast({
      title: 'Preferencias Guardadas (Simulación)',
      description: 'Tus preferencias de notificación han sido actualizadas.',
    });
  };

  const handleThemeChange = (themeName: string) => {
    document.body.classList.remove(...themes.map(t => `theme-${t.name}`));
    document.body.classList.add(`theme-${themeName}`);
    setActiveTheme(themeName);
    toast({
        title: 'Tema Actualizado',
        description: `El color del tema ha cambiado a ${themes.find(t => t.name === themeName)?.label}.`
    });
    // Here you would save the theme preference to Firestore/backend
  };
  
  if (loadingProfile || !mounted) {
    return (
        <div className="flex h-full w-full items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }

  const isDarkMode = theme === 'dark' || (theme === 'system' && systemTheme === 'dark');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-headline text-3xl font-bold">Configuración</h1>
        <p className="text-muted-foreground">Gestiona la configuración de tu cuenta y las preferencias de la plataforma.</p>
      </div>
      <Separator />
      <Tabs defaultValue="perfil" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="perfil">Perfil</TabsTrigger>
          <TabsTrigger value="apariencia">Apariencia</TabsTrigger>
          <TabsTrigger value="notificaciones">Notificaciones</TabsTrigger>
        </TabsList>
        
        <TabsContent value="perfil">
          <Card>
            <CardHeader>
              <CardTitle>Perfil de Usuario</CardTitle>
              <CardDescription>Actualiza tu información personal. El email no se puede cambiar.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-8">
                  <FormField
                    control={profileForm.control}
                    name="displayName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre Completo</FormLabel>
                        <FormControl><Input placeholder="Tu nombre" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={profileForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl><Input readOnly disabled {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <FormField
                    control={profileForm.control}
                    name="phoneNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número de Teléfono</FormLabel>
                        <FormControl><Input placeholder="Tu número de teléfono" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit">Guardar Cambios</Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="apariencia">
           <Card>
            <CardHeader>
              <CardTitle>Apariencia</CardTitle>
              <CardDescription>Personaliza la apariencia de la aplicación.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                        <Label className="text-base">Modo Oscuro</Label>
                        <p className="text-sm text-muted-foreground">Activa el modo oscuro para una experiencia visual diferente.</p>
                    </div>
                    <Switch
                        checked={isDarkMode}
                        onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                        aria-label="Toggle dark mode"
                    />
                </div>
                 <div className="rounded-lg border p-4">
                    <div className="space-y-0.5">
                        <Label className="text-base">Color del Tema</Label>
                         <p className="text-sm text-muted-foreground">Elige el color principal de la interfaz.</p>
                    </div>
                    <div className="flex items-center gap-4 mt-4">
                        {themes.map((t) => (
                           <Button
                            key={t.name}
                            variant="outline"
                            size="icon"
                            className={cn(
                                'h-10 w-10 rounded-full',
                                activeTheme === t.name && 'ring-2 ring-ring ring-offset-2 ring-offset-background'
                            )}
                            onClick={() => handleThemeChange(t.name)}
                            style={{ backgroundColor: t.color }}
                           >
                               {activeTheme === t.name && <Check className="h-5 w-5 text-white" />}
                               <span className="sr-only">{t.label}</span>
                           </Button>
                        ))}
                    </div>
                </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="notificaciones">
          <Card>
            <CardHeader>
              <CardTitle>Notificaciones</CardTitle>
              <CardDescription>Gestiona las notificaciones que recibes por correo electrónico.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...notificationsForm}>
                <form onSubmit={notificationsForm.handleSubmit(onNotificationsSubmit)} className="space-y-8">
                  <FormField
                    control={notificationsForm.control}
                    name="serviceUpdates"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <FormLabel className="text-base">Actualizaciones de Servicios</FormLabel>
                            <p className="text-sm text-muted-foreground">Recibe emails sobre cambios de estado en los servicios (asignado, completado, etc.).</p>
                        </div>
                        <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={notificationsForm.control}
                    name="quoteUpdates"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <FormLabel className="text-base">Actualizaciones de Cotizaciones</FormLabel>
                            <p className="text-sm text-muted-foreground">Recibe notificaciones cuando una cotización es aprobada o rechazada.</p>
                        </div>
                        <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={notificationsForm.control}
                    name="marketingEmails"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <FormLabel className="text-base">Noticias y Promociones</FormLabel>
                            <p className="text-sm text-muted-foreground">Recibe correos sobre nuevas funciones y ofertas especiales.</p>
                        </div>
                        <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                      </FormItem>
                    )}
                  />
                  <Button type="submit">Guardar Preferencias</Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

    