import { ReactNode, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { Button } from "@/components/ui/button";
import {
  Users,
  Database,
  TestTube,
  CreditCard,
  MessageSquare,
  HelpCircle,
  FileText,
  Heart,
  BarChart3,
  Shield,
  LogOut,
  Menu,
  X,
  UserCheck,
  Ban,
  Globe,
  Briefcase,
  BookOpen,
} from "lucide-react";

interface AdminLayoutProps {
  children: ReactNode;
}

const menuItems = [
  { icon: Users, label: "User Search", href: "/admin/users" },
  { icon: Database, label: "Meta Data", href: "/admin/metadata" },
  { icon: TestTube, label: "Test Matching", href: "/admin/matching" },
  { icon: CreditCard, label: "Payments", href: "/admin/payments" },
  { icon: MessageSquare, label: "Global Messages", href: "/admin/messages" },
  { icon: HelpCircle, label: "Help & Support", href: "/admin/support" },
  { icon: FileText, label: "Help Documents", href: "/admin/documents" },
  { icon: Heart, label: "Marriage Registry", href: "/admin/registry" },
  { icon: BarChart3, label: "Reporting", href: "/admin/reports" },
  { icon: Shield, label: "Admin Privileges", href: "/admin/privileges" },
];

export function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const { admin, logout } = useAdminAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = async () => {
    await logout();
    router.push("/admin/login");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 hover:bg-slate-100 rounded-lg"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Marriagepal Admin</h1>
              <p className="text-sm text-slate-600">System Administration Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-slate-900">{admin?.email}</p>
              <p className="text-xs text-slate-600 capitalize">{admin?.role.replace("_", " ")}</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } fixed lg:static lg:translate-x-0 inset-y-0 left-0 z-30 w-64 bg-white border-r border-slate-200 transition-transform duration-300 ease-in-out mt-[73px] lg:mt-0`}
        >
          <nav className="p-4 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = router.pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}