const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Replace the role update part
code = code.replace(/\/\/ Update in Supabase if connected[\s\S]*?\}\s*catch\s*\([^\)]*\)\s*\{[\s\S]*?\}\s*\}/g, '');

// Replace ensureSupabaseBucket entirely
code = code.replace(/async function ensureSupabaseBucket[\s\S]*?return \{ ready\: true[\s\S]*?\}\s*\}/g, 'async function ensureSupabaseBucket() { return { ready: true }; }');

// Replace uploadToSupabaseStorage entirely
code = code.replace(/async function uploadToSupabaseStorage[\s\S]*?return \{\s*success\: false\,[\s\S]*?\}\;\s*\}/g, 'async function uploadToSupabaseStorage(fileDataStr: string, fileName: string) { return { success: true, url: fileDataStr, isFallback: true }; }');

fs.writeFileSync('server.ts', code, 'utf8');
