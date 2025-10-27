
'use client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFirestore } from "@/firebase";
import { collection, doc, onSnapshot, query, updateDoc, writeBatch, serverTimestamp } from "firebase/firestore";
import type { UserProfile } from "../layout";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { UserX, PlusCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AddUserForm } from "@/components/dashboard/add-user-form";
import { useDashboard } from "../layout";

const roles = ["SuperAdmin", "Gerente", "Dispatcher", "Técnico", "Cliente", "Maestro", "Auditor", "AdministradorClientes"];

const TableSkeleton = () => (
    <div className="space-y-2">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
    </div>
);


export default function ClientesPage() {
  const firestore = useFirestore();
  const { userProfile: adminProfile } = useDashboard();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);

  useEffect(() => {
    if (!firestore) return;

    setLoading(true);
    const usersQuery = query(collection(firestore, 'users'));
    
    const unsubscribe = onSnapshot(usersQuery, (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as UserProfile));
      setUsers(usersData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching users:", error);
      toast({
        variant: "destructive",
        title: "Error de Carga",
        description: "No se pudieron cargar los usuarios. Revisa la consola para más detalles.",
      });
      setLoading(false);
    });

    return () => unsubscribe();
  }, [firestore, toast]);


  const handleRoleChange = async (targetUser: UserProfile, newRole: string) => {
    if (!firestore || !adminProfile) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "No se puede completar la acción. Intenta de nuevo.",
        });
        return;
    }

    const previousRoles = targetUser.roles || [];
    
    // Use a batch write for an atomic operation.
    const batch = writeBatch(firestore);

    // 1. Update the user's role
    const userRef = doc(firestore, 'users', targetUser.uid);
    batch.update(userRef, { roles: [newRole] });

    // 2. Create an audit log entry
    const auditLogRef = doc(collection(firestore, 'auditLogs'));
    batch.set(auditLogRef, {
        action: 'user.role.update',
        actorId: adminProfile.uid,
        actorEmail: adminProfile.email,
        targetUserId: targetUser.uid,
        targetUserEmail: targetUser.email,
        timestamp: serverTimestamp(),
        details: {
            previousRoles: previousRoles,
            newRoles: [newRole],
        },
    });
    
    // 3. Create an email notification document for the "Trigger Email" extension.
    // This is part of the atomic batch, so the email is only sent if everything else succeeds.
    // This pattern (update, audit, notify) is excellent for critical transactions.
    if (targetUser.email) {
        const mailRef = doc(collection(firestore, 'mail'));
        batch.set(mailRef, {
            to: [targetUser.email],
            message: {
                subject: 'Actualización de Rol en MaestroYa CRM',
                html: `
                    <p>Hola ${targetUser.displayName || 'usuario'},</p>
                    <p>Te informamos que tu rol en la plataforma MaestroYa CRM ha sido actualizado.</p>
                    <p><b>Nuevo Rol Asignado:</b> ${newRole}</p>
                    <p>Este cambio fue realizado por el administrador ${adminProfile.displayName || adminProfile.email}.</p>
                    <p>Si tienes alguna pregunta, por favor, contacta a tu gerente o al soporte del sistema.</p>
                    <p>Gracias,<br/>El equipo de MaestroYa CRM</p>
                `,
            },
        });
    }

    try {
        await batch.commit();
        toast({
            title: "Operación Exitosa",
            description: `El rol de ${targetUser.displayName} se actualizó a ${newRole} y se envió una notificación.`,
        });
    } catch (error: any) {
        console.error("Error updating role and creating audit/email log:", error);
        toast({
            variant: "destructive",
            title: "Error en la Operación",
            description: "No se pudo actualizar el rol, registrar la auditoría o enviar la notificación.",
        });
    }
  };
  
  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="font-headline">Gestión de Clientes y Roles</CardTitle>
              <CardDescription>Visualiza y administra los roles de los usuarios del sistema.</CardDescription>
            </div>
             <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
              <DialogTrigger asChild>
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Agregar Usuario
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                  <DialogTitle>Agregar Nuevo Usuario</DialogTitle>
                  <DialogDescription>
                    Crea un nuevo perfil de cliente o técnico en el sistema.
                  </DialogDescription>
                </DialogHeader>
                <AddUserForm onSuccess={() => setIsAddUserOpen(false)} />
              </DialogContent>
            </Dialog>
        </CardHeader>
        <CardContent>
          {loading ? (
            <TableSkeleton />
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center text-muted-foreground">
               <UserX className="h-12 w-12 mb-4" />
               <p className="font-semibold">No se encontraron usuarios.</p>
               <p className="text-sm">Cuando un nuevo usuario inicie sesión, aparecerá aquí.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Rol Actual</TableHead>
                    <TableHead>Cambiar Rol</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.uid}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={user.photoURL || ''} alt={user.displayName || 'Avatar'} />
                            <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
                          </Avatar>
                          <div className="font-medium">{user.displayName || user.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <div className="font-medium text-primary">{user.roles && user.roles.length > 0 ? user.roles[0] : 'Sin rol'}</div>
                      </TableCell>
                      <TableCell>
                        <Select
                          defaultValue={user.roles && user.roles.length > 0 ? user.roles[0] : undefined}
                          onValueChange={(value) => handleRoleChange(user, value)}
                          disabled={user.uid === adminProfile?.uid} // Prevent admin from changing their own role
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Seleccionar rol" />
                          </SelectTrigger>
                          <SelectContent>
                            {roles.map(role => (
                              <SelectItem key={role} value={role}>{role}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
