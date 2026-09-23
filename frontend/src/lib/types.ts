/** Wire types mirroring the FastAPI response models. */

export type UserRole = "client" | "specialist" | "admin";

export type User = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  must_change_password: boolean;
  created_at?: string | null;
  last_login_at?: string | null;
};

export type TokenPair = {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: User;
};

/** Admin is deliberately absent — it can't be self-registered. */
export type SignupRole = "client" | "specialist";

export type SignupPayload = {
  role: SignupRole;
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  accept_terms: boolean;
  /** Client-only: carried onto the client file the backend opens. */
  phone?: string | null;
  state?: string | null;
  zip_code?: string | null;
};

export type SignupResponse = {
  status: "active" | "pending_approval";
  message: string;
  /** Null for a specialist — the account can't sign in until it's approved. */
  session: TokenPair | null;
};

export type StaffMember = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  active: boolean;
  self_registered: boolean;
  /** Null on a request still awaiting a decision. */
  approved_at?: string | null;
  created_at?: string | null;
  last_login_at?: string | null;
};

// --- assessment ------------------------------------------------------------

export type AssessmentPayload = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  state: string;
  zip_code: string;
  concerns: string[];
  goals: string[];
  score_range: string;
  bureaus: string[];
  negative_accounts: string | null;
  has_recent_report: boolean | null;
  notes: string | null;
  consent_contact: boolean;
  source: string | null;
};

export type AssessmentReceipt = { reference: string; message: string };

// --- CRM -------------------------------------------------------------------

export type LeadStatus =
  | "new"
  | "contacted"
  | "assessment_completed"
  | "consultation_booked"
  | "converted"
  | "not_interested";

export type ClientStatus =
  | "active"
  | "pending_documents"
  | "under_review"
  | "action_required"
  | "follow_up_required"
  | "completed";

export type JourneyPhase =
  | "assessment"
  | "review"
  | "action_plan"
  | "dispute_follow_up"
  | "results_review";

export type Lead = {
  id: string;
  reference: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  state: string;
  status: LeadStatus;
  concerns: string[];
  goals: string[];
  tags: string[];
  assigned_to: string | null;
  assigned_to_name: string | null;
  next_follow_up_at: string | null;
  created_at: string;
  updated_at: string;
  converted_client_id: string | null;
};

export type LeadNote = { body: string; author: string; created_at: string };

export type LeadDetail = Lead & {
  zip_code: string;
  score_range: string | null;
  bureaus: string[];
  negative_accounts: string | null;
  has_recent_report: boolean | null;
  notes: string | null;
  source: string | null;
  consent_contact: boolean;
  internal_notes: LeadNote[];
};

export type Activity = {
  id: string;
  subject_id: string;
  subject_type: string;
  type: string;
  summary: string;
  actor_name: string;
  created_at: string;
};

// --- portal ----------------------------------------------------------------

export type JourneyStep = {
  phase: JourneyPhase;
  label: string;
  state: "complete" | "current" | "upcoming";
  completed_at: string | null;
};

export type BureauStatus = {
  bureau: string;
  label: string;
  report_on_file: boolean;
  last_updated_at: string | null;
  note: string | null;
};

export type TaskItem = {
  id: string;
  title: string;
  description: string | null;
  status: "open" | "in_progress" | "done";
  due_at: string | null;
  owner: string;
  created_at: string;
};

export type DisputeItem = {
  id: string;
  account_name: string;
  bureau: string;
  bureau_label: string;
  reason: string;
  stage: "prepared" | "submitted" | "bureau_investigating" | "response_received" | "closed";
  stage_label: string;
  opened_at: string;
  last_update_at: string | null;
  outcome_note: string | null;
};

export type MessageItem = {
  id: string;
  body: string;
  author_name: string;
  author_role: string;
  created_at: string;
  read: boolean;
};

export type NotificationItem = {
  id: string;
  title: string;
  body: string;
  kind: string;
  read: boolean;
  created_at: string;
  link: string | null;
};

export type AppointmentItem = {
  id: string;
  title: string;
  scheduled_for: string;
  duration_minutes: number;
  kind: string;
  status: string;
  location: string;
};

export type PaymentItem = {
  id: string;
  description: string;
  amount_cents: number;
  currency: string;
  status: string;
  due_at: string | null;
  paid_at: string | null;
};

export type ClientProfile = {
  id: string;
  user_id: string;
  reference: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  state: string;
  zip_code: string | null;
  package: string;
  status: ClientStatus;
  status_label: string;
  current_phase: JourneyPhase;
  phase_label: string;
  assigned_specialist_id: string | null;
  assigned_specialist_name: string | null;
  start_date: string;
  next_follow_up_at: string | null;
  goals: string[];
  concerns: string[];
};

export type PortalDashboard = {
  profile: ClientProfile;
  journey: JourneyStep[];
  bureau_status: BureauStatus[];
  documents_count: number;
  pending_tasks: TaskItem[];
  recent_disputes: DisputeItem[];
  unread_messages: number;
  unread_notifications: number;
  next_appointment: AppointmentItem | null;
  outstanding_payment: PaymentItem | null;
  status_note: string;
};

// --- documents -------------------------------------------------------------

export type DocumentCategory =
  | "experian_report"
  | "equifax_report"
  | "transunion_report"
  | "supporting_document"
  | "identity_theft_documentation"
  | "account_statement"
  | "other";

export type DocumentItem = {
  id: string;
  client_id: string;
  filename: string;
  category: DocumentCategory;
  category_label: string;
  content_type: string;
  size_bytes: number;
  status: "received" | "in_review" | "reviewed" | "action_needed";
  uploaded_at: string;
  uploaded_by_name: string;
  reviewed_at: string | null;
  reviewer_note: string | null;
};

// --- admin -----------------------------------------------------------------

export type CountRow = { key: string; label: string; count: number };

export type AdminOverview = {
  leads: CountRow[];
  clients: CountRow[];
  totals: {
    leads: number;
    clients: number;
    new_leads_this_week: number;
    documents_awaiting_review: number;
    follow_ups_due: number;
    unread_notifications: number;
    conversion_rate: number;
  };
  recent_activity: Activity[];
};

export type ClientSummary = {
  id: string;
  reference: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  state: string;
  package: string;
  status: ClientStatus;
  status_label: string;
  current_phase: JourneyPhase;
  phase_label: string;
  assigned_specialist_name: string | null;
  start_date: string;
  next_follow_up_at: string | null;
  documents_count: number;
  payment_status: string;
  open_tasks: number;
};

export type AdminClientDetail = {
  profile: ClientProfile;
  journey: JourneyStep[];
  bureau_status: BureauStatus[];
  documents: DocumentItem[];
  tasks: TaskItem[];
  disputes: DisputeItem[];
  messages: MessageItem[];
  payments: PaymentItem[];
  appointments: AppointmentItem[];
  internal_notes: LeadNote[];
  activity: Activity[];
  payment_status: string;
};

export type Specialist = { id: string; name: string; email: string; role: string };
