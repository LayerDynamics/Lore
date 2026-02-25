export function write(data) {
  process.stdout.write(String(data));
}

export function writeLine(data) {
  process.stdout.write(String(data) + '\n');
}

export function writeTable(headers, rows) {
  const cols = headers.map((h, i) => {
    const values = rows.map(r => String(r[i] ?? ''));
    return Math.max(h.length, ...values.map(v => v.length));
  });

  const pad = (str, width) => String(str).padEnd(width);
  const headerLine = headers.map((h, i) => pad(h, cols[i])).join(' | ');
  const separator = cols.map(w => '-'.repeat(w)).join('-+-');

  process.stdout.write(headerLine + '\n');
  process.stdout.write(separator + '\n');
  for (const row of rows) {
    const line = headers.map((_, i) => pad(row[i] ?? '', cols[i])).join(' | ');
    process.stdout.write(line + '\n');
  }
}

export function writeJSON(data) {
  process.stdout.write(JSON.stringify(data, null, 2) + '\n');
}
