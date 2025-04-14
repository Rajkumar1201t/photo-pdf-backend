const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const { PDFDocument } = require('pdf-lib');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.static('uploads'));

const upload = multer({ dest: 'uploads/' });

app.post('/image-to-pdf', upload.array('images'), async (req, res) => {
  const pdfDoc = await PDFDocument.create();

  for (const file of req.files) {
    const imgBytes = fs.readFileSync(file.path);
    const ext = path.extname(file.originalname).toLowerCase();
    let img;

    if (ext === '.jpg' || ext === '.jpeg') {
      img = await pdfDoc.embedJpg(imgBytes);
    } else if (ext === '.png') {
      img = await pdfDoc.embedPng(imgBytes);
    } else {
      continue;
    }

    const page = pdfDoc.addPage([img.width, img.height]);
    page.drawImage(img, {
      x: 0,
      y: 0,
      width: img.width,
      height: img.height,
    });

    fs.unlinkSync(file.path);
  }

  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync('uploads/output.pdf', pdfBytes);

  res.download('uploads/output.pdf');
});

app.post('/merge-pdf', upload.array('pdfs'), async (req, res) => {
  const mergedPdf = await PDFDocument.create();

  for (const file of req.files) {
    const pdfBytes = fs.readFileSync(file.path);
    const pdf = await PDFDocument.load(pdfBytes);
    const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());

    for (const page of copiedPages) {
      mergedPdf.addPage(page);
    }

    fs.unlinkSync(file.path);
  }

  const mergedBytes = await mergedPdf.save();
  fs.writeFileSync('uploads/merged.pdf', mergedBytes);

  res.download('uploads/merged.pdf');
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));