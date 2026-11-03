# AI Metadata Cleaner & C2PA Provenance Stripper

A privacy-focused, zero-dependency, 100% client-side web application and standalone CLI tool designed to detect, inspect, and strip AI provenance manifests (C2PA / Content Credentials), traditional EXIF data, GPS geotags, IPTC/XMP tags, and AI generation parameters from images, while offering perceptual hash (pHash) fingerprint defense.

---

## Credits & Acknowledgements

* **Original Idea & Reference**: Full credit and sincere appreciation to [AI Metadata Cleaner](https://aimetadatacleaner.com/) for the original tool concept, feature set, user interface inspiration, and in-browser privacy philosophy.
* **Analysis & Reverse Engineering**: Reverse engineered and analyzed using tools and workflows from [REA (Reverse Engineer Anything)](https://github.com/morluto/rea.git).

---

## Key Features

1. **Comprehensive Provenance & Metadata Removal**:
   - **C2PA / Content Credentials**: Scans and strips JUMBF containers and cryptographic manifests embedded by Adobe Firefly, Photoshop, OpenAI DALL-E, Microsoft Designer, Google, Leica, and CAI tools.
   - **AI Generation Prompts**: Strips embedded PNG text chunks (`tEXt`, `zTXt`, `iTXt`) containing generation prompts, negative prompts, seeds, steps, samplers, and ComfyUI workflow JSON.
   - **EXIF Camera Data**: Eradicates camera make, model, serial numbers, lens info, ISO, aperture, exposure time, and timestamps.
   - **GPS Coordinates**: Completely wipes latitude, longitude, and altitude geotags.
   - **XMP & IPTC Metadata**: Removes digital source types (`trainedAlgorithmicMedia`), creator tools, and edit histories.

2. **Dual Cleaning Modes**:
   - **Mode A: Re-encode & Change Fingerprint (pHash Defense)**:
     - Renders image onto an isolated canvas, severing all metadata containers.
     - Applies sub-pixel transformation (micro-zoom ~1.001–1.003x and micro-rotation ~0.04–0.16°).
     - Injects a 32×32 bilinear interpolated random noise field (±2.5 RGB perturbation).
     - Resets the perceptual hash (pHash, dHash, aHash) and cross-site tracking fingerprints (used by Pinterest, Instagram, Google Lens, and TinEye) without any perceptible loss in visual image quality.
   - **Mode B: Preserve Original Quality (Lossless Strip)**:
     - Pure binary stream stripping without re-compression or pixel decoding.
     - PNG: Filters chunks, preserving only display-critical chunks (`IHDR`, `PLTE`, `IDAT`, `IEND`, `tRNS`, `gAMA`, `cHRM`, `sRGB`, `sBIT`, `bKGD`).
     - JPEG: Retains SOF, DHT, DQT, DRI, JFIF, Adobe APP14, and ICC profiles, while dropping APP1 (EXIF/XMP), APP2 (C2PA JUMBF), APP13 (IPTC), and COM comments.
     - 100% bit-exact pixel preservation.

3. **100% Client-Side Architecture**:
   - Zero server uploads.
   - All image processing, decoding, canvas transformations, and verification happen in local memory inside the user's browser.

4. **Batch Processing & 1-Click ZIP Export**:
   - Drag & drop multiple images.
   - Per-file progress and status indicators.
   - Download individual cleaned files or export the entire batch as a single ZIP archive.

5. **Post-Cleaning Verification & Inspection**:
   - Real-time pre-cleaning scanner displays detected metadata (camera info, GPS coordinates, C2PA issuer).
   - Post-cleaning dual-pass verification re-scans the file to confirm 100% clean output.
   - Displays before & after file sizes, percentage reduction, and SHA-256 hashes.

6. **CLI Support**:
   - Includes standalone Python (`cli/cleaner.py`) and Node.js (`cli/cleaner.js`) scripts for batch automation and offline terminal workflows.

---

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Editorial typography & warm-paper aesthetic (`Fraunces`, `Instrument Sans`, `JetBrains Mono`)
- **Metadata Parsing**: `exifr` + native binary parsers for C2PA JUMBF & PNG text chunks
- **Archive Generation**: `jszip`
- **Icons**: `lucide-react`
- **CLI Tools**: Pure Python 3 & Node.js (zero external dependencies)

---

## Quick Start

### 1. Web Application

#### Prerequisites
- Node.js (v18+) and npm

#### Installation & Development
```bash
# Install dependencies
npm install

# Start local development server
npm run dev
```

Open `http://localhost:5173` in your browser.

#### Production Build
```bash
npm run build
npm run preview
```
The production bundle will be generated in `dist/`, ready to deploy to Netlify, Vercel, Cloudflare Pages, GitHub Pages, or any static hosting service.

---

### 2. Standalone CLI Tools

#### Python CLI (`cli/cleaner.py`)
```bash
# Clean a single image
python cli/cleaner.py photo.jpg cleaned_photo.jpg

# Clean an entire directory
python cli/cleaner.py --dir ./my_images --out-dir ./cleaned_images
```

#### Node.js CLI (`cli/cleaner.js`)
```bash
# Clean an image
node cli/cleaner.js input.png output.png
```

---

## Verification & Testing

To test the binary lossless strip on test images:
```bash
# Test with Python CLI
python cli/cleaner.py --help

# Test with Node CLI
node cli/cleaner.js
```

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
Free for personal and commercial use.
