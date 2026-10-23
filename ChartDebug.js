/** Manual experiment: three charts compare source data and the active renderer. */
function createChartTestSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (!spreadsheet) throw new Error('Open the bound dashboard Google Sheet first.');
  const name = '_Chart_Test';
  const sheet = spreadsheet.getSheetByName(name) || spreadsheet.insertSheet(name);
  if (sheet.getMaxColumns() < 14) sheet.insertColumnsAfter(sheet.getMaxColumns(), 14 - sheet.getMaxColumns());
  sheet.getCharts().forEach(function (chart) { sheet.removeChart(chart); });
  sheet.getRange('A5:N5').breakApart();
  sheet.clear();
  sheet.setHiddenGridlines(true);
  sheet.setColumnWidths(1, 14, 105);
  sheet.getRange('A1:B4').setValues([
    ['Month', 'Visits'], ['August', 3], ['September', 172], ['October', 93]
  ]);
  sheet.getRange('A5:N5').merge().setValue(
    'LEFT: known data, basic chart. RIGHT: copied dashboard data, basic chart. BELOW: known data, current dashboard options.');
  sheet.getRange('A5:N5').setWrap(true).setFontWeight('bold');

  const executive = spreadsheet.getSheetByName(DASHBOARD_CONFIG.sheets.executive);
  const sourceChart = executive && executive.getCharts()[0];
  const sourceRange = sourceChart && sourceChart.getRanges()[0];
  const sourceValues = sourceRange ? sourceRange.getValues().slice(0, 21) : [];
  if (sourceValues.length > 1) {
    sheet.getRange(1, 5, sourceValues.length, sourceValues[0].length).setValues(sourceValues);
  }
  SpreadsheetApp.flush();

  // No renderer options: this should always plot 3, 172, and 93.
  sheet.insertChart(sheet.newChart().addRange(sheet.getRange('A1:B4'))
    .setNumHeaders(1).setChartType(Charts.ChartType.COLUMN)
    .setPosition(7, 1, 0, 0).build());

  if (sourceValues.length > 1) {
    sheet.insertChart(sheet.newChart()
      .addRange(sheet.getRange(1, 5, sourceValues.length, sourceValues[0].length))
      .setNumHeaders(1).setChartType(Charts.ChartType.COLUMN)
      .setPosition(7, 8, 0, 0).build());
  }

  const styled = styleDashboardChart_(sheet.newChart().addRange(sheet.getRange('A1:B4'))
    .setNumHeaders(1).setChartType(Charts.ChartType.COLUMN)
    .setPosition(27, 1, 0, 0), Charts.ChartType.COLUMN,
  ['Month', 'Visits'], 'Known data with dashboard options', {vAxis: {minValue: 0}});
  sheet.insertChart(styled.build());

  const report = {
    testSheet: name,
    chartStyle: 'without-chartArea',
    knownData: [['August', 3], ['September', 172], ['October', 93]],
    sourceRange: sourceRange ? sourceRange.getSheet().getName() + '!' + sourceRange.getA1Notation() : 'none',
    sourceSheetHidden: sourceRange ? sourceRange.getSheet().isSheetHidden() : null,
    sourceSample: sourceValues.slice(0, 4),
    sourceNumericCells: sourceValues.slice(1).reduce(function (count, row) {
      return count + row.slice(1).filter(function (value) {
        return typeof value === 'number' && isFinite(value);
      }).length;
    }, 0)
  };
  const detail = JSON.stringify(report);
  Logger.log(detail);
  writeDashboardLog_(spreadsheet, new Date(), 'Chart test', 'INFO', detail);
  return report;
}

/** Manual visual test. Each chart changes only the option named in its title. */
function createChartStyleTestSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (!spreadsheet) throw new Error('Open the bound dashboard Google Sheet first.');
  const name = '_Chart_Style_Test';
  const sheet = spreadsheet.getSheetByName(name) || spreadsheet.insertSheet(name);
  if (sheet.getMaxColumns() < 14) sheet.insertColumnsAfter(sheet.getMaxColumns(), 14 - sheet.getMaxColumns());
  sheet.getCharts().forEach(function (chart) { sheet.removeChart(chart); });
  sheet.getRange('A5:N5').breakApart();
  sheet.clear();
  sheet.setHiddenGridlines(true);
  sheet.setColumnWidths(1, 14, 105);
  sheet.getRange('A1:B4').setValues([
    ['Month', 'Visits'], ['August', 3], ['September', 172], ['October', 93]
  ]);
  sheet.getRange('A5:N5').merge().setValue(
    'Each chart uses the same known data. Note which numbered charts show bars; the production dashboard is unchanged.');
  sheet.getRange('A5:N5').setWrap(true).setFontWeight('bold');
  SpreadsheetApp.flush();

  const colors = DASHBOARD_CONFIG.colors;
  const formerOptions = {
    width: 600,
    height: 310,
    backgroundColor: colors.white,
    chartArea: {left: 75, top: 48, width: '77%', height: '70%'},
    titleTextStyle: {color: colors.navy, fontSize: 14, bold: true},
    colors: [colors.teal, colors.blue, colors.orange, colors.mint],
    legend: {position: 'none', textStyle: {fontSize: 10}},
    vAxis: {minValue: 0}
  };
  const withoutChartArea = Object.assign({}, formerOptions);
  delete withoutChartArea.chartArea;
  const probes = [
    {title: '1. Title only (control)', options: {}},
    {title: '2. Width and height', options: {width: formerOptions.width, height: formerOptions.height}},
    {title: '3. White background', options: {backgroundColor: formerOptions.backgroundColor}},
    {title: '4. Chart area', options: {chartArea: formerOptions.chartArea}},
    {title: '5. Title text style', options: {titleTextStyle: formerOptions.titleTextStyle}},
    {title: '6. Sullivan colors', options: {colors: formerOptions.colors}},
    {title: '7. Legend position and text', options: {legend: formerOptions.legend}},
    {title: '8. Vertical axis minimum', options: {vAxis: formerOptions.vAxis}},
    {title: '9. All former options', options: formerOptions},
    {title: '10. All except chart area', options: withoutChartArea}
  ];
  probes.forEach(function (probe, index) {
    let builder = sheet.newChart().addRange(sheet.getRange('A1:B4'))
      .setNumHeaders(1).setChartType(Charts.ChartType.COLUMN)
      .setPosition(7 + Math.floor(index / 2) * 20, index % 2 ? 8 : 1, 0, 0)
      .setOption('title', probe.title);
    Object.keys(probe.options).forEach(function (option) {
      builder = builder.setOption(option, probe.options[option]);
    });
    sheet.insertChart(builder.build());
  });

  const report = {testSheet: name, chartCount: probes.length,
    probes: probes.map(function (probe) { return probe.title; })};
  const detail = JSON.stringify(report);
  Logger.log(detail);
  writeDashboardLog_(spreadsheet, new Date(), 'Chart style test', 'INFO', detail);
  return report;
}
