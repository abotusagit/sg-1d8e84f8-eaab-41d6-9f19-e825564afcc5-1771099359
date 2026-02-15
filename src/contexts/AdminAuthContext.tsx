import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { AdminUser } from "@/types/admin";
import { supabase } from "@/integrations/supabase/client";
import { useRouter } from "next/router";
import { useToast } from "@/hooks/use-toast";

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
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    checkAuth();
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN') {
        if (session?.user) {
          await fetchAdminProfile(session.user.id, session.user.email!);
        }
      } else if (event === 'SIGNED_OUT') {
        setAdmin(null);
        router.push("/admin/login");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await fetchAdminProfile(session.user.id, session.user.email!);
      } else {
        setAdmin(null);
      }
    } catch (error) {
      console.error("Auth check failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAdminProfile = async (userId: string, email: string) => {
    try {
      // First check if user exists in admin_users table
      const { data: adminData, error } = await supabase
        .from("admin_users")
        .select(`
          *,
          admin_user_privileges (
            privilege:admin_privileges (
              id,
              name,
              description,
              category
            )
          )
        `)
        .eq("id", userId)
        .single();

      if (error || !adminData) {
        console.error("Not an admin user", error);
        await supabase.auth.signOut();
        toast({
          title: "Access Denied",
          description: "You do not have administrative privileges.",
          variant: "destructive",
        });
        return;
      }

      // Transform privileges data structure
      const privileges = adminData.admin_user_privileges?.map((p: any) => p.privilege) || [];

      setAdmin({
        id: adminData.id,
        email: adminData.email,
        role: adminData.role as "full_admin" | "custom_admin",
        privileges,
        created_at: adminData.created_at,
        last_login: adminData.last_login
      });
    } catch (error) {
      console.error("Error fetching admin profile:", error);
    }
  };

  const login = async (email: string, password: string, captchaToken: string) => {
    // Verify CAPTCHA here (backend verification recommended in production)
    if (captchaToken !== "10") { // Simple mock check for "7 + 3"
      throw new Error("Invalid CAPTCHA");
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setAdmin(null);
    router.push("/admin/login");
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