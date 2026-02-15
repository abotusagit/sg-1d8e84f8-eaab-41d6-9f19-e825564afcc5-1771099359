import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Shield, CheckCircle2, AlertCircle } from "lucide-react";
import { SEO } from "@/components/SEO";

export default function AdminSetup() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    // Validation
    if (!email || !password || !confirmPassword) {
      setError("All fields are required");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      // Step 1: Create or sign in the user
      let userId: string;
      
      // Try signing up first
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) {
        if (signUpError.message.includes("already registered") || signUpError.message.includes("User already registered")) {
          // User exists, try signing in
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (signInError) {
            setError(`Authentication failed: ${signInError.message}`);
            setLoading(false);
            return;
          }

          userId = signInData.user!.id;
        } else {
          setError(`Sign up failed: ${signUpError.message}`);
          setLoading(false);
          return;
        }
      } else {
        userId = signUpData.user!.id;
      }

      // Step 2: Add user to admin_users table
      const { error: adminInsertError } = await supabase
        .from("admin_users")
        .insert({
          id: userId,
          email: email,
          role: "full_admin",
        });

      if (adminInsertError) {
        console.error("Admin insert error:", adminInsertError);
        
        // Check for specific error types
        if (adminInsertError.message.includes("duplicate") || 
            adminInsertError.code === "23505") {
          setError("This user is already an admin. Please use the login page.");
          await supabase.auth.signOut();
          setLoading(false);
          return;
        }
        
        if (adminInsertError.message.includes("policy") || 
            adminInsertError.message.includes("permission") ||
            adminInsertError.message.includes("privilege")) {
          setError("Admin setup is already complete. An admin user already exists. Please use the login page.");
          await supabase.auth.signOut();
          setLoading(false);
          return;
        }

        setError(`Failed to create admin user: ${adminInsertError.message}`);
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }

      // Step 3: Grant all privileges to the new admin
      const { data: privileges } = await supabase
        .from("admin_privileges")
        .select("id");

      if (privileges && privileges.length > 0) {
        const privilegeInserts = privileges.map(p => ({
          user_id: userId,
          privilege_id: p.id,
          granted_by: userId,
        }));

        const { error: privilegeError } = await supabase
          .from("admin_user_privileges")
          .insert(privilegeInserts);

        if (privilegeError) {
          console.error("Privilege grant error:", privilegeError);
          // Don't fail the setup if privilege grant fails, admin is still created
        }
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/admin/dashboard");
      }, 2000);

    } catch (err) {
      console.error("Setup error:", err);
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEO 
        title="Admin Setup - Marriagepal Admin"
        description="Create your first admin account for Marriagepal dating app administration"
      />
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <Shield className="h-6 w-6 text-purple-600" />
            </div>
            <CardTitle>Admin System Setup</CardTitle>
            <CardDescription>
              Create your first admin account to manage Marriagepal
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="mb-4 border-green-200 bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Admin account created successfully! Redirecting...
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSetup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Admin Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@marriagepal.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Minimum 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Admin Account...
                  </>
                ) : (
                  "Create Admin Account"
                )}
              </Button>

              <p className="text-sm text-center text-muted-foreground">
                This will create a Full Admin account with all privileges
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}