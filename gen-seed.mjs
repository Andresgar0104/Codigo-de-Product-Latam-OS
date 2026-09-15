import { workspaces, companies, contacts, deals, touchpointSeeds } from './src/lib/mock-data.ts';
const esc = (v) => {
  if (v === null || v === undefined) return 'NULL';
  if (typeof v === 'number') return String(v);
  if (Array.isArray(v)) return `ARRAY[${v.map(s => `'${String(s).replace(/'/g,"''")}'`).join(',')}]::TEXT[]`;
  return `'${String(v).replace(/'/g, "''")}'`;
};
function ins(table, cols, rows) {
  const colsQ = cols.map(c => `"${c}"`).join(',');
  const vals = rows.map(r => `(${cols.map(c => esc(r[c])).join(',')})`).join(',\n');
  return `INSERT INTO public.${table} (${colsQ}) VALUES\n${vals};\n`;
}
let sql = '';
sql += ins('workspaces', ['id','name','client','color','icp'], workspaces);
sql += ins('companies', ['id','name','domain','industry','size','country','workspaceId'], companies);
sql += ins('contacts', ['id','name','title','email','linkedin','companyId','eventId','workspaceId','tags','lastTouch'], contacts);
sql += ins('deals', ['id','contactId','workspaceId','stage','value','createdAt'], deals);
sql += ins('touchpoints', ['id','contactId','channel','date','note'], touchpointSeeds);
console.log(sql);
