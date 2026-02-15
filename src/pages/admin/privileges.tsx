import { useState, useEffect } from "react";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Shield, UserPlus, Check } from "lucide-react";
import { getAdminUsers, grantPrivilege, revokePrivilege } from "@/services/adminService";
import { supabase } from "@/integrations/supabase/client";
import { SEO } from "@/components/SEO";
import { useToast } from "@/hooks/use-toast";

export default function PrivilegesPage() {
  const { admin, isLoading: authLoading } = useAdminAuth();
  const { toast } = useToast();
  
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [allPrivileges, setAllPrivileges] = useState<any[]>([]);
  const [selectedAdmin, setSelectedAdmin] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: users } = await getAdminUsers();
      setAdminUsers(users || []);
      
      const { data: privileges } = await supabase.from("admin_privileges").select("*").order("category");
      setAllPrivileges(privileges || []);
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  const handlePrivilegeToggle = async (privilegeId: string, isGranted: boolean) => {
    if (!selectedAdmin) return;
    
    try {
      if (isGranted) {
        await grantPrivilege(selectedAdmin.id, privilegeId);
      } else {
        await revokePrivilege(selectedAdmin.id, privilegeId);
      }
      
      // Refresh local state
      const updatedPrivileges = isGranted 
        ? [...selectedAdmin.admin_user_privileges, { privilege_id: privilegeId }]
        : selectedAdmin.admin_user_privileges.filter((p: any) => p.privilege_id !== privilegeId);
        
      setSelectedAdmin({ ...selectedAdmin, admin_user_privileges: updatedPrivileges });
      loadData(); // Reload full data
    } catch (error) {
      toast({ title: "Error", description: "Failed to update privilege", variant: "destructive" });
    }
  };

  const openPrivilegeDialog = (admin: any) => {
    setSelectedAdmin(admin);
    setIsDialogOpen(true);
  };

  if (authLoading || !admin) return null;

  // Group privileges by category
  const groupedPrivileges = allPrivileges.reduce((acc: any, curr: any) => {
    if (!acc[curr.category]) acc[curr.category] = [];
    acc[curr.category].push(curr);
    return acc;
  }, {});

  return (
    <>
      <SEO title="Admin Privileges - Marriagepal Admin" />
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold text-slate-900">Admin Privileges</h2>
              <p className="text-slate-600">Manage administrator access and roles</p>
            </div>
            <Button>
              <UserPlus className="w-4 h-4 mr-2" />
              Add Admin User
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Administrator Accounts</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Privileges</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {adminUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.email}</TableCell>
                      <TableCell>
                        <Badge variant={user.role === 'full_admin' ? 'default' : 'secondary'}>
                          {user.role === 'full_admin' ? 'Full Admin' : 'Custom'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.role === 'full_admin' ? (
                          <span className="text-slate-500 italic">All Access</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {user.admin_user_privileges?.map((p: any) => {
                              const priv = allPrivileges.find(ap => ap.id === p.privilege.id);
                              return (
                                <Badge key={p.privilege.id} variant="outline" className="text-xs">
                                  {priv?.name}
                                </Badge>
                              );
                            })}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
                      </TableCell>
                      <TableCell className="text-right">
                        {user.role !== 'full_admin' && (
                          <Button variant="ghost" size="sm" onClick={() => openPrivilegeDialog(user)}>
                            <Shield className="w-4 h-4 mr-2" />
                            Manage Access
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Manage Privileges: {selectedAdmin?.email}</DialogTitle>
              <DialogDescription>
                Select the privileges this admin user should have access to.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              {Object.entries(groupedPrivileges).map(([category, privileges]: [string, any]) => (
                <div key={category} className="space-y-3">
                  <h3 className="font-medium text-slate-900 capitalize border-b pb-2">{category}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {privileges.map((priv: any) => {
                      const hasPrivilege = selectedAdmin?.admin_user_privileges?.some(
                        (p: any) => p.privilege.id === priv.id
                      );
                      return (
                        <div key={priv.id} className="flex items-start space-x-2">
                          <Checkbox 
                            id={priv.id} 
                            checked={hasPrivilege} 
                            onCheckedChange={(c) => handlePrivilegeToggle(priv.id, c as boolean)}
                          />
                          <div className="grid gap-1.5 leading-none">
                            <Label htmlFor={priv.id} className="cursor-pointer font-medium">
                              {priv.name}
                            </Label>
                            <p className="text-xs text-slate-500">
                              {priv.description}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </AdminLayout>
    </>
  );
}