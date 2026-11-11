/**
 * Run once from the bound Apps Script editor as the account that will run the
 * dashboard. This prompts for the project's required permissions and checks
 * access without rebuilding dashboards or creating a trigger.
 */
function authorizeScript() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (!spreadsheet) {
    throw new Error('Bind this Apps Script project to the dashboard Google Sheet.');
  }

  const sourceNames = [
    DASHBOARD_CONFIG.sheets.entrySource,
    DASHBOARD_CONFIG.sheets.printSource
  ];
  sourceNames.forEach(function (name) {
    const sheet = spreadsheet.getSheetByName(name);
    if (!sheet) throw new Error('Required source sheet missing: ' + name);
    sheet.getRange('A1').getValue(); // Confirm the account can read source data.
  });

  // The refresh uses document properties; scheduling uses ScriptApp. Checking
  // both here includes those services in the manual authorization run.
  const properties = PropertiesService.getDocumentProperties();
  if (!properties) throw new Error('Document properties are unavailable for this spreadsheet.');
  properties.getProperty('SULLIVAN_LAST_SUCCESS');
  const triggers = ScriptApp.getProjectTriggers();

  const message = 'Authorization check complete for ' + spreadsheet.getName() +
    '. Source sheets are accessible and trigger management is available. ' +
    'Run installNightlyRefresh from this account to schedule the refresh.';
  Logger.log(message + ' Triggers visible to this account: ' + triggers.length);
  return message;
}
