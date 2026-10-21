#!/usr/bin/env python3
"""OpenGIPHY demo proxy.

Serves ONE local port that joins the two app servers:
  - API paths (/auth, /gifs, /users, /uploads, /health, docs) -> backend  :8000
  - everything else (pages, assets)                           -> frontend :5173

Run:  python3 demo-proxy.py [port]        (default port 8088)
Then point ONE tunnel (cloudflared / ngrok) at this port and share that URL.
"""
import http.client
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

PROXY_PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8088
BACKEND = ("127.0.0.1", 8000)
FRONTEND = ("127.0.0.1", 5173)

API_PREFIXES = ("/auth", "/gifs", "/users", "/uploads")
API_EXACT = ("/health", "/openapi.json", "/docs", "/redoc")

HOP_BY_HOP = {
    "connection", "keep-alive", "proxy-authenticate", "proxy-authorization",
    "te", "trailers", "transfer-encoding", "upgrade", "content-encoding",
    "content-length",
}


def is_api(path: str) -> bool:
    clean = path.split("?", 1)[0]
    if clean in API_EXACT:
        return True
    return any(clean == p or clean.startswith(p + "/") for p in API_PREFIXES)


class Handler(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def _forward(self):
        target = BACKEND if is_api(self.path) else FRONTEND
        length = int(self.headers.get("Content-Length") or 0)
        body = self.rfile.read(length) if length else None
        headers = {
            k: v for k, v in self.headers.items()
            if k.lower() not in HOP_BY_HOP and k.lower() != "host"
        }
        headers["Host"] = f"{target[0]}:{target[1]}"
        conn = http.client.HTTPConnection(target[0], target[1], timeout=30)
        try:
            conn.request(self.command, self.path, body=body, headers=headers)
            resp = conn.getresponse()
            data = resp.read()
            self.send_response(resp.status, resp.reason)
            for k, v in resp.getheaders():
                if k.lower() in HOP_BY_HOP:
                    continue
                self.send_header(k, v)
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            if self.command != "HEAD":
                self.wfile.write(data)
        except Exception as exc:  # target down etc. -> honest 502
            payload = f"proxy error: {exc}".encode()
            self.send_response(502)
            self.send_header("Content-Type", "text/plain")
            self.send_header("Content-Length", str(len(payload)))
            self.end_headers()
            if self.command != "HEAD":
                self.wfile.write(payload)
        finally:
            conn.close()

    do_GET = _forward
    do_POST = _forward
    do_PUT = _forward
    do_PATCH = _forward
    do_DELETE = _forward
    do_HEAD = _forward

    def log_message(self, fmt, *args):
        sys.stderr.write("%s %s\n" % (self.address_string(), fmt % args))


if __name__ == "__main__":
    server = ThreadingHTTPServer(("127.0.0.1", PROXY_PORT), Handler)
    print(f"OpenGIPHY demo proxy on http://127.0.0.1:{PROXY_PORT} "
          f"(api -> :8000, pages -> :5173)", flush=True)
    server.serve_forever()
