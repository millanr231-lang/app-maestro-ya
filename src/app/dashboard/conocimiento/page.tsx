
'use client';

import { useState } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, PlusCircle, BookOpen, Pencil, Trash2 } from "lucide-react";
import { useCollection, useFirestore, useUser } from "@/firebase";
import { addDoc, collection, serverTimestamp, Timestamp, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboard } from "../layout";
import { DeleteConfirmationDialog } from "@/components/dashboard/delete-confirmation-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface KnowledgeArticle {
    id: string;
    title: string;
    content: string;
    category?: string;
    author: string;
    authorName: string;
    createdAt: Timestamp;
    isPublished: boolean;
}

const TableSkeleton = () => (
    <div className="space-y-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
    </div>
);


export default function ConocimientoPage() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");

  const [editingArticle, setEditingArticle] = useState<KnowledgeArticle | null>(null);
  const [deletingArticle, setDeletingArticle] = useState<KnowledgeArticle | null>(null);
  
  const firestore = useFirestore();
  const { user } = useUser();
  const { userProfile } = useDashboard();
  const { toast } = useToast();
  
  const { data: articles, loading: loadingArticles } = useCollection<KnowledgeArticle>('knowledgeArticles');
  
  // DEBUG LOG
  console.log('🔍 Debug Base Conocimiento:', {
    loading: loadingArticles,
    articlesCount: articles?.length,
    articles: articles
  });
  
  const userRoles = userProfile?.roles || [];

  const handleAddArticle = async () => {
    if (!firestore || !user) {
        toast({ variant: "destructive", title: "Error", description: "Debes iniciar sesión para crear un artículo." });
        return;
    }
    if (newTitle.trim() && newContent.trim()) {
      setIsSubmitting(true);
      try {
        await addDoc(collection(firestore, 'knowledgeArticles'), {
            title: newTitle,
            content: newContent,
            category: "General",
            author: user.uid,
            authorName: user.displayName || "Usuario Anónimo",
            tags: [],
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            views: 0,
            isPublished: true,
        });

        toast({ title: "Artículo creado", description: "El nuevo artículo ha sido añadido a la base de conocimiento." });
        
        setNewTitle("");
        setNewContent("");
        setIsAddDialogOpen(false);

      } catch (error: any) {
        console.error("Error adding article:", error);
        toast({ variant: "destructive", title: "Error al crear", description: error.message });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleEditArticle = async () => {
    if (!firestore || !editingArticle) return;
    
    setIsSubmitting(true);
    try {
        const articleRef = doc(firestore, 'knowledgeArticles', editingArticle.id);
        await updateDoc(articleRef, {
            title: editingArticle.title,
            content: editingArticle.content,
            updatedAt: serverTimestamp(),
        });

        toast({ title: "Artículo Actualizado", description: "Los cambios han sido guardados." });
        setIsEditDialogOpen(false);
        setEditingArticle(null);

    } catch (error: any) {
        console.error("Error updating article:", error);
        toast({ variant: "destructive", title: "Error al actualizar", description: error.message });
    } finally {
        setIsSubmitting(false);
    }
  };
  
  const handleDeleteArticle = async () => {
    if (!firestore || !deletingArticle) return;
    
    setIsSubmitting(true);
    try {
        await deleteDoc(doc(firestore, 'knowledgeArticles', deletingArticle.id));
        toast({ title: "Artículo Eliminado" });
        setDeletingArticle(null);
    } catch (error: any) {
        console.error("Error deleting article:", error);
        toast({ variant: "destructive", title: "Error al eliminar", description: error.message });
    } finally {
        setIsSubmitting(false);
    }
  };

  const openEditDialog = (article: KnowledgeArticle) => {
    setEditingArticle(article);
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (article: KnowledgeArticle) => {
    setDeletingArticle(article);
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
              <CardTitle className="font-headline">Base de Conocimiento</CardTitle>
              <CardDescription>Instructivos, manuales y guías de capacitación.</CardDescription>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Nuevo Artículo
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Crear Nuevo Artículo</DialogTitle>
                <DialogDescription>
                  Añade un nuevo instructivo, guía o procedimiento a la base de conocimiento.
                </DialogDescription>
              </DialogHeader>
              <ScrollArea className="max-h-[70vh]">
                <div className="grid gap-4 py-4 pr-6">
                  <div className="grid gap-2">
                    <Label htmlFor="title">Título del Artículo</Label>
                    <Input
                      id="title"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="Ej: Cómo reemplazar un termostato"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="content">Contenido</Label>
                    <Textarea
                      id="content"
                      value={newContent}
                      onChange={(e) => setNewContent(e.target.value)}
                      placeholder="Describe los pasos, protocolos o información necesaria..."
                      rows={8}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </ScrollArea>
              <DialogFooter>
                  <DialogClose asChild>
                      <Button type="button" variant="outline" disabled={isSubmitting}>Cancelar</Button>
                  </DialogClose>
                  <Button type="button" onClick={handleAddArticle} disabled={isSubmitting}>
                      {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Guardar Artículo
                  </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {loadingArticles ? (
              <TableSkeleton />
          ) : articles && articles.length > 0 ? (
              <Accordion type="single" collapsible className="w-full">
                {articles.map(article => (
                  <AccordionItem value={article.id} key={article.id}>
                    <div className="flex items-center justify-between w-full group">
                      <AccordionTrigger className="flex-1 text-left pr-4">{article.title}</AccordionTrigger>
                      {(user?.uid === article.author || userRoles.includes('SuperAdmin')) && (
                          <div className="flex items-center gap-2 pr-4 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(article)}>
                                  <Pencil className="h-4 w-4" />
                                  <span className="sr-only">Editar Artículo</span>
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive" onClick={() => openDeleteDialog(article)}>
                                  <Trash2 className="h-4 w-4" />
                                  <span className="sr-only">Eliminar Artículo</span>
                              </Button>
                          </div>
                      )}
                    </div>
                    <AccordionContent className="prose dark:prose-invert max-w-none">
                      {article.content}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
          ) : (
              <div className="flex flex-col items-center justify-center h-48 text-center text-muted-foreground">
                  <BookOpen className="h-12 w-12 mb-4" />
                  <p className="font-semibold">Aún no hay artículos.</p>
                  <p className="text-sm">Crea el primer artículo para empezar a construir la base de conocimiento.</p>
              </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Editar Artículo</DialogTitle>
            <DialogDescription>
              Modifica el título y el contenido del artículo.
            </DialogDescription>
          </DialogHeader>
          {editingArticle && (
             <ScrollArea className="max-h-[70vh]">
              <div className="grid gap-4 py-4 pr-6">
                <div className="grid gap-2">
                  <Label htmlFor="edit-title">Título del Artículo</Label>
                  <Input
                    id="edit-title"
                    value={editingArticle.title}
                    onChange={(e) => setEditingArticle({ ...editingArticle, title: e.target.value })}
                    placeholder="Ej: Cómo reemplazar un termostato"
                    disabled={isSubmitting}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-content">Contenido</Label>
                  <Textarea
                    id="edit-content"
                    value={editingArticle.content}
                    onChange={(e) => setEditingArticle({ ...editingArticle, content: e.target.value })}
                    placeholder="Describe los pasos, protocolos o información necesaria..."
                    rows={8}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </ScrollArea>
          )}
          <DialogFooter>
              <DialogClose asChild>
                  <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={isSubmitting}>Cancelar</Button>
              </DialogClose>
              <Button type="button" onClick={handleEditArticle} disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Guardar Cambios
              </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        isOpen={!!deletingArticle}
        onClose={() => setDeletingArticle(null)}
        onConfirm={handleDeleteArticle}
        title="Eliminar Artículo"
        description={`¿Estás seguro de que quieres eliminar el artículo "${deletingArticle?.title}"? Esta acción no se puede deshacer.`}
        isLoading={isSubmitting}
      />
    </>
  );
}
