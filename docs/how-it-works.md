# How the dashboard works

[Back to setup](../README.md)

## Data flow

1. A separate process updates `Entry_Sheet_Data` and `Print_Queue_Data`. This script does not import or edit those source tabs.
2. `refreshDashboard` takes a lock, reads both source tabs, and checks required headers before rebuilding the dashboard tabs. A header validation failure leaves the dashboard tabs intact and writes an error to `_Dashboard_Log`.
3. The executive, entry, and printer builders calculate views from the summary tables. They write chart datasets to `_Dashboard_Data`; the charts on the dashboard tabs read from that sheet. The refresh clears and rebuilds the dashboard tabs and `_Dashboard_Data` each run.
4. `_Dashboard_Log` records each builder's result and the overall chart count, dataset count, source row counts, warnings, and errors. Document properties hold the last successful source fingerprints; an unchanged source produces a warning on the next refresh.

`_Dashboard_Data` is kept visible so chart sources can be inspected. Keep manual notes outside `Execiutive Summary`, `Entry Statistics`, `Printer Statistics`, and `_Dashboard_Data`, because a refresh redraws them.

## What each dashboard shows

| Tab | Views |
| --- | --- |
| `Execiutive Summary` | Visits, distinct and returning students, students with 10+ visits, print requests and completions, equipment use, project mix, monthly activity, popular tools |
| `Entry Statistics` | Monthly and recent visitors, visit frequency and cadence, hourly and weekday traffic, equipment, and a day and hour heatmap with AM/PM labels |
| `Printer Statistics` | Project types, monthly mix, printers, queue action hours, anonymous ranked requestors, flag reasons, turnaround distributions, and duration averages |

The inputs are pre-aggregated summary tables, so counts come from the supplied data rather than reconstructed event records. The entry monthly table has month names without years; its August-to-July order is preserved. Print month dates include a year when present. The dashboard cannot infer filament colors or weight, village, approval status, or print restarts without more source data. A mismatch between flag reason totals and project outcome flags is logged as a warning.

The executive 10+ visits card reads the `Visited 10+ Times` row in `Entry_Sheet_Data`. If it is missing, the card shows `N/A` and the refresh logs a warning. The printer Top requestors chart sorts by request count and writes `Student 1`, `Student 2`, and so on to `_Dashboard_Data`; source names are not copied into that chart dataset.

## Source layout and new data

The builders use fixed column numbers and some fixed starting rows. `loadDashboardSources_` reads each source sheet's full used range, then checks specific headers. `sourceBlock_` reads rows until the first blank label in the selected column. The entry heatmap reads seven weekday rows and eleven hour columns.

Adding a separate table or new columns without moving existing data does not automatically create a dashboard view. Inserting columns or rows before referenced tables can break the fixed positions or header checks. New rows directly after an existing table, with no blank label row, may be treated as part of that table. Very large source sheets can also slow refreshes because the full used ranges are read.

To add a view, create a new `.js` builder that accepts `context`, reads `context.sources.entry` or `context.sources.print`, and uses the rendering helpers. Add its function to the `steps` list in `refreshDashboard` in [`Handler.js`](../Handler.js). For a new input table, add a header check in [`Source_check.js`](../Source_check.js). The handler supplies locking, source validation, timing, error handling, and logging.
