/** Reads the two existing summary sheets in one batch per sheet. */
function loadDashboardSources_(spreadsheet) {
  const names = DASHBOARD_CONFIG.sheets;
  const entrySheet = spreadsheet.getSheetByName(names.entrySource);
  const printSheet = spreadsheet.getSheetByName(names.printSource);
  if (!entrySheet || !printSheet) {
    throw new Error('Required source sheets missing: ' +
      [!entrySheet && names.entrySource, !printSheet && names.printSource].filter(Boolean).join(', '));
  }
  const entry = entrySheet.getDataRange().getValues();
  const print = printSheet.getDataRange().getValues();
  requireHeaders_(entry, {1: 'Hour of Day', 6: 'User Metric', 34: 'Month', 38: 'Equipment'}, names.entrySource);
  requireHeaders_(print, {1: 'Assistant Name', 7: 'Printer Name', 22: 'Project Type', 27: 'Month', 43: 'Completed Print Duration by Printer'}, names.printSource, {43: 16});
  if (entry.length < 2 || print.length < 2) {
    throw new Error('Source sheets contain headers but no data. Dashboard was left intact.');
  }
  return {entry: entry, print: print, timezone: spreadsheet.getSpreadsheetTimeZone()};
}

function requireHeaders_(rows, expected, sheetName, headerRows) {
  Object.keys(expected).forEach(function (column) {
    const row = headerRows && headerRows[column] || 1;
    const actual = String((rows[row - 1] || [])[Number(column) - 1] || '').trim();
    if (actual !== expected[column]) {
      throw new Error(sheetName + '!' + columnLetter_(Number(column)) + row +
        ': expected "' + expected[column] + '", found "' + actual + '".');
    }
  });
}

function columnLetter_(n) {
  let result = '';
  while (n) { n--; result = String.fromCharCode(65 + n % 26) + result; n = Math.floor(n / 26); }
  return result;
}

function isBlank_(value) { return value === '' || value === null || value === undefined; }
function count_(value) {
  if (typeof value === 'number' && isFinite(value)) return value;
  const n = Number(String(value).replace(/,/g, ''));
  return isFinite(n) ? n : 0;
}

/** A block ends at the first blank label, so new rows can be added without code edits. */
function sourceBlock_(matrix, startRow, columns) {
  const result = [];
  for (let r = startRow - 1; r < matrix.length; r++) {
    const sourceRow = matrix[r] || [];
    if (isBlank_(sourceRow[columns[0] - 1])) break;
    result.push(columns.map(function (column) { return sourceRow[column - 1]; }));
  }
  return result;
}

function series_(matrix, startRow, labelColumn, valueColumns, labelFormatter) {
  return sourceBlock_(matrix, startRow, [labelColumn].concat(valueColumns)).map(function (row) {
    const label = labelFormatter ? labelFormatter(row[0]) : String(row[0]).trim();
    return [label].concat(row.slice(1).map(count_));
  });
}

function hourLabel_(value, timezone) {
  if (value instanceof Date) return Utilities.formatDate(value, timezone || 'UTC', 'HH:mm');
  if (typeof value === 'number') return String(Math.round(value * 24) % 24).padStart(2, '0') + ':00';
  return String(value);
}

function monthLabel_(value, timezone) {
  if (value instanceof Date) return Utilities.formatDate(value, timezone, 'MMM yyyy');
  if (typeof value === 'number' && value > 30000) {
    const date = new Date(Date.UTC(1899, 11, 30) + Math.round(value) * 86400000);
    return Utilities.formatDate(date, 'UTC', 'MMM yyyy');
  }
  return String(value).trim();
}

function sumColumn_(rows, index) {
  return rows.reduce(function (sum, row) { return sum + count_(row[index]); }, 0);
}

function trimTrailingZeroRows_(rows) {
  let last = rows.length - 1;
  while (last >= 0 && rowTotal_(rows[last]) === 0) last--;
  return rows.slice(0, last + 1);
}

function rowTotal_(row) {
  return row.slice(1).reduce(function (sum, value) { return sum + count_(value); }, 0);
}

function lastPopulatedRow_(matrix) {
  for (let r = matrix.length - 1; r >= 0; r--) {
    if ((matrix[r] || []).some(function (value) { return !isBlank_(value); })) return r + 1;
  }
  return 0;
}

/** A small diagnostic fingerprint. Unchanged input is a warning, not a failure. */
function sourceFingerprint_(matrix) {
  const serialized = JSON.stringify(matrix);
  let hash = 2166136261;
  for (let i = 0; i < serialized.length; i++) {
    hash = Math.imul(hash ^ serialized.charCodeAt(i), 16777619) >>> 0;
  }
  return hash.toString(16);
}
