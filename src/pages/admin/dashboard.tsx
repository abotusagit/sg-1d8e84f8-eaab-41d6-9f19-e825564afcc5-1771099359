import { useEffect } from "react";
import { useRouter } from "next/router";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, CreditCard, Heart, MessageSquare, TrendingUp, Activity } from "lucide-react";
import { SEO } from "@/components/SEO";

export default function AdminDashboard() {
  const router = useRouter();
  const { admin, isLoading } = useAdminAuth();

  useEffect(() => {
    if (!isLoading && !admin) {
      router.push("/admin/login");
    }
  }, [admin, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!admin) return null;

  const stats = [
    { label: "Total Users", value: "12,458", change: "+12.5%", icon: Users, color: "text-blue-600" },
    { label: "Active Users", value: "8,234", change: "+8.2%", icon: Activity, color: "text-green-600" },
    { label: "Revenue (MTD)", value: "$45,230", change: "+15.3%", icon: CreditCard, color: "text-purple-600" },
    { label: "Marriages", value: "342", change: "+5.7%", icon: Heart, color: "text-pink-600" },
    { label: "Support Tickets", value: "89", change: "-12.4%", icon: MessageSquare, color: "text-orange-600" },
    { label: "Conversion Rate", value: "3.8%", change: "+0.4%", icon: TrendingUp, color: "text-indigo-600" },
  ];

  return (
    <>
      <SEO
        title="Dashboard - Marriagepal Admin"
        description="Marriagepal admin dashboard overview"
      />
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">Dashboard</h2>
            <p className="text-slate-600 mt-1">Welcome back! Here's your system overview.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <Card key={stat.label}>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardDescription>{stat.label}</CardDescription>
                    <Icon className={`w-5 h-5 ${stat.color}`} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{stat.value}</div>
                    <p className={`text-sm mt-1 ${stat.change.startsWith("+") ? "text-green-600" : "text-red-600"}`}>
                      {stat.change} from last month
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest system events and actions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { action: "New user registration", user: "john.doe@example.com", time: "5 minutes ago" },
                    { action: "Payment received", user: "jane.smith@example.com", time: "12 minutes ago" },
                    { action: "Support ticket created", user: "mike.wilson@example.com", time: "23 minutes ago" },
                    { action: "Marriage registry updated", user: "Admin", time: "1 hour ago" },
                  ].map((activity, idx) => (
                    <div key={idx} className="flex items-start gap-3 pb-3 border-b border-slate-100 last:border-0">
                      <div className="w-2 h-2 bg-indigo-600 rounded-full mt-2" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-900">{activity.action}</p>
                        <p className="text-xs text-slate-600">{activity.user}</p>
                      </div>
                      <p className="text-xs text-slate-500">{activity.time}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Frequently used admin functions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Search Users", href: "/admin/users" },
                    { label: "View Payments", href: "/admin/payments" },
                    { label: "Support Tickets", href: "/admin/support" },
                    { label: "Send Message", href: "/admin/messages" },
                    { label: "Test Match", href: "/admin/matching" },
                    { label: "View Reports", href: "/admin/reports" },
                  ].map((action) => (
                    <button
                      key={action.label}
                      onClick={() => router.push(action.href)}
                      className="p-4 text-left border border-slate-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
                    >
                      <p className="text-sm font-medium text-slate-900">{action.label}</p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </AdminLayout>
    </>
  );
}