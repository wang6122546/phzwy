(() => {
  window.downloadSafetyReportPdf = async (filename, html) => {
    const frame = document.createElement('iframe');
    frame.title = '报告导出';
    frame.setAttribute('aria-hidden', 'true');
    frame.tabIndex = -1;
    frame.style.cssText = 'position:fixed;left:-10000px;top:0;width:800px;height:1000px;border:0';

    try {
      await new Promise(resolve => {
        frame.onload = resolve;
        frame.srcdoc = html;
        document.body.appendChild(frame);
      });

      const report = frame.contentDocument.querySelector('main');
      await frame.contentDocument.fonts.ready;
      const canvas = await window.html2canvas(report, { scale: 2, backgroundColor: '#ffffff', logging: false });
      const pdf = new window.jspdf.jsPDF({ format: 'a4', compress: true });
      const margin = 14;
      const width = pdf.internal.pageSize.getWidth() - 2 * margin;
      const pageHeight = pdf.internal.pageSize.getHeight() - 2 * margin;
      const maxPixels = Math.floor(pageHeight * canvas.width / width);
      const reportTop = report.getBoundingClientRect().top;
      const scale = canvas.width / report.getBoundingClientRect().width;
      // Break after complete rows or paragraphs, keeping headings with their first item.
      const breaks = [...report.querySelectorAll('tbody tr, li, p')]
        .map(element => Math.ceil((element.getBoundingClientRect().bottom - reportTop) * scale))
        .filter(position => position > 0 && position < canvas.height);
      const page = document.createElement('canvas');
      page.width = canvas.width;

      for (let start = 0; start < canvas.height;) {
        const limit = Math.min(start + maxPixels, canvas.height);
        const end = limit === canvas.height ? limit :
          (breaks.findLast(position => position > start && position <= limit) ?? limit);
        page.height = end - start;
        page.getContext('2d').drawImage(canvas, 0, start, canvas.width, page.height, 0, 0, canvas.width, page.height);
        if (start) pdf.addPage();
        pdf.addImage(page, 'PNG', margin, margin, width, page.height * width / canvas.width);
        start = end;
      }

      pdf.save(filename);
    } finally {
      frame.remove();
    }
  };
})();
