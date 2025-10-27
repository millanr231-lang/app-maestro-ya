
'use client';

import { useState, useMemo, useEffect } from "react";
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useFirestore } from "@/firebase";
import { QuoteDetails } from "@/components/dashboard/quote-details";
import { Loader2 } from "lucide-react";
import type { DocumentData, Timestamp } from "firebase/firestore";
import { collection, onSnapshot, query } from "firebase/firestore";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";


export interface QuoteItem {
    description: string;
    quantity: number;
    price: number;
}

export interface QuoteHistory {
    status: string;
    timestamp: string | Timestamp;
    actorId: string;
}

export type QuoteStatus = 'draft' | 'sent' | 'approved' | 'rejected' | 'expired';

export interface Quote extends DocumentData {
    id: string;
    serviceRequestId: string;
    customerName?: string; 
    totalAmount: number;
    status: QuoteStatus;
    technicianId: string;
    customerId: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
    validUntil: Timestamp;
    items: QuoteItem[];
    history: QuoteHistory[];
    generatedMessage?: string;
    customerPhone?: string;
    customerEmail?: string;
    serviceAddress?: string;
    problemDescription?: string;
    serviceType?: string;
    urgency?: 'low' | 'medium' | 'high';
}

const statusTranslations: Record<QuoteStatus, string> = {
  draft: 'Borrador',
  sent: 'Enviada',
  approved: 'Aprobada',
  rejected: 'Rechazada',
  expired: 'Vencida',
};

const statusOrder: QuoteStatus[] = ['draft', 'sent', 'approved', 'rejected', 'expired'];

const TableSkeleton = () => (
    <div className="space-y-2">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
    </div>
);


export default function CotizacionesPage() {
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [isDetailsSheetOpen, setIsDetailsSheetOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');

  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);

  const firestore = useFirestore();
  const { toast } = useToast();

  useEffect(() => {
    if (!firestore) return;

    setLoading(true);
    const quotesQuery = query(collection(firestore, 'quotes'));
    
    const unsubscribe = onSnapshot(quotesQuery, (snapshot) => {
      const quotesData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Quote));
      setQuotes(quotesData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching quotes:", error);
      toast({
        variant: "destructive",
        title: "Error de Carga",
        description: "No se pudieron cargar las cotizaciones. Revisa la consola para más detalles.",
      });
      setLoading(false);
    });

    return () => unsubscribe();
  }, [firestore, toast]);


  const filteredQuotes = useMemo(() => {
    if (!quotes) return [];
    const sortedQuotes = [...quotes].sort((a, b) => {
        const dateA = a.createdAt?.seconds ? new Date(a.createdAt.seconds * 1000) : new Date(0);
        const dateB = b.createdAt?.seconds ? new Date(b.createdAt.seconds * 1000) : new Date(0);
        return dateB.getTime() - dateA.getTime();
    });

    if (statusFilter === 'all') {
      return sortedQuotes;
    }
    return sortedQuotes.filter(quote => quote.status === statusFilter);
  }, [quotes, statusFilter]);

  const handleRowClick = (quote: Quote) => {
    setSelectedQuote(quote);
    setIsDetailsSheetOpen(true);
  };
  
  const getStatusBadgeVariant = (status: Quote['status']) => {
    switch (status) {
      case 'approved':
        return 'bg-green-500/20 text-green-700 border-green-500/30 hover:bg-green-500/30';
      case 'sent':
        return 'bg-blue-500/20 text-blue-700 border-blue-500/30 hover:bg-blue-500/30';
      case 'rejected':
        return 'bg-red-500/20 text-red-700 border-red-500/30 hover:bg-red-500/30';
      case 'draft':
        return 'bg-gray-500/20 text-gray-700 border-gray-500/30 hover:bg-gray-500/30';
      case 'expired':
        return 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30 hover:bg-yellow-500/30';
      default:
        return 'outline';
    }
  };
  
  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Fecha inválida';
    if (timestamp.toDate) {
      return timestamp.toDate().toLocaleDateString('es-ES');
    }
    try {
      return new Date(timestamp).toLocaleDateString('es-ES');
    } catch (e) {
      return 'Fecha inválida';
    }
  };


  return (
    <>
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Gestión de Cotizaciones</CardTitle>
            <CardDescription>Visualiza el estado de las cotizaciones. Para crear una nueva, ve a la página de Servicios.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full mb-4">
                <TabsList className="grid w-full grid-cols-6">
                    <TabsTrigger value="all">Todas</TabsTrigger>
                    {statusOrder.map(status => (
                        <TabsTrigger key={status} value={status}>{statusTranslations[status]}</TabsTrigger>
                    ))}
                </TabsList>
            </Tabs>
            {loading ? (
               <TableSkeleton />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID Cotización</TableHead>
                    <TableHead>ID Servicio</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredQuotes.map((quote) => (
                    <TableRow key={quote.id} onClick={() => handleRowClick(quote)} className="cursor-pointer">
                      <TableCell className="font-medium text-primary hover:underline">
                        {quote.id.substring(0, 7).toUpperCase()}
                      </TableCell>
                      <TableCell>
                        <Link href={`/dashboard/servicios/${quote.serviceRequestId}`} className="font-medium text-primary hover:underline" onClick={(e) => e.stopPropagation()}>
                            {quote.serviceRequestId.substring(0, 7).toUpperCase()}
                        </Link>
                      </TableCell>
                      <TableCell>{quote.customerName}</TableCell>
                      <TableCell>{formatDate(quote.createdAt)}</TableCell>
                      <TableCell>
                        <Badge className={getStatusBadgeVariant(quote.status)}>
                          {statusTranslations[quote.status] || quote.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">${quote.totalAmount.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
        
      <Sheet open={isDetailsSheetOpen} onOpenChange={setIsDetailsSheetOpen}>
        <SheetContent className="sm:max-w-3xl w-full overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Detalles de la Cotización - {selectedQuote?.id.substring(0,7).toUpperCase()}</SheetTitle>
             <SheetDescription>Revisa, gestiona y envía la cotización al cliente.</SheetDescription>
          </SheetHeader>
          {selectedQuote && (
            <QuoteDetails 
              quote={selectedQuote} 
              onUpdate={(updatedQuote) => {
                  setSelectedQuote(prev => prev ? {...prev, ...updatedQuote} : updatedQuote);
              }}
              onClose={() => setIsDetailsSheetOpen(false)}
            />
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
