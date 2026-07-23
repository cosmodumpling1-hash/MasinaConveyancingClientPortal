const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const start = code.indexOf('// --- Dynamic Supabase DB Integration Helpers ---');
const end = code.indexOf('// API Routes');

const replacement = `// --- Local Database Helpers ---

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
    id: \`ad-\${Date.now()}\`,
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
    id: \`al-\${Date.now()}\`,
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

`;

if (start !== -1 && end !== -1) {
  code = code.substring(0, start) + replacement + code.substring(end);
}

code = code.replace(/import \{ createClient \} from '@supabase\/supabase-js';\n/g, '');
code = code.replace(/const DEFAULT_SUPABASE_ANON_KEY[\s\S]*?return supabaseClient;\n}\n\n/g, '');

fs.writeFileSync('server.ts', code, 'utf8');
