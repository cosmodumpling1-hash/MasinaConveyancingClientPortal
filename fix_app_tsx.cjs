const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/SupabaseAuthCenter/g, 'AuthCenter');
code = code.replace(/Supabase Security Hub/g, 'Security Hub');
code = code.replace(/Identity \& Supabase Auth/g, 'Identity \& Auth');
code = code.replace(/\/api\/supabase\/auth\/logout/g, '/api/auth/logout');
code = code.replace(/supabase-auth/g, 'auth-center');

fs.writeFileSync('src/App.tsx', code, 'utf8');
