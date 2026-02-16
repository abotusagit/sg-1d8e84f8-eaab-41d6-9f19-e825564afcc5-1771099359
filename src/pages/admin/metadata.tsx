import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Edit } from "lucide-react";
import { getMetaData, createMetaData, updateMetaData, deleteMetaData } from "@/services/adminService";
import { SEO } from "@/components/SEO";
import { useToast } from "@/hooks/use-toast";

const META_TABLES = [
  { id: "banned_countries", label: "Banned Countries" },
  { id: "banned_ip", label: "Banned IPs" },
  { id: "education", label: "Education" },
  { id: "height", label: "Height" },
  { id: "hobbies", label: "Hobbies" },
  { id: "religions", label: "Religions" },
  { id: "races", label: "Races" },
  { id: "occupations", label: "Occupations" },
];

export default function MetaDataManagement() {
  const { admin, isLoading: authLoading } = useAdminAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("education");
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [newItemName, setNewItemName] = useState("");

  useEffect(() => {
    if (activeTab) {
      loadData(activeTab);
    }
  }, [activeTab]);

  const loadData = async (table: string) => {
    setIsLoading(true);
    try {
      const items = await getMetaData(table as any);
      setData(items || []);
    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!newItemName) return;

    try {
      if (editingItem) {
        await updateMetaData(activeTab as any, editingItem.id, { name: newItemName });
        toast({ title: "Success", description: "Item updated successfully" });
      } else {
        const payload: any = { name: newItemName };
        // Specific fields for certain tables
        if (activeTab === 'banned_countries') {
           payload.country_code = newItemName.substring(0, 2).toUpperCase();
           payload.country_name = newItemName;
        } else if (activeTab === 'banned_ip') {
           payload.ip_address = newItemName;
        }

        await createMetaData(activeTab as any, payload);
        toast({ title: "Success", description: "Item created successfully" });
      }
      
      setIsDialogOpen(false);
      setEditingItem(null);
      setNewItemName("");
      loadData(activeTab);
    } catch (error) {
      console.error("Error saving:", error);
      toast({
        title: "Error",
        description: "Failed to save item",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    try {
      await deleteMetaData(activeTab as any, id);
      toast({ title: "Success", description: "Item deleted" });
      loadData(activeTab);
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete", variant: "destructive" });
    }
  };

  if (authLoading || !admin) return null;

  return (
    <>
      <SEO title="Meta Data Management - Marriagepal Admin" />
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold text-slate-900">Meta Data</h2>
              <p className="text-slate-600">Manage lookup tables and system configuration</p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => { setEditingItem(null); setNewItemName(""); }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add New
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingItem ? "Edit Item" : "Add New Item"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Name / Value</Label>
                    <Input 
                      value={newItemName}
                      onChange={(e) => setNewItemName(e.target.value)}
                      placeholder="Enter value..."
                    />
                  </div>
                  <Button onClick={handleSubmit} className="w-full">
                    {editingItem ? "Update" : "Create"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full justify-start flex-wrap h-auto gap-2 bg-transparent p-0">
              {META_TABLES.map((table) => (
                <TabsTrigger 
                  key={table.id} 
                  value={table.id}
                  className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white border border-slate-200 bg-white"
                >
                  {table.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <Card className="mt-6">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name / Value</TableHead>
                      <TableHead>Created At</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-8">Loading...</TableCell>
                      </TableRow>
                    ) : data.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-8 text-slate-500">No data found</TableCell>
                      </TableRow>
                    ) : (
                      data.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">
                            {item.name || item.country_name || item.ip_address || item.value}
                          </TableCell>
                          <TableCell>
                            {new Date(item.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="sm" onClick={() => {
                                setEditingItem(item);
                                setNewItemName(item.name || item.country_name || item.ip_address);
                                setIsDialogOpen(true);
                              }}>
                                <Edit className="w-4 h-4 text-slate-500" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)}>
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </Tabs>
        </div>
      </AdminLayout>
    </>
  );
}