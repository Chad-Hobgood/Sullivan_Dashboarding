# Sullivan dashboard refresh

This is a **container-bound Google Apps Script** for a Google Sheets copy of `Dashboard (1).xlsx`. It reads the two summary inputs and redraws three dashboard tabs every night. Another process can update the inputs before the refresh; this script does not import or alter the input data.

## Setup

1. Upload `Dashboard (1).xlsx` to Google Drive and open it as a **Google Sheet**. Check that these tabs and their headers survived conversion: `Print_Queue_Data` and `Entry_Sheet_Data`. The supplied executive tab is spelled `Execiutive Summary`; the script uses that name, or creates it if missing.
2. In the Google Sheet, open **Extensions → Apps Script**. Create one Apps Script file for each local `.js` file in this repository and paste its contents. The Apps Script editor displays these as `.gs` files. Apps Script shares global functions across files; their filename order does not control execution.
3. In `Config.js`, set `nightlyHour` to an hour **after both upstream sheets have finished updating**. The default is 3 a.m. in the spreadsheet's time zone. Set the spreadsheet time zone in **File → Settings**.
4. Run `refreshDashboard` once in Apps Script and authorize it. Inspect the three dashboard tabs, `_Dashboard_Data`, and `_Dashboard_Log`.
5. Run `installNightlyRefresh` once. It replaces any earlier trigger for `refreshDashboard` in this Apps Script project. The Apps Script time trigger runs once daily within the selected hour; it does not guarantee an exact minute. You can also use the **Sullivan Dashboard → Refresh now** menu.

The script owns and redraws `Execiutive Summary`, `Entry Statistics`, `Printer Statistics`, and `_Dashboard_Data`. Keep manual notes elsewhere. Source data is never cleared. All chart data is on the dedicated `_Dashboard_Data` tab; the dashboard tabs have no side data. `_Dashboard_Log` records each module's outcome, chart count, source row count, warnings, and errors. It warns if an input has not changed since the last successful run. Failed header validation stops before any dashboard is changed.

## Blank charts

The chart test showed that both known numbers and copied dashboard data render with basic chart settings. A follow-up test found that setting `chartArea` blanks the chart in this spreadsheet. The renderer now uses the tested styling options without `chartArea`. After updating `Handler.js`, `Renderer.js`, and `ChartDebug.js` in Apps Script, run `createChartTestSheet` once to confirm that its third chart plots. Then run `refreshDashboard` to rebuild the dashboard charts and clear the side data left by the previous renderer. The temporary `_Chart_Test` tab has three charts:

| Position | Test | What it tells you |
| --- | --- | --- |
| Left, row 7 | Known numbers (3, 172, 93) with basic chart settings | If blank, even a minimal chart fails in this spreadsheet or browser. Try manually inserting a chart from `_Chart_Test!A1:B4` and opening the sheet in another browser. |
| Right, row 7 | Copied real dashboard data with basic chart settings | If the left chart works but this is blank, inspect `_Chart_Test!E1:F4` and the `sourceNumericCells` value in the `Chart test` log entry. |
| Left, row 27 | Known numbers with the current dashboard options | It should now show the same three bars as the first chart. If it remains blank, confirm the updated `Renderer.js` was saved in Apps Script. |

Run `diagnoseDashboardCharts` for a per-chart report in `_Dashboard_Log`. It records each range, a few source values, and its numeric cell count. The test sheet is only created when requested and is not part of the nightly refresh.

## Chart appearance

The production charts have a small inset from the cell edges, Sullivan colors, consistent sizing, and formatted titles and legends. Run `createChartStyleTestSheet` manually, or reopen the spreadsheet and choose **Sullivan Dashboard → Test chart styling**. It creates `_Chart_Style_Test` with ten numbered charts using identical sample data. Chart 1 is the basic control; charts 2–8 test individual options; chart 9 uses the former full style; chart 10 combines the options without `chartArea`. This test sheet does not run nightly or modify the dashboards.

## Triggers

| Function | Trigger | Action |
| --- | --- | --- |
| `refreshDashboard` in `Handler.js` | **One installable time-driven trigger**, daily after the two source imports | Rebuilds all dashboards and writes the run log. Default schedule: sometime from 3:00 to 4:00 a.m. in the spreadsheet time zone. |
| `onOpen` in `Handler.js` | **Automatic simple open trigger**; no trigger setup needed | Adds the Sullivan Dashboard menu when an editor opens the sheet. |
| `installNightlyRefresh` in `Handler.js` | **No trigger**; run manually once | Creates or replaces the daily `refreshDashboard` trigger. Run it again after changing `nightlyHour`. |
| `buildExecutiveDashboard_`, `buildEntryDashboard_`, `buildPrinterDashboard_`, and other helpers | **No triggers** | `refreshDashboard` calls these in order. |

You can create the daily trigger either by running `installNightlyRefresh` **or** in Apps Script's **Triggers → Add Trigger**: choose `refreshDashboard`, **Time-driven**, **Day timer**, and an hour after the source imports. Use one method so the refresh does not run twice. Daily time-driven triggers run within an approximate hour, not at an exact minute. Install the trigger from the account that should own and run the refresh.

An edit or change trigger is not a dependable replacement when another script or an API populates the source tabs: programmatic writes do not fire those spreadsheet triggers. If the import function is in the same Apps Script project, it can call `refreshDashboard()` after both imports succeed; otherwise keep the daily schedule after the imports. A form-submit trigger is only relevant if form submissions directly update this spreadsheet.

## What is shown

| Tab | Views |
| --- | --- |
| Executive summary | Visits, distinct students, repeat students, print requests and outcomes, equipment use, project mix, monthly activity, popular tools |
| Entry statistics | Monthly and recent unique visitors, visit frequency and cadence, hourly and weekday traffic, equipment, day and hour heatmap |
| Printer statistics | Project types, monthly mix, printers, queue action hours, assistants, requestors, flags and reasons, four turnaround distributions, duration averages |

The source tabs are **pre-aggregated summary tables**, not event logs. Charts therefore use the provided counts as given. The entry monthly table has month names but no year, so the chart preserves its August-to-July order. Print month dates are displayed with a year when present. The dashboard does not infer missing measures from the KPI document: filament colors/weight, village, approval status, and print restarts need additional source columns or tables. The flag reason table may not total the flag count in project outcomes; a mismatch is logged.

## Extend it

Add a new `.js` file with a function that accepts `context`, reads `context.sources.entry` or `.print`, and uses the rendering helpers. Add just one item to the `steps` list inside `refreshDashboard` in `Handler.js`. The main handler supplies a document lock, source validation, timing, errors, and log output. For a new input table, add its header check in `Source_check.js`.

## Relevant Apps Script references

- [Embedded chart builder](https://developers.google.com/apps-script/reference/spreadsheet/embedded-chart-builder)
- [Sheet charts and formatting](https://developers.google.com/apps-script/reference/spreadsheet/sheet)
- [Clock trigger builder](https://developers.google.com/apps-script/reference/script/clock-trigger-builder)
- [Simple triggers](https://developers.google.com/apps-script/guides/triggers)
- [Installable triggers](https://developers.google.com/apps-script/guides/triggers/installable)
