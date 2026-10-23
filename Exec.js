function buildExecutiveDashboard_(context) {
  const c = DASHBOARD_CONFIG.colors;
  const entry = context.sources.entry;
  const print = context.sources.print;
  const sheet = prepareDashboardSheet_(context.spreadsheet, DASHBOARD_CONFIG.sheets.executive,
    'Projects, tools, student interactions, and space use  •  Refreshed ' + context.runLabel);
  const projects = series_(print, 2, 22, [23, 24, 25]);
  const months = trimTrailingZeroRows_(series_(entry, 2, 34, [35, 36]));
  const printMonths = trimTrailingZeroRows_(series_(print, 2, 27, [28, 29, 30, 31],
    function (value) { return monthLabel_(value, context.sources.timezone); }));
  const equipment = series_(entry, 2, 38, [39]);
  const users = series_(entry, 2, 6, [7]);
  const swipes = sumColumn_(months, 1);
  const uniqueUsers = users.length ? users[0][1] : 0;
  const once = users.filter(function (r) { return r[0] === 'Visited Exactly Once'; });
  const repeat = Math.max(0, uniqueUsers - (once.length ? once[0][1] : 0));
  const requested = sumColumn_(projects, 1);
  const flagged = sumColumn_(projects, 2);
  const completed = sumColumn_(projects, 3);
  const equipmentUses = sumColumn_(equipment, 1);
  const printers = series_(print, 2, 7, [8]).filter(function (r) { return r[1] > 0; }).length;
  const topProject = topRows_(projects.map(function (r) { return [r[0], r[1]]; }), 1);

  card_(sheet, 5, 1, 3, 'Space visits', swipes, c.teal, 'Entry swipes in source period');
  card_(sheet, 5, 4, 3, 'Students reached', uniqueUsers, c.blue, 'Unique space users');
  card_(sheet, 5, 7, 3, 'Print projects', requested, c.orange, 'Requested print jobs');
  card_(sheet, 5, 10, 3, 'Equipment uses', equipmentUses, c.teal, 'Logged tool interactions');
  card_(sheet, 10, 1, 3, 'Completed prints', completed, c.blue, 'Resolved as completed');
  card_(sheet, 10, 4, 3, 'Flagged prints', flagged, c.orange, requested ? (100 * flagged / requested).toFixed(1) + '% of requests' : 'No requests');
  card_(sheet, 10, 7, 3, 'Returning students', repeat, c.teal, 'Visited more than once');
  card_(sheet, 10, 10, 3, 'Used printers', printers, c.blue, 'Printers with logged requests');
  section_(sheet, 16, 'At a glance');
  addDashboardChart_(context, sheet, 'executive_project_mix', ['Project type', 'Requests'],
    projects.map(function (r) { return [r[0], r[1]]; }), Charts.ChartType.PIE,
    'What students are making', 18, 1, {pieHole: 0.48});
  addDashboardChart_(context, sheet, 'executive_monthly_visits', ['Month', 'Swipes', 'Unique users'],
    months, Charts.ChartType.LINE, 'Space visits by month', 18, 7,
    {vAxis: {minValue: 0, title: 'Visits / students'}});
  addDashboardChart_(context, sheet, 'executive_equipment', ['Equipment', 'Uses'],
    topRows_(equipment, 10), Charts.ChartType.BAR, 'Most used tools', 36, 1,
    {hAxis: {minValue: 0, title: 'Logged uses'}});
  addDashboardChart_(context, sheet, 'executive_print_months',
    ['Month', 'Academic / club', 'Personal', 'Just for fun', 'Trying 3D printing'],
    printMonths, Charts.ChartType.COLUMN, 'Print requests by month and purpose', 36, 7,
    {isStacked: true, vAxis: {minValue: 0, title: 'Requests'}});
  note_(sheet, 55, 'Most common project: ' + (topProject.length ? topProject[0][0] : 'No data') +
    '. Counts reflect the current summary tables; the entry and print source periods may differ.');
  context.metrics = {swipes: swipes, uniqueUsers: uniqueUsers, requested: requested,
    completed: completed, flagged: flagged, equipmentUses: equipmentUses};
}
