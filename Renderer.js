/** These three sheets are fully owned by the dashboard renderer. */
function prepareDashboardSheet_(spreadsheet, name, subtitle) {
  let sheet = spreadsheet.getSheetByName(name);
  if (!sheet) sheet = spreadsheet.insertSheet(name);
  if (sheet.getMaxColumns() < 12) sheet.insertColumnsAfter(sheet.getMaxColumns(), 12 - sheet.getMaxColumns());
  if (sheet.getMaxRows() < 180) sheet.insertRowsAfter(sheet.getMaxRows(), 180 - sheet.getMaxRows());
  sheet.getCharts().forEach(function (chart) { sheet.removeChart(chart); });
  sheet.getRange(1, 1, sheet.getMaxRows(), 12).breakApart();
  sheet.clear();
  sheet.clearConditionalFormatRules();
  sheet.setHiddenGridlines(true);
  sheet.setColumnWidths(1, 12, 104);
  sheet.setRowHeights(1, 2, 28);
  sheet.getRange('A1:L2').merge().setValue(name === DASHBOARD_CONFIG.sheets.executive ? 'SULLIVAN  |  EXECUTIVE SUMMARY' : name.toUpperCase())
    .setBackground(DASHBOARD_CONFIG.colors.navy).setFontColor(DASHBOARD_CONFIG.colors.white)
    .setFontSize(19).setFontWeight('bold').setVerticalAlignment('middle');
  sheet.getRange('A3:L3').merge().setValue(subtitle).setFontColor(DASHBOARD_CONFIG.colors.muted)
    .setFontSize(10).setBackground(DASHBOARD_CONFIG.colors.pale);
  sheet.setFrozenRows(3);
  sheet.setTabColor(DASHBOARD_CONFIG.colors.teal);
  return sheet;
}

function section_(sheet, row, title) {
  sheet.getRange(row, 1, 1, 12).merge().setValue(title.toUpperCase())
    .setBackground(DASHBOARD_CONFIG.colors.navy).setFontColor('#FFFFFF')
    .setFontWeight('bold').setFontSize(11);
  sheet.setRowHeight(row, 28);
}

function card_(sheet, row, column, width, label, value, accent, detail) {
  const colors = DASHBOARD_CONFIG.colors;
  const box = sheet.getRange(row, column, 4, width);
  box.setBackground(colors.pale).setBorder(true, true, true, true, false, false, '#DDE6EF', SpreadsheetApp.BorderStyle.SOLID);
  sheet.getRange(row, column, 1, width).merge().setValue(label.toUpperCase())
    .setFontColor(colors.muted).setFontSize(9).setFontWeight('bold');
  sheet.getRange(row + 1, column, 2, width).merge().setValue(value)
    .setFontColor(accent || colors.blue).setFontSize(23).setFontWeight('bold')
    .setVerticalAlignment('middle');
  sheet.getRange(row + 3, column, 1, width).merge().setValue(detail || '')
    .setFontColor(colors.muted).setFontSize(9);
}

function note_(sheet, row, message) {
  sheet.getRange(row, 1, 1, 12).merge().setValue(message)
    .setFontColor(DASHBOARD_CONFIG.colors.muted).setFontSize(9).setWrap(true);
  sheet.setRowHeight(row, 32);
}

function writeChartData_(context, target, key, headers, rows) {
  if (!rows.length) return null;
  const width = headers.length;
  const sheet = context.chartData;
  const start = context.chartDataNextRow;
  sheet.getRange(start, 1, 1, width).setValues([headers]);
  sheet.getRange(start + 1, 1, rows.length, width).setValues(rows);
  sheet.getRange(start, 1, 1, width).setBackground(DASHBOARD_CONFIG.colors.navy)
    .setFontColor('#FFFFFF').setFontWeight('bold');
  sheet.getRange(start, width + 2).setValue(key).setFontColor(DASHBOARD_CONFIG.colors.muted);
  context.chartDataNextRow += rows.length + 3;
  SpreadsheetApp.flush(); // Commit data before the chart is inserted.
  context.datasetCount++;
  return sheet.getRange(start, 1, rows.length + 1, width);
}

function addDashboardChart_(context, target, key, headers, rows, chartType, title, anchorRow, anchorColumn, options) {
  const range = writeChartData_(context, target, key, headers, rows);
  if (!range) {
    target.getRange(anchorRow, anchorColumn).setValue(title + ': no data yet').setFontColor(DASHBOARD_CONFIG.colors.muted);
    context.warnings.push(key + ' has no rows');
    return;
  }
  let builder = target.newChart().addRange(range).setNumHeaders(1)
    .setHiddenDimensionStrategy(Charts.ChartHiddenDimensionStrategy.SHOW_BOTH)
    .setChartType(chartType).setPosition(anchorRow, anchorColumn, 12, 8);
  builder = styleDashboardChart_(builder, chartType, headers, title, options);
  target.insertChart(builder.build());
  context.chartCount++;
}

function styleDashboardChart_(builder, chartType, headers, title, options) {
  const colors = DASHBOARD_CONFIG.colors;
  // The style probe showed that chartArea alone blanks a chart in this sheet.
  // Keep the other tested options and let Sheets choose the plotting area.
  builder = builder
    .setOption('title', title).setOption('width', 600).setOption('height', 310)
    .setOption('backgroundColor', colors.white)
    .setOption('titleTextStyle', {color: colors.navy, fontSize: 14, bold: true})
    .setOption('colors', [colors.teal, colors.blue, colors.orange, colors.mint])
    .setOption('legend', {position: headers.length > 2 || chartType === Charts.ChartType.PIE ? 'bottom' : 'none',
      textStyle: {fontSize: 10}});
  Object.keys(options || {}).forEach(function (name) {
    if (name !== 'chartArea') builder = builder.setOption(name, options[name]);
  });
  return builder;
}

function topRows_(rows, count, valueIndex) {
  return rows.filter(function (r) { return count_(r[valueIndex || 1]) > 0; })
    .sort(function (a, b) { return count_(b[valueIndex || 1]) - count_(a[valueIndex || 1]); }).slice(0, count);
}
