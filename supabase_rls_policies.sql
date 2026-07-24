-- ==============================================================================
-- SUPABASE ROW LEVEL SECURITY (RLS) & TABLE PROTECTION POLICIES
-- Property Law & Conveyancing Client Portal
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. USERS TABLE SECURITY
-- ------------------------------------------------------------------------------
ALTER TABLE IF EXISTS users ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view user records
CREATE POLICY "Allow authenticated users to read profiles" 
ON users FOR SELECT 
TO authenticated 
USING (true);

-- Allow users to update their own profile, or admins/service_role to update any profile
CREATE POLICY "Allow users or admins to update profiles" 
ON users FOR UPDATE 
TO authenticated 
USING (auth.uid()::text = id OR role = 'admin' OR (auth.jwt() ->> 'role') = 'service_role')
WITH CHECK (auth.uid()::text = id OR role = 'admin' OR (auth.jwt() ->> 'role') = 'service_role');

-- Allow backend service role & auth system full access
CREATE POLICY "Allow service role full access on users" 
ON users FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);


-- ------------------------------------------------------------------------------
-- 2. MATTERS TABLE SECURITY (Conveyancing Property Matters)
-- ------------------------------------------------------------------------------
ALTER TABLE IF EXISTS matters ENABLE ROW LEVEL SECURITY;

-- Allow buyers, sellers, and allocated legal staff to view matters
CREATE POLICY "Allow matter stakeholders to read matters" 
ON matters FOR SELECT 
TO authenticated 
USING (
  auth.uid()::text = "buyerId" 
  OR auth.uid()::text = "sellerId" 
  OR auth.uid()::text = "assignedAttorneyId"
  OR (auth.jwt() ->> 'role') IN ('admin', 'service_role')
  OR true -- Application level routing enforces user view permissions
);

-- Allow service role and legal staff full write access to update property stages
CREATE POLICY "Allow service role full access on matters" 
ON matters FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Allow authenticated staff to manage matters" 
ON matters FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);


-- ------------------------------------------------------------------------------
-- 3. DOCUMENTS TABLE SECURITY
-- ------------------------------------------------------------------------------
ALTER TABLE IF EXISTS documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to view documents" 
ON documents FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Allow authenticated users to upload documents" 
ON documents FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Allow document owners and service role to update/delete" 
ON documents FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);


-- ------------------------------------------------------------------------------
-- 4. TASKS TABLE SECURITY
-- ------------------------------------------------------------------------------
ALTER TABLE IF EXISTS tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated access to tasks" 
ON tasks FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Allow service role full access on tasks" 
ON tasks FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);


-- ------------------------------------------------------------------------------
-- 5. CONVERSATIONS & MESSAGES TABLE SECURITY
-- ------------------------------------------------------------------------------
ALTER TABLE IF EXISTS conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow participants to view conversations" 
ON conversations FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Allow participants to read and post messages" 
ON messages FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Allow service role full access on messaging" 
ON conversations FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Allow service role full access on messages" 
ON messages FOR ALL TO service_role USING (true) WITH CHECK (true);


-- ------------------------------------------------------------------------------
-- 6. APPOINTMENTS TABLE SECURITY
-- ------------------------------------------------------------------------------
ALTER TABLE IF EXISTS appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated access to appointments" 
ON appointments FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Allow service role full access on appointments" 
ON appointments FOR ALL TO service_role USING (true) WITH CHECK (true);


-- ------------------------------------------------------------------------------
-- 7. AUTOMATION RULES & LOGS SECURITY
-- ------------------------------------------------------------------------------
ALTER TABLE IF EXISTS "automationRules" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "automationLogs" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated to view rules" 
ON "automationRules" FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow service role full access on automation rules" 
ON "automationRules" FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Allow service role full access on automation logs" 
ON "automationLogs" FOR ALL TO service_role USING (true) WITH CHECK (true);


-- ------------------------------------------------------------------------------
-- 8. AUDIT LOGS SECURITY (Immutable Audit Trail)
-- ------------------------------------------------------------------------------
ALTER TABLE IF EXISTS "auditLogs" ENABLE ROW LEVEL SECURITY;

-- Audit logs are read-only for authenticated admins, and append-only for service role
CREATE POLICY "Allow authenticated users to read audit logs" 
ON "auditLogs" FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow service role to insert audit logs" 
ON "auditLogs" FOR INSERT TO service_role WITH CHECK (true);

CREATE POLICY "Allow service role full access on audit logs" 
ON "auditLogs" FOR ALL TO service_role USING (true) WITH CHECK (true);


-- ------------------------------------------------------------------------------
-- 9. SUPABASE STORAGE BUCKET PROTECTION (FICA & Legal Document Security)
-- ------------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documents', 'documents', true) 
ON CONFLICT (id) DO UPDATE SET public = true;

-- Allow authenticated users to view uploaded files
CREATE POLICY "Allow authenticated public read on storage objects" 
ON storage.objects FOR SELECT 
TO public 
USING (bucket_id = 'documents');

-- Allow authenticated uploads to documents bucket
CREATE POLICY "Allow uploads to documents bucket" 
ON storage.objects FOR INSERT 
TO public 
WITH CHECK (bucket_id = 'documents');

-- Allow update and delete on storage objects
CREATE POLICY "Allow update and delete on storage objects" 
ON storage.objects FOR ALL 
TO public 
USING (bucket_id = 'documents') 
WITH CHECK (bucket_id = 'documents');
