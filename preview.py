"""Preview the portfolio on this PC: python preview.py, then open http://localhost:8000
Serves this folder like a real web host does, including byte ranges, so videos can be scrubbed."""
import http.server, os, re, sys

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
os.chdir(os.path.dirname(os.path.abspath(__file__)))


class Handler(http.server.SimpleHTTPRequestHandler):
    extensions_map = {**http.server.SimpleHTTPRequestHandler.extensions_map,
                      '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.mp4': 'video/mp4',
                      '.webm': 'video/webm', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml'}

    def end_headers(self):
        self.send_header('Accept-Ranges', 'bytes')
        self.send_header('Cache-Control', 'no-cache')      # so your edits show up on reload
        super().end_headers()

    def send_head(self):
        m = re.fullmatch(r'bytes=(\d*)-(\d*)', self.headers.get('Range', '').strip())
        path = self.translate_path(self.path)
        if not m or not os.path.isfile(path):
            return super().send_head()
        size = os.path.getsize(path)
        a, b = m.groups()
        start, end = (size - int(b), size - 1) if a == '' else (int(a), min(int(b), size - 1) if b else size - 1)
        if start >= size or start > end:
            self.send_response(416); self.send_header('Content-Range', f'bytes */{size}'); self.end_headers(); return None
        f = open(path, 'rb'); f.seek(start)
        self.send_response(206)
        self.send_header('Content-Type', self.guess_type(path))
        self.send_header('Content-Range', f'bytes {start}-{end}/{size}')
        self.send_header('Content-Length', str(end - start + 1))
        self.end_headers()
        self.range_left = end - start + 1
        return f

    def copyfile(self, source, outputfile):
        left = getattr(self, 'range_left', None)
        if left is None: return super().copyfile(source, outputfile)
        try:
            while left > 0:
                chunk = source.read(min(256 * 1024, left))
                if not chunk: break
                outputfile.write(chunk); left -= len(chunk)
        except (ConnectionResetError, BrokenPipeError):
            pass                                            # the browser stopped this request early, which is normal for video

    def log_message(self, *args):
        pass


if __name__ == '__main__':
    print(f'Preview running at http://localhost:{PORT}  (press Ctrl+C or close this window to stop)')
    http.server.ThreadingHTTPServer(('127.0.0.1', PORT), Handler).serve_forever()
