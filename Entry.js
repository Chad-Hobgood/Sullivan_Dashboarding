function buildEntryDashboard_(context) {
  const entry = context.sources.entry;
  const sheet = prepareDashboardSheet_(context.spreadsheet, DASHBOARD_CONFIG.sheets.entry,
    'Who uses the space, when they visit, and which tools they use  •  Refreshed ' + context.runLabel);
  const hourly = series_(entry, 2, 1, [2, 3, 4], function (value) {
    return hourLabel_(value, context.sources.timezone);
  });
  const userGroups = series_(entry, 2, 6, [7]);
  const recent = series_(entry, 2, 9, [10]);
  const intervals = series_(entry, 2, 12, [13]);
  const frequency = series_(entry, 2, 15, [16]);
  const weekdays = series_(entry, 2, 18, [19]);
  const months = trimTrailingZeroRows_(series_(entry, 2, 34, [35, 36]));
  const equipment = series_(entry, 2, 38, [39]);

  section_(sheet, 5, 'Visitors and repeat use');
  addDashboardChart_(context, sheet, 'entry_months', ['Month', 'Total swipes', 'Unique users'],
    months, Charts.ChartType.COLUMN, 'Monthly visits and distinct students', 7, 1,
    {vAxis: {minValue: 0, title: 'People / swipes'}});
  addDashboardChart_(context, sheet, 'entry_recent', ['Window', 'Unique users'],
    recent, Charts.ChartType.BAR, 'Recent unique visitors', 7, 7,
    {hAxis: {minValue: 0, title: 'Students'}});
  addDashboardChart_(context, sheet, 'entry_groups', ['Frequency', 'Students'],
    userGroups.slice(1), Charts.ChartType.PIE, 'Visit counts per student', 25, 1,
    {pieHole: 0.4});
  addDashboardChart_(context, sheet, 'entry_return_cadence', ['Visit cadence', 'Students'],
    frequency, Charts.ChartType.BAR, 'How often students return', 25, 7,
    {hAxis: {minValue: 0, title: 'Students'}});
  section_(sheet, 43, 'Traffic and tools');
  addDashboardChart_(context, sheet, 'entry_hourly',
    ['Hour', 'Whole year', 'Jan–May', 'Aug–Dec'], hourly, Charts.ChartType.LINE,
    'Entry traffic by hour', 45, 1, {vAxis: {minValue: 0, title: 'Swipes'}});
  addDashboardChart_(context, sheet, 'entry_weekday', ['Day', 'Avg. users'],
    weekdays, Charts.ChartType.COLUMN, 'Average users by day', 45, 7,
    {vAxis: {minValue: 0, title: 'Average users'}});
  addDashboardChart_(context, sheet, 'entry_equipment', ['Equipment', 'Uses'],
    topRows_(equipment, 12), Charts.ChartType.BAR, 'Equipment usage', 63, 1,
    {hAxis: {minValue: 0, title: 'Logged uses'}});
  addDashboardChart_(context, sheet, 'entry_intervals', ['Days between visits', 'Students'],
    intervals.filter(function (r) { return r[1] > 0; }).slice(0, 20), Charts.ChartType.COLUMN,
    'Days between repeat visits', 63, 7, {vAxis: {minValue: 0, title: 'Students'}});
  drawEntryHeatmap_(sheet, entry, context.sources.timezone);
  drawVillageEntry_(context, sheet, entry);
}

/** Show village reach and the two weekly series supplied by Entry_Sheet_Data. */
function drawVillageEntry_(context, sheet, entry) {
  const villages = sourceBlock_(entry, 2, [41, 42, 43, 44]).map(function (row) {
    const swiped = count_(row[1]);
    const members = count_(row[2]);
    return [String(row[0]).trim(), swiped, members,
      villagePercent_(row[3], swiped, members)];
  });
  section_(sheet, 98, 'Village participation');
  drawVillageTable_(sheet, 100, villages);
  const weeklyRow = Math.max(111, 103 + villages.length);
  const swipes = villageWeeks_(entry, 46, context.sources.timezone);
  const unique = villageWeeks_(entry, 52, context.sources.timezone);
  const swipeHeaders = (entry[0] || []).slice(45, 50).map(String);
  const uniqueHeaders = (entry[0] || []).slice(51, 56).map(String);

  section_(sheet, weeklyRow, 'Weekly village swipes');
  addDashboardChart_(context, sheet, 'entry_village_weekly_swipes',
    swipeHeaders.slice(0, 4), swipes.map(function (row) { return row.slice(0, 4); }),
    Charts.ChartType.COLUMN, 'Swipes by village each week', weeklyRow + 2, 1,
    {isStacked: true, vAxis: {minValue: 0, title: 'Swipes'}});
  addDashboardChart_(context, sheet, 'entry_village_weekly_swipes_total',
    [swipeHeaders[0], swipeHeaders[4]], swipes.map(function (row) { return [row[0], row[4]]; }),
    Charts.ChartType.LINE, 'Total swipes each week', weeklyRow + 2, 7,
    {vAxis: {minValue: 0, title: 'Swipes'}});

  const uniqueRow = weeklyRow + 20;
  section_(sheet, uniqueRow, 'Weekly unique village members');
  addDashboardChart_(context, sheet, 'entry_village_weekly_unique',
    uniqueHeaders.slice(0, 4), unique.map(function (row) { return row.slice(0, 4); }),
    Charts.ChartType.COLUMN, 'Unique members by village each week', uniqueRow + 2, 1,
    {isStacked: true, vAxis: {minValue: 0, title: 'Unique members'}});
  addDashboardChart_(context, sheet, 'entry_village_weekly_unique_total',
    [uniqueHeaders[0], uniqueHeaders[4]], unique.map(function (row) { return [row[0], row[4]]; }),
    Charts.ChartType.LINE, 'Total unique members each week', uniqueRow + 2, 7,
    {vAxis: {minValue: 0, title: 'Unique members'}});
}

function drawVillageTable_(sheet, row, villages) {
  const colors = DASHBOARD_CONFIG.colors;
  const headers = ['Village', 'Swiped in', 'Total members', 'Swiped in %'];
  headers.forEach(function (label, index) {
    sheet.getRange(row, 1 + index * 3, 1, 3).merge().setValue(label)
      .setBackground(colors.navy).setFontColor(colors.white).setFontWeight('bold');
  });
  villages.forEach(function (village, index) {
    village.forEach(function (value, column) {
      sheet.getRange(row + index + 1, 1 + column * 3, 1, 3).merge().setValue(value)
        .setBackground(index % 2 ? colors.white : colors.pale)
        .setFontColor(colors.text).setBorder(false, false, true, false, false, false,
          '#DFE7EF', SpreadsheetApp.BorderStyle.SOLID);
    });
  });
  if (villages.length) {
    sheet.getRange(row + 1, 4, villages.length, 6).setNumberFormat('#,##0');
    sheet.getRange(row + 1, 10, villages.length, 3).setNumberFormat('0.00%');
  } else {
    note_(sheet, row + 1, 'No village participation data yet.');
  }
  note_(sheet, row + villages.length + 2,
    'Swiped in counts members who visited at least once. The percentage uses each village\'s total membership.');
}

function villagePercent_(value, swiped, members) {
  if (!isBlank_(value)) {
    const text = String(value).trim();
    const number = Number(text.replace(/[% ,]/g, ''));
    if (isFinite(number)) return text.indexOf('%') >= 0 || number > 1 ? number / 100 : number;
  }
  return members ? swiped / members : 0;
}

function villageWeeks_(entry, startColumn, timezone) {
  return series_(entry, 2, startColumn,
    [startColumn + 1, startColumn + 2, startColumn + 3, startColumn + 4],
    function (value) {
      if (value instanceof Date) return Utilities.formatDate(value, timezone, 'yyyy-MM-dd');
      return String(value).trim().replace(/^(\d{4}-\d{2}-\d{2})\s+to\s+.*/, '$1');
    });
}

function drawEntryHeatmap_(sheet, entry, timezone) {
  section_(sheet, 82, 'Visits by day and hour');
  const header = ['Day'].concat((entry[0] || []).slice(21, 32).map(function (value) {
    return hour12Label_(value, timezone);
  }));
  const rows = sourceBlock_(entry, 2, [21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32])
    .slice(0, 7).map(function (r) { return [String(r[0])].concat(r.slice(1).map(count_)); });
  if (!rows.length) return;
  const values = [header].concat(rows);
  const range = sheet.getRange(84, 1, values.length, 12);
  range.setValues(values).setHorizontalAlignment('center').setBorder(true, true, true, true, true, true,
    '#DFE7EF', SpreadsheetApp.BorderStyle.SOLID);
  sheet.getRange(84, 1, 1, 12).setBackground(DASHBOARD_CONFIG.colors.navy)
    .setFontColor('#FFFFFF').setFontWeight('bold');
  sheet.getRange(85, 1, rows.length, 1).setBackground(DASHBOARD_CONFIG.colors.pale).setFontWeight('bold');
  const maximum = Math.max(1, ...rows.map(function (r) { return Math.max.apply(null, r.slice(1)); }));
  const backgrounds = rows.map(function (r) {
    return r.slice(1).map(function (n) {
      const shade = Math.round(244 - 148 * n / maximum);
      return '#' + [shade, Math.round(250 - 90 * n / maximum),
        Math.round(250 - 92 * n / maximum)].map(function (channel) {
        return channel.toString(16).padStart(2, '0');
      }).join('');
    });
  });
  sheet.getRange(85, 2, rows.length, 11).setBackgrounds(backgrounds);
  note_(sheet, 93, 'Cell color shows relative traffic within the observed weekday and hour grid.');
}

/** Format heatmap headers as 12-hour times without changing other hour charts. */
function hour12Label_(value, timezone) {
  const label = hourLabel_(value, timezone);
  const match = /^(\d{1,2})(?::(\d{2}))?(?::\d{2})?$/.exec(label.trim());
  if (!match) return label;
  const hour = Number(match[1]);
  const minute = Number(match[2] || 0);
  if (hour > 23 || minute > 59) return label;
  return (hour % 12 || 12) + ':' + String(minute).padStart(2, '0') +
    (hour < 12 ? ' AM' : ' PM');
}
