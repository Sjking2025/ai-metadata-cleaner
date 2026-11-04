import fs from 'fs';
import path from 'path';
import { PDFDocument } from 'pdf-lib';

async function createFixtures() {
  const dir = path.resolve('tests/fixtures');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  // 1. PDF Fixture
  const pdfDoc = await PDFDocument.create();
  pdfDoc.setTitle('Confidential Strategic Report');
  pdfDoc.setAuthor('Jane Doe');
  pdfDoc.setProducer('Adobe Acrobat Pro');
  pdfDoc.setCreator('Microsoft Word');
  pdfDoc.setCreationDate(new Date('2024-06-01T12:00:00Z'));
  const page = pdfDoc.addPage([400, 600]);
  page.drawText('Confidential client data');
  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync(path.join(dir, 'test.pdf'), Buffer.from(pdfBytes));
  console.log('Created tests/fixtures/test.pdf');

  // 2. MP4 Fixture
  const ftyp = Buffer.from([0, 0, 0, 20, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d, 0, 0, 2, 0, 0x69, 0x73, 0x6f, 0x6d]);
  const gpsString = Buffer.from('+37.7749-122.4194/');
  const udtaPayload = Buffer.concat([
    Buffer.from([0, 0, 0, gpsString.length + 8, 0xa9, 0x78, 0x79, 0x7a]),
    gpsString,
    Buffer.from([0, 0, 0, 18, 0xa9, 0x6d, 0x61, 0x6b]),
    Buffer.from('Apple iPhone 15')
  ]);
  const udta = Buffer.concat([
    Buffer.from([0, 0, 0, udtaPayload.length + 8, 0x75, 0x64, 0x74, 0x61]),
    udtaPayload
  ]);
  const mvhd = Buffer.from([
    0, 0, 0, 112, 0x6d, 0x76, 0x68, 0x64, 0, 0, 0, 0, 0x80, 0, 0, 0, 0x80, 0, 0, 0, ...new Array(92).fill(0)
  ]);
  const moovPayload = Buffer.concat([mvhd, udta]);
  const moov = Buffer.concat([
    Buffer.from([0, 0, 0, moovPayload.length + 8, 0x6d, 0x6f, 0x6f, 0x76]),
    moovPayload
  ]);
  const mp4 = Buffer.concat([ftyp, moov]);
  fs.writeFileSync(path.join(dir, 'test.mp4'), mp4);
  console.log('Created tests/fixtures/test.mp4');

  // 3. Simple JPEG Fixture with minimal APP1 EXIF
  const jpegHeader = Buffer.from([
    0xFF, 0xD8, // SOI
    0xFF, 0xE1, 0x00, 0x1E, // APP1 length 30
    0x45, 0x78, 0x69, 0x66, 0x00, 0x00, // Exif\0\0
    0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00, // TIFF header (II)
    0x01, 0x00, 0x0F, 0x01, 0x02, 0x00, 0x05, 0x00, 0x00, 0x00, 0x1A, 0x00, 0x00, 0x00, // Make tag
    0x53, 0x6F, 0x6E, 0x79, 0x00, // 'Sony\0'
    0xFF, 0xDB, 0x00, 0x43, 0x00, ...new Array(64).fill(1), // DQT
    0xFF, 0xC0, 0x00, 0x0B, 0x08, 0x00, 0x01, 0x00, 0x01, 0x01, 0x01, 0x11, 0x00, // SOF0
    0xFF, 0xDA, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3F, 0x00, // SOS
    0x00, // 1 scan byte
    0xFF, 0xD9 // EOI
  ]);
  fs.writeFileSync(path.join(dir, 'test.jpg'), jpegHeader);
  console.log('Created tests/fixtures/test.jpg');
}

createFixtures();
