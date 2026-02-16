import { useState } from "react";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Send, Users, User, Shield } from "lucide-react";
import { sendGlobalMessage } from "@/services/adminService";
import { SEO } from "@/components/SEO";
import { useToast } from "@/hooks/use-toast";

export default function GlobalMessages() {
  const { admin, isLoading: authLoading } = useAdminAuth();
  const { toast } = useToast();
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [targetType, setTargetType] = useState<"all" | "user" | "group">("all");
  const [targetId, setTargetId] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    if (!subject || !content) {
      toast({ title: "Validation Error", description: "Subject and content are required", variant: "destructive" });
      return;
    }

    if (targetType === "user" && !targetId) {
        toast({ title: "Validation Error", description: "User ID is required for single user messages", variant: "destructive" });
        return;
    }

    setIsSending(true);
    try {
      const targetIds = targetId ? [targetId] : [];
      await sendGlobalMessage(subject, content, targetType, targetIds, admin!.id);
      
      toast({ title: "Success", description: "Message sent successfully" });
      setSubject("");
      setContent("");
      setTargetId("");
    } catch (error) {
      console.error("Send error:", error);
      toast({ title: "Error", description: "Failed to send message", variant: "destructive" });
    } finally {
      setIsSending(false);
    }
  };

  if (authLoading || !admin) return null;

  return (
    <>
      <SEO title="Global Messages - Marriagepal Admin" />
      <AdminLayout>
        <div className="max-w-4xl mx-auto space-y-6">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">Global Messages</h2>
            <p className="text-slate-600">Broadcast updates and announcements to users</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Compose Message</CardTitle>
              <CardDescription>Send a new message to all users or specific groups</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label>Recipient Target</Label>
                <RadioGroup value={targetType} onValueChange={(v: any) => setTargetType(v)} className="flex flex-col space-y-2">
                  <div className="flex items-center space-x-2 border p-3 rounded-lg hover:bg-slate-50 cursor-pointer">
                    <RadioGroupItem value="all" id="all" />
                    <Label htmlFor="all" className="flex items-center cursor-pointer flex-1">
                      <Users className="w-4 h-4 mr-2 text-indigo-500" />
                      All Users
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 border p-3 rounded-lg hover:bg-slate-50 cursor-pointer">
                    <RadioGroupItem value="user" id="user" />
                    <Label htmlFor="user" className="flex items-center cursor-pointer flex-1">
                      <User className="w-4 h-4 mr-2 text-blue-500" />
                      Specific User
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 border p-3 rounded-lg hover:bg-slate-50 cursor-pointer">
                    <RadioGroupItem value="group" id="group" />
                    <Label htmlFor="group" className="flex items-center cursor-pointer flex-1">
                      <Shield className="w-4 h-4 mr-2 text-green-500" />
                      Premium Members Only
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {targetType === "user" && (
                <div className="space-y-2">
                  <Label>User ID / Email</Label>
                  <Input 
                    placeholder="Enter user ID..." 
                    value={targetId}
                    onChange={(e) => setTargetId(e.target.value)}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>Subject</Label>
                <Input 
                  placeholder="Message subject..." 
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Message Content</Label>
                <Textarea 
                  placeholder="Type your message here..." 
                  className="min-h-[200px]"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={handleSend} disabled={isSending} className="w-full sm:w-auto">
                  <Send className="w-4 h-4 mr-2" />
                  {isSending ? "Sending..." : "Send Message"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    </>
  );
}