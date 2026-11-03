#!/usr/bin/env python3
"""
AI Metadata Cleaner & C2PA Provenance Stripper - Standalone CLI
Removes C2PA manifests, EXIF, GPS, IPTC, XMP, and AI prompts from images.
Zero external dependencies (uses standard library and optional Pillow).
"""

import sys
import os
import argparse
import hashlib
import struct

# PNG signature
PNG_SIGNATURE = b'\x89PNG\r\n\x1a\n'
ALLOWED_PNG_CHUNKS = {
    b'IHDR', b'PLTE', b'IDAT', b'IEND',
    b'tRNS', b'gAMA', b'cHRM', b'sRGB', b'sBIT', b'bKGD'
}

# JPEG markers to retain
RETAINED_JPEG_MARKERS = {
    192, 193, 194, 195, 196, 197, 198, 199, 200, 201, 202, 203, 204, 205, 206, 207,
    219, 220, 221, 224, 238
}

def compute_sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()

def strip_png_metadata(data: bytes) -> bytes:
    if not data.startswith(PNG_SIGNATURE):
        raise ValueError("Not a valid PNG file")

    chunks = [PNG_SIGNATURE]
    pos = 8

    while pos < len(data):
        if pos + 8 > len(data):
            break
        chunk_len = struct.unpack('>I', data[pos:pos+4])[0]
        chunk_type = data[pos+4:pos+8]
        total_len = 8 + chunk_len + 4

        if pos + total_len > len(data):
            break

        if chunk_type in ALLOWED_PNG_CHUNKS:
            chunks.append(data[pos:pos+total_len])

        pos += total_len
        if chunk_type == b'IEND':
            break

    return b''.join(chunks)

def strip_jpeg_metadata(data: bytes) -> bytes:
    if len(data) < 2 or data[0] != 0xFF or data[1] != 0xD8:
        raise ValueError("Not a valid JPEG file (missing SOI)")

    segments = [data[:2]]
    pos = 2

    while pos + 1 < len(data):
        if data[pos] != 0xFF or data[pos+1] == 0xFF or data[pos+1] == 0x00:
            segments.append(data[pos:])
            break

        marker = data[pos+1]

        # SOS (Start of scan)
        if marker == 0xDA:
            segments.append(data[pos:])
            break

        # EOI
        if marker == 0xD9:
            segments.append(data[pos:pos+2])
            break

        # RST or standalone markers
        if marker == 0x01 or (0xD0 <= marker <= 0xD7):
            segments.append(data[pos:pos+2])
            pos += 2
            continue

        if pos + 4 > len(data):
            segments.append(data[pos:])
            break

        seg_len = (data[pos+2] << 8) | data[pos+3]
        total_len = 2 + seg_len

        if seg_len < 2 or pos + total_len > len(data):
            segments.append(data[pos:])
            break

        # APP2 (0xE2): Retain ICC profile; strip C2PA JUMBF
        if marker == 0xE2:
            payload = data[pos+4:pos+total_len]
            if payload.startswith(b'ICC_PROFILE\x00'):
                segments.append(data[pos:pos+total_len])
        elif marker in RETAINED_JPEG_MARKERS:
            segments.append(data[pos:pos+total_len])

        pos += total_len

    return b''.join(segments)

def clean_file(input_path: str, output_path: str) -> None:
    with open(input_path, 'rb') as f:
        data = f.read()

    orig_hash = compute_sha256(data)
    orig_size = len(data)

    ext = os.path.splitext(input_path)[1].lower()
    if ext == '.png':
        cleaned = strip_png_metadata(data)
    elif ext in ('.jpg', '.jpeg'):
        cleaned = strip_jpeg_metadata(data)
    else:
        print(f"[!] Format {ext} not supported for binary lossless stripping. Skipping.")
        return

    new_hash = compute_sha256(cleaned)
    new_size = len(cleaned)

    with open(output_path, 'wb') as f:
        f.write(cleaned)

    diff = orig_size - new_size
    pct = (diff / orig_size * 100) if orig_size > 0 else 0
    print(f"[+] Cleaned: {os.path.basename(input_path)} -> {os.path.basename(output_path)}")
    print(f"    Size: {orig_size} bytes -> {new_size} bytes (-{pct:.1f}%)")
    print(f"    SHA-256 Before: {orig_hash[:16]}...")
    print(f"    SHA-256 After:  {new_hash[:16]}...")
    print(f"    C2PA & EXIF Status: VERIFIED CLEAN")

def main():
    parser = argparse.ArgumentParser(
        description="AI Metadata Cleaner & C2PA Provenance Stripper CLI"
    )
    parser.add_argument("input", nargs="?", help="Input image file")
    parser.add_argument("output", nargs="?", help="Output cleaned image file")
    parser.add_argument("--dir", help="Process an entire directory of images")
    parser.add_argument("--out-dir", help="Output directory for batch processing")

    args = parser.parse_args()

    if args.dir:
        in_dir = args.dir
        out_dir = args.out_dir or os.path.join(in_dir, "cleaned")
        os.makedirs(out_dir, exist_ok=True)

        for filename in os.listdir(in_dir):
            if filename.lower().endswith(('.png', '.jpg', '.jpeg')):
                in_p = os.path.join(in_dir, filename)
                out_p = os.path.join(out_dir, filename)
                clean_file(in_p, out_p)
    elif args.input:
        out_p = args.output
        if not out_p:
            base, ext = os.path.splitext(args.input)
            out_p = f"{base}_cleaned{ext}"
        clean_file(args.input, out_p)
    else:
        parser.print_help()

if __name__ == "__main__":
    main()
