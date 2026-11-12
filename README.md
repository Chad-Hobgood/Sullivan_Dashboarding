# Sullivan dashboard refresh

This is a Google Apps Script bound to a Google Sheets copy of `Dashboard (1).xlsx`. It reads the `Entry_Sheet_Data` and `Print_Queue_Data` summary tabs and rebuilds three dashboard tabs. The source data is updated by a separate process.

## Set up and run

1. Convert `Dashboard (1).xlsx` to a Google Sheet. Confirm that `Entry_Sheet_Data` and `Print_Queue_Data` are present, including the village blocks in `Entry_Sheet_Data!AO:BD`.
2. Open **Extensions → Apps Script** from that sheet. Create an Apps Script file for each root `.js` file in this repository and paste in its contents. Apps Script shares functions across these files.
3. Set the spreadsheet time zone in **File → Settings**. In `Config.js`, set `nightlyHour` to an hour after both source tabs finish updating; the default is 3 a.m.
4. As the account that will run the dashboard, run `authorizeScript` once in Apps Script and accept the permission prompts.
5. Run `refreshDashboard` once. Check `Execiutive Summary` (the workbook spelling), `Entry Statistics`, `Printer Statistics`, `_Dashboard_Data`, and `_Dashboard_Log`.
6. Run `installNightlyRefresh` once to schedule the daily refresh. To run it manually later, use **Sullivan Dashboard → Refresh now** in the sheet or run `refreshDashboard` in Apps Script.

The nightly trigger runs sometime during the selected hour. When transferring ownership, see [trigger handoff](docs/operations.md#trigger-handoff) to avoid duplicate refreshes.

## Documentation

- [How the dashboard works](docs/how-it-works.md): data flow, outputs, source layout, and adding new data.
- [Functions and files](docs/functions.md): entry points and module responsibilities.
- [Operations and chart diagnostics](docs/operations.md): triggers, handoff, and chart tests.
