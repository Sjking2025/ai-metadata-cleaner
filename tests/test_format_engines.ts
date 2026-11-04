import { cleanPdf, detectPdfMetadata } from '../src/engine/pdfCleaner.ts';
import { cleanVideo, detectVideoMetadata } from '../src/engine/videoCleaner.ts';
import { PDFDocument } from 'pdf-lib';
import assert from 'assert';

async function testPdfCleaner() {
  console.log('Testing PDF Cleaner...');

  // Create a synthetic PDF with sensitive metadata
  const doc = await PDFDocument.create();
  doc.setTitle('Confidential Strategy Document');
  doc.setAuthor('John Doe');
  doc.setSubject('Top Secret');
  doc.setKeywords(['merger', 'acquisition']);
  doc.setProducer('Adobe Acrobat Pro DC');
  doc.setCreator('Microsoft Word');
  doc.setCreationDate(new Date('2024-05-15T10:30:00Z'));
  doc.setModificationDate(new Date('2024-05-16T14:45:00Z'));

  const page = doc.addPage([400, 600]);
  page.drawText('Sample confidential text content');

  const pdfBytes = await doc.save();
  const file = new File([pdfBytes], 'test_doc.pdf', { type: 'application/pdf' });

  // 1. Detect
  const detected = await detectPdfMetadata(file);
  console.log('Detected PDF Author:', detected.author);
  console.log('Detected PDF Producer:', detected.producer);
  assert.strictEqual(detected.author, 'John Doe');
  assert.strictEqual(detected.title, 'Confidential Strategy Document');
  assert.strictEqual(detected.producer, 'Adobe Acrobat Pro DC');

  // 2. Clean
  const result = await cleanPdf(file);
  assert.strictEqual(result.verification.clean, true);

  // 3. Verify cleaned PDF has 0 author, 0 producer, 0 title
  const cleanedFile = new File([await result.blob.arrayBuffer()], 'cleaned.pdf', { type: 'application/pdf' });
  const rechecked = await detectPdfMetadata(cleanedFile);
  assert.strictEqual(rechecked.author, undefined);
  assert.strictEqual(rechecked.title, undefined);
  assert.strictEqual(rechecked.producer, undefined);

  console.log('✓ PDF Cleaner passed: 100% metadata stripped and verified clean!');
}

async function testVideoCleaner() {
  console.log('Testing Video Cleaner (MP4 ISO-BMFF Box Stripper)...');

  // Build a minimal valid MP4 with ftyp, moov, mvhd, and udta containing GPS
  const ftypBox = Buffer.from([
    0x00, 0x00, 0x00, 0x14, // size 20
    0x66, 0x74, 0x79, 0x70, // 'ftyp'
    0x69, 0x73, 0x6f, 0x6d, // 'isom'
    0x00, 0x00, 0x02, 0x00, // minor_version
    0x69, 0x73, 0x6f, 0x6d  // compatible_brands
  ]);

  // udta box containing Apple device and GPS string: '+37.7749-122.4194/'
  const gpsString = Buffer.from('+37.7749-122.4194/');
  const udtaPayload = Buffer.concat([
    Buffer.from([0x00, 0x00, 0x00, gpsString.length + 8, 0xa9, 0x78, 0x79, 0x7a]), // (c)xyz
    gpsString,
    Buffer.from([0x00, 0x00, 0x00, 0x12, 0xa9, 0x6d, 0x61, 0x6b]), // (c)mak
    Buffer.from('Apple iPhone 15')
  ]);

  const udtaBox = Buffer.concat([
    Buffer.from([0x00, 0x00, 0x00, udtaPayload.length + 8, 0x75, 0x64, 0x74, 0x61]), // 'udta'
    udtaPayload
  ]);

  // mvhd box with creation time = 1000000
  const mvhdBox = Buffer.from([
    0x00, 0x00, 0x00, 0x70, // size 112
    0x6d, 0x76, 0x68, 0x64, // 'mvhd'
    0x00, 0x00, 0x00, 0x00, // version 0, flags 0
    0x80, 0x00, 0x00, 0x00, // creation_time
    0x80, 0x00, 0x00, 0x00, // modification_time
    ...new Array(92).fill(0) // rest of mvhd
  ]);

  const moovPayload = Buffer.concat([mvhdBox, udtaBox]);
  const moovBox = Buffer.concat([
    Buffer.from([0x00, 0x00, 0x00, moovPayload.length + 8, 0x6d, 0x6f, 0x6f, 0x76]), // 'moov'
    moovPayload
  ]);

  const mp4Bytes = Buffer.concat([ftypBox, moovBox]);
  const file = new File([mp4Bytes], 'iphone_capture.mp4', { type: 'video/mp4' });

  // 1. Detect
  const detected = await detectVideoMetadata(file);
  console.log('Detected GPS Coordinates:', detected.gpsCoordinates);
  console.log('Detected Camera Make:', detected.cameraMake);
  assert(detected.gpsCoordinates?.includes('+37.7749'));
  assert.strictEqual(detected.cameraMake, 'Apple');
  assert.strictEqual(detected.hasUserData, true);

  // 2. Clean
  const cleanResult = await cleanVideo(file);
  assert.strictEqual(cleanResult.verification.clean, true);

  // 3. Verify output video has zero udta, zero GPS, zero camera make
  const cleanedFile = new File([await cleanResult.blob.arrayBuffer()], 'iphone_cleaned.mp4', { type: 'video/mp4' });
  const postDetect = await detectVideoMetadata(cleanedFile);
  assert.strictEqual(postDetect.gpsCoordinates, undefined);
  assert.strictEqual(postDetect.cameraMake, undefined);
  assert.strictEqual(postDetect.hasUserData, false);

  console.log('✓ Video Cleaner passed: GPS location & udta container successfully neutralized!');
}

async function run() {
  try {
    await testPdfCleaner();
    await testVideoCleaner();
    console.log('\nALL FORMAT ENGINE TESTS PASSED SUCCESSFULLY! 🚀');
  } catch (e) {
    console.error('Test failed:', e);
    process.exit(1);
  }
}

run();
