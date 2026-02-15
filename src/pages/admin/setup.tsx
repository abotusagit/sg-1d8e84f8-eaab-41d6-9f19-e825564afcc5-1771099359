import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/integrations/supabase/client";
import { SEO } from "@/components/SEO";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle, Shield } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function AdminSetup() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [hasAdmins, setHasAdmins] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkAdminUsers();
  }, []);

  const checkAdminUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("admin_users")
        .select("id")
        .limit(1);

      if (error) throw error;
      setHasAdmins(data && data.length > 0);
    } catch (err) {
      console.error("Error checking admin users:", err);
      setError("Failed to check admin status. Please try again.");
    } finally {
      setChecking(false);
    }
  };

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validation
    if (!email || !password || !confirmPassword) {
      setError("All fields are required");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    setLoading(true);

    try {
      // Try to sign up first
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      let userId = signUpData?.user?.id;

      // If user already exists, try to sign in instead
      if (signUpError?.message?.includes("already registered")) {
        console.log("User already exists, attempting sign in...");
        
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          setError("User already exists but password is incorrect. Please use the correct password or use a different email.");
          setLoading(false);
          return;
        }

        userId = signInData?.user?.id;
        console.log("Signed in existing user:", userId);
      } else if (signUpError) {
        throw signUpError;
      }

      if (!userId) {
        throw new Error("Failed to create or sign in user");
      }

      // Check if user is already an admin
      const { data: existingAdmin } = await supabase
        .from("admin_users")
        .select("id")
        .eq("id", userId)
        .single();

      if (existingAdmin) {
        setSuccess("You are already an admin! Redirecting to dashboard...");
        setTimeout(() => router.push("/admin/dashboard"), 2000);
        return;
      }

      // Add user to admin_users table
      const { error: adminError } = await supabase
        .from("admin_users")
        .insert({
          id: userId,
          email,
          role: "full_admin",
          is_active: true,
        });

      if (adminError) throw adminError;

      // Grant all privileges to the new admin
      const { data: privileges } = await supabase
        .from("admin_privileges")
        .select("id");

      if (privileges && privileges.length > 0) {
        const privilegeGrants = privileges.map(p => ({
          user_id: userId,
          privilege_id: p.id,
        }));

        await supabase
          .from("admin_user_privileges")
          .insert(privilegeGrants);
      }

      setSuccess("Admin account created successfully! Redirecting to dashboard...");
      setTimeout(() => router.push("/admin/dashboard"), 2000);

    } catch (err: any) {
      console.error("Setup error:", err);
      setError(err.message || "Failed to create admin account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <>
        <SEO title="Admin Setup - MarriagePal" />
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 p-4">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">Checking admin status...</p>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  if (hasAdmins) {
    return (
      <>
        <SEO title="Admin Setup - MarriagePal" />
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-6 w-6" />
                Setup Complete
              </CardTitle>
              <CardDescription>
                Admin users already exist in the system
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  The initial admin setup has already been completed. Please use the login page to access the admin panel.
                </AlertDescription>
              </Alert>
              <Button 
                onClick={() => router.push("/admin/login")}
                className="w-full"
              >
                Go to Login
              </Button>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <SEO title="Admin Setup - MarriagePal" />
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-6 w-6" />
              Initial Admin Setup
            </CardTitle>
            <CardDescription>
              Create the first administrator account for MarriagePal
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSetup} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="border-green-500 text-green-700">
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Admin Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@marriagepal.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter secure password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  minLength={8}
                />
                <p className="text-xs text-muted-foreground">
                  Minimum 8 characters
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  This will create a <strong>Full Administrator</strong> account with all privileges. Additional admins can be created from the Admin Privileges page.
                </AlertDescription>
              </Alert>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Creating Admin Account..." : "Create Admin Account"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}