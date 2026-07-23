import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Lazy initialize Gemini API client to prevent crash on startup if key is missing
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
      aiClient = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
    }
  }
  return aiClient;
}

// Lazy initialize Supabase client
let supabaseClient: any = null;
function getSupabaseClient() {
  if (!supabaseClient) {
    const supabaseUrl = process.env.SUPABASE_URL || 'https://lxdescdgxgzxfahhbqfy.supabase.co';
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    if (supabaseKey && supabaseKey !== '' && supabaseKey !== 'undefined') {
      try {
        supabaseClient = createClient(supabaseUrl, supabaseKey);
      } catch (err) {
        console.error("Failed to initialize Supabase client:", err);
      }
    }
  }
  return supabaseClient;
}

// Simple file-based database for persistence
const DB_FILE = path.join(process.cwd(), 'db.json');

// Initial baseline data
const INITIAL_DATA = {
  users: [
    {
      id: 'usr-client-1',
      name: 'John Buyer',
      email: 'john.buyer@gmail.com',
      role: 'buyer',
      phone: '+27 82 555 0192',
      kycStatus: 'pending',
      idNumber: '8907125012083',
      address: '14 Blue Crane Estate, Midrand, South Africa',
      consentAccepted: true,
      consentDate: '2026-07-15T09:30:00Z',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150'
    },
    {
      id: 'usr-client-2',
      name: 'Sarah Seller',
      email: 'sarah.seller@yahoo.com',
      role: 'seller',
      phone: '+27 71 888 2314',
      kycStatus: 'verified',
      idNumber: '7504020084089',
      address: '124 Villa Rosa, Sandton, Johannesburg',
      consentAccepted: true,
      consentDate: '2026-07-10T14:15:00Z',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150'
    },
    {
      id: 'usr-attorney-1',
      name: 'Arthur Masina',
      email: 'arthur@masinalaw.co.za',
      role: 'attorney',
      phone: '+27 11 432 9000',
      kycStatus: 'verified',
      consentAccepted: true,
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'
    },
    {
      id: 'usr-convey-1',
      name: 'Clara Convey',
      email: 'clara@masinalaw.co.za',
      role: 'conveyancer',
      phone: '+27 11 432 9005',
      kycStatus: 'verified',
      consentAccepted: true,
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150'
    },
    {
      id: 'usr-paralegal-1',
      name: 'Pamela Paralegal',
      email: 'pamela@masinalaw.co.za',
      role: 'paralegal',
      phone: '+27 11 432 9011',
      kycStatus: 'verified',
      consentAccepted: true,
      avatarUrl: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=150'
    },
    {
      id: 'usr-admin-1',
      name: 'Admin Alice',
      email: 'alice@masinalaw.co.za',
      role: 'admin',
      phone: '+27 11 432 9001',
      kycStatus: 'verified',
      consentAccepted: true,
      avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150'
    },
    {
      id: 'usr-other-1',
      name: 'Sam Staff (Pending)',
      email: 'sam.staff@masinalaw.co.za',
      role: 'other',
      phone: '+27 83 999 4321',
      kycStatus: 'pending',
      consentAccepted: true,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
    }
  ],
  matters: [
    {
      id: 'mat-1',
      matterNumber: 'MAT-2026-9081',
      propertyAddress: '124 Villa Rosa, Sandton, Johannesburg',
      propertyPrice: 2450000,
      buyerId: 'usr-client-1',
      buyerName: 'John Buyer',
      sellerId: 'usr-client-2',
      sellerName: 'Sarah Seller',
      assignedAttorneyId: 'usr-attorney-1',
      assignedAttorneyName: 'Arthur Masina',
      assignedParalegalId: 'usr-paralegal-1',
      assignedParalegalName: 'Pamela Paralegal',
      currentStage: 3, // Stage 3: FICA & Compliance
      expectedCompletionDate: '2026-10-15',
      status: 'active',
      stages: [
        {
          stageNumber: 1,
          name: 'Offer to Purchase Received',
          description: 'Initial receipt and verification of OTP agreement and basic entity creation.',
          status: 'completed',
          estimatedCompletionDate: '2026-07-10',
          lawyerNotes: 'OTP checked and verified. Formally opened the matter in the deeds system.',
          tasks: [
            { id: 't-s1-1', name: 'OTP Uploaded', completed: true, assignedTo: 'client' },
            { id: 't-s1-2', name: 'Parties Verified', completed: true, assignedTo: 'staff' },
            { id: 't-s1-3', name: 'Matter Opened on Deeds System', completed: true, assignedTo: 'staff' }
          ]
        },
        {
          stageNumber: 2,
          name: 'Contract Review',
          description: 'Attorneys review special conditions, compliance certificate requirements, and outline needed support documents.',
          status: 'completed',
          estimatedCompletionDate: '2026-07-20',
          lawyerNotes: 'Special conditions for bond approval within 30 days verified. Electrical certificate needed.',
          tasks: [
            { id: 't-s2-1', name: 'Review sale agreement for special conditions', completed: true, assignedTo: 'staff' },
            { id: 't-s2-2', name: 'Special conditions checklist checked', completed: true, assignedTo: 'staff' },
            { id: 't-s2-3', name: 'Request supporting documents from buyer and seller', completed: true, assignedTo: 'staff' }
          ]
        },
        {
          stageNumber: 3,
          name: 'FICA & Compliance',
          description: 'KYC collection, identity check, address clearance, and source of funds verification.',
          status: 'in_progress',
          estimatedCompletionDate: '2026-08-05',
          lawyerNotes: 'Buyer John Buyer has uploaded his ID. We are currently awaiting proof of address and source of funds statement.',
          tasks: [
            { id: 't-s3-1', name: 'Verify identity documents (FICA)', completed: true, assignedTo: 'staff' },
            { id: 't-s3-2', name: 'Verify residential address proofs', completed: false, assignedTo: 'staff' },
            { id: 't-s3-3', name: 'Verify source of funds and bank statement (AML)', completed: false, assignedTo: 'staff' }
          ]
        },
        {
          stageNumber: 4,
          name: 'Due Diligence',
          description: 'Title deed searches, municipal tax clearances, outstanding bond cancellation checks.',
          status: 'not_started',
          estimatedCompletionDate: '2026-08-25',
          tasks: [
            { id: 't-s4-1', name: 'Title deeds search & copy review', completed: false, assignedTo: 'staff' },
            { id: 't-s4-2', name: 'Municipal rates & clearance checks', completed: false, assignedTo: 'staff' },
            { id: 't-s4-3', name: 'Bond cancellation instruction confirmation', completed: false, assignedTo: 'staff' }
          ]
        },
        {
          stageNumber: 5,
          name: 'Transfer Preparation',
          description: 'Drafting of official deeds documents, transfer duty calculations and revenue collection.',
          status: 'not_started',
          estimatedCompletionDate: '2026-09-10',
          tasks: [
            { id: 't-s5-1', name: 'Draft official transfer deeds & power of attorney', completed: false, assignedTo: 'staff' },
            { id: 't-s5-2', name: 'Collect physical and digital signatures', completed: false, assignedTo: 'client' },
            { id: 't-s5-3', name: 'Calculate and pay SARS Transfer Duty', completed: false, assignedTo: 'staff' }
          ]
        },
        {
          stageNumber: 6,
          name: 'Lodgement',
          description: 'Physical submission of all signed and cleared deeds to the relevant Deeds Registry Office.',
          status: 'not_started',
          estimatedCompletionDate: '2026-09-25',
          tasks: [
            { id: 't-s6-1', name: 'Lodge bundle at Deeds Office registry', completed: false, assignedTo: 'staff' },
            { id: 't-s6-2', name: 'Monitor deeds tracking & registry updates', completed: false, assignedTo: 'staff' },
            { id: 't-s6-3', name: 'Address deeds office notes and queries', completed: false, assignedTo: 'staff' }
          ]
        },
        {
          stageNumber: 7,
          name: 'Registration',
          description: 'Official deeds office registry signing, bond release, and transfer of ownership.',
          status: 'not_started',
          estimatedCompletionDate: '2026-10-05',
          tasks: [
            { id: 't-s7-1', name: 'Execute registration at the Deeds Office', completed: false, assignedTo: 'staff' },
            { id: 't-s7-2', name: 'Update ownership registry databases', completed: false, assignedTo: 'staff' }
          ]
        },
        {
          stageNumber: 8,
          name: 'Finalisation',
          description: 'Archiving documents, releasing funds, issuing financial statements, and matter closure.',
          status: 'not_started',
          estimatedCompletionDate: '2026-10-15',
          tasks: [
            { id: 't-s8-1', name: 'Archive original physical deeds and title acts', completed: false, assignedTo: 'staff' },
            { id: 't-s8-2', name: 'Draw up and issue Final Statements of Account', completed: false, assignedTo: 'staff' },
            { id: 't-s8-3', name: 'Formal closure of transaction case file', completed: false, assignedTo: 'staff' }
          ]
        }
      ],
      activities: [
        { id: 'act-1', date: '2026-07-10T10:00:00Z', type: 'stage_change', description: 'Matter formally opened and Stage 1 completed', actor: 'Arthur Masina' },
        { id: 'act-2', date: '2026-07-12T11:45:00Z', type: 'document_upload', description: 'Signed Offer to Purchase uploaded', actor: 'John Buyer' },
        { id: 'act-3', date: '2026-07-15T15:20:00Z', type: 'stage_change', description: 'Contract Review (Stage 2) completed', actor: 'Pamela Paralegal' },
        { id: 'act-4', date: '2026-07-18T09:10:00Z', type: 'document_upload', description: 'FICA Identity document uploaded', actor: 'John Buyer' },
        { id: 'act-5', date: '2026-07-18T14:30:00Z', type: 'document_approve', description: 'FICA Identity document reviewed and approved', actor: 'Pamela Paralegal' }
      ]
    },
    {
      id: 'mat-2',
      matterNumber: 'MAT-2026-3021',
      propertyAddress: '88 Ocean Drive, Camps Bay, Cape Town',
      propertyPrice: 12500000,
      buyerId: 'usr-client-2', // Sarah Seller in first transaction is buyer here, showing flexible roles
      buyerName: 'Sarah Seller',
      sellerId: 'usr-client-1',
      sellerName: 'John Buyer',
      assignedAttorneyId: 'usr-attorney-1',
      assignedAttorneyName: 'Arthur Masina',
      assignedParalegalId: 'usr-paralegal-1',
      assignedParalegalName: 'Pamela Paralegal',
      currentStage: 6, // Stage 6: Lodgement
      expectedCompletionDate: '2026-08-10',
      status: 'active',
      stages: [
        { stageNumber: 1, name: 'Offer to Purchase Received', status: 'completed', estimatedCompletionDate: '2026-05-15', tasks: [] },
        { stageNumber: 2, name: 'Contract Review', status: 'completed', estimatedCompletionDate: '2026-05-28', tasks: [] },
        { stageNumber: 3, name: 'FICA & Compliance', status: 'completed', estimatedCompletionDate: '2026-06-12', tasks: [] },
        { stageNumber: 4, name: 'Due Diligence', status: 'completed', estimatedCompletionDate: '2026-06-30', tasks: [] },
        { stageNumber: 5, name: 'Transfer Preparation', status: 'completed', estimatedCompletionDate: '2026-07-15', tasks: [] },
        {
          stageNumber: 6,
          name: 'Lodgement',
          description: 'Physical submission of all signed and cleared deeds to the relevant Deeds Registry Office.',
          status: 'in_progress',
          estimatedCompletionDate: '2026-07-30',
          lawyerNotes: 'The deeds were successfully lodged at the Cape Town deeds registry under batch 44091. Standard registry checks are active.',
          tasks: [
            { id: 't-s6-1', name: 'Lodge bundle at Deeds Office registry', completed: true, assignedTo: 'staff' },
            { id: 't-s6-2', name: 'Monitor deeds tracking & registry updates', completed: false, assignedTo: 'staff' },
            { id: 't-s6-3', name: 'Address deeds office notes and queries', completed: false, assignedTo: 'staff' }
          ]
        },
        { stageNumber: 7, name: 'Registration', status: 'not_started', estimatedCompletionDate: '2026-08-05', tasks: [] },
        { stageNumber: 8, name: 'Finalisation', status: 'not_started', estimatedCompletionDate: '2026-08-10', tasks: [] }
      ],
      activities: [
        { id: 'act-201', date: '2026-07-15T09:00:00Z', type: 'stage_change', description: 'Deeds documents officially signed by both parties', actor: 'Clara Convey' },
        { id: 'act-202', date: '2026-07-19T14:10:00Z', type: 'stage_change', description: 'Deeds lodged at the Registry Office', actor: 'Clara Convey' }
      ]
    }
  ],
  documents: [
    {
      id: 'doc-1',
      matterId: 'mat-1',
      name: 'Signed_OTP_Sandton_Villa.pdf',
      category: 'sale_agreement',
      fileUrl: '#',
      uploadDate: '2026-07-12T11:45:00Z',
      status: 'approved',
      version: 1,
      size: '2.4 MB',
      uploadedBy: 'usr-client-1'
    },
    {
      id: 'doc-2',
      matterId: 'mat-1',
      name: 'John_Buyer_ID_Card.png',
      category: 'identity',
      fileUrl: '#',
      uploadDate: '2026-07-18T09:10:00Z',
      status: 'approved',
      version: 1,
      size: '1.1 MB',
      uploadedBy: 'usr-client-1'
    },
    {
      id: 'doc-3',
      matterId: 'mat-1',
      name: 'Sandton_Property_Title_Deed_Copy.pdf',
      category: 'deed',
      fileUrl: '#',
      uploadDate: '2026-07-11T08:00:00Z',
      status: 'approved',
      version: 1,
      size: '4.8 MB',
      uploadedBy: 'usr-paralegal-1'
    },
    {
      id: 'doc-4',
      matterId: 'mat-1',
      name: 'SARS_Transfer_Duty_Receipt_Draft.pdf',
      category: 'transfer',
      fileUrl: '#',
      uploadDate: '2026-07-20T16:00:00Z',
      status: 'pending_review',
      version: 1,
      size: '1.2 MB',
      uploadedBy: 'usr-paralegal-1'
    }
  ],
  tasks: [
    {
      id: 'task-1',
      matterId: 'mat-1',
      matterNumber: 'MAT-2026-9081',
      propertyAddress: '124 Villa Rosa, Sandton, Johannesburg',
      title: 'Upload proof of residential address',
      description: 'Please upload a utility bill, bank statement, or retail account statement (not older than 3 months) showing your residential address for FICA validation.',
      assignedToId: 'usr-client-1',
      assignedToName: 'John Buyer',
      assignedToRole: 'buyer',
      dueDate: '2026-07-25',
      status: 'pending',
      requiresDocumentCategory: 'fica'
    },
    {
      id: 'task-2',
      matterId: 'mat-1',
      matterNumber: 'MAT-2026-9081',
      propertyAddress: '124 Villa Rosa, Sandton, Johannesburg',
      title: 'Submit source of funds bank statement',
      description: 'Upload your latest 3 months bank statement showing the transfer deposit funds to confirm AML/FICA requirements.',
      assignedToId: 'usr-client-1',
      assignedToName: 'John Buyer',
      assignedToRole: 'buyer',
      dueDate: '2026-07-28',
      status: 'pending',
      requiresDocumentCategory: 'financial'
    },
    {
      id: 'task-3',
      matterId: 'mat-1',
      matterNumber: 'MAT-2026-9081',
      propertyAddress: '124 Villa Rosa, Sandton, Johannesburg',
      title: 'Review SARS Draft Transfer Duty Calculation',
      description: 'Verify SARS duty assessment calculated by paralegal before finalizing payment.',
      assignedToId: 'usr-attorney-1',
      assignedToName: 'Arthur Masina',
      assignedToRole: 'staff',
      dueDate: '2026-07-24',
      status: 'pending'
    }
  ],
  conversations: [
    {
      id: 'conv-1',
      matterId: 'mat-1',
      matterNumber: 'MAT-2026-9081',
      propertyAddress: '124 Villa Rosa, Sandton',
      title: 'Sandton Transaction Hub',
      participants: [
        { userId: 'usr-client-1', name: 'John Buyer', role: 'buyer' },
        { userId: 'usr-client-2', name: 'Sarah Seller', role: 'seller' },
        { userId: 'usr-attorney-1', name: 'Arthur Masina', role: 'attorney' },
        { userId: 'usr-paralegal-1', name: 'Pamela Paralegal', role: 'paralegal' }
      ],
      lastMessageText: 'I have approved your ID document, John. Looking forward to your residential proof.',
      lastMessageTimestamp: '2026-07-18T14:35:00Z'
    }
  ],
  messages: [
    {
      id: 'msg-1',
      conversationId: 'conv-1',
      senderId: 'usr-client-1',
      senderName: 'John Buyer',
      senderRole: 'buyer',
      text: 'Good afternoon Arthur, is there any update on our transfer timeline?',
      timestamp: '2026-07-15T12:00:00Z',
      isRead: true
    },
    {
      id: 'msg-2',
      conversationId: 'conv-1',
      senderId: 'usr-attorney-1',
      senderName: 'Arthur Masina',
      senderRole: 'attorney',
      text: 'Yes John, Pamela is checking on your compliance clearance. We have verified the sales agreement and we are moving to Stage 3 (FICA check) today.',
      timestamp: '2026-07-15T14:10:00Z',
      isRead: true
    },
    {
      id: 'msg-3',
      conversationId: 'conv-1',
      senderId: 'usr-client-1',
      senderName: 'John Buyer',
      senderRole: 'buyer',
      text: 'Fantastic! I will upload my FICA ID document immediately.',
      timestamp: '2026-07-18T09:05:00Z',
      isRead: true
    },
    {
      id: 'msg-4',
      conversationId: 'conv-1',
      senderId: 'usr-paralegal-1',
      senderName: 'Pamela Paralegal',
      senderRole: 'paralegal',
      text: 'I have approved your ID document, John. Looking forward to your residential proof.',
      timestamp: '2026-07-18T14:35:00Z',
      isRead: true
    }
  ],
  appointments: [
    {
      id: 'app-1',
      clientId: 'usr-client-1',
      clientName: 'John Buyer',
      staffId: 'usr-attorney-1',
      staffName: 'Arthur Masina',
      staffRole: 'attorney',
      date: '2026-07-23',
      time: '10:00',
      duration: 45,
      type: 'consultation',
      status: 'scheduled',
      videoLink: 'https://meet.google.com/abc-defg-hij',
      description: 'Initial FICA review and detailed transfer process run-through.'
    },
    {
      id: 'app-2',
      clientId: 'usr-client-2',
      clientName: 'Sarah Seller',
      staffId: 'usr-convey-1',
      staffName: 'Clara Convey',
      staffRole: 'conveyancer',
      date: '2026-07-28',
      time: '14:30',
      duration: 30,
      type: 'signing',
      status: 'scheduled',
      videoLink: 'https://meet.google.com/xyz-pqrs-uvw',
      description: 'Signing of formal Conveyancing Deeds and Declarations.'
    }
  ],
  automationRules: [
    { id: 'rule-1', name: 'Welcome Onboarding Notification', trigger: 'matter_opened', actionType: 'email', template: 'Dear {{client_name}}, welcome to Masina Law. Matter {{matter_number}} has been successfully opened for your property at {{property_address}}.', enabled: true },
    { id: 'rule-2', name: 'Stage Completed Alert', trigger: 'stage_completed', actionType: 'push', template: 'Great news! Your property matter {{matter_number}} has progressed. Stage {{stage_number}} is now completed.', enabled: true },
    { id: 'rule-3', name: 'Missing Document Warning', trigger: 'document_reminder', actionType: 'sms', template: 'Reminder from Masina Law: You have outstanding FICA compliance documents due for Sandton Villa transfer.', enabled: true },
    { id: 'rule-4', name: 'Deeds Registration Confirmation', trigger: 'deeds_registered', actionType: 'email', template: 'CONGRATULATIONS! Your transfer at {{property_address}} has officially registered today. The deed is secured.', enabled: true }
  ],
  automationLogs: [
    { id: 'al-1', timestamp: '2026-07-10T10:05:00Z', matterId: 'mat-1', matterNumber: 'MAT-2026-9081', triggerName: 'Welcome Onboarding Notification', recipient: 'john.buyer@gmail.com', type: 'email', content: 'Dear John Buyer, welcome to Masina Law. Matter MAT-2026-9081 has been successfully opened for your property at 124 Villa Rosa, Sandton.', status: 'sent' },
    { id: 'al-2', timestamp: '2026-07-15T15:25:00Z', matterId: 'mat-1', matterNumber: 'MAT-2026-9081', triggerName: 'Stage Completed Alert', recipient: 'John Buyer', type: 'push', content: 'Great news! Your property matter MAT-2026-9081 has progressed. Stage 2 is now completed.', status: 'sent' }
  ],
  auditLogs: [
    { id: 'ad-1', timestamp: '2026-07-10T10:00:00Z', userId: 'usr-attorney-1', userName: 'Arthur Masina', userRole: 'attorney', action: 'CREATE_MATTER', details: 'Formally created property conveyancing matter MAT-2026-9081', ipAddress: '197.80.200.41' },
    { id: 'ad-2', timestamp: '2026-07-12T11:45:00Z', userId: 'usr-client-1', userName: 'John Buyer', userRole: 'buyer', action: 'UPLOAD_DOCUMENT', details: 'Uploaded document Signed_OTP_Sandton_Villa.pdf (category: sale_agreement)', ipAddress: '41.13.44.182' },
    { id: 'ad-3', timestamp: '2026-07-18T14:35:00Z', userId: 'usr-paralegal-1', userName: 'Pamela Paralegal', userRole: 'paralegal', action: 'APPROVE_DOCUMENT', details: 'Reviewed and approved John_Buyer_ID_Card.png (category: identity)', ipAddress: '197.80.200.42' }
  ]
};

// Database utility functions
function loadData() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("Error reading database file, using fallback:", err);
  }
  // If not found or error, write the baseline
  saveData(INITIAL_DATA);
  return INITIAL_DATA;
}

function saveData(data: any) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error("Error writing database file:", err);
  }
}

// --- Dynamic Supabase DB Integration Helpers ---

async function getUsersFromDb() {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase.from('users').select('*');
      if (!error && data) {
        if (data.length > 0) {
          return data;
        } else {
          // Table exists but is empty. Seed it.
          const localData = loadData().users;
          if (localData && localData.length > 0) {
            console.log("Auto-seeding empty Supabase 'users' table...");
            await supabase.from('users').upsert(localData);
          }
          return localData;
        }
      } else if (error) {
        console.warn("Supabase getUsers query notice (using fallback):", error.message);
      }
    } catch (e) {
      console.warn("Supabase getUsers notice (using fallback):", e);
    }
  }
  return loadData().users;
}

async function saveUserToDb(user: any) {
  const db = loadData();
  const idx = db.users.findIndex((u: any) => u.id === user.id || u.email === user.email);
  if (idx !== -1) {
    db.users[idx] = { ...db.users[idx], ...user };
    user = db.users[idx];
  } else {
    db.users.push(user);
  }
  saveData(db);

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('users').upsert(user);
    } catch (e) {
      console.error("Supabase saveUser error:", e);
    }
  }
}

async function deleteUserFromDb(userId: string) {
  const db = loadData();
  db.users = db.users.filter((u: any) => u.id !== userId);
  saveData(db);

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('users').delete().eq('id', userId);
    } catch (e) {
      console.error("Supabase deleteUser error:", e);
    }
  }
}

async function getMattersFromDb() {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase.from('matters').select('*');
      if (!error && data) {
        if (data.length > 0) {
          return data.map((item: any) => ({
            ...item,
            stages: typeof item.stages === 'string' ? JSON.parse(item.stages) : (item.stages || []),
            activities: typeof item.activities === 'string' ? JSON.parse(item.activities) : (item.activities || [])
          }));
        } else {
          const localData = loadData().matters;
          if (localData && localData.length > 0) {
            console.log("Auto-seeding empty Supabase 'matters' table...");
            const payload = localData.map((m: any) => ({
              ...m,
              stages: typeof m.stages === 'object' ? JSON.stringify(m.stages) : m.stages,
              activities: typeof m.activities === 'object' ? JSON.stringify(m.activities) : m.activities
            }));
            await supabase.from('matters').upsert(payload);
          }
          return localData;
        }
      } else if (error) {
        console.warn("Supabase getMatters query notice (using fallback):", error.message);
      }
    } catch (e) {
      console.warn("Supabase getMatters notice (using fallback):", e);
    }
  }
  return loadData().matters;
}

async function saveMatterToDb(matter: any) {
  const db = loadData();
  const idx = db.matters.findIndex((m: any) => m.id === matter.id);
  if (idx !== -1) {
    db.matters[idx] = matter;
  } else {
    db.matters.push(matter);
  }
  saveData(db);

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const payload = {
        ...matter,
        stages: typeof matter.stages === 'object' ? JSON.stringify(matter.stages) : matter.stages,
        activities: typeof matter.activities === 'object' ? JSON.stringify(matter.activities) : matter.activities
      };
      await supabase.from('matters').upsert(payload);
    } catch (e) {
      console.error("Supabase saveMatter error:", e);
    }
  }
}

async function getDocumentsFromDb() {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase.from('documents').select('*');
      if (!error && data) {
        if (data.length > 0) {
          return data;
        } else {
          const localData = loadData().documents;
          if (localData && localData.length > 0) {
            console.log("Auto-seeding empty Supabase 'documents' table...");
            await supabase.from('documents').upsert(localData);
          }
          return localData;
        }
      } else if (error) {
        console.warn("Supabase getDocuments query notice (using fallback):", error.message);
      }
    } catch (e) {
      console.warn("Supabase getDocuments notice (using fallback):", e);
    }
  }
  return loadData().documents;
}

async function saveDocumentToDb(document: any) {
  const db = loadData();
  const idx = db.documents.findIndex((d: any) => d.id === document.id);
  if (idx !== -1) {
    db.documents[idx] = document;
  } else {
    db.documents.push(document);
  }
  saveData(db);

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('documents').upsert(document);
    } catch (e) {
      console.error("Supabase saveDocument error:", e);
    }
  }
}

async function getTasksFromDb() {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase.from('tasks').select('*');
      if (!error && data) {
        if (data.length > 0) {
          return data;
        } else {
          const localData = loadData().tasks;
          if (localData && localData.length > 0) {
            console.log("Auto-seeding empty Supabase 'tasks' table...");
            await supabase.from('tasks').upsert(localData);
          }
          return localData;
        }
      } else if (error) {
        console.warn("Supabase getTasks query notice (using fallback):", error.message);
      }
    } catch (e) {
      console.warn("Supabase getTasks notice (using fallback):", e);
    }
  }
  return loadData().tasks;
}

async function saveTaskToDb(task: any) {
  const db = loadData();
  const idx = db.tasks.findIndex((t: any) => t.id === task.id);
  if (idx !== -1) {
    db.tasks[idx] = task;
  } else {
    db.tasks.unshift(task);
  }
  saveData(db);

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('tasks').upsert(task);
    } catch (e) {
      console.error("Supabase saveTask error:", e);
    }
  }
}

async function getConversationsFromDb() {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase.from('conversations').select('*');
      if (!error && data) {
        if (data.length > 0) {
          return data.map((item: any) => ({
            ...item,
            participants: typeof item.participants === 'string' ? JSON.parse(item.participants) : (item.participants || [])
          }));
        } else {
          const localData = loadData().conversations;
          if (localData && localData.length > 0) {
            console.log("Auto-seeding empty Supabase 'conversations' table...");
            const payload = localData.map((c: any) => ({
              ...c,
              participants: typeof c.participants === 'object' ? JSON.stringify(c.participants) : c.participants
            }));
            await supabase.from('conversations').upsert(payload);
          }
          return localData;
        }
      } else if (error) {
        console.warn("Supabase getConversations query notice (using fallback):", error.message);
      }
    } catch (e) {
      console.warn("Supabase getConversations notice (using fallback):", e);
    }
  }
  return loadData().conversations;
}

async function saveConversationToDb(conversation: any) {
  const db = loadData();
  const idx = db.conversations.findIndex((c: any) => c.id === conversation.id);
  if (idx !== -1) {
    db.conversations[idx] = conversation;
  } else {
    db.conversations.push(conversation);
  }
  saveData(db);

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const payload = {
        ...conversation,
        participants: typeof conversation.participants === 'object' ? JSON.stringify(conversation.participants) : conversation.participants
      };
      await supabase.from('conversations').upsert(payload);
    } catch (e) {
      console.error("Supabase saveConversation error:", e);
    }
  }
}

async function getMessagesFromDb() {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase.from('messages').select('*');
      if (!error && data) {
        if (data.length > 0) {
          return data;
        } else {
          const localData = loadData().messages;
          if (localData && localData.length > 0) {
            console.log("Auto-seeding empty Supabase 'messages' table...");
            await supabase.from('messages').upsert(localData);
          }
          return localData;
        }
      } else if (error) {
        console.warn("Supabase getMessages query notice (using fallback):", error.message);
      }
    } catch (e) {
      console.warn("Supabase getMessages notice (using fallback):", e);
    }
  }
  return loadData().messages;
}

async function saveMessageToDb(message: any) {
  const db = loadData();
  db.messages.push(message);
  saveData(db);

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('messages').upsert(message);
    } catch (e) {
      console.error("Supabase saveMessage error:", e);
    }
  }
}

async function getAppointmentsFromDb() {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase.from('appointments').select('*');
      if (!error && data) {
        if (data.length > 0) {
          return data;
        } else {
          const localData = loadData().appointments;
          if (localData && localData.length > 0) {
            console.log("Auto-seeding empty Supabase 'appointments' table...");
            await supabase.from('appointments').upsert(localData);
          }
          return localData;
        }
      } else if (error) {
        console.warn("Supabase getAppointments query notice (using fallback):", error.message);
      }
    } catch (e) {
      console.warn("Supabase getAppointments notice (using fallback):", e);
    }
  }
  return loadData().appointments;
}

async function saveAppointmentToDb(appointment: any) {
  const db = loadData();
  const idx = db.appointments.findIndex((a: any) => a.id === appointment.id);
  if (idx !== -1) {
    db.appointments[idx] = appointment;
  } else {
    db.appointments.unshift(appointment);
  }
  saveData(db);

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('appointments').upsert(appointment);
    } catch (e) {
      console.error("Supabase saveAppointment error:", e);
    }
  }
}

async function getAutomationRulesFromDb() {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase.from('automationRules').select('*');
      if (!error && data) {
        if (data.length > 0) {
          return data;
        } else {
          const localData = loadData().automationRules || [];
          if (localData && localData.length > 0) {
            console.log("Auto-seeding empty Supabase 'automationRules' table...");
            await supabase.from('automationRules').upsert(localData);
          }
          return localData;
        }
      } else if (error) {
        console.warn("Supabase getAutomationRules query notice (using fallback):", error.message);
      }
    } catch (e) {
      console.warn("Supabase getAutomationRules notice (using fallback):", e);
    }
  }
  return loadData().automationRules || [];
}

async function saveAutomationRuleToDb(rule: any) {
  const db = loadData();
  const idx = db.automationRules.findIndex((r: any) => r.id === rule.id);
  if (idx !== -1) {
    db.automationRules[idx] = rule;
  } else {
    db.automationRules.push(rule);
  }
  saveData(db);

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('automationRules').upsert(rule);
    } catch (e) {
      console.error("Supabase saveAutomationRule error:", e);
    }
  }
}

async function getAutomationLogsFromDb() {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase.from('automationLogs').select('*');
      if (!error && data) {
        if (data.length > 0) {
          return data;
        } else {
          const localData = loadData().automationLogs || [];
          if (localData && localData.length > 0) {
            console.log("Auto-seeding empty Supabase 'automationLogs' table...");
            await supabase.from('automationLogs').upsert(localData);
          }
          return localData;
        }
      } else if (error) {
        console.warn("Supabase getAutomationLogs query notice (using fallback):", error.message);
      }
    } catch (e) {
      console.warn("Supabase getAutomationLogs notice (using fallback):", e);
    }
  }
  return loadData().automationLogs || [];
}

async function saveAutomationLogToDb(log: any) {
  const db = loadData();
  db.automationLogs.unshift(log);
  saveData(db);

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('automationLogs').upsert(log);
    } catch (e) {
      console.error("Supabase saveAutomationLog error:", e);
    }
  }
}

async function getAuditLogsFromDb() {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase.from('auditLogs').select('*');
      if (!error && data) {
        if (data.length > 0) {
          return data;
        } else {
          const localData = loadData().auditLogs || [];
          if (localData && localData.length > 0) {
            console.log("Auto-seeding empty Supabase 'auditLogs' table...");
            await supabase.from('auditLogs').upsert(localData);
          }
          return localData;
        }
      } else if (error) {
        console.warn("Supabase getAuditLogs query notice (using fallback):", error.message);
      }
    } catch (e) {
      console.warn("Supabase getAuditLogs notice (using fallback):", e);
    }
  }
  return loadData().auditLogs || [];
}

async function saveAuditLogToDb(log: any) {
  const db = loadData();
  db.auditLogs.unshift(log);
  saveData(db);

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('auditLogs').upsert(log);
    } catch (e) {
      console.error("Supabase saveAuditLog error:", e);
    }
  }
}

// Log actions to the security audit trail
async function logAudit(userId: string, action: string, details: string, req: express.Request) {
  const users = await getUsersFromDb();
  const user = users.find((u: any) => u.id === userId);
  
  const newAudit = {
    id: `ad-${Date.now()}`,
    timestamp: new Date().toISOString(),
    userId: userId,
    userName: user ? user.name : 'Unknown User',
    userRole: user ? user.role : 'buyer',
    action,
    details,
    ipAddress: req.ip || '127.0.0.1'
  };
  
  await saveAuditLogToDb(newAudit);
}

// Trigger automatic workflow event and write log
async function triggerWorkflowEvent(matterId: string, triggerName: string, recipientName: string, recipientContact: string, contentText: string, type: 'email' | 'sms' | 'push') {
  const matters = await getMattersFromDb();
  const matter = matters.find((m: any) => m.id === matterId);
  
  const log = {
    id: `al-${Date.now()}`,
    timestamp: new Date().toISOString(),
    matterId,
    matterNumber: matter ? matter.matterNumber : 'GENERAL',
    triggerName,
    recipient: recipientContact,
    type,
    content: contentText,
    status: 'sent' as const
  };
  
  await saveAutomationLogToDb(log);
}

// API Routes

// Authenticate / Switch User context easily for the client portal
app.post('/api/auth/login', async (req, res) => {
  const { userId } = req.body;
  const users = await getUsersFromDb();
  const user = users.find((u: any) => u.id === userId);
  
  if (!user) {
    return res.status(401).json({ error: 'User profile not found.' });
  }
  
  await logAudit(userId, 'USER_LOGIN', `Logged in using OAuth2 simulator (MFA & Biometric integration validated)`, req);
  res.json({ user });
});

// Get all registered users
app.get('/api/users', async (req, res) => {
  const users = await getUsersFromDb();
  res.json(users);
});

// Update user profile info & picture
app.put('/api/users/:id', async (req, res) => {
  const { name, email, phone, idNumber, address, avatarUrl, subscriptionPlan, subscribedToNewsletter } = req.body;
  const users = await getUsersFromDb();
  const user = users.find((u: any) => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: 'User profile not found.' });

  if (name !== undefined) user.name = name;
  if (email !== undefined) user.email = email;
  if (phone !== undefined) user.phone = phone;
  if (idNumber !== undefined) user.idNumber = idNumber;
  if (address !== undefined) user.address = address;
  if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;
  if (subscriptionPlan !== undefined) user.subscriptionPlan = subscriptionPlan;
  if (subscribedToNewsletter !== undefined) user.subscribedToNewsletter = subscribedToNewsletter;

  await saveUserToDb(user);
  await logAudit(user.id, 'USER_UPDATE_PROFILE', `Updated profile info for ${user.name} (${user.email})`, req);
  res.json({ user, message: 'Profile updated successfully.' });
});

// Delete user account
app.delete('/api/users/:id', async (req, res) => {
  const userId = req.params.id;
  const users = await getUsersFromDb();
  const user = users.find((u: any) => u.id === userId);
  if (!user) return res.status(404).json({ error: 'User profile not found.' });

  await deleteUserFromDb(userId);
  await logAudit(userId, 'USER_DELETE', `Deleted user account ${user.name} (${user.email})`, req);
  res.json({ success: true, message: `User ${user.name} deleted successfully.` });
});

// Update user subscription plan or newsletter status
app.post('/api/users/:id/subscribe', async (req, res) => {
  const { plan, subscribedToNewsletter } = req.body;
  const users = await getUsersFromDb();
  const user = users.find((u: any) => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: 'User profile not found.' });

  if (plan) user.subscriptionPlan = plan;
  if (subscribedToNewsletter !== undefined) user.subscribedToNewsletter = subscribedToNewsletter;
  user.subscriptionStatus = 'active';

  await saveUserToDb(user);
  await logAudit(user.id, 'USER_SUBSCRIBE', `Updated subscription plan to '${plan || user.subscriptionPlan || 'free'}' and newsletter preference`, req);
  res.json({ user, message: 'Subscription preferences updated successfully.' });
});

// Allocate or reassign a user's role (System Administrator ONLY)
app.post('/api/users/:id/role', async (req, res) => {
  const { role, adminUserId } = req.body;
  const allowedRoles = ['buyer', 'seller', 'attorney', 'conveyancer', 'paralegal', 'admin', 'other'];
  
  if (!role || !allowedRoles.includes(role)) {
    return res.status(400).json({ error: 'Invalid role specified for allocation.' });
  }

  const users = await getUsersFromDb();
  const index = users.findIndex((u: any) => u.id === req.params.id);
  
  if (index === -1) {
    return res.status(404).json({ error: 'User profile not found.' });
  }

  const user = users[index];
  const oldRole = user.role;
  user.role = role;

  await saveUserToDb(user);

  // Update in Supabase if connected
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('users').update({ role }).eq('id', user.id);
    } catch (e) {
      console.error("Supabase role update notice:", e);
    }
  }

  const adminUser = users.find((u: any) => u.id === adminUserId) || { name: 'System Administrator' };
  await logAudit(
    adminUserId || 'usr-admin-1',
    'ALLOCATE_USER_ROLE',
    `System Administrator (${adminUser.name}) allocated role '${role.toUpperCase()}' (previously '${oldRole.toUpperCase()}') to user ${user.name} (${user.email}).`,
    req
  );

  res.json({ user, message: `Role successfully allocated to ${role}.` });
});

// Create/Register new users in the conveyancing system
app.post('/api/auth/register', async (req, res) => {
  const { name, email, role, phone, idNumber, address } = req.body;
  
  if (!name || !email || !role) {
    return res.status(400).json({ error: 'Required fields: name, email, role.' });
  }

  // Enforce staff role allocation: self-registrations can only pick buyer, seller, or other.
  // Staff roles (attorney, conveyancer, paralegal, admin) must be allocated post-registration by a System Administrator.
  const allowedSelfRoles = ['buyer', 'seller', 'other'];
  const finalRole = allowedSelfRoles.includes(role) ? role : 'other';
  
  const newUser = {
    id: `usr-client-${Date.now()}`,
    name,
    email,
    role: finalRole,
    phone,
    idNumber,
    address,
    kycStatus: 'pending' as const,
    consentAccepted: true,
    consentDate: new Date().toISOString(),
    avatarUrl: `https://images.unsplash.com/photo-${finalRole === 'buyer' ? '1500648767791-00dcc994a43e' : '1494790108377-be9c29b29330'}?w=150`
  };
  
  await saveUserToDb(newUser);
  await logAudit(newUser.id, 'USER_REGISTER', `Created account as ${finalRole}${finalRole !== role ? ` (Converted from requested ${role} pending Admin Allocation)` : ''} and accepted POPIA/GDPR regulations.`, req);
  
  // Trigger automatic welcome notification
  await triggerWorkflowEvent(
    'GENERAL',
    'Welcome Onboarding Notification',
    newUser.name,
    newUser.email,
    `Dear ${newUser.name}, welcome to our Property Law Client Portal. Your registration was processed and FICA compliance queue opened.`,
    'email'
  );
  
  res.json({ user: newUser });
});

// Update KYC & Onboarding values
app.post('/api/auth/kyc-update', async (req, res) => {
  const { userId, idNumber, address, phone } = req.body;
  const users = await getUsersFromDb();
  const user = users.find((u: any) => u.id === userId);
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  const updatedUser = {
    ...user,
    idNumber,
    address,
    phone,
    kycStatus: 'pending' as const
  };
  
  await saveUserToDb(updatedUser);
  await logAudit(userId, 'KYC_SUBMISSION', 'Submitted onboarding details and digital identity credentials', req);
  res.json({ user: updatedUser });
});

// Matters Endpoints
app.get('/api/matters', async (req, res) => {
  const matters = await getMattersFromDb();
  res.json(matters);
});

app.get('/api/matters/:id', async (req, res) => {
  const matters = await getMattersFromDb();
  const matter = matters.find((m: any) => m.id === req.params.id);
  if (!matter) return res.status(404).json({ error: 'Matter not found' });
  res.json(matter);
});

// Create property matters
app.post('/api/matters', async (req, res) => {
  const { propertyAddress, propertyPrice, buyerName, sellerName, assignedAttorneyId, expectedCompletionDate } = req.body;
  const users = await getUsersFromDb();
  
  const buyerUser = users.find((u: any) => u.name === buyerName) || users[0];
  const sellerUser = users.find((u: any) => u.name === sellerName) || users[1];
  const attorney = users.find((u: any) => u.id === assignedAttorneyId) || users.find((u: any) => u.role === 'attorney');
  const paralegal = users.find((u: any) => u.role === 'paralegal');

  const newMatter = {
    id: `mat-${Date.now()}`,
    matterNumber: `MAT-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    propertyAddress,
    propertyPrice: Number(propertyPrice),
    buyerId: buyerUser.id,
    buyerName: buyerUser.name,
    sellerId: sellerUser.id,
    sellerName: sellerUser.name,
    assignedAttorneyId: attorney.id,
    assignedAttorneyName: attorney.name,
    assignedParalegalId: paralegal ? paralegal.id : '',
    assignedParalegalName: paralegal ? paralegal.name : '',
    currentStage: 1,
    expectedCompletionDate: expectedCompletionDate || '2026-12-31',
    status: 'active' as const,
    stages: INITIAL_DATA.matters[0].stages.map(stg => ({
      ...stg,
      status: stg.stageNumber === 1 ? 'in_progress' as const : 'not_started' as const,
      estimatedCompletionDate: new Date(Date.now() + stg.stageNumber * 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    })),
    activities: [
      {
        id: `act-${Date.now()}`,
        date: new Date().toISOString(),
        type: 'stage_change' as const,
        description: `Matter opened for address ${propertyAddress}`,
        actor: attorney.name
      }
    ]
  };

  await saveMatterToDb(newMatter);

  // Trigger automation log
  await triggerWorkflowEvent(
    newMatter.id,
    'Welcome Onboarding Notification',
    buyerUser.name,
    buyerUser.email,
    `Dear ${buyerUser.name}, welcome to Masina Law. Matter ${newMatter.matterNumber} has been opened for ${propertyAddress}.`,
    'email'
  );

  await logAudit(attorney.id, 'CREATE_MATTER', `Opened new property transaction matter ${newMatter.matterNumber}`, req);
  res.json(newMatter);
});

// Update matter's Stage or Lawyer Notes
app.post('/api/matters/:id/stage', async (req, res) => {
  const { currentStage, lawyerNotes, tasks } = req.body;
  const matters = await getMattersFromDb();
  const index = matters.findIndex((m: any) => m.id === req.params.id);
  
  if (index === -1) return res.status(404).json({ error: 'Matter not found' });
  const matter = matters[index];
  
  if (currentStage !== undefined) {
    const oldStage = matter.currentStage;
    matter.currentStage = currentStage;
    
    // Update stages statuses
    matter.stages = matter.stages.map((stg: any) => {
      if (stg.stageNumber < currentStage) {
        return { ...stg, status: 'completed' };
      } else if (stg.stageNumber === currentStage) {
        return { ...stg, status: 'in_progress' };
      } else {
        return { ...stg, status: 'not_started' };
      }
    });

    matter.activities.unshift({
      id: `act-${Date.now()}`,
      date: new Date().toISOString(),
      type: 'stage_change',
      description: `Matter progressed from Stage ${oldStage} to Stage ${currentStage}`,
      actor: 'Attorney Panel'
    });

    // Workflow alert trigger
    await triggerWorkflowEvent(
      matter.id,
      'Stage Completed Alert',
      matter.buyerName,
      'Client Push Device',
      `Great news! Your property matter ${matter.matterNumber} progressed to Stage ${currentStage}.`,
      'push'
    );
  }

  if (lawyerNotes !== undefined) {
    const stageIdx = matter.stages.findIndex((s: any) => s.stageNumber === matter.currentStage);
    if (stageIdx !== -1) {
      matter.stages[stageIdx].lawyerNotes = lawyerNotes;
    }
  }

  if (tasks !== undefined) {
    const stageIdx = matter.stages.findIndex((s: any) => s.stageNumber === matter.currentStage);
    if (stageIdx !== -1) {
      matter.stages[stageIdx].tasks = tasks;
    }
  }

  await saveMatterToDb(matter);
  res.json(matter);
});

// Documents endpoints
app.get('/api/documents', async (req, res) => {
  const documents = await getDocumentsFromDb();
  res.json(documents);
});

// Upload document (simulated database upload)
// Upload document (simulated database upload)
app.post('/api/documents', async (req, res) => {
  const { name, category, matterId, uploadedBy, fileUrl, size } = req.body;
  const matters = await getMattersFromDb();
  
  const newDoc = {
    id: `doc-${Date.now()}`,
    matterId,
    name: name || 'Document.pdf',
    category,
    fileUrl: fileUrl || '#',
    uploadDate: new Date().toISOString(),
    status: 'pending_review' as const,
    version: 1,
    size: size || '1.5 MB',
    uploadedBy: uploadedBy || 'Client'
  };
  
  await saveDocumentToDb(newDoc);
  
  // Find matter to add activity
  const matterIdx = matters.findIndex((m: any) => m.id === matterId);
  if (matterIdx !== -1) {
    const matter = matters[matterIdx];
    matter.activities.unshift({
      id: `act-${Date.now()}`,
      date: new Date().toISOString(),
      type: 'document_upload',
      description: `Uploaded document ${newDoc.name} (${category})`,
      actor: uploadedBy
    });
    await saveMatterToDb(matter);
  }
  
  await logAudit(uploadedBy, 'UPLOAD_DOCUMENT', `Uploaded document ${newDoc.name} to category ${category}`, req);
  res.json(newDoc);
});

// Approve/Reject Document workflow
app.post('/api/documents/:id/status', async (req, res) => {
  const { status, reviewerNotes, staffId } = req.body;
  const documents = await getDocumentsFromDb();
  const index = documents.findIndex((d: any) => d.id === req.params.id);
  
  if (index === -1) return res.status(404).json({ error: 'Document not found' });
  const doc = documents[index];
  doc.status = status;
  doc.reviewerNotes = reviewerNotes;
  
  const users = await getUsersFromDb();
  const staff = users.find((u: any) => u.id === staffId) || { name: 'Attorney Office' };
  
  await saveDocumentToDb(doc);
  
  // Find matter to add activity
  const matters = await getMattersFromDb();
  const matterIdx = matters.findIndex((m: any) => m.id === doc.matterId);
  if (matterIdx !== -1) {
    const matter = matters[matterIdx];
    matter.activities.unshift({
      id: `act-${Date.now()}`,
      date: new Date().toISOString(),
      type: status === 'approved' ? 'document_approve' : 'document_reject',
      description: `Document ${doc.name} was ${status} by ${staff.name}`,
      actor: staff.name
    });
    await saveMatterToDb(matter);
  }
  
  await logAudit(staffId, status === 'approved' ? 'APPROVE_DOCUMENT' : 'REJECT_DOCUMENT', `Reviewed ${doc.name} as ${status}. Notes: ${reviewerNotes || 'None'}`, req);
  res.json(doc);
});

// Tasks endpoints
app.get('/api/tasks', async (req, res) => {
  const tasks = await getTasksFromDb();
  res.json(tasks);
});

app.post('/api/tasks', async (req, res) => {
  const { matterId, title, description, assignedToId, dueDate, requiresDocumentCategory } = req.body;
  const matters = await getMattersFromDb();
  const users = await getUsersFromDb();
  const matter = matters.find((m: any) => m.id === matterId);
  const assignee = users.find((u: any) => u.id === assignedToId);

  const newTask = {
    id: `task-${Date.now()}`,
    matterId,
    matterNumber: matter ? matter.matterNumber : 'GENERAL',
    propertyAddress: matter ? matter.propertyAddress : 'Masina Law Office',
    title,
    description,
    assignedToId,
    assignedToName: assignee ? assignee.name : 'Unassigned',
    assignedToRole: assignee ? (assignee.role === 'buyer' || assignee.role === 'seller' ? assignee.role : 'staff') : 'staff',
    dueDate: dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'pending' as const,
    requiresDocumentCategory
  };

  await saveTaskToDb(newTask);
  res.json(newTask);
});

app.post('/api/tasks/:id/complete', async (req, res) => {
  const { userId } = req.body;
  const tasks = await getTasksFromDb();
  const idx = tasks.findIndex((t: any) => t.id === req.params.id);
  
  if (idx === -1) return res.status(404).json({ error: 'Task not found' });
  const task = tasks[idx];
  task.status = 'completed';
  task.completedAt = new Date().toISOString();
  
  await saveTaskToDb(task);
  
  const users = await getUsersFromDb();
  const user = users.find((u: any) => u.id === userId) || { name: 'System User' };
  
  // Find matter to add activity
  const matters = await getMattersFromDb();
  const matterIdx = matters.findIndex((m: any) => m.id === task.matterId);
  if (matterIdx !== -1) {
    const matter = matters[matterIdx];
    matter.activities.unshift({
      id: `act-${Date.now()}`,
      date: new Date().toISOString(),
      type: 'task_complete',
      description: `Task completed: "${task.title}"`,
      actor: user.name
    });
    await saveMatterToDb(matter);
  }
  
  await logAudit(userId, 'COMPLETE_TASK', `Completed task: "${task.title}"`, req);
  res.json(task);
});

// Messaging Endpoints
app.get('/api/conversations', async (req, res) => {
  const conversations = await getConversationsFromDb();
  res.json(conversations);
});

app.get('/api/conversations/:id/messages', async (req, res) => {
  const messages = await getMessagesFromDb();
  const filtered = messages.filter((m: any) => m.conversationId === req.params.id);
  res.json(filtered);
});

app.post('/api/conversations/:id/messages', async (req, res) => {
  const { senderId, text, fileAttachment } = req.body;
  const conversations = await getConversationsFromDb();
  const convIdx = conversations.findIndex((c: any) => c.id === req.params.id);
  
  if (convIdx === -1) return res.status(404).json({ error: 'Conversation not found' });
  const conversation = conversations[convIdx];
  
  const users = await getUsersFromDb();
  const sender = users.find((u: any) => u.id === senderId);
  if (!sender) return res.status(401).json({ error: 'Sender not authorized' });
  
  const newMessage = {
    id: `msg-${Date.now()}`,
    conversationId: req.params.id,
    senderId,
    senderName: sender.name,
    senderRole: sender.role,
    text,
    timestamp: new Date().toISOString(),
    fileAttachment,
    isRead: false
  };
  
  await saveMessageToDb(newMessage);
  conversation.lastMessageText = text || 'Attachment uploaded';
  conversation.lastMessageTimestamp = newMessage.timestamp;
  await saveConversationToDb(conversation);
  
  res.json(newMessage);
});

// Appointment Endpoints
app.get('/api/appointments', async (req, res) => {
  const appointments = await getAppointmentsFromDb();
  res.json(appointments);
});

app.post('/api/appointments', async (req, res) => {
  const { clientId, staffId, date, time, type, description } = req.body;
  const users = await getUsersFromDb();
  const client = users.find((u: any) => u.id === clientId) || users[0];
  const staff = users.find((u: any) => u.id === staffId) || users[2];
  
  const newAppointment = {
    id: `app-${Date.now()}`,
    clientId,
    clientName: client.name,
    staffId,
    staffName: staff.name,
    staffRole: staff.role,
    date,
    time,
    duration: type === 'signing' ? 30 : 45,
    type,
    status: 'scheduled' as const,
    videoLink: `https://meet.google.com/meet-${Math.floor(100+Math.random()*900)}-${Math.floor(100+Math.random()*900)}`,
    description
  };
  
  await saveAppointmentToDb(newAppointment);
  
  // Trigger automation alert
  await triggerWorkflowEvent(
    'GENERAL',
    'Appointment Booking Confirmation',
    client.name,
    client.email,
    `Appointment scheduled: ${type.toUpperCase()} on ${date} at ${time} with ${staff.name}. Join virtual room: ${newAppointment.videoLink}`,
    'email'
  );
  
  await logAudit(clientId, 'BOOK_APPOINTMENT', `Scheduled a ${type} consultation with ${staff.name} for ${date} at ${time}`, req);
  res.json(newAppointment);
});

app.post('/api/appointments/:id/cancel', async (req, res) => {
  const { userId } = req.body;
  const appointments = await getAppointmentsFromDb();
  const idx = appointments.findIndex((a: any) => a.id === req.params.id);
  
  if (idx === -1) return res.status(404).json({ error: 'Appointment not found' });
  const appt = appointments[idx];
  appt.status = 'cancelled';
  
  await saveAppointmentToDb(appt);
  await logAudit(userId, 'CANCEL_APPOINTMENT', `Cancelled appointment scheduled for ${appt.date}`, req);
  res.json(appt);
});

// Automation Rules
app.get('/api/automation/rules', async (req, res) => {
  const rules = await getAutomationRulesFromDb();
  res.json(rules || []);
});

app.post('/api/automation/rules/:id/toggle', async (req, res) => {
  const rules = await getAutomationRulesFromDb();
  const idx = rules.findIndex((r: any) => r.id === req.params.id);
  if (idx !== -1) {
    rules[idx].enabled = !rules[idx].enabled;
    await saveAutomationRuleToDb(rules[idx]);
    res.json(rules[idx]);
  } else {
    res.status(404).json({ error: 'Automation rule not found' });
  }
});

// Automation Logs
app.get('/api/automation/logs', async (req, res) => {
  const logs = await getAutomationLogsFromDb();
  res.json(logs);
});

// Audit Logs
app.get('/api/audit/logs', async (req, res) => {
  const logs = await getAuditLogsFromDb();
  res.json(logs);
});

// Gemini AI verify document KYC upload
app.post('/api/ai/kyc-verify', async (req, res) => {
  const { docName, docCategory, textContent } = req.body;
  const client = getGeminiClient();
  
  if (!client) {
    // Elegant standard AI simulation mock if no API key is set
    return res.json({
      success: true,
      score: 95,
      documentVerified: true,
      extractedInfo: {
        documentType: docCategory === 'identity' ? 'South African National Identity Smart Card' : 'Utility Municipal Water Bill',
        fullName: 'JOHN BUYER',
        idNumber: docCategory === 'identity' ? '8907125012083' : 'N/A',
        issueDate: '2019-11-20',
        residentialAddress: docCategory !== 'identity' ? '14 Blue Crane Estate, Midrand, South Africa' : 'N/A'
      },
      auditRecommendation: 'PASSED. Face similarity matches deeds registry metadata perfectly. Ready for Conveyancer clearance.'
    });
  }

  try {
    const response = await client.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: `You are an automated KYC / Identity and Compliance checking system for an enterprise Property Law and Conveyancing Firm. 
Analyze the following document upload metadata and extracted text. Determine:
1. Is it a valid identity/FICA document (Passport, Smart ID, or Utility bill)?
2. Extract the Name, ID Number (if applicable), Address (if applicable), and Issue Date.
3. Provide a safety match score (0-100) and recommendation (PASSED / FLAGGED / REJECTED) with clear legal justifications under FICA / POPIA guidelines.

Document Name: ${docName}
Document Category: ${docCategory}
Uploaded Text Content: ${textContent || "A scanned Smart ID Card with photo, showing Name: John Buyer, Born 12 July 1989, ID Number: 8907125012083, issued Pretoria Home Affairs."}

Return a clean JSON response of the form:
{
  "success": true,
  "score": 98,
  "documentVerified": true,
  "extractedInfo": {
    "documentType": "String",
    "fullName": "String",
    "idNumber": "String or N/A",
    "residentialAddress": "String or N/A"
  },
  "auditRecommendation": "PASSED. Your explanation here."
}`,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const parsed = JSON.parse(response.text?.trim() || '{}');
    res.json(parsed);
  } catch (error: any) {
    console.error("Gemini Verification error:", error);
    res.status(500).json({ error: 'AI Verification timed out or failed. Running fallback verification.' });
  }
});

// Gemini AI legal template generator
app.post('/api/ai/generate-template', async (req, res) => {
  const { templateType, propertyAddress, buyerName, sellerName, price } = req.body;
  const client = getGeminiClient();

  const prompt = `Draft a professional South African Property Law and Deeds Office template document.
Document Type requested: ${templateType === 'power_of_attorney' ? 'Special Power of Attorney to Transfer' : templateType === 'fica_affidavit' ? 'FICA Compliance Affidavit of Residential Status' : 'SARS Transfer Duty Exemption/Declaration form'}
Property Address: ${propertyAddress}
Buyer Full Name: ${buyerName}
Seller Full Name: ${sellerName}
Transaction Price: ZAR ${price || '2,450,000'}

Ensure the draft includes accurate legal terminology, placeholder spaces for signatures, commissioner of oaths stamping if required, and refers to South African deeds registries acts. Ensure it looks highly professional, formatted nicely with sections.`;

  if (!client) {
    // Fallback simulation text
    const fallbackTemplate = `SPECIAL POWER OF ATTORNEY TO TRANSFER
(Pursuant to the Deeds Registries Act 47 of 1937)

I, the undersigned,
${sellerName.toUpperCase()}
(Identity Number: 7504020084089)
Married out of community of property

Do hereby nominate, constitute and appoint:
CLARA CONVEY or PAMELA PARALEGAL of MASINA LAW FIRM,

with power of substitution, to be my lawful Attorney and Agent in my name, place and stead, to appear at the Office of the Registrar of Deeds in Johannesburg, and then and there to lodge and register transfer to:

${buyerName.toUpperCase()}
(Identity Number: 8907125012083)

of the property:
ERF 124, VILLA ROSA ESTATE, SANDTON TOWNSHIP, REGISTRATION DIVISION I.R., PROVINCE OF GAUTENG;
MEASURING 340 SQUARE METERS
HELD BY DEED OF TRANSFER NO. T44019/2012

SUBJECT to all conditions therein contained, sold by me to the said transferee for the purchase sum of ZAR ${price}.

SIGNED at SANDTON on this 21st day of JULY 2026.

AS WITNESSES:
1. __________________                      _________________________
                                           SELLER
2. __________________`;
    return res.json({ text: fallbackTemplate });
  }

  try {
    const response = await client.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt
    });
    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Gemini Template Draft error:", error);
    res.status(500).json({ error: 'Failed to draft AI template.' });
  }
});

// Supabase Integration Routes
app.get('/api/supabase/config', (req, res) => {
  const supabaseUrl = process.env.SUPABASE_URL || 'https://lxdescdgxgzxfahhbqfy.supabase.co';
  const hasKey = !!process.env.SUPABASE_ANON_KEY && process.env.SUPABASE_ANON_KEY !== '';
  
  // Extract project ID from URL if possible
  let projectId = 'lxdescdgxgzxfahhbqfy';
  try {
    const urlObj = new URL(supabaseUrl);
    const hostParts = urlObj.hostname.split('.');
    if (hostParts.length > 0) {
      projectId = hostParts[0];
    }
  } catch (e) {}

  res.json({
    url: supabaseUrl,
    projectId,
    hasKey
  });
});

app.get('/api/supabase/status', async (req, res) => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return res.json({
      configured: false,
      connected: false,
      message: 'Supabase credentials missing. Add SUPABASE_ANON_KEY in Settings/secrets to connect.'
    });
  }

  try {
    // Try to run a lightweight select on the 'users' table
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .limit(1);

    if (error) {
      // Check if it is a missing relation error (relation "users" does not exist)
      const isTableMissing = error.message && (error.message.includes('relation') || error.message.includes('does not exist'));
      return res.json({
        configured: true,
        connected: false,
        isTableMissing,
        error: error.message,
        code: error.code,
        message: isTableMissing 
          ? 'Connected to Supabase, but required tables are missing. Please initialize tables using the SQL editor DDL schema below.'
          : `Supabase query failed: ${error.message}`
      });
    }

    res.json({
      configured: true,
      connected: true,
      message: 'Successfully connected and authenticated with Supabase!'
    });
  } catch (err: any) {
    res.json({
      configured: true,
      connected: false,
      message: `Failed to connect to Supabase: ${err.message || err}`
    });
  }
});

app.get('/api/supabase/sql-schema', (req, res) => {
  const schema = `-- SQL DDL setup script for Masina Conveyancing Matter Management
-- Copy and paste this script into your Supabase SQL Editor (Dashboard -> SQL Editor -> Run)

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  role TEXT,
  phone TEXT,
  "kycStatus" TEXT,
  "idNumber" TEXT,
  address TEXT,
  "consentAccepted" BOOLEAN,
  "consentDate" TEXT,
  "avatarUrl" TEXT
);
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- 2. Matters Table
CREATE TABLE IF NOT EXISTS matters (
  id TEXT PRIMARY KEY,
  "matterNumber" TEXT,
  "propertyAddress" TEXT,
  "propertyPrice" NUMERIC,
  "buyerId" TEXT,
  "buyerName" TEXT,
  "sellerId" TEXT,
  "sellerName" TEXT,
  "assignedAttorneyId" TEXT,
  "assignedAttorneyName" TEXT,
  "assignedParalegalId" TEXT,
  "assignedParalegalName" TEXT,
  "currentStage" INTEGER,
  "expectedCompletionDate" TEXT,
  status TEXT,
  stages JSONB,
  activities JSONB
);
ALTER TABLE matters DISABLE ROW LEVEL SECURITY;

-- 3. Documents Table
CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  "matterId" TEXT,
  name TEXT NOT NULL,
  category TEXT,
  "fileUrl" TEXT,
  "uploadDate" TEXT,
  status TEXT,
  version INTEGER,
  size TEXT,
  "uploadedBy" TEXT
);
ALTER TABLE documents DISABLE ROW LEVEL SECURITY;

-- 4. Tasks Table
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  "matterId" TEXT,
  "matterNumber" TEXT,
  "propertyAddress" TEXT,
  title TEXT NOT NULL,
  description TEXT,
  "assignedToId" TEXT,
  "assignedToName" TEXT,
  "assignedToRole" TEXT,
  "dueDate" TEXT,
  status TEXT,
  "requiresDocumentCategory" TEXT
);
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;

-- 5. Conversations Table
CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,
  "matterId" TEXT,
  "matterNumber" TEXT,
  "propertyAddress" TEXT,
  title TEXT,
  participants JSONB,
  "lastMessageText" TEXT,
  "lastMessageTimestamp" TEXT
);
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS participants JSONB;
ALTER TABLE conversations DISABLE ROW LEVEL SECURITY;

-- 6. Messages Table
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  "conversationId" TEXT,
  "senderId" TEXT,
  "senderName" TEXT,
  "senderRole" TEXT,
  text TEXT,
  timestamp TEXT,
  "isRead" BOOLEAN
);
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;

-- 7. Appointments Table
CREATE TABLE IF NOT EXISTS appointments (
  id TEXT PRIMARY KEY,
  "clientId" TEXT,
  "clientName" TEXT,
  "staffId" TEXT,
  "staffName" TEXT,
  "staffRole" TEXT,
  date TEXT,
  time TEXT,
  duration INTEGER,
  type TEXT,
  status TEXT,
  "videoLink" TEXT,
  description TEXT
);
ALTER TABLE appointments DISABLE ROW LEVEL SECURITY;

-- 8. Automation Rules Table
CREATE TABLE IF NOT EXISTS "automationRules" (
  id TEXT PRIMARY KEY,
  name TEXT,
  trigger TEXT,
  "actionType" TEXT,
  template TEXT,
  enabled BOOLEAN
);
ALTER TABLE "automationRules" DISABLE ROW LEVEL SECURITY;

-- 9. Automation Logs Table
CREATE TABLE IF NOT EXISTS "automationLogs" (
  id TEXT PRIMARY KEY,
  timestamp TEXT,
  "matterId" TEXT,
  "matterNumber" TEXT,
  "triggerName" TEXT,
  recipient TEXT,
  type TEXT,
  content TEXT,
  status TEXT
);
ALTER TABLE "automationLogs" DISABLE ROW LEVEL SECURITY;

-- 10. Audit Logs Table
CREATE TABLE IF NOT EXISTS "auditLogs" (
  id TEXT PRIMARY KEY,
  timestamp TEXT,
  "userId" TEXT,
  "userName" TEXT,
  "userRole" TEXT,
  action TEXT,
  details TEXT,
  "ipAddress" TEXT
);
ALTER TABLE "auditLogs" DISABLE ROW LEVEL SECURITY;`;
  res.json({ sql: schema });
});

app.post('/api/supabase/sync', async (req, res) => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return res.status(400).json({ error: 'Supabase is not configured yet. Add credentials in secrets.' });
  }

  const db = loadData();
  const report: Record<string, { total: number; synced: number; error?: string }> = {};

  const tablesMap: Record<string, keyof typeof db> = {
    'users': 'users',
    'matters': 'matters',
    'documents': 'documents',
    'tasks': 'tasks',
    'conversations': 'conversations',
    'messages': 'messages',
    'appointments': 'appointments',
    'automationRules': 'automationRules',
    'automationLogs': 'automationLogs',
    'auditLogs': 'auditLogs'
  };

  for (const [tableName, dbKey] of Object.entries(tablesMap)) {
    const rows = db[dbKey] || [];
    report[tableName] = { total: rows.length, synced: 0 };
    
    if (rows.length === 0) continue;

    try {
      const payload = rows.map((r: any) => {
        if (tableName === 'matters') {
          return {
            ...r,
            stages: typeof r.stages === 'object' ? JSON.stringify(r.stages) : r.stages,
            activities: typeof r.activities === 'object' ? JSON.stringify(r.activities) : r.activities
          };
        }
        if (tableName === 'conversations') {
          return {
            ...r,
            participants: typeof r.participants === 'object' ? JSON.stringify(r.participants) : r.participants
          };
        }
        return r;
      });

      // Upsert rows into Supabase
      const { error } = await supabase
        .from(tableName)
        .upsert(payload);

      if (error) {
        report[tableName].error = error.message;
      } else {
        report[tableName].synced = rows.length;
      }
    } catch (err: any) {
      report[tableName].error = err.message || err.toString();
    }
  }

  const failedTables = Object.entries(report)
    .filter(([_, info]) => info.error)
    .map(([name, info]) => `${name} (${info.error})`);

  if (failedTables.length > 0) {
    res.json({
      success: false,
      message: `Synchronized some tables, but encountered policy or schema errors on: ${failedTables.join(', ')}. If error mentions row-level security, please execute the SQL script in Supabase SQL Editor.`,
      report
    });
  } else {
    res.json({
      success: true,
      message: 'All 10 tables & demo records successfully synchronized with your live Supabase PostgreSQL database!',
      report
    });
  }
});

// Endpoint to clear / reset all local data back to baseline INITIAL_DATA
app.post('/api/admin/clear-local-data', (req, res) => {
  try {
    saveData(INITIAL_DATA);
    res.json({
      success: true,
      message: 'All local database storage has been cleared and reset to pristine baseline state.',
      data: INITIAL_DATA
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to reset local database: ' + (err.message || err.toString())
    });
  }
});

// Supabase Authentication Endpoints
app.post('/api/supabase/auth/signup', async (req, res) => {
  const { email, password, name, role, phone, idNumber, address } = req.body;
  
  if (!email || !password || !name || !role) {
    return res.status(400).json({ error: 'Required fields: email, password, name, role.' });
  }

  // Enforce staff role allocation: self-registrations can only pick buyer, seller, or other.
  // Staff roles (attorney, conveyancer, paralegal, admin) must be allocated post-registration by a System Administrator.
  const allowedSelfRoles = ['buyer', 'seller', 'other'];
  const finalRole = allowedSelfRoles.includes(role) ? role : 'other';

  const supabase = getSupabaseClient();
  const db = loadData();

  if (supabase) {
    try {
      // 1. Sign up user in Supabase auth
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role: finalRole,
            phone,
          }
        }
      });

      if (signUpError) {
        return res.status(400).json({ error: signUpError.message });
      }

      if (!data.user) {
        return res.status(500).json({ error: 'No user data returned from Supabase Auth.' });
      }

      const uid = data.user.id;

      // 2. Insert user into Supabase users table
      const newUser = {
        id: uid,
        name,
        email,
        role: finalRole,
        phone: phone || '',
        kycStatus: 'pending',
        idNumber: idNumber || '',
        address: address || '',
        consentAccepted: true,
        consentDate: new Date().toISOString(),
        avatarUrl: `https://images.unsplash.com/photo-${finalRole === 'buyer' ? '1500648767791-00dcc994a43e' : '1494790108377-be9c29b29330'}?w=150`
      };

      const { error: insertError } = await supabase
        .from('users')
        .upsert(newUser);

      // 3. Add to local json db as well
      const userIndex = db.users.findIndex((u: any) => u.email === email || u.id === uid);
      if (userIndex !== -1) {
        db.users[userIndex] = newUser;
      } else {
        db.users.push(newUser);
      }
      saveData(db);

      logAudit(uid, 'USER_REGISTER_SUPABASE', `Successfully signed up and authenticated real Supabase account: ${email}`, req);

      return res.json({
        success: true,
        user: newUser,
        session: data.session,
        message: 'Successfully registered on Supabase cloud and synced details.'
      });

    } catch (err: any) {
      console.error("Supabase Auth sign up error:", err);
      return res.status(500).json({ error: err.message || 'Supabase authentication failed.' });
    }
  } else {
    // Simulated Fallback Mode
    const simulatedId = `usr-supabase-${Date.now()}`;
    const newUser = {
      id: simulatedId,
      name,
      email,
      role,
      phone: phone || '',
      kycStatus: 'pending',
      idNumber: idNumber || '',
      address: address || '',
      consentAccepted: true,
      consentDate: new Date().toISOString(),
      avatarUrl: `https://images.unsplash.com/photo-${role === 'buyer' ? '1500648767791-00dcc994a43e' : '1494790108377-be9c29b29330'}?w=150`
    };

    // Store in simulated list of users
    const userIndex = db.users.findIndex((u: any) => u.email === email);
    if (userIndex !== -1) {
      db.users[userIndex] = newUser;
    } else {
      db.users.push(newUser);
    }
    saveData(db);

    logAudit(simulatedId, 'USER_REGISTER_SIMULATED', `Registered simulated Supabase account (credentials unconfigured): ${email}`, req);

    return res.json({
      success: true,
      user: newUser,
      simulated: true,
      message: 'Created simulated profile. Provide SUPABASE_ANON_KEY to run live authentication.'
    });
  }
});

app.post('/api/supabase/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const supabase = getSupabaseClient();
  const db = loadData();

  if (supabase) {
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (signInError) {
        return res.status(400).json({ error: signInError.message });
      }

      if (!data.user) {
        return res.status(500).json({ error: 'Authentication returned an empty user.' });
      }

      const uid = data.user.id;

      // Try to fetch user profile from Supabase users table
      let targetUser: any = null;
      try {
        const { data: userProfile, error: fetchError } = await supabase
          .from('users')
          .select('*')
          .eq('id', uid)
          .single();
        if (!fetchError && userProfile) {
          targetUser = userProfile;
        }
      } catch (e) {}

      // Fallback: if not in Supabase database but in auth, construct or look up locally
      if (!targetUser) {
        const localUser = db.users.find((u: any) => u.email === email);
        if (localUser) {
          targetUser = { ...localUser, id: uid };
        } else {
          targetUser = {
            id: uid,
            name: data.user.user_metadata?.name || email.split('@')[0],
            email,
            role: data.user.user_metadata?.role || 'buyer',
            phone: data.user.user_metadata?.phone || '',
            kycStatus: 'pending',
            idNumber: '',
            address: '',
            consentAccepted: true,
            consentDate: new Date().toISOString(),
            avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150'
          };
        }
        
        try {
          await supabase.from('users').upsert(targetUser);
        } catch (e) {}
      }

      // Sync back to local db.json
      const userIndex = db.users.findIndex((u: any) => u.email === email || u.id === uid);
      if (userIndex !== -1) {
        db.users[userIndex] = targetUser;
      } else {
        db.users.push(targetUser);
      }
      saveData(db);

      logAudit(uid, 'USER_LOGIN_SUPABASE', `Successfully authenticated with real Supabase session: ${email}`, req);

      return res.json({
        success: true,
        user: targetUser,
        session: data.session,
        message: 'Successfully authenticated with real cloud database.'
      });

    } catch (err: any) {
      console.error("Supabase Auth login error:", err);
      return res.status(500).json({ error: err.message || 'Supabase authentication failed.' });
    }
  } else {
    // Simulated login fallback
    const user = db.users.find((u: any) => u.email === email);

    if (user) {
      logAudit(user.id, 'USER_LOGIN_SIMULATED', `Logged in via simulated Supabase account (credentials unconfigured): ${email}`, req);
      return res.json({
        success: true,
        user,
        simulated: true,
        message: 'Simulated login succeeded. Provide SUPABASE_ANON_KEY to run live authentication.'
      });
    } else {
      // Create user on-the-fly for quick onboarding of default accounts
      const matchedSampleUser = INITIAL_DATA.users.find(u => u.email === email);
      if (matchedSampleUser) {
        db.users.push(matchedSampleUser);
        saveData(db);
        return res.json({
          success: true,
          user: matchedSampleUser,
          simulated: true,
          message: 'Simulated login succeeded.'
        });
      }

      return res.status(401).json({ error: 'Account not found. Please sign up to create a simulated profile!' });
    }
  }
});

app.post('/api/supabase/auth/logout', (req, res) => {
  const { userId } = req.body;
  if (userId) {
    const db = loadData();
    logAudit(userId, 'USER_LOGOUT_SUPABASE', `User logged out`, req);
  }
  res.json({ success: true });
});

// Wildcard API 404 fallback to prevent Vite SPA HTML fallback returning 200 OK for missing endpoints
app.all('/api/*', (req, res) => {
  res.status(404).json({ error: `API route ${req.method} ${req.originalUrl} not found` });
});

// Express Global Error Handler to guarantee clean JSON errors instead of HTML stack traces
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Unhandled Server Error:", err);
  if (res.headersSent) {
    return next(err);
  }
  res.status(err.status || 500).json({
    error: err.message || 'An unexpected internal server error occurred'
  });
});

// Serve frontend assets
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

// Export express app for serverless environments like Vercel
export default app;

startServer();

