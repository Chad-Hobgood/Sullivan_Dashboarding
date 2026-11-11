# Operations and chart diagnostics

[Back to setup](../README.md) · [Functions and files](functions.md)

## Daily trigger

`installNightlyRefresh` creates one installable time-driven trigger for `refreshDashboard` under the account that runs it. It replaces that account's existing `refreshDashboard` triggers. The default `nightlyHour` is 3 in the spreadsheet time zone, so the run occurs sometime between 3:00 and 4:00 a.m. Set it to an hour after both source imports finish, and rerun `installNightlyRefresh` after changing it.

You can instead create the trigger in **Apps Script → Triggers → Add Trigger**: select `refreshDashboard`, **Time-driven**, **Day timer**, and the desired hour. Use only one scheduling method for an account.

The sheet's `onOpen` simple trigger adds the **Sullivan Dashboard** menu automatically; it does not need manual installation. An edit or change trigger is not dependable for source data written by another script or an API, because programmatic writes do not fire those triggers. If imports run in the same Apps Script project, they can call `refreshDashboard()` after both succeed.

## Trigger handoff

Run `authorizeScript`, `refreshDashboard`, and `installNightlyRefresh` as the new owner. Have the previous owner remove their `refreshDashboard` trigger in Apps Script. The new owner cannot see or replace another account's trigger; leaving both in place can run the refresh twice.

## Blank charts

Run `diagnoseDashboardCharts` to log each chart's source range, sample values, and numeric cell counts in `_Dashboard_Log`. Then run `createChartTestSheet`. It creates `_Chart_Test` only on request and does not run during nightly refreshes.

| Position on `_Chart_Test` | Test | Interpretation |
| --- | --- | --- |
| Left, row 7 | Known numbers (3, 172, 93) with basic settings | If blank, try inserting a chart manually from `_Chart_Test!A1:B4` and checking another browser. |
| Right, row 7 | Copied dashboard data with basic settings | If the left chart works but this is blank, inspect `_Chart_Test!E1:F4` and `sourceNumericCells` in the Chart test log entry. |
| Left, row 27 | Known numbers with current dashboard styling | Should show the same three bars as the first chart. If blank, confirm the current `Renderer.js` was saved in Apps Script. |

The chart investigation found that the `chartArea` option blanked charts in this spreadsheet. The current renderer omits that option. After updating Apps Script files, run `refreshDashboard` to rebuild the charts and `_Dashboard_Data`.

For appearance comparisons, run `createChartStyleTestSheet` or choose **Sullivan Dashboard → Test chart styling**. It creates `_Chart_Style_Test` with ten charts using identical sample data. Chart 1 is the basic control; charts 2–8 test individual options; chart 9 uses the former full style; chart 10 combines options without `chartArea`. This sheet does not modify the dashboards or run nightly.

## Apps Script references

- [Embedded chart builder](https://developers.google.com/apps-script/reference/spreadsheet/embedded-chart-builder)
- [Sheet charts and formatting](https://developers.google.com/apps-script/reference/spreadsheet/sheet)
- [Clock trigger builder](https://developers.google.com/apps-script/reference/script/clock-trigger-builder)
- [Simple triggers](https://developers.google.com/apps-script/guides/triggers)
- [Installable triggers](https://developers.google.com/apps-script/guides/triggers/installable)
