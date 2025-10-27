
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { KpiCard } from "@/components/ui/kpi-card";
import { DollarSign, Wrench, Users, BarChart2, Download, Filter, Search } from 'lucide-react';
import { ServiceChart, type MonthlyServices } from '@/components/dashboard/service-chart';
import { useFirestore } from '@/firebase';
import { collection, query, where, getDocs, Timestamp, onSnapshot } from 'firebase/firestore';
import { format, subMonths, startOfDay, endOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { ServiceRequest } from '@/lib/types';
import type { UserProfile } from '../layout';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import type { DateRange } from 'react-day-picker';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { HelpTooltip } from '@/components/ui/help-tooltip';

const technicalRoles = ["Técnico", "Maestro", "Plomería", "Electricidad", "Albañilería", "Maestro General", "Aire Acondicionado", "Carpintería"];

const statusTranslations: { [key: string]: string } = {
  pending: 'Pendiente',
  assigned: 'Asignado',
  scheduled: 'Programado',
  in_progress: 'En Progreso',
  en_ruta: 'En Ruta',
  completed: 'Completado',
  completado: 'Completado',
  cancelled: 'Cancelado',
};

interface ReportStats {
    totalRevenue: number;
    completedServices: number;
    averageTicket: number;
    uniqueCustomers: number;
}

const KpiSkeleton = () => (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Skeleton className="h-[126px] w-full" />
        <Skeleton className="h-[126px] w-full" />
        <Skeleton className="h-[126px] w-full" />
        <Skeleton className="h-[126px] w-full" />
    </div>
);

const ChartSkeleton = () => (
    <Skeleton className="h-[350px] w-full" />
);

const TableSkeleton = () => (
    <div className="space-y-2">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
    </div>
);

export default function ReportesPage() {
    const [allServices, setAllServices] = useState<ServiceRequest[]>([]);
    const [technicians, setTechnicians] = useState<UserProfile[]>([]);
    const [serviceTypes, setServiceTypes] = useState<string[]>([]);
    
    const [stats, setStats] = useState<ReportStats | null>(null);
    const [monthlyData, setMonthlyData] = useState<MonthlyServices[]>([]);
    const [loading, setLoading] = useState(true);
    const firestore = useFirestore();

    // FILTERS STATE
    const [dateRange, setDateRange] = useState<DateRange | undefined>({ from: subMonths(new Date(), 12), to: new Date() });
    const [selectedTechnician, setSelectedTechnician] = useState<string>('all');
    const [selectedServiceType, setSelectedServiceType] = useState<string>('all');
    const [locationFilter, setLocationFilter] = useState<string>('');

    // Initial data fetching
    useEffect(() => {
        if (!firestore) return;

        const fetchInitialData = async () => {
            setLoading(true);

            const servicesQuery = query(collection(firestore, 'serviceRequests'), where('status', 'in', ['completed', 'completado']));
            const servicesSnapshot = await getDocs(servicesQuery);
            const servicesData = servicesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ServiceRequest));
            setAllServices(servicesData);

            const techniciansQuery = query(collection(firestore, 'users'), where('roles', 'array-contains-any', technicalRoles));
            const techniciansSnapshot = await getDocs(techniciansQuery);
            const techniciansData = techniciansSnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile));
            setTechnicians(techniciansData);
            
            const uniqueTypes = [...new Set(servicesData.map(s => s.serviceType).filter(Boolean))];
            setServiceTypes(uniqueTypes);
            
            setLoading(false);
        };
        
        fetchInitialData();
    }, [firestore]);

    const filteredServices = useMemo(() => {
        return allServices
          .filter(service => {
            const completedAt = service.completedAt?.toDate();
            if (!completedAt) return false;

            const inDateRange = dateRange?.from && dateRange?.to ? 
                (completedAt >= startOfDay(dateRange.from) && completedAt <= endOfDay(dateRange.to)) : true;
            
            const matchesTechnician = selectedTechnician === 'all' || service.technicianId === selectedTechnician;
            const matchesServiceType = selectedServiceType === 'all' || service.serviceType === selectedServiceType;
            const matchesLocation = !locationFilter || service.location.toLowerCase().includes(locationFilter.toLowerCase());

            return inDateRange && matchesTechnician && matchesServiceType && matchesLocation;
          })
          .sort((a, b) => b.completedAt.toDate().getTime() - a.completedAt.toDate().getTime());
    }, [allServices, dateRange, selectedTechnician, selectedServiceType, locationFilter]);
    
    const technicianMap = useMemo(() => {
        return technicians.reduce((acc, tech) => {
            acc[tech.uid] = tech.displayName || tech.email;
            return acc;
        }, {} as Record<string, string>);
    }, [technicians]);


    useEffect(() => {
        if (loading) return;

        let totalRevenue = 0;
        const uniqueCustomers = new Set<string>();
        const monthlyBuckets: { [key: string]: { services: number; revenue: number } } = {};

        if (dateRange?.from) {
             let currentDate = new Date(dateRange.from);
             let endDate = dateRange.to || new Date();
             while (currentDate <= endDate) {
                const monthKey = format(currentDate, 'yyyy-MM');
                monthlyBuckets[monthKey] = { services: 0, revenue: 0 };
                currentDate.setMonth(currentDate.getMonth() + 1);
             }
        }
       
        filteredServices.forEach((service) => {
            const completedAt = service.completedAt.toDate();
            const amount = service.totalAmount || 0;
            totalRevenue += amount;
             
            if(service.customerId) {
                uniqueCustomers.add(service.customerId);
            }

            const monthKey = format(completedAt, 'yyyy-MM');
            if(monthlyBuckets[monthKey]) {
                 monthlyBuckets[monthKey].services += 1;
                 monthlyBuckets[monthKey].revenue += amount;
            }
        });

        setStats({
            totalRevenue,
            completedServices: filteredServices.length,
            averageTicket: filteredServices.length > 0 ? totalRevenue / filteredServices.length : 0,
            uniqueCustomers: uniqueCustomers.size,
        });

        const chartData = Object.entries(monthlyBuckets)
            .map(([monthKey, data]) => ({
                month: format(new Date(monthKey + '-02'), 'MMM', { locale: es }), 
                services: data.services,
            }))
            .sort((a,b) => new Date(a.month).getMonth() - new Date(b.month).getMonth());

        setMonthlyData(chartData);

    }, [filteredServices, loading, dateRange]);
    
    const exportToCSV = () => {
        const headers = ['Cliente', 'Técnico', 'Tipo Servicio', 'Monto', 'Estado', 'Fecha'];
        const rows = filteredServices.map(service => [
            `"${service.customerName.replace(/"/g, '""')}"`,
            `"${technicianMap[service.technicianId || ''] || 'No asignado'}"`,
            service.serviceType,
            service.totalAmount,
            statusTranslations[service.status] || service.status,
            service.completedAt.toDate().toLocaleDateString('es-ES')
        ]);
      
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');
      
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (link.href) {
            URL.revokeObjectURL(link.href);
        }
        link.href = URL.createObjectURL(blob);
        link.download = `reportes-maestroya-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="flex flex-col gap-6">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline text-3xl">Reportes y Analíticas</CardTitle>
                    <CardDescription>Visualiza el rendimiento de tu negocio y obtén insights clave.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-col md:flex-row gap-4 p-4 border rounded-lg bg-muted/50">
                        <h3 className="font-semibold flex items-center gap-2 shrink-0"><Filter className="w-5 h-5"/> Filtros</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 flex-1">
                            <DateRangePicker date={dateRange} onDateChange={setDateRange} />
                            <Select value={selectedTechnician} onValueChange={setSelectedTechnician}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Técnico" />
                                </SelectTrigger>
                                 <SelectContent>
                                    <SelectItem value="all">Todos los técnicos</SelectItem>
                                    {technicians.map(tech => (
                                        <SelectItem key={tech.uid} value={tech.uid}>{tech.displayName}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select value={selectedServiceType} onValueChange={setSelectedServiceType}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Tipo de Servicio" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos los servicios</SelectItem>
                                    {serviceTypes.map(type => (
                                        <SelectItem key={type} value={type}>{type}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                             <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input 
                                  type="search" 
                                  placeholder="Buscar por zona/barrio..." 
                                  className="pl-8"
                                  value={locationFilter}
                                  onChange={(e) => setLocationFilter(e.target.value)}
                                />
                             </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {loading ? <KpiSkeleton /> : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <KpiCard
                        title="Ingresos Totales (período)"
                        value={`$${(stats?.totalRevenue || 0).toFixed(2)}`}
                        change="Total facturado de servicios completados"
                        icon={<DollarSign />}
                    />
                    <KpiCard
                        title="Servicios Completados (período)"
                        value={`${stats?.completedServices || 0}`}
                        change="Total de servicios finalizados"
                        icon={<Wrench />}
                    />
                    <KpiCard
                        title="Ticket Promedio"
                        value={`$${(stats?.averageTicket || 0).toFixed(2)}`}
                        change="Valor promedio por servicio completado"
                        icon={<BarChart2 />}
                    />
                    <KpiCard
                        title="Clientes Atendidos (período)"
                        value={`${stats?.uniqueCustomers || 0}`}
                        change="Número de clientes únicos"
                        icon={<Users />}
                    />
                </div>
            )}
            
            <Card className="lg:col-span-2">
                <CardHeader>
                    <div className="flex items-center gap-2">
                      <CardTitle className="font-headline">Rendimiento Mensual</CardTitle>
                      <HelpTooltip>Este gráfico muestra la cantidad de servicios completados cada mes, según los filtros aplicados.</HelpTooltip>
                    </div>
                    <CardDescription>Servicios completados en el período seleccionado.</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? <ChartSkeleton /> : <ServiceChart data={monthlyData} />}
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="font-headline">Resumen de Datos</CardTitle>
                    <CardDescription>Datos detallados del período seleccionado.</CardDescription>
                  </div>
                  <Button variant="outline" onClick={exportToCSV} disabled={loading || filteredServices.length === 0}>
                    <Download className="mr-2 h-4 w-4" />
                    Exportar a CSV
                  </Button>
                </CardHeader>
                <CardContent>
                   {loading ? <TableSkeleton /> : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Cliente</TableHead>
                            <TableHead>Técnico</TableHead>
                            <TableHead>Tipo Servicio</TableHead>
                            <TableHead className="text-right">Monto</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead>Fecha</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredServices.slice(0, 50).map((service) => (
                            <TableRow key={service.id}>
                              <TableCell className="font-medium">{service.customerName}</TableCell>
                              <TableCell>{technicianMap[service.technicianId || ''] || 'No asignado'}</TableCell>
                              <TableCell>{service.serviceType}</TableCell>
                              <TableCell className="text-right">${(service.totalAmount || 0).toFixed(2)}</TableCell>
                              <TableCell>
                                <Badge variant={service.status === 'completed' || service.status === 'completado' ? 'default' : 'secondary'}>
                                   {statusTranslations[service.status] || service.status}
                                </Badge>
                              </TableCell>
                              <TableCell>{service.completedAt.toDate().toLocaleDateString('es-ES')}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                   )}
                </CardContent>
            </Card>
        </div>
    );
}
