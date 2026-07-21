export type UserRole = 'buyer' | 'seller' | 'attorney' | 'conveyancer' | 'paralegal' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  kycStatus: 'unsubmitted' | 'pending' | 'verified' | 'rejected';
  idNumber?: string;
  address?: string;
  consentAccepted: boolean;
  consentDate?: string;
  avatarUrl?: string;
}

export type DocumentCategory = 
  | 'identity' 
  | 'deed' 
  | 'sale_agreement' 
  | 'rates_clearance' 
  | 'financial' 
  | 'fica' 
  | 'transfer';

export interface Document {
  id: string;
  matterId: string;
  name: string;
  category: DocumentCategory;
  fileUrl: string;
  uploadDate: string;
  status: 'pending_review' | 'approved' | 'rejected';
  reviewerNotes?: string;
  version: number;
  size: string;
  uploadedBy: string;
}

export interface StageTask {
  id: string;
  name: string;
  completed: boolean;
  assignedTo: 'client' | 'staff';
  completedAt?: string;
}

export interface StageDetails {
  stageNumber: number;
  name: string;
  description: string;
  status: 'not_started' | 'in_progress' | 'completed';
  estimatedCompletionDate: string;
  lawyerNotes?: string;
  tasks: StageTask[];
}

export interface MatterActivity {
  id: string;
  date: string;
  type: 'stage_change' | 'document_upload' | 'document_approve' | 'document_reject' | 'task_complete' | 'appointment_book' | 'message_sent';
  description: string;
  actor: string;
}

export interface PropertyMatter {
  id: string;
  matterNumber: string;
  propertyAddress: string;
  propertyPrice: number;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName: string;
  assignedAttorneyId: string;
  assignedAttorneyName: string;
  assignedParalegalId: string;
  assignedParalegalName: string;
  currentStage: number; // 1 to 8
  expectedCompletionDate: string;
  status: 'active' | 'completed' | 'on_hold' | 'cancelled';
  stages: StageDetails[];
  activities: MatterActivity[];
}

export interface Task {
  id: string;
  matterId: string;
  matterNumber: string;
  propertyAddress: string;
  title: string;
  description: string;
  assignedToId: string;
  assignedToName: string;
  assignedToRole: 'buyer' | 'seller' | 'staff';
  dueDate: string;
  status: 'pending' | 'completed';
  completedAt?: string;
  requiresDocumentCategory?: DocumentCategory;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  text: string;
  timestamp: string;
  fileAttachment?: {
    name: string;
    url: string;
    type: string;
  };
  isRead: boolean;
}

export interface Conversation {
  id: string;
  matterId: string;
  matterNumber: string;
  propertyAddress: string;
  title: string;
  participants: {
    userId: string;
    name: string;
    role: UserRole;
  }[];
  lastMessageText?: string;
  lastMessageTimestamp?: string;
}

export interface Appointment {
  id: string;
  clientId: string;
  clientName: string;
  staffId: string;
  staffName: string;
  staffRole: UserRole;
  date: string;
  time: string;
  duration: number; // in minutes
  type: 'consultation' | 'signing' | 'virtual_meeting';
  status: 'scheduled' | 'cancelled' | 'completed';
  videoLink?: string;
  description?: string;
}

export interface AutomationRule {
  id: string;
  name: string;
  trigger: string;
  actionType: 'email' | 'sms' | 'push';
  template: string;
  enabled: boolean;
}

export interface AutomationLog {
  id: string;
  timestamp: string;
  matterId: string;
  matterNumber: string;
  triggerName: string;
  recipient: string;
  type: 'email' | 'sms' | 'push';
  content: string;
  status: 'sent' | 'failed';
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  details: string;
  ipAddress: string;
}
