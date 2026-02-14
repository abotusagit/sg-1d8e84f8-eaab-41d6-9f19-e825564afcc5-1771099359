export interface AdminUser {
  id: string;
  email: string;
  role: "full_admin" | "custom_admin";
  privileges: AdminPrivilege[];
  created_at: string;
  last_login?: string;
}

export interface AdminPrivilege {
  id: string;
  name: string;
  description: string;
  category: "matching" | "payment" | "user_management" | "support" | "registry" | "messaging" | "reporting";
}

export interface User {
  id: string;
  username: string;
  email: string;
  phone?: string;
  location?: string;
  created_at: string;
  last_login?: string;
  membership_type: "free" | "premium" | "vip";
  is_active: boolean;
}

export interface MatchCriteria {
  age_min: number;
  age_max: number;
  height_min?: number;
  height_max?: number;
  education_ids?: string[];
  religion_ids?: string[];
  race_ids?: string[];
  location?: string;
}

export interface Payment {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  status: "pending" | "completed" | "failed";
  payment_date: string;
  membership_type: string;
}

export interface SupportTicket {
  id: string;
  user_id: string;
  subject: string;
  description: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "urgent";
  created_at: string;
  updated_at: string;
  responses: TicketResponse[];
}

export interface TicketResponse {
  id: string;
  ticket_id: string;
  admin_id: string;
  message: string;
  created_at: string;
}

export interface MarriageRegistry {
  id: string;
  user1_id: string;
  user2_id: string;
  marriage_date: string;
  location: string;
  status: "pending" | "confirmed" | "completed";
  gift_sent: boolean;
  admin_notes?: string;
  created_at: string;
}

export interface MetaDataTable {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
}

export interface GlobalMessage {
  id: string;
  subject: string;
  content: string;
  target_type: "all" | "user" | "group";
  target_ids?: string[];
  sent_by: string;
  sent_at: string;
}

export interface HelpDocument {
  id: string;
  title: string;
  content: string;
  category: string;
  version: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}