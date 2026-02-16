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
      // Step 1: Fetch Admin User (Simple query, no joins)
      const { data: adminData, error: adminError } = await supabase
        .from("admin_users")
        .select("*")
        .eq("id", userId)
        .single();

      if (adminError || !adminData) {
        console.error("Not an admin user", adminError);
        await supabase.auth.signOut();
        toast({
          title: "Access Denied",
          description: "You do not have administrative privileges.",
          variant: "destructive",
        });
        return;
      }

      // Step 2: Fetch Privileges separately to avoid 'PGRST200 relationship not found' errors
      let privileges: any[] = [];
      
      const { data: userPrivs, error: privsError } = await supabase
        .from("admin_user_privileges")
        .select("privilege_id")
        .eq("user_id", userId);

      if (userPrivs && userPrivs.length > 0) {
        const privIds = userPrivs.map(p => p.privilege_id);
        
        const { data: privDetails } = await supabase
          .from("admin_privileges")
          .select("id, name, description, category")
          .in("id", privIds);
          
        privileges = privDetails || [];
      }

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