import { useState, useEffect } from "react";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SEO } from "@/components/SEO";
import { useToast } from "@/hooks/use-toast";

export default function HelpDocuments() {
  const { admin, isLoading: authLoading } = useAdminAuth();
  const { toast } = useToast();
  const [docs, setDocs] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentDoc, setCurrentDoc] = useState<any>(null);
  
  // Form state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [isPublished, setIsPublished] = useState(false);

  useEffect(() => {
    loadDocs();
  }, []);

  const loadDocs = async () => {
    const { data } = await supabase.from("help_documents").select("*").order("updated_at", { ascending: false });
    setDocs(data || []);
  };

  const handleSave = async () => {
    try {
      if (currentDoc) {
        // Update existing - increment version
        const { error } = await supabase.from("help_documents").update({
          title, content, category, is_published: isPublished,
          version: currentDoc.version + 1,
          updated_at: new Date().toISOString()
        }).eq("id", currentDoc.id);
        if (error) throw error;
      } else {
        // Create new
        const { error } = await supabase.from("help_documents").insert({
          title, content, category, is_published: isPublished,
          created_by: admin!.id
        });
        if (error) throw error;
      }
      
      toast({ title: "Success", description: "Document saved successfully" });
      setIsDialogOpen(false);
      resetForm();
      loadDocs();
    } catch (error) {
      toast({ title: "Error", description: "Failed to save document", variant: "destructive" });
    }
  };

  const openEdit = (doc: any) => {
    setCurrentDoc(doc);
    setTitle(doc.title);
    setContent(doc.content);
    setCategory(doc.category);
    setIsPublished(doc.is_published);
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setCurrentDoc(null);
    setTitle("");
    setContent("");
    setCategory("");
    setIsPublished(false);
  };

  if (authLoading || !admin) return null;

  return (
    <>
      <SEO title="Help Documents - Marriagepal Admin" />
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold text-slate-900">Help Documents</h2>
              <p className="text-slate-600">Manage user guides and FAQs</p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Document
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle>{currentDoc ? "Edit Document" : "New Document"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Title</Label>
                      <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="How to verify profile..." />
                    </div>
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Getting Started" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Content (Markdown supported)</Label>
                    <Textarea 
                      value={content} 
                      onChange={(e) => setContent(e.target.value)} 
                      className="min-h-[300px] font-mono text-sm"
                      placeholder="# Guide Content..."
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      id="publish" 
                      checked={isPublished} 
                      onChange={(e) => setIsPublished(e.target.checked)}
                      className="rounded border-slate-300"
                    />
                    <Label htmlFor="publish">Publish immediately</Label>
                  </div>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleSave}>Save Document</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {docs.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell className="font-medium flex items-center gap-2">
                        <FileText className="w-4 h-4 text-slate-400" />
                        {doc.title}
                      </TableCell>
                      <TableCell>{doc.category}</TableCell>
                      <TableCell>v{doc.version}</TableCell>
                      <TableCell>
                        <Badge variant={doc.is_published ? "default" : "secondary"}>
                          {doc.is_published ? "Published" : "Draft"}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(doc.updated_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(doc)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {docs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                        No documents found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    </>
  );
}