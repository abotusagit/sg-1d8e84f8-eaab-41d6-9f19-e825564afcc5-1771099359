import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Tables = Database["public"]["Tables"];
type TableName = keyof Tables;

// User Management
export async function searchUsers(filters: {
  username?: string;
  email?: string;
  phone?: string;
  location?: string;
}) {
  let query = supabase.from("users").select("*");

  if (filters.username) {
    query = query.ilike("username", `%${filters.username}%`);
  }
  if (filters.email) {
    query = query.ilike("email", `%${filters.email}%`);
  }
  if (filters.phone) {
    query = query.ilike("phone", `%${filters.phone}%`);
  }
  if (filters.location) {
    query = query.ilike("location", `%${filters.location}%`);
  }

  const { data, error } = await query.order("created_at", { ascending: false });
  console.log("Search users:", { data, error });
  return { data, error };
}

export async function getUserById(userId: string) {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();
  
  console.log("Get user by ID:", { data, error });
  return { data, error };
}

export async function updateUser(userId: string, updates: Partial<Tables["users"]["Update"]>) {
  const { data, error } = await supabase
    .from("users")
    .update(updates)
    .eq("id", userId)
    .select()
    .single();
  
  console.log("Update user:", { data, error });
  return { data, error };
}

export async function deleteUser(userId: string) {
  const { data, error } = await supabase
    .from("users")
    .delete()
    .eq("id", userId);
  
  console.log("Delete user:", { data, error });
  return { data, error };
}

// Meta Data Management
export async function getMetaData(table: TableName) {
  const { data, error } = await supabase
    .from(table)
    .select("*")
    .order("created_at", { ascending: false }); // Most tables have created_at
  
  console.log(`Get ${table}:`, { data, error });
  return { data, error };
}

export async function createMetaData(table: TableName, item: any) {
  const { data, error } = await supabase
    .from(table)
    .insert(item)
    .select()
    .single();
  
  console.log(`Create ${table}:`, { data, error });
  return { data, error };
}

export async function updateMetaData(table: TableName, id: string, updates: any) {
  const { data, error } = await supabase
    .from(table)
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  
  console.log(`Update ${table}:`, { data, error });
  return { data, error };
}

export async function deleteMetaData(table: TableName, id: string) {
  const { data, error } = await supabase
    .from(table)
    .delete()
    .eq("id", id);
  
  console.log(`Delete ${table}:`, { data, error });
  return { data, error };
}

// Payments
export async function searchPayments(userId?: string) {
  let query = supabase
    .from("payments")
    .select(`
      *,
      users:user_id (
        username,
        email
      )
    `);

  if (userId) {
    query = query.eq("user_id", userId);
  }

  const { data, error } = await query.order("payment_date", { ascending: false });
  console.log("Search payments:", { data, error });
  return { data, error };
}

export async function getPaymentStats(startDate?: string, endDate?: string) {
  let query = supabase.from("payments").select("*");

  if (startDate) {
    query = query.gte("payment_date", startDate);
  }
  if (endDate) {
    query = query.lte("payment_date", endDate);
  }

  const { data, error } = await query;
  console.log("Get payment stats:", { data, error });
  return { data, error };
}

// Support Tickets
export async function getSupportTickets(status?: string) {
  let query = supabase
    .from("support_tickets")
    .select(`
      *,
      users:user_id (
        username,
        email
      ),
      ticket_responses (*)
    `);

  if (status) {
    // Cast string to specific enum type if needed, or let Supabase handle it
    query = query.eq("status", status as any);
  }

  const { data, error } = await query.order("created_at", { ascending: false });
  console.log("Get support tickets:", { data, error });
  return { data, error };
}

export async function updateTicketStatus(
  ticketId: string,
  status: "open" | "in_progress" | "resolved" | "closed"
) {
  const { data, error } = await supabase
    .from("support_tickets")
    .update({ status: status as any, updated_at: new Date().toISOString() })
    .eq("id", ticketId)
    .select()
    .single();
  
  console.log("Update ticket status:", { data, error });
  return { data, error };
}

export async function addTicketResponse(
  ticketId: string,
  adminId: string,
  message: string
) {
  const { data, error } = await supabase
    .from("ticket_responses")
    .insert({
      ticket_id: ticketId,
      admin_id: adminId,
      message
    })
    .select()
    .single();
  
  console.log("Add ticket response:", { data, error });
  return { data, error };
}

// Global Messages
export async function sendGlobalMessage(
  subject: string,
  content: string,
  targetType: "all" | "user" | "group",
  targetIds: string[],
  sentBy: string
) {
  const { data: message, error: messageError } = await supabase
    .from("global_messages")
    .insert({
      subject,
      content,
      target_type: targetType as any,
      target_ids: targetType === "all" ? null : targetIds,
      sent_by: sentBy
    })
    .select()
    .single();

  if (messageError) {
    console.log("Send global message error:", { messageError });
    return { data: null, error: messageError };
  }

  // Create recipient records
  if (targetType === "all") {
    const { data: users } = await supabase.from("users").select("id");
    const recipients = (users || []).map(u => ({
      message_id: message.id,
      user_id: u.id
    }));
    
    const { error: recipientError } = await supabase
      .from("message_recipients")
      .insert(recipients);
    
    console.log("Create recipients:", { recipientError });
  } else {
    const recipients = targetIds.map(id => ({
      message_id: message.id,
      user_id: id
    }));
    
    const { error: recipientError } = await supabase
      .from("message_recipients")
      .insert(recipients);
    
    console.log("Create recipients:", { recipientError });
  }

  return { data: message, error: null };
}

// Marriage Registry
export async function getMarriageRegistries(status?: string) {
  // Use simple foreign key syntax or specific column selection to avoid deep types
  let query = supabase
    .from("marriage_registry")
    .select(`
      *,
      user1:user1_id (username, email),
      user2:user2_id (username, email)
    `);

  if (status) {
    query = query.eq("status", status as any);
  }

  const { data, error } = await query.order("created_at", { ascending: false });
  console.log("Get marriage registries:", { data, error });
  return { data, error };
}

export async function updateMarriageRegistry(
  registryId: string,
  updates: Partial<Tables["marriage_registry"]["Update"]>
) {
  const { data, error } = await supabase
    .from("marriage_registry")
    .update(updates)
    .eq("id", registryId)
    .select()
    .single();
  
  console.log("Update marriage registry:", { data, error });
  return { data, error };
}

// Test Matching
export async function createTestMatch(user1Id: string, user2Id: string, adminId: string) {
  const { data, error } = await supabase
    .from("test_matches")
    .insert({
      user1_id: user1Id,
      user2_id: user2Id,
      matched_by: adminId
    })
    .select()
    .single();
  
  console.log("Create test match:", { data, error });
  return { data, error };
}

// Admin Privileges
export async function getAdminUsers() {
  const { data, error } = await supabase
    .from("admin_users")
    .select(`
      *,
      admin_user_privileges (
        privilege:privilege_id (*)
      )
    `);
  
  console.log("Get admin users:", { data, error });
  return { data, error };
}

export async function grantPrivilege(userId: string, privilegeId: string) {
  const { data, error } = await supabase
    .from("admin_user_privileges")
    .insert({
      user_id: userId,
      privilege_id: privilegeId
    })
    .select()
    .single();
  
  console.log("Grant privilege:", { data, error });
  return { data, error };
}

export async function revokePrivilege(userId: string, privilegeId: string) {
  const { data, error } = await supabase
    .from("admin_user_privileges")
    .delete()
    .eq("user_id", userId)
    .eq("privilege_id", privilegeId);
  
  console.log("Revoke privilege:", { data, error });
  return { data, error };
}