#!/usr/bin/env python3
"""Tiny static file server for Critter Codex.

Usage:  python3 server.py [port]   (default port 8000)
Then open http://localhost:8000/ in a browser.
"""
import http.server
import socketserver
import os
import sys

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8000

os.chdir(os.path.dirname(os.path.abspath(__file__)))


class Handler(http.server.SimpleHTTPRequestHandler):
    # No-cache so edits show up on refresh during development.
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, max-age=0')
        super().end_headers()


with socketserver.TCPServer(('', PORT), Handler) as httpd:
    print(f'Critter Codex serving at http://localhost:{PORT}/')
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print('\nStopped.')
