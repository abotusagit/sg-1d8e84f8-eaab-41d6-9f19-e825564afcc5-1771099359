import { useState, useEffect } from "react";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Edit, Gift, MapPin, Calendar } from "lucide-react";
import { getMarriageRegistries, updateMarriageRegistry } from "@/services/adminService";
import { SEO } from "@/components/SEO";
import { useToast } from "@/hooks/use-toast";

export default function RegistryPage() {
  const { admin, isLoading: authLoading } = useAdminAuth();
  const { toast } = useToast();
  const [registries, setRegistries] = useState<any[]>([]);
  const [selectedRegistry, setSelectedRegistry] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [giftSent, setGiftSent] = useState(false);

  useEffect(() => {
    loadRegistries();
  }, []);

  const loadRegistries = async () => {
    try {
      const { data } = await getMarriageRegistries();
      setRegistries(data || []);
    } catch (error) {
      console.error("Error loading registries:", error);
    }
  };

  const handleUpdate = async () => {
    if (!selectedRegistry) return;
    try {
      const { error } = await updateMarriageRegistry(selectedRegistry.id, {
        admin_notes: notes,
        gift_sent: giftSent
      });
      
      if (error) throw error;
      
      toast({ title: "Success", description: "Registry updated successfully" });
      setIsDialogOpen(false);
      loadRegistries();
    } catch (error) {
      toast({ title: "Error", description: "Update failed", variant: "destructive" });
    }
  };

  const openEditDialog = (registry: any) => {
    setSelectedRegistry(registry);
    setNotes(registry.admin_notes || "");
    setGiftSent(registry.gift_sent || false);
    setIsDialogOpen(true);
  };

  if (authLoading || !admin) return null;

  return (
    <>
      <SEO title="Marriage Registry - Marriagepal Admin" />
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">Marriage Registry</h2>
            <p className="text-slate-600">Manage wedding registries and gifts</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Registered Marriages</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Couple</TableHead>
                    <TableHead>Date & Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Gift Status</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {registries.map((reg) => (
                    <TableRow key={reg.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium text-indigo-600">{reg.user1?.username}</p>
                          <p className="text-xs text-slate-400">&</p>
                          <p className="font-medium text-pink-600">{reg.user2?.username}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center text-slate-600">
                            <Calendar className="w-3 h-3 mr-2" />
                            {new Date(reg.marriage_date).toLocaleDateString()}
                          </div>
                          <div className="flex items-center text-slate-600">
                            <MapPin className="w-3 h-3 mr-2" />
                            {reg.location}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">{reg.status}</Badge>
                      </TableCell>
                      <TableCell>
                        {reg.gift_sent ? (
                          <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">
                            <Gift className="w-3 h-3 mr-1" /> Sent
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Pending</Badge>
                        )}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-slate-500 text-sm">
                        {reg.admin_notes || "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(reg)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {registries.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                        No registries found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Registry</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex items-center space-x-2 border p-3 rounded-lg">
                <Checkbox 
                  id="gift" 
                  checked={giftSent} 
                  onCheckedChange={(c) => setGiftSent(c as boolean)} 
                />
                <Label htmlFor="gift" className="flex items-center cursor-pointer">
                  <Gift className="w-4 h-4 mr-2 text-pink-500" />
                  Marriage Gift Sent
                </Label>
              </div>
              <div className="space-y-2">
                <Label>Admin Notes</Label>
                <Textarea 
                  value={notes} 
                  onChange={(e) => setNotes(e.target.value)} 
                  placeholder="Internal notes about this registry..."
                  className="min-h-[100px]"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleUpdate}>Save Changes</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </AdminLayout>
    </>
  );
}