import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { SEO } from "@/components/SEO";
import { ShieldCheck, Loader2 } from "lucide-react";

export default function AdminSetup() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: ""
  });

  useEffect(() => {
    checkSetupStatus();
  }, []);

  const checkSetupStatus = async () => {
    try {
      // Check if any admin exists
      const { count, error } = await supabase
        .from("admin_users")
        .select("*", { count: "exact", head: true });

      if (error) throw error;

      if (count && count > 0) {
        // Admins already exist, redirect to login
        router.push("/admin/login");
      }
    } catch (error) {
      console.error("Setup check failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Sign up the user in Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("No user created");

      // 2. Insert into admin_users (allowed by bootstrap policy if table is empty)
      const { error: adminError } = await supabase
        .from("admin_users")
        .insert({
          id: authData.user.id,
          email: formData.email,
          role: "full_admin"
        });

      if (adminError) throw adminError;

      toast({
        title: "Setup Complete",
        description: "Initial admin account created. Redirecting to dashboard...",
      });

      // Give a moment for data propagation
      setTimeout(() => {
        router.push("/admin/dashboard");
      }, 1500);

    } catch (error: any) {
      console.error("Setup error:", error);
      toast({ 
        title: "Setup Failed", 
        description: error.message || "Could not create admin account", 
        variant: "destructive" 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <>
      <SEO title="Initial Admin Setup - Marriagepal" />
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto bg-indigo-100 w-12 h-12 rounded-full flex items-center justify-center mb-4">
              <ShieldCheck className="w-6 h-6 text-indigo-600" />
            </div>
            <CardTitle className="text-2xl">Admin Setup</CardTitle>
            <CardDescription>Create the first System Administrator account</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@marriagepal.com"
                  required
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm">Confirm Password</Label>
                <Input
                  id="confirm"
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Setting up...
                  </>
                ) : (
                  "Create Admin Account"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}