
'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Star, Loader2, UserX, ArrowRight } from "lucide-react";
import { useCollection, useFirestore } from '@/firebase';
import type { UserProfile } from '../layout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

// Define los roles que se consideran "técnicos"
const technicalRoles = ["Técnico", "Maestro", "Plomería", "Electricidad", "Albañilería", "Maestro General", "Aire Acondicionado", "Carpintería"];

export default function TecnicosPage() {
  const firestore = useFirestore();
  const usersCollectionPath = useMemo(() => firestore ? 'users' : null, [firestore]);
  const { data: users, loading } = useCollection<UserProfile>(usersCollectionPath);

  const technicians = useMemo(() => {
    if (!users) return [];
    // Filtra usuarios que tengan al menos uno de los roles técnicos
    return users.filter(user => 
      user.roles?.some(role => technicalRoles.includes(role))
    );
  }, [users]);
  
  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'T';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };
  
  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'Maestro':
        return 'bg-blue-500/20 text-blue-700 border-blue-500/30';
      case 'Técnico':
        return 'bg-purple-500/20 text-purple-700 border-purple-500/30';
      default:
        return 'outline';
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle className="font-headline">Gestión de Técnicos</CardTitle>
          <CardDescription>
            Para agregar un técnico, primero debe iniciar sesión en la app. Luego, asígnale un rol desde la gestión de roles.
          </CardDescription>
        </div>
        <Button asChild>
            <Link href="/dashboard/clientes">
                Administrar Roles <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        ) : technicians.length === 0 ? (
           <div className="flex flex-col items-center justify-center h-48 text-center text-muted-foreground">
              <UserX className="h-12 w-12 mb-4" />
              <p className="font-semibold">No se encontraron técnicos.</p>
              <p className="text-sm">Asegúrate de asignar un rol técnico a los usuarios correspondientes.</p>
            </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Estado (Próximamente)</TableHead>
                <TableHead className="text-right">Calificación (Próximamente)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {technicians.map((tech) => (
                <TableRow key={tech.uid}>
                   <TableCell>
                     <Link href={`/dashboard/tecnicos/${tech.uid}`} className="flex items-center gap-3 hover:underline">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={tech.photoURL || ''} alt={tech.displayName || 'Avatar'} />
                        <AvatarFallback>{getInitials(tech.displayName)}</AvatarFallback>
                      </Avatar>
                      <div className="font-medium">{tech.displayName}</div>
                    </Link>
                  </TableCell>
                  <TableCell>{tech.email}</TableCell>
                   <TableCell>
                    <Badge variant="outline" className={getRoleBadgeVariant(tech.roles?.[0] || 'Técnico')}>
                        {tech.roles?.[0] || 'Sin Rol'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-green-500/20 text-green-700 border-green-500/30">
                      Disponible
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right flex items-center justify-end gap-1 text-muted-foreground">
                    4.8 <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
