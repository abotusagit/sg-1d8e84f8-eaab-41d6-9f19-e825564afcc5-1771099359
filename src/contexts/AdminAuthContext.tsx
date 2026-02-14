import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { AdminUser } from "@/types/admin";

interface AdminAuthContextType {
  admin: AdminUser | null;
  isLoading: boolean;
  login: (email: string, password: string, captchaToken: string) => Promise<void>;
  logout: () => Promise<void>;
  hasPrivilege: (privilege: string) => boolean;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const stored = localStorage.getItem("admin_session");
      if (stored) {
        const session = JSON.parse(stored);
        setAdmin(session.admin);
      }
    } catch (error) {
      console.error("Auth check failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string, captchaToken: string) => {
    // TODO: Implement actual Supabase authentication
    // For now, mock authentication
    const mockAdmin: AdminUser = {
      id: "1",
      email,
      role: "full_admin",
      privileges: [],
      created_at: new Date().toISOString(),
    };
    
    setAdmin(mockAdmin);
    localStorage.setItem("admin_session", JSON.stringify({ admin: mockAdmin }));
  };

  const logout = async () => {
    setAdmin(null);
    localStorage.removeItem("admin_session");
  };

  const hasPrivilege = (privilege: string): boolean => {
    if (!admin) return false;
    if (admin.role === "full_admin") return true;
    return admin.privileges.some(p => p.name === privilege);
  };

  return (
    <AdminAuthContext.Provider value={{ admin, isLoading, login, logout, hasPrivilege }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error("useAdminAuth must be used within AdminAuthProvider");
  }
  return context;
}