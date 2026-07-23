const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const regex = /app\.get\('\/api\/supabase[\s\S]*?(?=\napp\.post\('\/api\/supabase\/auth\/login')/g;
code = code.replace(regex, '');

const regex2 = /app\.post\('\/api\/supabase\/auth\/login'[\s\S]*?(?=\n\/\/ Wildcard API 404 fallback)/g;
code = code.replace(regex2, '');

fs.writeFileSync('server.ts', code, 'utf8');
