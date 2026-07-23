const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const replacement = `
async function uploadToSupabaseStorage(
  fileDataStr: string,
  fileName: string,
  bucketName: string = 'mdocs',
  folder: string = 'uploads'
) {
  return { success: true, url: fileDataStr, isFallback: true };
}
// Storage API Routes`;

code = code.replace(/\/\/ Storage API Routes/, replacement);
fs.writeFileSync('server.ts', code, 'utf8');
