
'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FilePlus, FileText, CalendarCheck, DollarSign, ArrowRight, Lightbulb } from 'lucide-react';
import { HelpTooltip } from '@/components/ui/help-tooltip';

interface WorkflowGuideProps {
    onNewServiceClick: () => void;
}

const steps = [
    {
        icon: <FilePlus className="w-8 h-8 text-primary" />,
        title: 'Paso 1: Registrar un Servicio',
        description: 'Todo comienza aquí. Recibe una llamada o un mensaje y crea una nueva solicitud de servicio en el sistema.',
        buttonText: 'Crear Servicio Ahora',
        isLink: false,
    },
    {
        icon: <FileText className="w-8 h-8 text-primary" />,
        title: 'Paso 2: Crear una Cotización',
        description: 'Una vez creado el servicio, ve a la lista de servicios y genera una cotización detallada para el cliente.',
        buttonText: 'Ir a Servicios',
        isLink: true,
        href: '/dashboard/servicios',
    },
    {
        icon: <CalendarCheck className="w-8 h-8 text-primary" />,
        title: 'Paso 3: Programar y Ejecutar',
        description: 'Con la cotización aprobada, asigna un técnico, programa la fecha y marca el trabajo como completado.',
        buttonText: 'Ir a Servicios',
        isLink: true,
        href: '/dashboard/servicios',
    },
    {
        icon: <DollarSign className="w-8 h-8 text-primary" />,
        title: 'Paso 4: Cerrar y Facturar',
        description: 'Una vez completado el trabajo, gestiona el cobro final, revisa la garantía y prepara la facturación.',
        buttonText: 'Ir a Facturación',
        isLink: true,
        href: '/dashboard/facturacion',
    },
];

export function WorkflowGuide({ onNewServiceClick }: WorkflowGuideProps) {
    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="font-headline text-2xl flex items-center gap-2">
                           <Lightbulb/>
                           Guía Rápida: ¿Por Dónde Empezar?
                        </CardTitle>
                        <CardDescription>
                            Sigue estos pasos para gestionar un servicio de principio a fin en MaestroYa CRM.
                        </CardDescription>
                    </div>
                     <HelpTooltip>
                        Esta guía te muestra el flujo de trabajo principal de la aplicación. Cada servicio que gestiones pasará por estas etapas.
                    </HelpTooltip>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {steps.map((step, index) => (
                        <Card key={index} className="flex flex-col">
                            <CardHeader className="flex-grow">
                                <div className="flex items-center gap-4">
                                    <div className="bg-primary/10 p-3 rounded-full">
                                        {step.icon}
                                    </div>
                                    <CardTitle>{step.title}</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-grow">
                                <p className="text-sm text-muted-foreground">{step.description}</p>
                            </CardContent>
                            <CardContent>
                                {step.isLink ? (
                                    <Button asChild className="w-full">
                                        <Link href={step.href!}>
                                            {step.buttonText} <ArrowRight className="ml-2 h-4 w-4" />
                                        </Link>
                                    </Button>
                                ) : (
                                    <Button onClick={onNewServiceClick} className="w-full">
                                        {step.buttonText} <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
