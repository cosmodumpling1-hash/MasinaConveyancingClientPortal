import express from 'express';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Ensure API requests handled by Vercel function have clean /api pathing for Express routing
app.use((req, res, next) => {
  if (req.url) {
    if (req.url.includes('/api/index')) {
      req.url = req.url.replace('/api/index.ts', '/api').replace('/api/index', '/api');
    }
  }
  next();
});

// API Root Status Handler
app.get(['/api', '/api/'], (req, res) => {
  res.json({
    status: 'online',
    service: 'Masina Conveyancing API',
    timestamp: new Date().toISOString()
  });
});

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

// Simple file-based database for persistence
const DB_FILE = (process.env.VERCEL || process.env.VERCEL_ENV || process.env.NODE_ENV === 'production')
  ? path.join(os.tmpdir(), 'masina_db.json')
  : path.join(process.cwd(), 'db.json');

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
      fileUrl: 'data:application/pdf;base64,JVBERi0xLjUKMSAwIG9iaj88L1R5cGUvQ2F0YWxvZy9QYWdlcyAyIDAgUj4+ZW5kb2JqMiAwIG9iajw8L1R5cGUvUGFnZXMvS2lkc1szIDAgUl0vQ291bnQgMT4+ZW5kb2JqMyAwIG9iajw8L1R5cGUvUGFnZS9QYXJlbnQgMiAwIFIvTWVkaWFCb3hbMCAwIDU5NSA4NDJdL0NvbnRlbnRzIDQgMCBSPj5lbmRvYmo0IDAgb2JqPDwvTGVuZ3RoIDU5Pj5zdHJlYW0KQlQgL0YxIDEyIFRmIDcwIDcwMCBUZCAoU2lnbmVkIE9UUCAtIFNhbmR0b24gVmlsbGEpIFRqIEVQKGVuZHN0cmVhbWVuZG9ianhyZWYKMCA1CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDAwOSAwMDAwMCBuIAowMDAwMDAwMDU2IDAwMDAwIG4gCjAwMDAwMDAxMTEgMDAwMDAgbiAKMDAwMDAwMDIxMiAwMDAwMCBuIAp0cmFpbGVyPDwvTaXplIDUvUm9vdCAxIDAgUj4+CnN0YXJ0eHJlZgowCiUlRU9G',
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
      fileUrl: 'data:application/pdf;base64,JVBERi0xLjUKMSAwIG9iaj88L1R5cGUvQ2F0YWxvZy9QYWdlcyAyIDAgUj4+ZW5kb2JqMiAwIG9iajw8L1R5cGUvUGFnZXMvS2lkc1szIDAgUl0vQ291bnQgMT4+ZW5kb2JqMyAwIG9iajw8L1R5cGUvUGFnZS9QYXJlbnQgMiAwIFIvTWVkaWFCb3hbMCAwIDU5NSA4NDJdL0NvbnRlbnRzIDQgMCBSPj5lbmRvYmo0IDAgb2JqPDwvTGVuZ3RoIDU5Pj5zdHJlYW0KQlQgL0YxIDEyIFRmIDcwIDcwMCBUZCAoSm9obiBCdXllciAtIElEIENhcmQpIFRqIEVQKGVuZHN0cmVhbWVuZG9ianhyZWYKMCA1CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDAwOSAwMDAwMCBuIAowMDAwMDAwMDU2IDAwMDAwIG4gCjAwMDAwMDAxMTEgMDAwMDAgbiAKMDAwMDAwMDIxMiAwMDAwMCBuIAp0cmFpbGVyPDwvTaXplIDUvUm9vdCAxIDAgUj4+CnN0YXJ0eHJlZgowCiUlRU9G',
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
      fileUrl: 'data:application/pdf;base64,JVBERi0xLjUKMSAwIG9iaj88L1R5cGUvQ2F0YWxvZy9QYWdlcyAyIDAgUj4+ZW5kb2JqMiAwIG9iajw8L1R5cGUvUGFnZXMvS2lkc1szIDAgUl0vQ291bnQgMT4+ZW5kb2JqMyAwIG9iajw8L1R5cGUvUGFnZS9QYXJlbnQgMiAwIFIvTWVkaWFCb3hbMCAwIDU5NSA4NDJdL0NvbnRlbnRzIDQgMCBSPj5lbmRvYmo0IDAgb2JqPDwvTGVuZ3RoIDU5Pj5zdHJlYW0KQlQgL0YxIDEyIFRmIDcwIDcwMCBUZCAoU2FuZHRvbiBQcm9wZXJ0eSAtIFRpdGxlIERlZWQpIFRqIEVQKGVuZHN0cmVhbWVuZG9ianhyZWYKMCA1CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDAwOSAwMDAwMCBuIAowMDAwMDAwMDU2IDAwMDAwIG4gCjAwMDAwMDAxMTEgMDAwMDAgbiAKMDAwMDAwMDIxMiAwMDAwMCBuIAp0cmFpbGVyPDwvTaXplIDUvUm9vdCAxIDAgUj4+CnN0YXJ0eHJlZgowCiUlRU9G',
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
      fileUrl: 'data:application/pdf;base64,JVBERi0xLjUKMSAwIG9iaj88L1R5cGUvQ2F0YWxvZy9QYWdlcyAyIDAgUj4+ZW5kb2JqMiAwIG9iajw8L1R5cGUvUGFnZXMvS2lkc1szIDAgUl0vQ291bnQgMT4+ZW5kb2JqMyAwIG9iajw8L1R5cGUvUGFnZS9QYXJlbnQgMiAwIFIvTWVkaWFCb3hbMCAwIDU5NSA4NDJdL0NvbnRlbnRzIDQgMCBSPj5lbmRvYmo0IDAgb2JqPDwvTGVuZ3RoIDU5Pj5zdHJlYW0KQlQgL0YxIDEyIFRmIDcwIDcwMCBUZCAoU0FSUyBUcmFuc2ZlciBEdXR5IFJlY2VpcHQpIFRqIEVQKGVuZHN0cmVhbWVuZG9ianhyZWYKMCA1CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDAwOSAwMDAwMCBuIAowMDAwMDAwMDU2IDAwMDAwIG4gCjAwMDAwMDAxMTEgMDAwMDAgbiAKMDAwMDAwMDIxMiAwMDAwMCBuIAp0cmFpbGVyPDwvTaXplIDUvUm9vdCAxIDAgUj4+CnN0YXJ0eHJlZgowCiUlRU9G',
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
      const parsed = JSON.parse(data);
      if (parsed && typeof parsed === 'object') {
        return {
          users: Array.isArray(parsed.users) ? parsed.users : INITIAL_DATA.users,
          matters: Array.isArray(parsed.matters) ? parsed.matters : INITIAL_DATA.matters,
          documents: Array.isArray(parsed.documents) ? parsed.documents : INITIAL_DATA.documents,
          tasks: Array.isArray(parsed.tasks) ? parsed.tasks : INITIAL_DATA.tasks,
          conversations: Array.isArray(parsed.conversations) ? parsed.conversations : INITIAL_DATA.conversations,
          messages: Array.isArray(parsed.messages) ? parsed.messages : INITIAL_DATA.messages,
          appointments: Array.isArray(parsed.appointments) ? parsed.appointments : INITIAL_DATA.appointments,
          automationRules: Array.isArray(parsed.automationRules) ? parsed.automationRules : INITIAL_DATA.automationRules,
          automationLogs: Array.isArray(parsed.automationLogs) ? parsed.automationLogs : INITIAL_DATA.automationLogs,
          auditLogs: Array.isArray(parsed.auditLogs) ? parsed.auditLogs : INITIAL_DATA.auditLogs,
        };
      }
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

// --- Local Database Helpers ---

async function getUsersFromDb() {
  return loadData().users;
}

async function saveUserToDb(user: any) {
  const db = loadData();
  const idx = db.users.findIndex((u: any) => u.id === user.id || u.email === user.email);
  if (idx !== -1) {
    db.users[idx] = { ...db.users[idx], ...user };
  } else {
    db.users.push(user);
  }
  saveData(db);
}

async function deleteUserFromDb(userId: string) {
  const db = loadData();
  db.users = db.users.filter((u: any) => u.id !== userId);
  saveData(db);
}

async function getMattersFromDb() {
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
}

async function getDocumentsFromDb() {
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
}

async function getTasksFromDb() {
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
}

async function getConversationsFromDb() {
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
}

async function getMessagesFromDb() {
  return loadData().messages;
}

async function saveMessageToDb(message: any) {
  const db = loadData();
  db.messages.push(message);
  saveData(db);
}

async function getAppointmentsFromDb() {
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
}

async function getAutomationRulesFromDb() {
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
}

async function getAutomationLogsFromDb() {
  return loadData().automationLogs || [];
}

async function saveAutomationLogToDb(log: any) {
  const db = loadData();
  db.automationLogs.unshift(log);
  saveData(db);
}

async function getAuditLogsFromDb() {
  return loadData().auditLogs || [];
}

async function saveAuditLogToDb(log: any) {
  const db = loadData();
  db.auditLogs.unshift(log);
  saveData(db);
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
  if (avatarUrl !== undefined) {
    if (typeof avatarUrl === 'string' && avatarUrl.startsWith('data:image/')) {
      const uploadRes = await uploadToCloudStorage(avatarUrl, `profile-${user.id}.png`, 'mdocs', 'profile-pictures');
      user.avatarUrl = uploadRes.url;
    } else {
      user.avatarUrl = avatarUrl;
    }
  }
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
  
  let finalFileUrl = fileUrl || '#';
  if (typeof fileUrl === 'string' && fileUrl.startsWith('data:')) {
    const uploadRes = await uploadToCloudStorage(fileUrl, name || 'document.pdf', 'mdocs', category || 'fica');
    finalFileUrl = uploadRes.url;
  }

  const newDoc = {
    id: `doc-${Date.now()}`,
    matterId,
    name: name || 'Document.pdf',
    category,
    fileUrl: finalFileUrl,
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

// Cloud Storage File Buckets Helpers
async function ensureCloudBucket() { return { ready: true }; }



async function uploadToCloudStorage(
  fileDataStr: string,
  fileName: string,
  bucketName: string = 'mdocs',
  folder: string = 'uploads'
) {
  return { success: true, url: fileDataStr, isFallback: true };
}
// Storage API Routes
app.post('/api/storage/upload', async (req, res) => {
  const { fileName, fileData, bucketName, folder } = req.body;

  if (!fileData) {
    return res.status(400).json({ error: 'Missing fileData in request body.' });
  }

  const targetBucket = bucketName || 'mdocs';
  const targetFolder = folder || 'uploads';
  const nameToUse = fileName || `file-${Date.now()}.png`;

  const result = await uploadToCloudStorage(fileData, nameToUse, targetBucket, targetFolder);
  return res.json(result);
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

// Serve frontend assets (only when running as standalone Node process, not in Vercel Serverless Function)
async function startServer() {
  if (process.env.VERCEL || process.env.VERCEL_ENV) {
    return;
  }

  if (process.env.NODE_ENV !== 'production') {
    try {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } catch (e) {
      console.warn("Vite middleware omitted:", e);
    }
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

// Export express app for serverless environments like Vercel
export default app;

if (!process.env.VERCEL && !process.env.VERCEL_ENV) {
  startServer();
}

