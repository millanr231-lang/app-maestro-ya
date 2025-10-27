
'use client';

import {
  Activity,
  DollarSign,
  HardHat,
  Wrench,
  PlusCircle,
  AlertTriangle,
  BarChart2,
  Map,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { RecentServices } from '@/components/dashboard/recent-services';
import { NewServiceForm } from '@/components/dashboard/new-service-form';
import { useState, useEffect } from 'react';
import { useFirestore } from '@/firebase';
import { collection, onSnapshot, query, where, Timestamp } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import dynamic from 'next/dynamic';
import { useDashboard } from '@/app/dashboard/layout';
import { WorkflowGuide } from '@/components/dashboard/workflow-guide';

// Dynamically import the map component to ensure it's only loaded on the client-side
const TechnicianMap = dynamic(() => import('@/components/dashboard/technician-map'), { 
  ssr: false,
  loading: () => <Skeleton className="h-full w-full" />
});

const technicalRoles = ["Técnico", "Maestro", "Plomería", "Electricidad", "Albañilería", "Maestro General", "Aire Acondicionado", "Carpintería"];


const KpiSkeleton = () => (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Skeleton className="h-[126px] w-full" />
        <Skeleton className="h-[126px] w-full" />
        <Skeleton className="h-[126px] w-full" />
        <Skeleton className="h-[126px] w-full" />
    </div>
);


export function DashboardOverview() {
  const [isNewServiceDialogOpen, setIsNewServiceDialogOpen] = useState(false);
  const [kpiData, setKpiData] = useState({
    monthlyRevenue: { value: 0, change: 0 },
    activeServices: { value: 0, change: 0 },
    availableTechnicians: { value: 0, inService: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { userProfile } = useDashboard();

  const firestore = useFirestore();

  useEffect(() => {
    if (!firestore) {
        setError("No se pudo conectar a la base de datos.");
        setLoading(false);
        return;
    }

    setLoading(true);
    
    const servicesQuery = query(collection(firestore, 'serviceRequests'));
    const unsubscribeServices = onSnapshot(servicesQuery, (snapshot) => {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        const startOfPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfPreviousMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
        
        let currentMonthRevenue = 0;
        let previousMonthRevenue = 0;
        let activeServicesCount = 0;
        
        snapshot.forEach(doc => {
            const service = doc.data();

            if (service.payments && Array.isArray(service.payments)) {
                service.payments.forEach((payment: any) => {
                    if (!payment || typeof payment !== 'object' || !payment.paidAt?.toDate) {
                      return; // Skip invalid payment entries
                    }
                    const paymentDate = (payment.paidAt as Timestamp).toDate();
                    const amount = parseFloat(payment.amount) || 0;

                    if (paymentDate >= startOfMonth && paymentDate <= endOfMonth) {
                        currentMonthRevenue += amount;
                    } else if (paymentDate >= startOfPreviousMonth && paymentDate <= endOfPreviousMonth) {
                        previousMonthRevenue += amount;
                    }
                });
            }
            
            if (['pending', 'assigned', 'programado', 'en_ruta', 'en_progreso'].includes(service.status)) {
                activeServicesCount++;
            }
        });

        const revenueChange = previousMonthRevenue > 0 
            ? ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue * 100)
            : (currentMonthRevenue > 0 ? 100 : 0);
        
        setKpiData(prev => ({
            ...prev,
            monthlyRevenue: { value: currentMonthRevenue, change: revenueChange },
            activeServices: { value: activeServicesCount, change: 0 }, 
        }));
        setLoading(false);

    }, (err) => {
        console.error("Error fetching services:", err);
        setError("No se pudieron cargar los datos de los servicios.");
        setLoading(false);
    });

    const usersQuery = query(collection(firestore, 'users'), where('roles', 'array-contains-any', technicalRoles));
    const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
        let availableTechniciansCount = 0;
        let inServiceTechniciansCount = 0;
        snapshot.forEach(doc => {
            const tecnico = doc.data();
            if (tecnico.status === 'Disponible' || !tecnico.status) {
                availableTechniciansCount++;
            } else if (tecnico.status === 'En Servicio') {
                inServiceTechniciansCount++;
            }
        });

        setKpiData(prev => ({
            ...prev,
            availableTechnicians: { value: availableTechniciansCount, inService: inServiceTechniciansCount }
        }));
        setLoading(false);
    }, (err) => {
        console.error("Error fetching technicians:", err);
        setError("No se pudieron cargar los datos de los técnicos.");
        setLoading(false);
    });


    return () => {
        unsubscribeServices();
        unsubscribeUsers();
    };

  }, [firestore]);

  const handleNewServiceSuccess = () => {
    setIsNewServiceDialogOpen(false);
  };
  
  const canViewMap = userProfile?.roles.some(role => ['SuperAdmin', 'Gerente', 'Dispatcher'].includes(role));
  
  if (error) {
    return (
        <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error de Conexión</AlertTitle>
            <AlertDescription>
                {error} Por favor, revisa tu conexión y las reglas de Firestore.
            </AlertDescription>
        </Alert>
    );
  }

  return (
    <div className="flex flex-col gap-6">
       <WorkflowGuide onNewServiceClick={() => setIsNewServiceDialogOpen(true)} />
      <div className="flex items-center justify-between">
        <h1 className="font-headline text-3xl font-bold">Resumen General</h1>
        <Dialog open={isNewServiceDialogOpen} onOpenChange={setIsNewServiceDialogOpen}>
          <DialogTrigger asChild>
             <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Nuevo Servicio
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle>Crear Nueva Solicitud de Servicio</DialogTitle>
              <DialogDescription>
                Complete los detalles a continuación para registrar un nuevo servicio.
              </DialogDescription>
            </DialogHeader>
            <NewServiceForm onSuccess={handleNewServiceSuccess} />
          </DialogContent>
        </Dialog>
      </div>
      
      {loading ? (
        <KpiSkeleton />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            title="Ingresos del Mes"
            value={`$${kpiData.monthlyRevenue.value.toFixed(2)}`}
            change={`${kpiData.monthlyRevenue.change >= 0 ? '+' : ''}${kpiData.monthlyRevenue.change.toFixed(1)}% vs mes anterior`}
            icon={<DollarSign className="h-5 w-5 text-muted-foreground" />}
          />
          <KpiCard
            title="Servicios Activos"
            value={`${kpiData.activeServices.value}`}
            change="Pendientes, programados o en progreso"
            icon={<Wrench className="h-5 w-5 text-muted-foreground" />}
          />
          <KpiCard
            title="Técnicos Disponibles"
            value={`${kpiData.availableTechnicians.value}`}
            change={`${kpiData.availableTechnicians.inService} en servicio`}
            icon={<HardHat className="h-5 w-5 text-muted-foreground" />}
          />
          <KpiCard
            title="Satisfacción Cliente"
            value="N/D"
            change="Sin calificaciones registradas"
            icon={<Activity className="h-5 w-5 text-muted-foreground" />}
          />
        </div>
      )}
      
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-headline">Rendimiento</CardTitle>
            <CardDescription>Servicios completados este año.</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center h-[350px] text-center bg-muted/50 rounded-lg p-8">
             <div>
                <BarChart2 className="w-12 h-12 text-muted-foreground mx-auto mb-4"/>
                <h3 className="font-semibold text-lg">Gráfico en Desarrollo</h3>
                <p className="text-muted-foreground text-sm">Próximamente: Estadísticas de servicios mensuales.</p>
             </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Tracking de Técnicos</CardTitle>
            <CardDescription>Ubicación en tiempo real (simulación).</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px] p-0 rounded-b-lg overflow-hidden">
             <div className="flex h-full flex-col items-center justify-center rounded-lg bg-muted/50 p-8 text-center">
                <Map className="mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="text-lg font-semibold">Mapa en desarrollo</h3>
                <p className="text-sm text-muted-foreground">
                  Esta sección será activada al publicar.
                </p>
              </div>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Servicios Recientes</CardTitle>
          <CardDescription>
            Últimos servicios solicitados y su estado actual.
          </CardDescription>
        </CardHeader>
        <CardContent>
           <RecentServices />
        </CardContent>
      </Card>
    </div>
  );
}

    