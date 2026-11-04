import puppeteer from 'puppeteer-core';
import { preview } from 'vite';
import path from 'path';
import fs from 'fs';
import assert from 'assert';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const FIXTURES_DIR = path.resolve('tests/fixtures');
const USER_DATA_DIR = path.resolve('.chrome_test_profile');

async function runRouteTests() {
  console.log('--- STARTING APPLICATION ROUTE TESTS IN HEADLESS BROWSER ---\n');

  if (!fs.existsSync(USER_DATA_DIR)) {
    fs.mkdirSync(USER_DATA_DIR, { recursive: true });
  }

  // 1. Start Vite preview server for production bundle
  console.log('1. Starting Vite preview server...');
  const server = await preview({
    preview: {
      port: 5199,
      host: '127.0.0.1'
    }
  });

  const baseUrl = 'http://127.0.0.1:5199';
  console.log(`Vite preview server running at ${baseUrl}`);

  // 2. Launch headless Chrome browser
  console.log('2. Launching headless Chrome browser...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    userDataDir: USER_DATA_DIR,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--no-first-run'
    ]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  try {
    // =========================================================================
    // TEST ROUTE 1: / (Main Image & C2PA Tool)
    // =========================================================================
    console.log('\n--- Testing Route: / (Image & C2PA Cleaner) ---');
    await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle0' });

    const heroTitle = await page.$eval('.hero-title', (el) => el.textContent?.trim());
    console.log('Page title:', heroTitle);
    assert(heroTitle?.includes('Free Metadata Cleaner'));

    // Check FormatNav is present
    const formatNav = await page.$('.format-tools-nav');
    assert(formatNav !== null, 'FormatNav should be rendered');

    // Upload JPEG to route
    const imageInput = await page.$('input[type="file"]');
    assert(imageInput !== null, 'File input must exist on image route');
    const testJpgPath = path.join(FIXTURES_DIR, 'test.jpg');
    await imageInput.uploadFile(testJpgPath);

    // Wait for card to appear in queue
    await page.waitForSelector('.result-card', { timeout: 5000 });
    console.log('✓ Image file uploaded to UI successfully');

    // Click Clean button
    const cleanBtn = await page.$('.btn-pulse-action');
    if (cleanBtn) {
      await cleanBtn.click();
      await page.waitForSelector('.badge-verified, .badge-clean, .btn-download', { timeout: 10000 });
      console.log('✓ Image processing executed and verified clean in UI');
    }

    // =========================================================================
    // TEST ROUTE 2: /remove-metadata-from-pdf (PDF Metadata Remover)
    // =========================================================================
    console.log('\n--- Testing Route: /remove-metadata-from-pdf (PDF Tool) ---');
    await page.goto(`${baseUrl}/remove-metadata-from-pdf`, { waitUntil: 'networkidle0' });

    const pdfTitle = await page.$eval('.hero-title', (el) => el.textContent?.trim());
    console.log('PDF Page Title:', pdfTitle);
    assert(pdfTitle?.includes('Free PDF Metadata Remover'));

    // Upload test PDF
    const pdfInput = await page.$('input[type="file"]');
    assert(pdfInput !== null, 'PDF file input must exist');
    const testPdfPath = path.join(FIXTURES_DIR, 'test.pdf');
    await pdfInput.uploadFile(testPdfPath);

    // Verify pre-scan displays detected Author in UI
    await page.waitForSelector('.pdf-item-card', { timeout: 5000 });
    const authorTag = await page.$eval('.pdf-tag.alert', (el) => el.textContent?.trim());
    console.log('UI Pre-scan Tag:', authorTag);
    assert(authorTag?.includes('Jane Doe'), 'Pre-scan must show detected author "Jane Doe"');

    // Click Clean in the UI
    const pdfCleanBtn = await page.$('.btn-card-action, .btn-pulse-action');
    assert(pdfCleanBtn !== null, 'Clean button must exist');
    await pdfCleanBtn.click();

    // Verify UI shows sanitized status and download button
    await page.waitForSelector('.pdf-status-clean', { timeout: 10000 });
    const pdfStatusText = await page.$eval('.pdf-status-clean', (el) => el.textContent?.trim());
    console.log('UI Status:', pdfStatusText);
    assert(pdfStatusText?.includes('100% Sanitized'));

    const downloadBtn = await page.$('.btn-clean-download');
    assert(downloadBtn !== null, 'Download Clean PDF button must appear');
    console.log('✓ PDF clean workflow passed via application route!');

    // =========================================================================
    // TEST ROUTE 3: /remove-metadata-from-video (Video Metadata Remover)
    // =========================================================================
    console.log('\n--- Testing Route: /remove-metadata-from-video (Video Tool) ---');
    await page.goto(`${baseUrl}/remove-metadata-from-video`, { waitUntil: 'networkidle0' });

    const videoTitle = await page.$eval('.hero-title', (el) => el.textContent?.trim());
    console.log('Video Page Title:', videoTitle);
    assert(videoTitle?.includes('Free Video Metadata Remover'));

    // Upload test MP4 with GPS
    const videoInput = await page.$('input[type="file"]');
    assert(videoInput !== null, 'Video file input must exist');
    const testMp4Path = path.join(FIXTURES_DIR, 'test.mp4');
    await videoInput.uploadFile(testMp4Path);

    // Verify pre-scan displays GPS tag in UI
    await page.waitForSelector('.pdf-item-card', { timeout: 5000 });
    const gpsTag = await page.$eval('.pdf-tag.alert', (el) => el.textContent?.trim());
    console.log('UI Pre-scan Tag:', gpsTag);
    assert(gpsTag?.includes('+37.7749'), 'UI must display detected GPS latitude');

    // Click Clean Video in the UI
    const videoCleanBtn = await page.$('.btn-card-action, .btn-pulse-action');
    assert(videoCleanBtn !== null, 'Clean Video button must exist');
    await videoCleanBtn.click();

    // Verify UI shows sanitized status and download button
    await page.waitForSelector('.pdf-status-clean', { timeout: 10000 });
    const videoStatusText = await page.$eval('.pdf-status-clean', (el) => el.textContent?.trim());
    console.log('UI Status:', videoStatusText);
    assert(videoStatusText?.includes('Losslessly sanitized'));

    const videoDownloadBtn = await page.$('.btn-clean-download');
    assert(videoDownloadBtn !== null, 'Download Clean Video button must appear');
    console.log('✓ Video clean workflow passed via application route!');

    // =========================================================================
    // TEST ROUTE 4: /remove-metadata-from-raw (Camera RAW Tool)
    // =========================================================================
    console.log('\n--- Testing Route: /remove-metadata-from-raw (RAW Tool) ---');
    await page.goto(`${baseUrl}/remove-metadata-from-raw`, { waitUntil: 'networkidle0' });

    const rawTitle = await page.$eval('.hero-title', (el) => el.textContent?.trim());
    console.log('RAW Page Title:', rawTitle);
    assert(rawTitle?.includes('Free Camera RAW Photo'));

    const rawDropzone = await page.$('.dropzone-container');
    assert(rawDropzone !== null, 'RAW Dropzone must be present');
    console.log('✓ RAW photo route loaded and verified!');

    // =========================================================================
    // TEST ROUTE 5: Dynamic Client-Side Format Switching via UI
    // =========================================================================
    console.log('\n--- Testing Client-Side Format Switcher (FormatNav) ---');
    
    // Switch to PDF
    await page.waitForSelector('a.format-tool-pill[href="/remove-metadata-from-pdf"]');
    await page.click('a.format-tool-pill[href="/remove-metadata-from-pdf"]');
    await page.waitForFunction(() => window.location.pathname === '/remove-metadata-from-pdf');
    console.log('✓ Switched to /remove-metadata-from-pdf via FormatNav');

    // Switch to Video
    await page.waitForSelector('a.format-tool-pill[href="/remove-metadata-from-video"]');
    await page.click('a.format-tool-pill[href="/remove-metadata-from-video"]');
    await page.waitForFunction(() => window.location.pathname === '/remove-metadata-from-video');
    console.log('✓ Switched to /remove-metadata-from-video via FormatNav');

    // Switch back to Images
    await page.waitForSelector('a.format-tool-pill[href="/"]');
    await page.click('a.format-tool-pill[href="/"]');
    await page.waitForFunction(() => window.location.pathname === '/');
    console.log('✓ Switched back to / via FormatNav');

    console.log('\n======================================================');
    console.log('🎉 ALL APPLICATION ROUTES VERIFIED 100% IN BROWSER! 🎉');
    console.log('======================================================');
  } finally {
    await browser.close();
    server.httpServer.close();
    try {
      fs.rmSync(USER_DATA_DIR, { recursive: true, force: true });
    } catch {
      // ignore
    }
  }
}

runRouteTests().catch((err) => {
  console.error('Route test error:', err);
  process.exit(1);
});
