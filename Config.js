/** Settings for the bound Google Sheets script. */
const DASHBOARD_CONFIG = Object.freeze({
  sheets: {
    executive: 'Execiutive Summary', // Spelling in the supplied workbook.
    entry: 'Entry Statistics',
    printer: 'Printer Statistics',
    entrySource: 'Entry_Sheet_Data',
    printSource: 'Print_Queue_Data',
    chartData: '_Dashboard_Data',
    log: '_Dashboard_Log'
  },
  nightlyHour: 3, // In the spreadsheet time zone; schedule after both source imports.
  colors: {
    navy: '#15263F',
    blue: '#275D8C',
    teal: '#008C89',
    mint: '#70C3B5',
    orange: '#E79A3B',
    pale: '#F2F6FA',
    text: '#243246',
    muted: '#67798C',
    white: '#FFFFFF'
  }
});
