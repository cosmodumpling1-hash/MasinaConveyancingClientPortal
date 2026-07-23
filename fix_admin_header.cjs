const fs = require('fs');
let code = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

const replacement = `          </button>
        </div>
        <div className="text-[10px] text-brand-gold-dark font-mono font-bold bg-brand-gold/10 border border-brand-gold/20 px-2.5 py-1 rounded">
          Admin: {currentUser.name} (Alice)
        </div>
      </div>`;

// We want to replace lines 211 to 218. Let's do it correctly using a regex.
code = code.replace(/User Access Management\s*<\/button>\s*<div className="text-\[10px\][^>]*>[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<\/div>/, replacement);
fs.writeFileSync('src/components/AdminPanel.tsx', code, 'utf8');
