// Read course lists from CSV or Excel files into an array of row objects.
// Column names are matched loosely: "Course Code", "code", "CODE" all become `code`.

const ALIASES = {
  code: ['code', 'course code', 'course_code', 'coursecode'],
  title: ['title', 'course title', 'course_title', 'name', 'course name'],
  units: ['units', 'unit', 'credit units', 'credits', 'credit'],
  department: ['department', 'dept', 'department code', 'dept code'],
  level: ['level', 'lvl'],
  semester: ['semester', 'sem'],
  session: ['session', 'academic session'],
};

function normaliseKey(k) {
  const key = String(k).trim().toLowerCase().replace(/\s+/g, ' ');
  return Object.keys(ALIASES).find((name) => ALIASES[name].includes(key)) || key;
}

/** Minimal CSV parser that handles quoted fields, commas and new lines inside quotes. */
export function parseCSV(text) {
  const rows = [];
  let row = [], field = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') { row.push(field); field = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(field); rows.push(row); row = []; field = '';
    } else field += ch;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((c) => String(c).trim() !== ''));
}

function toObjects(table) {
  const [header, ...body] = table;
  if (!header) return { rows: [], columns: [] };
  const keys = header.map(normaliseKey);
  return { columns: keys, rows: body.map((r) => Object.fromEntries(keys.map((k, i) => [k, String(r[i] ?? '').trim()]))) };
}

export const REQUIRED_COLUMNS = ['code', 'title', 'units', 'department', 'level', 'semester'];

/** Returns { rows, columns, missing } for a File (.csv, .xlsx, .xls). */
export async function readCourseFile(file) {
  const name = file.name.toLowerCase();
  if (file.size > 2 * 1024 * 1024) throw new Error('The file is larger than 2 MB.');
  let result;
  if (name.endsWith('.csv')) {
    result = toObjects(parseCSV(await file.text()));
  } else if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
    const XLSX = await import('xlsx');
    const wb = XLSX.read(await file.arrayBuffer(), { type: 'array' });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    result = toObjects(XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: false }));
  } else {
    throw new Error('Upload a .csv, .xlsx or .xls file.');
  }
  if (!result.rows.length) throw new Error('The file has no course rows under the header.');
  if (result.rows.length > 1000) throw new Error('The file has more than 1,000 rows. Split it into smaller files.');
  const missing = REQUIRED_COLUMNS.filter((c) => !result.columns.includes(c));
  return { ...result, missing };
}

export const SAMPLE_CSV = 'code,title,units,department,level,semester,session\n'
  + 'CSC 781,Software Engineering Practice,3,CSC,700,second,2025/2026\n'
  + 'CYB 721,Ethical Hacking and Penetration Testing,3,CYB,700,second,2025/2026\n'
  + 'STA 722,Bayesian Statistics,3,STA,700,second,2025/2026\n';
