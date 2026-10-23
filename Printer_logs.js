function buildPrinterDashboard_(context) {
  const print = context.sources.print;
  const sheet = prepareDashboardSheet_(context.spreadsheet, DASHBOARD_CONFIG.sheets.printer,
    'Print demand, queue operations, flags, and turnaround  •  Refreshed ' + context.runLabel);
  const assistants = series_(print, 2, 1, [2, 3]);
  const printers = series_(print, 2, 7, [8]);
  const hours = series_(print, 2, 10, [11, 12], function (value) {
    return hourLabel_(value, context.sources.timezone);
  });
  const requestors = series_(print, 2, 14, [15]);
  const flaggedUsers = series_(print, 2, 16, [17]);
  const reasons = series_(print, 2, 19, [20]);
  const projects = series_(print, 2, 22, [23, 24, 25]);
  const monthly = trimTrailingZeroRows_(series_(print, 2, 27, [28, 29, 30, 31],
    function (value) { return monthLabel_(value, context.sources.timezone); }));
  const submitStart = series_(print, 18, 27, [28]);
  const submitFlag = series_(print, 18, 30, [31]);
  const submitComplete = series_(print, 18, 33, [34]);
  const startComplete = series_(print, 18, 36, [37]);
  const printerDurations = series_(print, 17, 43, [44]).filter(function (r) { return r[1] > 0; });
  const projectDurations = series_(print, 37, 43, [44]).filter(function (r) { return r[1] > 0; });
  const finalDurations = series_(print, 43, 43, [44]).filter(function (r) { return r[1] > 0; });

  section_(sheet, 5, 'Demand and outcomes');
  addDashboardChart_(context, sheet, 'print_project_outcomes',
    ['Project type', 'Requested', 'Flagged', 'Completed'], projects,
    Charts.ChartType.COLUMN, 'Project purpose and outcome', 7, 1,
    {vAxis: {minValue: 0, title: 'Requests'}});
  addDashboardChart_(context, sheet, 'print_months',
    ['Month', 'Academic / club', 'Personal', 'Just for fun', 'Trying 3D printing'], monthly,
    Charts.ChartType.COLUMN, 'Requests by month and project type', 7, 7,
    {isStacked: true, vAxis: {minValue: 0, title: 'Requests'}});
  addDashboardChart_(context, sheet, 'print_printers', ['Printer', 'Requests'],
    topRows_(printers, 14), Charts.ChartType.BAR, 'Requests by printer', 25, 1,
    {hAxis: {minValue: 0, title: 'Requests'}});
  addDashboardChart_(context, sheet, 'print_hours', ['Hour', 'Started', 'Ended'],
    hours, Charts.ChartType.LINE, 'Queue actions by hour', 25, 7,
    {vAxis: {minValue: 0, title: 'Actions'}});
  section_(sheet, 43, 'Queue work and flags');
  addDashboardChart_(context, sheet, 'print_assistants', ['Assistant', 'Completed', 'Flagged'],
    assistants, Charts.ChartType.BAR, 'Actions by assistant', 45, 1,
    {hAxis: {minValue: 0, title: 'Actions'}});
  addDashboardChart_(context, sheet, 'print_flag_reasons', ['Reason', 'Flags'],
    topRows_(reasons, 10), Charts.ChartType.BAR, 'Recorded reasons for flags', 45, 7,
    {hAxis: {minValue: 0, title: 'Flagged requests'}});
  addDashboardChart_(context, sheet, 'print_requestors', ['Requestor', 'Requests'],
    topRows_(requestors, 10), Charts.ChartType.BAR, 'Top requestors', 63, 1,
    {hAxis: {minValue: 0, title: 'Requests'}});
  addDashboardChart_(context, sheet, 'print_flagged_users', ['Requestor', 'Flags'],
    topRows_(flaggedUsers, 10), Charts.ChartType.BAR, 'Top flagged requestors', 63, 7,
    {hAxis: {minValue: 0, title: 'Flags'}});
  section_(sheet, 81, 'Turnaround and print duration');
  addDashboardChart_(context, sheet, 'print_submit_start', ['Submission to start', 'Requests'],
    submitStart, Charts.ChartType.COLUMN, 'Submission to in progress', 83, 1,
    {vAxis: {minValue: 0, title: 'Requests'}});
  addDashboardChart_(context, sheet, 'print_submit_flag', ['Submission to flag', 'Requests'],
    submitFlag, Charts.ChartType.COLUMN, 'Submission to flagged', 83, 7,
    {vAxis: {minValue: 0, title: 'Requests'}});
  addDashboardChart_(context, sheet, 'print_submit_complete', ['Submission to completion', 'Requests'],
    submitComplete, Charts.ChartType.COLUMN, 'Submission to completed', 101, 1,
    {vAxis: {minValue: 0, title: 'Requests'}});
  addDashboardChart_(context, sheet, 'print_start_complete', ['In progress to completion', 'Requests'],
    startComplete, Charts.ChartType.COLUMN, 'In progress to completed', 101, 7,
    {vAxis: {minValue: 0, title: 'Requests'}});
  addDashboardChart_(context, sheet, 'print_duration_printer', ['Printer', 'Avg. hours'],
    printerDurations, Charts.ChartType.BAR, 'Average completed print duration by printer', 119, 1,
    {hAxis: {minValue: 0, title: 'Hours'}});
  addDashboardChart_(context, sheet, 'print_duration_project', ['Project type', 'Avg. hours'],
    projectDurations, Charts.ChartType.BAR, 'Average duration by project type', 119, 7,
    {hAxis: {minValue: 0, title: 'Hours'}});
  addDashboardChart_(context, sheet, 'print_final_duration', ['Final status', 'Avg. hours'],
    finalDurations, Charts.ChartType.BAR, 'Average time to final status', 137, 1,
    {hAxis: {minValue: 0, title: 'Hours'}});
  note_(sheet, 156, 'Durations are source averages. “No Uses” printers are omitted from duration charts.');
  const projectFlagged = sumColumn_(projects, 2);
  const reasonFlags = sumColumn_(reasons, 1);
  if (reasonFlags !== projectFlagged) {
    context.warnings.push('Flag reason counts (' + reasonFlags +
      ') differ from project outcome flags (' + projectFlagged + ').');
  }
}
