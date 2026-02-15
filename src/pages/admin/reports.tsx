import { useState, useEffect } from "react";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Users, DollarSign, Activity, Map, Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SEO } from "@/components/SEO";

export default function ReportsPage() {
  const { admin, isLoading: authLoading } = useAdminAuth();
  const [stats, setStats] = useState<any>({
    totalUsers: 0,
    activeUsers: 0,
    premiumUsers: 0,
    totalRevenue: 0,
    usersByCountry: [],
    matchesCount: 0
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    // This would ideally be a single RPC call or Edge Function in production
    // for performance, but here we'll do individual queries
    
    // Total Users
    const { count: totalUsers } = await supabase.from("users").select("*", { count: "exact", head: true });
    
    // Active Users (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const { count: activeUsers } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .gte("last_login", thirtyDaysAgo.toISOString());

    // Premium Users
    const { count: premiumUsers } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .in("membership_type", ["premium", "vip"]);

    // Total Revenue
    const { data: payments } = await supabase
      .from("payments")
      .select("amount")
      .eq("status", "completed");
    
    const totalRevenue = payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

    // Matches
    const { count: matchesCount } = await supabase
      .from("matches")
      .select("*", { count: "exact", head: true });

    setStats({
      totalUsers: totalUsers || 0,
      activeUsers: activeUsers || 0,
      premiumUsers: premiumUsers || 0,
      totalRevenue,
      matchesCount: matchesCount || 0
    });
  };

  if (authLoading || !admin) return null;

  const StatCard = ({ title, value, icon: Icon, desc }: any) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between space-y-0 pb-2">
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <Icon className="h-4 w-4 text-slate-400" />
        </div>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-slate-500 mt-1">{desc}</p>
      </CardContent>
    </Card>
  );

  return (
    <>
      <SEO title="Reporting & Analytics - Marriagepal Admin" />
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold text-slate-900">Reporting</h2>
              <p className="text-slate-600">System analytics and performance metrics</p>
            </div>
            <div className="flex gap-2">
              <Select defaultValue="30d">
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 Days</SelectItem>
                  <SelectItem value="30d">Last 30 Days</SelectItem>
                  <SelectItem value="90d">Last 3 Months</SelectItem>
                  <SelectItem value="1y">Last Year</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline">Export Report</Button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard 
              title="Total Users" 
              value={stats.totalUsers} 
              icon={Users} 
              desc={`${((stats.activeUsers / stats.totalUsers) * 100).toFixed(1)}% active rate`} 
            />
            <StatCard 
              title="Premium Members" 
              value={stats.premiumUsers} 
              icon={Activity} 
              desc={`${((stats.premiumUsers / stats.totalUsers) * 100).toFixed(1)}% conversion`} 
            />
            <StatCard 
              title="Total Matches" 
              value={stats.matchesCount} 
              icon={Heart} 
              desc="Successful connections" 
            />
            <StatCard 
              title="Total Revenue" 
              value={`$${stats.totalRevenue.toLocaleString()}`} 
              icon={DollarSign} 
              desc="Lifetime revenue" 
            />
          </div>

          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="demographics">Demographics</TabsTrigger>
              <TabsTrigger value="financial">Financial</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>User Growth</CardTitle>
                  <CardDescription>New user registrations over time</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px] flex items-center justify-center text-slate-400">
                  <BarChart className="w-16 h-16 opacity-20 mr-4" />
                  <p>Chart visualization would be implemented with Recharts or similar library</p>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="demographics" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Users by Country</CardTitle>
                  </CardHeader>
                  <CardContent className="h-[300px] flex items-center justify-center text-slate-400">
                    <Map className="w-16 h-16 opacity-20" />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Membership Distribution</CardTitle>
                  </CardHeader>
                  <CardContent className="h-[300px] flex items-center justify-center text-slate-400">
                    <Users className="w-16 h-16 opacity-20" />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </AdminLayout>
    </>
  );
}