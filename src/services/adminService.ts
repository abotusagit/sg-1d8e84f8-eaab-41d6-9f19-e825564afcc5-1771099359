import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

// Define generic types for flexibility
type Tables = Database['public']['Tables'];
type TableName = keyof Tables;

// --- USER MANAGEMENT ---

export const adminService = {
  // Get users with optional search filters
  async getUsers(page = 1, limit = 20, search?: string) {
    let query = supabase
      .from("users")
      .select("*", { count: "exact" });

    if (search) {
      // Search across multiple fields
      query = query.or(`email.ilike.%${search}%,username.ilike.%${search}%,phone.ilike.%${search}%,id.eq.${search}`);
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await query
      .range(from, to)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return { data, count };
  },

  async getUserById(id: string) {
    const { data, error } = await supabase
      .from("users")
      .select(`
        *,
        match_criteria(*),
        profiles(*)
      `)
      .eq("id", id)
      .single();
    
    if (error) throw error;
    return data;
  },

  // --- METADATA MANAGEMENT (Generic CRUD) ---

  async getMetadata(table: TableName) {
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .order("created_at", { ascending: false } as any); // Type assertion for generic table

    if (error) throw error;
    return data;
  },

  async createMetadata(table: TableName, payload: any) {
    const { data, error } = await supabase
      .from(table)
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateMetadata(table: TableName, id: string, payload: any) {
    const { data, error } = await supabase
      .from(table)
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteMetadata(table: TableName, id: string) {
    const { error } = await supabase
      .from(table)
      .delete()
      .eq("id", id);

    if (error) throw error;
    return true;
  },

  // --- PAYMENTS ---

  async getPayments(page = 1, limit = 20, search?: string) {
    let query = supabase
      .from("payments")
      .select(`
        *,
        users (email, username)
      `, { count: "exact" });

    if (search) {
       // Search for payment by ID or User Email
       // Requires joining or separate handling, for now simple ID search or status
       query = query.or(`transaction_id.ilike.%${search}%,status.ilike.%${search}%`);
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await query
      .range(from, to)
      .order("payment_date", { ascending: false });

    if (error) throw error;
    return { data, count };
  },

  async getPaymentStats() {
    // Simple aggregation via RPC would be better, but doing client-side for now or simple counts
    // For production, create a Postgres function for complex stats
    const { count: totalRevenue } = await supabase.from("payments").select("*", { count: "exact", head: true });
    return { totalRevenue }; // Placeholder
  },

  // --- MARRIAGE REGISTRY ---

  async getMarriageRegistry(page = 1, limit = 20) {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await supabase
      .from("marriage_registry")
      .select(`
        *,
        user1:users!marriage_registry_user1_id_fkey(username, email),
        user2:users!marriage_registry_user2_id_fkey(username, email)
      `, { count: "exact" })
      .range(from, to)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return { data, count };
  },

  async updateRegistryStatus(id: string, status: string, notes?: string, giftSent?: boolean) {
    const payload: any = {};
    if (status) payload.status = status;
    if (notes !== undefined) payload.admin_notes = notes;
    if (giftSent !== undefined) payload.gift_sent = giftSent;

    const { data, error } = await supabase
      .from("marriage_registry")
      .update(payload)
      .eq("id", id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // --- SUPPORT TICKETS ---

  async getSupportTickets(status?: string) {
    let query = supabase
      .from("support_tickets")
      .select(`
        *,
        users(email, username)
      `)
      .order("created_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async respondToTicket(ticketId: string, adminId: string, message: string, newStatus?: string) {
    // 1. Create response
    const { error: responseError } = await supabase
      .from("ticket_responses")
      .insert({
        ticket_id: ticketId,
        admin_id: adminId,
        message: message
      });

    if (responseError) throw responseError;

    // 2. Update status if provided
    if (newStatus) {
      const { error: statusError } = await supabase
        .from("support_tickets")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", ticketId);
      
      if (statusError) throw statusError;
    }

    return true;
  },

  // --- GLOBAL MESSAGES ---

  async sendGlobalMessage(subject: string, content: string, targetType: "all" | "user" | "group", targetIds?: string[], sentBy?: string) {
    const { data, error } = await supabase
      .from("global_messages")
      .insert({
        subject,
        content,
        target_type: targetType,
        target_ids: targetIds,
        sent_by: sentBy
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },
  
  async getGlobalMessages() {
    const { data, error } = await supabase
      .from("global_messages")
      .select("*")
      .order("created_at", { ascending: false });
      
    if (error) throw error;
    return data;
  }
};