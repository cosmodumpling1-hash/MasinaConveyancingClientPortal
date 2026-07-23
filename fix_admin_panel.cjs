const fs = require('fs');
let code = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

// Remove Supabase config state
code = code.replace(/const \[supabaseConfig[\s\S]*?\]\;/g, '');
code = code.replace(/const \[supabaseStatus[\s\S]*?\]\;/g, '');
code = code.replace(/const \[supabaseBuckets[\s\S]*?\]\;/g, '');
code = code.replace(/const \[supabaseSql[\s\S]*?\]\;/g, '');

// Remove Supabase methods
code = code.replace(/const fetchSupabaseInfo = async \(\) \=\> \{[\s\S]*?\}\;/g, '');
code = code.replace(/const handleSyncSupabase = async \(\) \=\> \{[\s\S]*?\}\;/g, '');

// Remove useEffect fetchSupabaseInfo
code = code.replace(/React\.useEffect\(\(\) \=\> \{\n    fetchSupabaseInfo\(\)\;\n  \}\, \[\]\)\;/g, '');

// Remove the Supabase Integration tab
code = code.replace(/\{ id\: 'supabase', label\: 'Supabase Integration', icon\: Database \}\,/g, '');

// Remove the Supabase tab content
code = code.replace(/\{\/\* TAB 5\: SUPABASE DATABASE SYNCHRONIZER \*\/\}[\s\S]*?(?=\{\/\* SYSTEM NOTIFICATIONS CENTER \*\/)/, '');

fs.writeFileSync('src/components/AdminPanel.tsx', code, 'utf8');
