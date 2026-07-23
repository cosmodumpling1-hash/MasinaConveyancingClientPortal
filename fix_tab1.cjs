const fs = require('fs');
let code = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

const regex = /\{\/\* TAB 1: IMMUTABLE AUDIT TRAIL LOGS \*\/\}[\s\S]*?(?=\{\/\* TAB 2: AUTOMATION \& WORKFLOWS \*\/)/;
const replacement = `{/* TAB 1: IMMUTABLE AUDIT TRAIL LOGS */}
        {activeTab === 'audit' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-serif font-bold text-brand-navy uppercase tracking-wider flex items-center space-x-1.5">
                <Shield className="h-4.5 w-4.5 text-brand-gold-dark" />
                <span>Regulatory Activity Registry</span>
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">Immutable cryptographic records active</span>
            </div>

            <div className="bg-brand-navy text-slate-300 rounded-xl p-4 font-mono text-[11px] h-96 overflow-y-auto border border-slate-800 space-y-2.5 shadow-inner">
              {auditLogs.map(log => (
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
              ))}
            </div>
          </div>
        )}

        `;

code = code.replace(regex, replacement);
fs.writeFileSync('src/components/AdminPanel.tsx', code, 'utf8');
