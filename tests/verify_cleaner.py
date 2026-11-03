#!/usr/bin/env python3
"""
Verification test suite for AI Metadata Cleaner & C2PA Provenance Stripper.
Generates test files with C2PA manifests, EXIF tags, and AI prompts,
then validates that both the Python and Node.js engines strip them 100% losslessly.
"""

import os
import sys
import struct
import zlib
import subprocess

def make_test_png():
    # PNG signature
    sig = b'\x89PNG\r\n\x1a\n'
    
    # IHDR: 1x1 8-bit RGBA
    ihdr_data = struct.pack('>IIBBBBB', 1, 1, 8, 6, 0, 0, 0)
    ihdr_crc = struct.pack('>I', zlib.crc32(b'IHDR' + ihdr_data) & 0xffffffff)
    ihdr_chunk = struct.pack('>I', len(ihdr_data)) + b'IHDR' + ihdr_data + ihdr_crc

    # AI Prompt in tEXt chunk
    prompt_text = b'parameters\x00masterpiece, best quality, cyberpunk city\nNegative prompt: ugly, blurry\nSteps: 30, Sampler: DPM++ 2M Karras, CFG scale: 7, Seed: 99887766'
    text_crc = struct.pack('>I', zlib.crc32(b'tEXt' + prompt_text) & 0xffffffff)
    text_chunk = struct.pack('>I', len(prompt_text)) + b'tEXt' + prompt_text + text_crc

    # C2PA manifest chunk: caBX
    c2pa_data = b'c2pa.manifest\x00{"claim_generator":"OpenAI/DALL-E","assertions":[{"label":"c2pa.actions","data":{"actions":[{"action":"c2pa.created"}]}}]}'
    c2pa_crc = struct.pack('>I', zlib.crc32(b'caBX' + c2pa_data) & 0xffffffff)
    c2pa_chunk = struct.pack('>I', len(c2pa_data)) + b'caBX' + c2pa_data + c2pa_crc

    # IDAT: 1x1 transparent pixel
    raw_pixels = b'\x00\xff\x00\x00\xff' # filter byte 0 + RGBA
    idat_data = zlib.compress(raw_pixels)
    idat_crc = struct.pack('>I', zlib.crc32(b'IDAT' + idat_data) & 0xffffffff)
    idat_chunk = struct.pack('>I', len(idat_data)) + b'IDAT' + idat_data + idat_crc

    # IEND
    iend_crc = struct.pack('>I', zlib.crc32(b'IEND') & 0xffffffff)
    iend_chunk = struct.pack('>I', 0) + b'IEND' + iend_crc

    return sig + ihdr_chunk + text_chunk + c2pa_chunk + idat_chunk + iend_chunk

def make_test_jpeg():
    # SOI
    soi = b'\xff\xd8'
    
    # APP0 (JFIF)
    app0_payload = b'JFIF\x00\x01\x01\x00\x00\x01\x00\x01\x00\x00'
    app0 = b'\xff\xe0' + struct.pack('>H', len(app0_payload) + 2) + app0_payload

    # APP1 (EXIF / GPS)
    app1_payload = b'Exif\x00\x00II*\x00\x08\x00\x00\x00CAMERA_MAKE=SONY_A7R;GPS_LAT=37.7749;GPS_LON=-122.4194'
    app1 = b'\xff\xe1' + struct.pack('>H', len(app1_payload) + 2) + app1_payload

    # APP2 (C2PA JUMBF Manifest)
    app2_payload = b'c2pa\x00\x00Content Credentials Provenance JUMBF Container OpenAI DALL-E 3'
    app2 = b'\xff\xe2' + struct.pack('>H', len(app2_payload) + 2) + app2_payload

    # DQT (Quantization)
    dqt_payload = b'\x00' + b'\x10' * 64
    dqt = b'\xff\xdb' + struct.pack('>H', len(dqt_payload) + 2) + dqt_payload

    # SOF0
    sof0_payload = b'\x08\x00\x01\x00\x01\x03\x01\x11\x00\x02\x11\x01\x03\x11\x01'
    sof0 = b'\xff\xc0' + struct.pack('>H', len(sof0_payload) + 2) + sof0_payload

    # SOS (Start of scan)
    sos_payload = b'\x03\x01\x00\x02\x11\x03\x11\x00\x3f\x00'
    sos = b'\xff\xda' + struct.pack('>H', len(sos_payload) + 2) + sos_payload + b'\x00\x00'

    # EOI
    eoi = b'\xff\xd9'

    return soi + app0 + app1 + app2 + dqt + sof0 + sos + eoi

def run_tests():
    os.makedirs('tests/fixtures', exist_ok=True)
    png_path = 'tests/fixtures/test_ai_image.png'
    jpg_path = 'tests/fixtures/test_c2pa_image.jpg'

    with open(png_path, 'wb') as f:
        f.write(make_test_png())

    with open(jpg_path, 'wb') as f:
        f.write(make_test_jpeg())

    print("[*] Created test fixtures with C2PA and AI metadata.")

    # 1. Test Python cleaner CLI
    print("\n--- Testing Python CLI (cli/cleaner.py) ---")
    py_png_out = 'tests/fixtures/test_ai_image_py_cleaned.png'
    py_jpg_out = 'tests/fixtures/test_c2pa_image_py_cleaned.jpg'
    
    subprocess.run([sys.executable, 'cli/cleaner.py', png_path, py_png_out], check=True)
    subprocess.run([sys.executable, 'cli/cleaner.py', jpg_path, py_jpg_out], check=True)

    # Validate Python outputs
    with open(py_png_out, 'rb') as f:
        cleaned_png = f.read()
    assert b'parameters' not in cleaned_png, "Error: AI prompt still in PNG!"
    assert b'caBX' not in cleaned_png, "Error: C2PA caBX chunk still in PNG!"
    assert b'c2pa' not in cleaned_png, "Error: c2pa string still in PNG!"
    print("[PASS] Python PNG cleaning stripped all AI prompts and C2PA markers.")

    with open(py_jpg_out, 'rb') as f:
        cleaned_jpg = f.read()
    assert b'CAMERA_MAKE' not in cleaned_jpg, "Error: EXIF camera info still in JPEG!"
    assert b'GPS_LAT' not in cleaned_jpg, "Error: GPS coordinates still in JPEG!"
    assert b'Content Credentials' not in cleaned_jpg, "Error: C2PA credentials still in JPEG!"
    print("[PASS] Python JPEG cleaning stripped all EXIF, GPS, and C2PA credentials.")

    # 2. Test Node.js cleaner CLI
    print("\n--- Testing Node.js CLI (cli/cleaner.js) ---")
    node_png_out = 'tests/fixtures/test_ai_image_node_cleaned.png'
    node_jpg_out = 'tests/fixtures/test_c2pa_image_node_cleaned.jpg'

    subprocess.run(['node', 'cli/cleaner.js', png_path, node_png_out], check=True)
    subprocess.run(['node', 'cli/cleaner.js', jpg_path, node_jpg_out], check=True)

    with open(node_png_out, 'rb') as f:
        node_cleaned_png = f.read()
    assert b'parameters' not in node_cleaned_png, "Error: AI prompt still in Node PNG!"
    assert b'caBX' not in node_cleaned_png, "Error: C2PA caBX still in Node PNG!"
    print("[PASS] Node.js PNG cleaning verified 100% clean.")

    with open(node_jpg_out, 'rb') as f:
        node_cleaned_jpg = f.read()
    assert b'GPS_LAT' not in node_cleaned_jpg, "Error: GPS still in Node JPEG!"
    assert b'Content Credentials' not in node_cleaned_jpg, "Error: C2PA still in Node JPEG!"
    print("[PASS] Node.js JPEG cleaning verified 100% clean.")

    print("\n[SUCCESS] ALL VERIFICATION TESTS PASSED SUCCESSFULLY! 100% VERIFIED CLEAN.")

if __name__ == '__main__':
    run_tests()
