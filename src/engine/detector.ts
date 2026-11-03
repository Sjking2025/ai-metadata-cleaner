import exifr from 'exifr';
import type { DetectedMetadata } from '../types';

/**
 * Check first bytes of file for presence of C2PA / Content Credentials signatures
 */
export async function quickCheckC2PA(file: Blob): Promise<boolean> {
  try {
    const slice = file.slice(0, Math.min(file.size, 524288)); // check first 512KB
    const buffer = await slice.arrayBuffer();
    const str = new TextDecoder('latin1').decode(new Uint8Array(buffer));
    return (
      str.includes('c2pa') ||
      str.includes('jumd') ||
      str.includes('caBX') ||
      str.includes('cabX') ||
      str.includes('urn:c2pa') ||
      str.includes('c2pa.manifest')
    );
  } catch {
    return false;
  }
}

/**
 * Extract C2PA issuer information from binary data
 */
function extractC2PAIssuer(str: string): string | undefined {
  const issuers = [
    { pattern: /OpenAI/i, name: 'OpenAI (DALL-E)' },
    { pattern: /Adobe Firefly/i, name: 'Adobe Firefly' },
    { pattern: /Photoshop/i, name: 'Adobe Photoshop' },
    { pattern: /Microsoft/i, name: 'Microsoft Designer' },
    { pattern: /Midjourney/i, name: 'Midjourney' },
    { pattern: /Google/i, name: 'Google DeepMind' },
    { pattern: /Truepic/i, name: 'Truepic' },
    { pattern: /Leica/i, name: 'Leica Content Credentials' },
    { pattern: /Nikon/i, name: 'Nikon Authenticity' },
    { pattern: /Sony/i, name: 'Sony Camera Signature' },
    { pattern: /c2pa\.claim_generator[^\w]*([a-zA-Z0-9_\-\.\s]{3,30})/i, name: '$1' },
    { pattern: /claim_generator[^\w]*([a-zA-Z0-9_\-\.\s]{3,30})/i, name: '$1' }
  ];

  for (const item of issuers) {
    const match = str.match(item.pattern);
    if (match) {
      if (item.name.includes('$1')) {
        return match[1].trim();
      }
      return item.name;
    }
  }

  if (str.includes('c2pa') || str.includes('caBX') || str.includes('jumd')) {
    return 'C2PA Content Credentials';
  }
  return undefined;
}

/**
 * Parse PNG text chunks (tEXt, zTXt, iTXt) for AI prompts & parameters
 */
function parsePngTextChunks(buffer: ArrayBuffer): {
  hasText: boolean;
  prompts?: {
    parameters?: string;
    prompt?: string;
    negativePrompt?: string;
    workflow?: string;
    metadata?: Record<string, string>;
  };
} {
  const bytes = new Uint8Array(buffer);
  if (bytes.length < 8) return { hasText: false };

  // Check PNG signature: 137 80 78 71 13 10 26 10
  if (
    bytes[0] !== 137 ||
    bytes[1] !== 80 ||
    bytes[2] !== 78 ||
    bytes[3] !== 71 ||
    bytes[4] !== 13 ||
    bytes[5] !== 10 ||
    bytes[6] !== 26 ||
    bytes[7] !== 10
  ) {
    return { hasText: false };
  }

  const view = new DataView(buffer);
  let pos = 8;
  const textChunks: Record<string, string> = {};

  while (pos + 8 <= bytes.length) {
    const length = view.getUint32(pos);
    const type = String.fromCharCode(
      bytes[pos + 4],
      bytes[pos + 5],
      bytes[pos + 6],
      bytes[pos + 7]
    );

    if (pos + 8 + length + 4 > bytes.length) break;

    if (type === 'tEXt' || type === 'iTXt') {
      try {
        const chunkData = bytes.slice(pos + 8, pos + 8 + length);
        let nullIdx = -1;
        for (let i = 0; i < chunkData.length; i++) {
          if (chunkData[i] === 0) {
            nullIdx = i;
            break;
          }
        }
        if (nullIdx > 0) {
          const keyword = new TextDecoder('latin1').decode(chunkData.slice(0, nullIdx));
          let text = '';
          if (type === 'tEXt') {
            text = new TextDecoder('latin1').decode(chunkData.slice(nullIdx + 1));
          } else if (type === 'iTXt') {
            // iTXt has compression flag, compression method, language tag, translated keyword
            // Header: keyword null compFlag compMethod lang null transKey null text
            let current = nullIdx + 3; // skip compFlag and compMethod
            // skip lang tag
            while (current < chunkData.length && chunkData[current] !== 0) current++;
            current++;
            // skip translated keyword
            while (current < chunkData.length && chunkData[current] !== 0) current++;
            current++;
            if (current < chunkData.length) {
              text = new TextDecoder('utf-8').decode(chunkData.slice(current));
            }
          }
          if (keyword && text) {
            textChunks[keyword] = text;
          }
        }
      } catch {
        // ignore malformed chunk
      }
    }

    pos += 8 + length + 4;
    if (type === 'IEND') break;
  }

  const keys = Object.keys(textChunks);
  if (keys.length === 0) return { hasText: false };

  const parameters = textChunks['parameters'] || textChunks['Parameters'];
  let prompt: string | undefined;
  let negativePrompt: string | undefined;

  if (parameters) {
    const negMatch = parameters.match(/Negative prompt:\s*([\s\S]*?)(?:Steps:|$)/i);
    if (negMatch) {
      negativePrompt = negMatch[1].trim();
      const firstPart = parameters.substring(0, negMatch.index).trim();
      prompt = firstPart;
    } else {
      const stepMatch = parameters.match(/Steps:\s*\d+/i);
      if (stepMatch && stepMatch.index) {
        prompt = parameters.substring(0, stepMatch.index).trim();
      } else {
        prompt = parameters;
      }
    }
  }

  return {
    hasText: true,
    prompts: {
      parameters,
      prompt: prompt || textChunks['prompt'],
      negativePrompt,
      workflow: textChunks['workflow'],
      metadata: textChunks
    }
  };
}

/**
 * Scan an image file for all metadata: EXIF, GPS, IPTC, XMP, C2PA, and PNG text chunks.
 */
export async function detectMetadata(file: Blob): Promise<DetectedMetadata> {
  const result: DetectedMetadata = {
    hasAny: false,
    c2pa: false,
    exif: false,
    gps: false,
    iptc: false,
    xmp: false,
    pngTextChunks: false
  };

  try {
    const arrayBuffer = await file.arrayBuffer();

    // 1. C2PA binary detection
    const isC2PA = await quickCheckC2PA(file);
    if (isC2PA) {
      result.c2pa = true;
      const textSample = new TextDecoder('latin1').decode(
        new Uint8Array(arrayBuffer.slice(0, Math.min(arrayBuffer.byteLength, 1048576)))
      );
      result.c2paIssuer = extractC2PAIssuer(textSample);
      result.c2paDetails = {
        claimGenerator: result.c2paIssuer,
        title: 'C2PA Manifest / JUMBF Container Present'
      };
    }

    // 2. PNG text chunk parsing
    const pngInfo = parsePngTextChunks(arrayBuffer);
    if (pngInfo.hasText) {
      result.pngTextChunks = true;
      result.pngPrompts = pngInfo.prompts;
    }

    // 3. EXIF, GPS, IPTC, XMP extraction using exifr
    try {
      const parsed: any = await exifr.parse(arrayBuffer, {
        xmp: true,
        iptc: true,
        jfif: true,
        tiff: true,
        icc: false
      } as any);

      if (parsed) {
        // EXIF
        if (parsed.exif && Object.keys(parsed.exif).length > 0) {
          result.exif = true;
          const sw =
            parsed.exif.Software?.description ||
            parsed.exif.Software?.value ||
            parsed.exif.Software;
          if (sw) result.software = String(sw);

          result.exifDetails = {
            make: parsed.image?.Make || parsed.exif?.Make,
            model: parsed.image?.Model || parsed.exif?.Model,
            lens: parsed.exif?.LensModel || parsed.exif?.Lens,
            software: result.software,
            dateTime: parsed.exif?.DateTimeOriginal || parsed.image?.ModifyDate,
            fNumber: parsed.exif?.FNumber,
            iso: parsed.exif?.ISO,
            exposureTime: parsed.exif?.ExposureTime,
            allTags: parsed.exif
          };
        }

        // GPS
        if (parsed.gps && Object.keys(parsed.gps).length > 0) {
          result.gps = true;
          result.gpsDetails = {
            latitude: parsed.latitude || parsed.gps?.latitude,
            longitude: parsed.longitude || parsed.gps?.longitude,
            altitude: parsed.gps?.GPSAltitude
          };
        }

        // IPTC
        if (parsed.iptc && Object.keys(parsed.iptc).length > 0) {
          result.iptc = true;
          result.iptcDetails = parsed.iptc;
          const dst =
            parsed.iptc.digitalSourceType?.description ||
            parsed.iptc['Digital Source Type']?.description ||
            parsed.iptc.digitalSourceType;
          if (dst) result.digitalSourceType = String(dst);
        }

        // XMP
        if (parsed.xmp && Object.keys(parsed.xmp).length > 0) {
          result.xmp = true;
          result.xmpDetails = parsed.xmp;
          const creatorTool =
            parsed.xmp.CreatorTool?.description ||
            parsed.xmp.CreatorTool?.value ||
            parsed.xmp.CreatorTool;
          if (creatorTool) result.software = result.software || String(creatorTool);

          const dst =
            parsed.xmp.digitalSourceType?.description ||
            parsed.xmp.DigitalSourceType?.description ||
            parsed.xmp.digitalSourceType;
          if (dst) result.digitalSourceType = result.digitalSourceType || String(dst);
        }
      }
    } catch {
      // exifr parse error on non-standard formats is non-fatal
    }

    result.hasAny =
      result.c2pa ||
      result.exif ||
      result.gps ||
      result.iptc ||
      result.xmp ||
      result.pngTextChunks;
  } catch (err) {
    console.error('Detection error:', err);
  }

  return result;
}
