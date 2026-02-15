import { useState, useEffect } from "react";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, CheckCircle, XCircle, Clock } from "lucide-react";
import { getSupportTickets, updateTicketStatus, addTicketResponse } from "@/services/adminService";
import { SEO } from "@/components/SEO";
import { useToast } from "@/hooks/use-toast";

export default function SupportPage() {
  const { admin, isLoading: authLoading } = useAdminAuth();
  const { toast } = useToast();
  const [tickets, setTickets] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [response, setResponse] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  useEffect(() => {
    loadTickets();
  }, [filterStatus]);

  const loadTickets = async () => {
    try {
      const status = filterStatus === "all" ? undefined : filterStatus;
      const { data } = await getSupportTickets(status);
      setTickets(data || []);
    } catch (error) {
      console.error("Error loading tickets:", error);
    }
  };

  const handleStatusUpdate = async (ticketId: string, newStatus: any) => {
    try {
      const { error } = await updateTicketStatus(ticketId, newStatus);
      if (error) throw error;
      toast({ title: "Success", description: "Ticket status updated" });
      loadTickets();
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket({ ...selectedTicket, status: newStatus });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
    }
  };

  const handleSendResponse = async () => {
    if (!response || !selectedTicket) return;
    try {
      const { error } = await addTicketResponse(selectedTicket.id, admin!.id, response);
      if (error) throw error;
      toast({ title: "Success", description: "Response sent" });
      setResponse("");
      loadTickets();
      // Refresh selected ticket to show new response
      const { data } = await getSupportTickets();
      const updated = data?.find((t: any) => t.id === selectedTicket.id);
      if (updated) setSelectedTicket(updated);
    } catch (error) {
      toast({ title: "Error", description: "Failed to send response", variant: "destructive" });
    }
  };

  if (authLoading || !admin) return null;

  return (
    <>
      <SEO title="Support Tickets - Marriagepal Admin" />
      <AdminLayout>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-140px)]">
          {/* Ticket List */}
          <Card className="lg:col-span-1 flex flex-col h-full">
            <CardHeader>
              <CardTitle>Support Tickets</CardTitle>
              <div className="pt-2">
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tickets</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-0">
              <div className="divide-y divide-slate-100">
                {tickets.map((ticket) => (
                  <button
                    key={ticket.id}
                    onClick={() => setSelectedTicket(ticket)}
                    className={`w-full text-left p-4 hover:bg-slate-50 transition-colors ${
                      selectedTicket?.id === ticket.id ? "bg-indigo-50 border-l-4 border-indigo-500" : ""
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-medium text-slate-900 truncate max-w-[70%]">{ticket.subject}</span>
                      <Badge variant={
                        ticket.status === 'open' ? 'destructive' : 
                        ticket.status === 'resolved' ? 'default' : 'secondary'
                      } className="text-xs capitalize">
                        {ticket.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-500 truncate">{ticket.description}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
                      <span>{ticket.users?.email}</span>
                      <span>•</span>
                      <span>{new Date(ticket.created_at).toLocaleDateString()}</span>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Ticket Detail */}
          <Card className="lg:col-span-2 flex flex-col h-full">
            {selectedTicket ? (
              <>
                <CardHeader className="border-b border-slate-100">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{selectedTicket.subject}</CardTitle>
                      <CardDescription className="mt-1">
                        From: {selectedTicket.users?.email} • {new Date(selectedTicket.created_at).toLocaleString()}
                      </CardDescription>
                    </div>
                    <Select 
                      value={selectedTicket.status} 
                      onValueChange={(val) => handleStatusUpdate(selectedTicket.id, val)}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto p-6 space-y-6">
                  <div className="bg-slate-50 p-4 rounded-lg">
                    <p className="text-slate-700">{selectedTicket.description}</p>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-slate-900">Conversation History</h3>
                    {selectedTicket.ticket_responses?.map((resp: any) => (
                      <div key={resp.id} className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">
                          A
                        </div>
                        <div className="flex-1">
                          <div className="bg-white border border-slate-200 p-3 rounded-lg rounded-tl-none shadow-sm">
                            <p className="text-sm text-slate-700">{resp.message}</p>
                          </div>
                          <p className="text-xs text-slate-400 mt-1">
                            {new Date(resp.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
                <div className="p-4 border-t border-slate-100 bg-slate-50">
                  <div className="flex gap-2">
                    <Textarea 
                      placeholder="Type your reply..." 
                      value={response}
                      onChange={(e) => setResponse(e.target.value)}
                      className="min-h-[80px] bg-white"
                    />
                    <Button onClick={handleSendResponse} className="h-auto">Send</Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                <MessageSquare className="w-12 h-12 mb-4 opacity-20" />
                <p>Select a ticket to view details</p>
              </div>
            )}
          </Card>
        </div>
      </AdminLayout>
    </>
  );
}