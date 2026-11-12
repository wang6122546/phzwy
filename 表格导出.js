(() => {
  window.exportWorkbook = (filename, rows) => {
    const { utils, writeFile } = window.XLSX;
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, utils.aoa_to_sheet(rows), '明细');
    writeFile(workbook, filename, { bookType: 'xlsx', compression: true });
  };
})();
