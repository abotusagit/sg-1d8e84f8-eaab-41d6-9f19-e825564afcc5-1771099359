import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

// Types
type Tables = Database['public']['Tables'];
type TableName = keyof Tables;

// --- USER MANAGEMENT ---

export async function searchUsers(params: {
  page?: number;
  limit?: number;
  search?: string;
  username?: string;
  email?: string;
  phone?: string;
  location?: string;
} = {}) {
  const { page = 1, limit = 20, search, username, email, phone, location } = params;

  let query = supabase
    .from("users")
    .select("*", { count: "exact" });

  if (search) {
    query = query.or(`email.ilike.%${search}%,username.ilike.%${search}%,phone.ilike.%${search}%,id.eq.${search}`);
  }

  if (username) query = query.ilike('username', `%${username}%`);
  if (email) query = query.ilike('email', `%${email}%`);
  if (phone) query = query.ilike('phone', `%${phone}%`);
  if (location) query = query.ilike('location', `%${location}%`);

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error, count } = await query
    .range(from, to)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return { data, count };
}

export async function getUserById(id: string) {
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
}

export async function updateUser(id: string, updates: any) {
  const { data, error } = await supabase
    .from("users")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteUser(id: string) {
  const { error } = await supabase.from("users").delete().eq("id", id);
  if (error) throw error;
  return true;
}

// --- ADMIN USER MANAGEMENT ---

export async function getAdminUsers() {
  const { data, error } = await supabase
    .from("admin_users")
    .select(`
      *,
      privileges:admin_user_privileges(
        privilege:admin_privileges(*)
      )
    `);

  if (error) throw error;
  return data;
}

export async function grantPrivilege(userId: string, privilegeId: string, grantedBy: string) {
  const { error } = await supabase
    .from("admin_user_privileges")
    .insert({
      user_id: userId,
      privilege_id: privilegeId,
      granted_by: grantedBy
    });

  if (error) throw error;
  return true;
}

export async function revokePrivilege(userId: string, privilegeId: string) {
  const { error } = await supabase
    .from("admin_user_privileges")
    .delete()
    .match({ user_id: userId, privilege_id: privilegeId });

  if (error) throw error;
  return true;
}

// --- METADATA MANAGEMENT (Generic CRUD) ---

export async function getMetaData(table: string) {
  const { data, error } = await supabase
    .from(table as any)
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function createMetaData(table: string, payload: any) {
  const { data, error } = await supabase
    .from(table as any)
    .insert(payload)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateMetaData(table: string, id: string, payload: any) {
  const { data, error } = await supabase
    .from(table as any)
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteMetaData(table: string, id: string) {
  const { error } = await supabase
    .from(table as any)
    .delete()
    .eq("id", id);

  if (error) throw error;
  return true;
}

// --- MATCHING ---

export async function createTestMatch(userId1: string, userId2: string) {
  // Use RPC or direct insert if test_matches table exists
  // For now, assume test_matches table
  const { data, error } = await supabase
    .from("test_matches")
    .insert({
      user1_id: userId1,
      user2_id: userId2,
      created_by: (await supabase.auth.getUser()).data.user?.id
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// --- PAYMENTS ---

export async function searchPayments(page = 1, limit = 20, search?: string) {
  let query = supabase
    .from("payments")
    .select(`
      *,
      users (email, username)
    `, { count: "exact" });

  if (search) {
    query = query.or(`transaction_id.ilike.%${search}%,status.ilike.%${search}%`);
  }

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error, count } = await query
    .range(from, to)
    .order("payment_date", { ascending: false });

  if (error) throw error;
  return { data, count };
}

// --- MARRIAGE REGISTRY ---

export async function getMarriageRegistries(page = 1, limit = 20) {
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
}

export async function updateMarriageRegistry(id: string, updates: any) {
  const { data, error } = await supabase
    .from("marriage_registry")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// --- SUPPORT TICKETS ---

export async function getSupportTickets(status?: string) {
  let query = supabase
    .from("support_tickets")
    .select(`
      *,
      users(email, username)
    `)
    .order("created_at", { ascending: false });

  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function updateTicketStatus(ticketId: string, status: string) {
  const validStatuses = ["open", "in_progress", "resolved", "closed"];
  if (!validStatuses.includes(status)) {
    throw new Error(`Invalid status: ${status}`);
  }

  // Explicitly cast to the specific union type required by the database
  const typedStatus = status as "open" | "in_progress" | "resolved" | "closed";

  const { error } = await supabase
    .from("support_tickets")
    .update({ 
      status: typedStatus, 
      updated_at: new Date().toISOString() 
    })
    .eq("id", ticketId);
  
  if (error) throw error;
  return true;
}

export async function addTicketResponse(ticketId: string, adminId: string, message: string) {
  const { error } = await supabase
    .from("ticket_responses")
    .insert({
      ticket_id: ticketId,
      admin_id: adminId,
      message: message
    });

  if (error) throw error;
  return true;
}

// --- GLOBAL MESSAGES ---

export async function sendGlobalMessage(subject: string, content: string, targetType: "all" | "user" | "group", targetIds?: string[], sentBy?: string) {
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
}

export async function getGlobalMessages() {
  const { data, error } = await supabase
    .from("global_messages")
    .select("*")
    .order("created_at", { ascending: false });
    
  if (error) throw error;
  return data;
}