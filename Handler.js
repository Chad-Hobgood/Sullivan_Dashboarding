/**
 * Main handler. To add a new dashboard module, add its function to `steps`.
 * The separate import process must finish before this handler runs.
 */
function refreshDashboard() {
  const lock = LockService.getDocumentLock() || LockService.getScriptLock();
  if (!lock.tryLock(30000)) throw new Error('Another dashboard refresh is still running.');
  const started = new Date();
  let context;
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    if (!spreadsheet) throw new Error('Bind this Apps Script project to the converted Google Sheet.');
    const sources = loadDashboardSources_(spreadsheet); // Validate before changing dashboards.
    context = {
      spreadsheet: spreadsheet,
      sources: sources,
      runLabel: Utilities.formatDate(started, sources.timezone, 'MMM d, yyyy h:mm a z'),
      chartData: null,
      chartDataNextRow: 1,
      chartCount: 0,
      datasetCount: 0,
      warnings: [],
      metrics: {}
    };
    const properties = PropertiesService.getDocumentProperties();
    const fingerprints = {entry: sourceFingerprint_(sources.entry),
      print: sourceFingerprint_(sources.print)};
    Object.keys(fingerprints).forEach(function (name) {
      if (properties.getProperty('SULLIVAN_SOURCE_' + name) === fingerprints[name]) {
        context.warnings.push(name + ' source values are unchanged since the last successful refresh.');
      }
    });
    context.chartData = spreadsheet.getSheetByName(DASHBOARD_CONFIG.sheets.chartData) ||
      spreadsheet.insertSheet(DASHBOARD_CONFIG.sheets.chartData);
    // Keep chart source visible while we diagnose the blank-chart issue.
    if (context.chartData.isSheetHidden()) {
      context.chartData.showSheet();
      context.warnings.push('_Dashboard_Data was hidden and has been made visible.');
    }
    context.chartData.clear();
    context.chartData.setHiddenGridlines(true);
    context.chartData.setColumnWidths(1, 8, 150);
    context.chartData.setTabColor(DASHBOARD_CONFIG.colors.muted);
    const steps = [
      {name: 'Executive summary', run: buildExecutiveDashboard_},
      {name: 'Entry statistics', run: buildEntryDashboard_},
      {name: 'Printer statistics', run: buildPrinterDashboard_}
    ];
    const failures = [];
    steps.forEach(function (step) {
      const stepStarted = Date.now();
      try {
        step.run(context);
        writeDashboardLog_(spreadsheet, started, step.name, 'OK',
          'Completed in ' + (Date.now() - stepStarted) + ' ms');
      } catch (error) {
        const detail = error && error.stack ? error.stack : String(error);
        failures.push(step.name + ': ' + detail);
        writeDashboardLog_(spreadsheet, started, step.name, 'ERROR', detail);
      }
    });
    const detail = JSON.stringify({charts: context.chartCount, datasets: context.datasetCount,
      metrics: context.metrics, warnings: context.warnings,
      sourceRows: {entry: lastPopulatedRow_(sources.entry),
        print: lastPopulatedRow_(sources.print)}});
    writeDashboardLog_(spreadsheet, started, 'Refresh', failures.length ? 'ERROR' : 'OK', detail);
    if (failures.length) throw new Error(failures.join('\n'));
    properties.setProperty('SULLIVAN_LAST_SUCCESS', started.toISOString());
    properties.setProperty('SULLIVAN_SOURCE_entry', fingerprints.entry);
    properties.setProperty('SULLIVAN_SOURCE_print', fingerprints.print);
    Logger.log('Dashboard refresh succeeded: ' + detail);
  } catch (error) {
    if (!context) {
      const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
      if (spreadsheet) writeDashboardLog_(spreadsheet, started, 'Validation', 'ERROR',
        error && error.stack ? error.stack : String(error));
    }
    Logger.log('Dashboard refresh failed: ' + (error && error.stack ? error.stack : error));
    throw error;
  } finally {
    lock.releaseLock();
  }
}

function writeDashboardLog_(spreadsheet, runAt, step, status, detail) {
  let sheet = spreadsheet.getSheetByName(DASHBOARD_CONFIG.sheets.log);
  if (!sheet) sheet = spreadsheet.insertSheet(DASHBOARD_CONFIG.sheets.log);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['Run at', 'Step', 'Status', 'Details']);
    sheet.getRange('A1:D1').setBackground(DASHBOARD_CONFIG.colors.navy)
      .setFontColor('#FFFFFF').setFontWeight('bold');
    sheet.setFrozenRows(1);
    sheet.setColumnWidths(1, 1, 165);
    sheet.setColumnWidths(2, 2, 150);
    sheet.setColumnWidth(4, 650);
    sheet.setTabColor(DASHBOARD_CONFIG.colors.orange);
  }
  sheet.appendRow([runAt, step, status, String(detail).slice(0, 45000)]);
  Logger.log(step + ' [' + status + '] ' + detail);
}

/** Run once after conversion to Google Sheets, then authorize the trigger. */
function installNightlyRefresh() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (!spreadsheet) throw new Error('Bind this script to the dashboard Google Sheet.');
  const oldTriggers = ScriptApp.getProjectTriggers().filter(function (trigger) {
    return trigger.getHandlerFunction() === 'refreshDashboard';
  });
  oldTriggers.forEach(function (trigger) { ScriptApp.deleteTrigger(trigger); });
  ScriptApp.newTrigger('refreshDashboard').timeBased()
    .atHour(DASHBOARD_CONFIG.nightlyHour).everyDays(1)
    .inTimezone(spreadsheet.getSpreadsheetTimeZone()).create();
  writeDashboardLog_(spreadsheet, new Date(), 'Schedule', 'OK',
    'Nightly refresh scheduled in hour ' + DASHBOARD_CONFIG.nightlyHour +
    ':00–' + (DASHBOARD_CONFIG.nightlyHour + 1) + ':00 ' + spreadsheet.getSpreadsheetTimeZone() +
    '. Installable time triggers run within an approximate hour.');
}

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Sullivan Dashboard')
    .addItem('Refresh now', 'refreshDashboard')
    .addItem('Install nightly refresh', 'installNightlyRefresh')
    .addItem('Diagnose blank charts', 'diagnoseDashboardCharts')
    .addItem('Create chart test sheet', 'createChartTestSheet')
    .addItem('Test chart styling', 'createChartStyleTestSheet')
    .addToUi();
}

/** Run manually if a chart still looks blank after refreshDashboard. */
function diagnoseDashboardCharts() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (!spreadsheet) throw new Error('Open the bound dashboard Google Sheet first.');
  SpreadsheetApp.flush();
  const dataSheet = spreadsheet.getSheetByName(DASHBOARD_CONFIG.sheets.chartData);
  const report = {
    dataSheetPresent: !!dataSheet,
    dataSheetHidden: dataSheet ? dataSheet.isSheetHidden() : null,
    dashboards: {}
  };
  [DASHBOARD_CONFIG.sheets.executive, DASHBOARD_CONFIG.sheets.entry,
    DASHBOARD_CONFIG.sheets.printer].forEach(function (name) {
    const sheet = spreadsheet.getSheetByName(name);
    report.dashboards[name] = sheet ? sheet.getCharts().map(function (chart, index) {
      const range = chart.getRanges()[0];
      const values = range ? range.getValues() : [];
      const numeric = values.slice(1).reduce(function (count, row) {
        return count + row.slice(1).filter(function (value) {
          return typeof value === 'number' && isFinite(value);
        }).length;
      }, 0);
      const positive = values.slice(1).reduce(function (count, row) {
        return count + row.slice(1).filter(function (value) {
          return typeof value === 'number' && value > 0;
        }).length;
      }, 0);
      return {
        chart: index + 1,
        chartType: String(chart.getChartType()),
        source: range ? range.getSheet().getName() + '!' + range.getA1Notation() : 'none',
        sourceHidden: range ? range.getSheet().isSheetHidden() : null,
        dataRows: Math.max(0, values.length - 1),
        numericCells: numeric,
        positiveCells: positive,
        sample: values.slice(0, 3)
      };
    }) : [];
  });
  const detail = JSON.stringify(report);
  Logger.log(detail);
  writeDashboardLog_(spreadsheet, new Date(), 'Chart diagnostic', 'INFO', detail);
  return report;
}
