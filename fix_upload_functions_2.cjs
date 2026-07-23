const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const regex = /async function ensureSupabaseBucket[\s\S]*?(?=\napp\.get\('\/api\/ai\/status')/;
const replacement = `async function ensureSupabaseBucket(bucketName: string = 'masina-files') {
  return { ready: true, bucketName, created: false };
}

async function uploadToSupabaseStorage(
  fileDataStr: string,
  fileName: string,
  bucketName: string = 'mdocs',
  folder: string = 'uploads'
) {
  return { success: true, url: fileDataStr, isFallback: true };
}
`;

code = code.replace(regex, replacement);
fs.writeFileSync('server.ts', code, 'utf8');
