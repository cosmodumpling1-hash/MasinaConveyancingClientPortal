const fs = require('fs');
let code = fs.readFileSync('src/components/AuthCenter.tsx', 'utf8');

code = code.replace(/SupabaseAuthCenter/g, 'AuthCenter');
code = code.replace(/Supabase/g, 'System');
code = code.replace(/\/api\/supabase\/auth\/login/g, '/api/auth/login');
code = code.replace(/\/api\/supabase\/auth\/signup/g, '/api/auth/signup');
code = code.replace(/\/api\/supabase\/auth\/logout/g, '/api/auth/logout');

// Remove fetchConfig and related UI
code = code.replace(/const fetchConfig \= async \(\) \=\> \{[\s\S]*?\}\;/g, '');
code = code.replace(/React\.useEffect\(\(\) \=\> \{[\s\S]*?fetchConfig\(\)\;[\s\S]*?\}\, \[\]\)\;/g, '');

fs.writeFileSync('src/components/AuthCenter.tsx', code, 'utf8');
