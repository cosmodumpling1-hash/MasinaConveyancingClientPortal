const fs = require('fs');
let code = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

const regex = /\{auditLogs\.map\(log => \([\s\S]*?\)\)\}/;
const replacement = `{auditLogs.map(log => (
                <div key={log.id} className="border-b border-slate-900 pb-2 hover:bg-slate-900/40 transition-colors">
                  <div className="flex flex-wrap justify-between text-[10px] text-brand-gold font-bold">
                    <span>[{log.timestamp}] EVENT: {log.action}</span>
                    <span>IP: {log.ipAddress}</span>
                  </div>
                  <p className="text-white mt-0.5 leading-relaxed">{log.details}</p>
                  <div className="text-[9px] text-slate-500 mt-1">
                    Actor: {log.userName} (Role: {log.userRole.toUpperCase()}) | Log ID: {log.id}
                  </div>
                </div>
              ))}`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/components/AdminPanel.tsx', code, 'utf8');
