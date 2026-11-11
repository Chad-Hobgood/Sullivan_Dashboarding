# Functions and files

[Back to setup](../README.md) · [How it works](how-it-works.md)

Apps Script shares global functions across all project files. Names ending in `_` are internal helpers. The entry points below run manually, from the sheet menu, or through a trigger as noted.

## Public entry points

| Function | File | Purpose |
| --- | --- | --- |
| `authorizeScript` | [`Authorize.js`](../Authorize.js) | Manually check access to the bound sheet, source tabs, document properties, and trigger management. Does not refresh or schedule. |
| `refreshDashboard` | [`Handler.js`](../Handler.js) | Validate inputs, rebuild all three dashboards, and write the run log. Run manually or by the daily trigger. |
| `installNightlyRefresh` | [`Handler.js`](../Handler.js) | Replace the current account's daily `refreshDashboard` trigger using `nightlyHour`. |
| `onOpen` | [`Handler.js`](../Handler.js) | Automatically add the Sullivan Dashboard menu when the sheet opens. |
| `diagnoseDashboardCharts` | [`Handler.js`](../Handler.js) | Record chart ranges, numeric cell counts, and sample values in `_Dashboard_Log`. |
| `createChartTestSheet` | [`ChartDebug.js`](../ChartDebug.js) | Create the three-chart `_Chart_Test` diagnostic sheet. |
| `createChartStyleTestSheet` | [`ChartDebug.js`](../ChartDebug.js) | Create the ten-chart `_Chart_Style_Test` comparison sheet. |

## Internal modules

| File | Key symbols | Responsibility |
| --- | --- | --- |
| [`Config.js`](../Config.js) | `DASHBOARD_CONFIG` | Sheet names, nightly hour, and colors. |
| [`Source_check.js`](../Source_check.js) | `loadDashboardSources_`, `requireHeaders_`, `sourceBlock_`, `series_`, `hourLabel_`, `monthLabel_` | Read and validate sources; extract series and format labels. Other helpers count, sum, trim, and fingerprint source data. |
| [`Exec.js`](../Exec.js) | `buildExecutiveDashboard_` | Calculate executive cards and charts, including the 10+ visits card. |
| [`Entry.js`](../Entry.js) | `buildEntryDashboard_`, `drawEntryHeatmap_`, `hour12Label_` | Build entry charts and the AM/PM day and hour heatmap. |
| [`Printer_logs.js`](../Printer_logs.js) | `buildPrinterDashboard_` | Build printer charts and replace requestor names with rank labels before writing chart data. |
| [`Renderer.js`](../Renderer.js) | `prepareDashboardSheet_`, `section_`, `card_`, `note_`, `writeChartData_`, `addDashboardChart_`, `styleDashboardChart_`, `topRows_` | Clear and lay out dashboard tabs, write chart datasets, insert styled charts, and rank rows. |
| [`Handler.js`](../Handler.js) | `writeDashboardLog_` | Append results and diagnostics to `_Dashboard_Log`. |

The three dashboard builders receive the `context` created by `refreshDashboard`. It contains the bound spreadsheet, validated source matrices, time zone, chart data sheet, counters, warnings, and metrics. The handler calls the builders in executive, entry, printer order. A builder failure is logged and the remaining builders still run; the overall refresh then reports an error.
