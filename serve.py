#!/usr/bin/env python3
import mimetypes
import os
import socket
import sys
import webbrowser
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

ROOT = os.path.dirname(os.path.abspath(__file__))

EXTRA_MIME = {
    ".js": "text/javascript",
    ".mjs": "text/javascript",
    ".css": "text/css",
    ".html": "text/html; charset=utf-8",
    ".json": "application/json",
    ".wasm": "application/wasm",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".mp3": "audio/mpeg",
    ".wav": "audio/wav",
}

for ext, mime in EXTRA_MIME.items():
    mimetypes.add_type(mime, ext)

class WandererHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        super().end_headers()

    def guess_type(self, path):
        ext = os.path.splitext(path)[1].lower()
        if ext in EXTRA_MIME:
            return EXTRA_MIME[ext]
        return super().guess_type(path)

def find_free_port(start=3344):
    for p in range(start, start + 100):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            if s.connect_ex(('127.0.0.1', p)) != 0:
                return p
    return start

def main():
    os.chdir(ROOT)
    port = find_free_port(3344)
    url = f"http://127.0.0.1:{port}/index.html"

    print("=" * 60, flush=True)
    print("WANDERER 3D — Servidor Local Ativo", flush=True)
    print("=" * 60, flush=True)
    print(f"URL Local: {url}", flush=True)
    print("Pressione Ctrl+C para encerrar.", flush=True)
    print("=" * 60, flush=True)

    server = ThreadingHTTPServer(('127.0.0.1', port), WandererHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nServidor encerrado.", flush=True)

if __name__ == '__main__':
    main()
