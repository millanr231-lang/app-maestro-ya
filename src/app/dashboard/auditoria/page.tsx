
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useFirestore } from "@/firebase";
import { collection, onSnapshot, query, orderBy, Timestamp, DocumentData } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { History, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ArrowRight } from 'lucide-react';
import { HelpTooltip } from '@/components/ui/help-tooltip';

interface AuditLog extends DocumentData {
    id: string;
    action: string;
    actorEmail: string;
    targetUserEmail: string;
    timestamp: Timestamp;
    details: {
        previousRoles: string[];
        newRoles: string[];
    };
}

const TableSkeleton = () => (
    <div className="space-y-2">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
    </div>
);

const actionTranslations: { [key: string]: string } = {
    'user.role.update': 'Cambio de Rol',
};

export default function AuditoriaPage() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const firestore = useFirestore();

    useEffect(() => {
        if (!firestore) return;

        setLoading(true);
        const logsQuery = query(collection(firestore, 'auditLogs'), orderBy('timestamp', 'desc'));
        
        const unsubscribe = onSnapshot(logsQuery, (snapshot) => {
            const logsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AuditLog));
            setLogs(logsData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching audit logs:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [firestore]);

    const formatDate = (timestamp: Timestamp | null) => {
        if (!timestamp?.toDate) return 'Fecha inválida';
        return format(timestamp.toDate(), 'dd/MM/yyyy, HH:mm:ss', { locale: es });
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="font-headline text-3xl flex items-center gap-2">
                            <History/> 
                            Registro de Auditoría
                            <HelpTooltip>
                                Aquí se registran automáticamente todas las acciones críticas, como cambios de roles. Esto asegura la trazabilidad y seguridad del sistema.
                            </HelpTooltip>
                        </CardTitle>
                        <CardDescription>
                            Historial de acciones críticas realizadas en el sistema, como cambios de roles.
                        </CardDescription>
                    </div>
                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input 
                          type="search" 
                          placeholder="Filtrar por email, acción..." 
                          className="pl-8"
                          disabled // Search functionality to be implemented
                        />
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {loading ? <TableSkeleton /> : (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Fecha</TableHead>
                                    <TableHead>Acción</TableHead>
                                    <TableHead>Administrador</TableHead>
                                    <TableHead>Usuario Afectado</TableHead>
                                    <TableHead>Detalles del Cambio</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {logs.map(log => (
                                    <TableRow key={log.id}>
                                        <TableCell className="text-sm text-muted-foreground">{formatDate(log.timestamp)}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{actionTranslations[log.action] || log.action}</Badge>
                                        </TableCell>
                                        <TableCell className="font-medium">{log.actorEmail}</TableCell>
                                        <TableCell className="font-medium text-primary">{log.targetUserEmail}</TableCell>
                                        <TableCell className="text-sm">
                                            <div className="flex items-center gap-2">
                                                <Badge variant="destructive" className="font-normal">{log.details.previousRoles.join(', ')}</Badge>
                                                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                                <Badge variant="default" className="bg-green-600/80">{log.details.newRoles.join(', ')}</Badge>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
                { !loading && logs.length === 0 && (
                     <div className="text-center py-12 text-muted-foreground">
                        <p>No hay registros de auditoría para mostrar.</p>
                        <p className="text-sm">Realiza un cambio de rol para ver el primer registro aquí.</p>
                     </div>
                )}
            </CardContent>
        </Card>
    );
}
