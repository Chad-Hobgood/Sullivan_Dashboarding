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
}

function drawEntryHeatmap_(sheet, entry, timezone) {
  section_(sheet, 82, 'Visits by day and hour');
  const header = ['Day'].concat((entry[0] || []).slice(21, 32).map(function (value) {
    return hourLabel_(value, timezone);
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
