#!/usr/bin/env python3
"""
NutriPlan — one-click launcher (Angular + Flask + SQLite)

Run from ANYWHERE — double-click run.bat (Windows) / run.sh (Mac, Linux),
or simply:      python start.py

It will:
  1. check Python version
  2. install the backend dependencies automatically (one time)
  3. FREE PORT 8000 — detect & stop any old app using it (asks first)
  4. start the server and open your browser at the right address
"""

import atexit
import os
import re
import socket
import subprocess
import sys
import threading
import time
import webbrowser

ROOT = os.path.dirname(os.path.abspath(__file__))
BACKEND = os.path.join(ROOT, "backend")
DEFAULT_PORT = 8000


def ensure_deps():
    try:
        import flask  # noqa: F401
        import flask_cors  # noqa: F401
        import flask_sqlalchemy  # noqa: F401
        import jwt  # noqa: F401
        import waitress  # noqa: F401
        return
    except ImportError:
        pass

    print("Installing Python dependencies (one time only)...")
    import subprocess
    try:
        subprocess.check_call(
            [sys.executable, "-m", "pip", "install", "-r",
             os.path.join(BACKEND, "requirements.txt")]
        )
    except subprocess.CalledProcessError:
        print()
        print("ERROR: Could not install dependencies automatically.")
        print("Run this manually, then start again:")
        print("   cd backend")
        print("   pip install -r requirements.txt")
        sys.exit(1)


# ---------------------------------------------------------------- port helpers

def port_in_use(port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(1.0)
        return s.connect_ex(("127.0.0.1", port)) == 0


def pids_on_port(port):
    """Process IDs listening on the given port (Windows / macOS / Linux)."""
    pids = set()
    if os.name == "nt":
        try:
            out = subprocess.check_output(["netstat", "-ano"], text=True, errors="ignore")
            for line in out.splitlines():
                parts = line.split()
                if len(parts) >= 5 and parts[3] == "LISTENING" and \
                        parts[1].endswith(":%d" % port):
                    pids.add(parts[4])
        except Exception:
            pass
    else:
        try:
            out = subprocess.check_output(["lsof", "-ti", "tcp:%d" % port],
                                          text=True, errors="ignore")
            pids.update(p.strip() for p in out.split() if p.strip().isdigit())
        except Exception:
            pass
        if not pids:
            # fallback: ss (standard on most modern Linux distros)
            try:
                out = subprocess.check_output(
                    ["ss", "-ltnp", "sport = :%d" % port], text=True, errors="ignore")
                import re as _re
                pids.update(m for m in _re.findall(r"pid=(\d+)", out))
            except Exception:
                pass
    return {p for p in pids if p.isdigit() and p != str(os.getpid())}


def kill_pid(pid):
    try:
        if os.name == "nt":
            subprocess.check_call(
                ["taskkill", "/F", "/PID", pid],
                stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        else:
            os.kill(int(pid), 9)
        return True
    except Exception:
        return False


def free_port(port):
    """Make sure `port` is free. Returns True if free (or freed)."""
    if not port_in_use(port):
        return True

    print()
    print("=" * 58)
    print("  Port %d is BUSY — an old app is still running there." % port)
    pids = pids_on_port(port)
    if pids:
        print("  Process ID(s) using it: %s" % ", ".join(sorted(pids)))

    answer = ""
    try:
        answer = input("  Stop the old app so NutriPlan can use port %d? [Y/n] "
                       % port).strip().lower()
    except EOFError:
        answer = "y"  # non-interactive: just do it

    if answer in ("", "y", "yes"):
        for pid in sorted(pids):
            if kill_pid(pid):
                print("  Stopped process %s" % pid)
        for _ in range(20):
            time.sleep(0.5)
            if not port_in_use(port):
                print("  Port %d is free now ✓" % port)
                return True
        # maybe the listener died but TIME_WAIT lingers — re-check pids
        if not pids_on_port(port) and not port_in_use(port):
            return True

    print()
    print("  Could not free port %d automatically. Fix it manually:" % port)
    print("   Windows   : netstat -ano | findstr :%d   then  taskkill /F /PID <number>" % port)
    print("   Mac/Linux : lsof -i :%d   then  kill -9 <number>" % port)
    print("  (Usually the old app is another terminal/black window — just close it.)")
    return False


def pick_port():
    """Free the default port; otherwise fall back to the next free one."""
    if free_port(DEFAULT_PORT):
        return DEFAULT_PORT
    for candidate in range(DEFAULT_PORT + 1, DEFAULT_PORT + 10):
        if not port_in_use(candidate):
            print("  -> Using port %d instead." % candidate)
            return candidate
    print("ERROR: no free port between %d-%d" % (DEFAULT_PORT, DEFAULT_PORT + 9))
    sys.exit(1)


def get_local_ip():
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
            s.connect(("8.8.8.8", 80))
            return s.getsockname()[0]
    except Exception:
        return "127.0.0.1"


def start_public_tunnel(port):
    cf_path = os.path.join(ROOT, "cloudflared.exe")
    if not os.path.isfile(cf_path):
        return None
    try:
        proc = subprocess.Popen(
            [cf_path, "tunnel", "--url", "http://127.0.0.1:%d" % port],
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1,
        )
        atexit.register(lambda: proc.terminate() if proc.poll() is None else None)
        
        tunnel_url = None
        start_t = time.time()
        while time.time() - start_t < 15:
            line = proc.stdout.readline()
            if not line:
                break
            m = re.search(r"https://[a-zA-Z0-9-]+\.trycloudflare\.com", line)
            if m:
                tunnel_url = m.group(0)
                break
        return tunnel_url
    except Exception:
        return None


def open_browser_later(url):
    def _open():
        time.sleep(1.2)
        try:
            webbrowser.open(url)
        except Exception:
            pass
    threading.Thread(target=_open, daemon=True).start()


def main():
    if sys.version_info < (3, 9):
        print("ERROR: Python 3.9 or newer is required (you have %s)" %
              sys.version.split()[0])
        sys.exit(1)

    ensure_deps()
    port = pick_port()
    local_ip = get_local_ip()

    print("\n  Starting Worldwide Public Tunnel...")
    public_url = start_public_tunnel(port)

    os.chdir(BACKEND)
    sys.path.insert(0, BACKEND)
    from app import app  # noqa: E402  (imports the Flask app from backend/app.py)

    url = "http://localhost:%d" % port
    print()
    print("=" * 64)
    print("  [NutriPlan] 24/7 Server is ACTIVE!")
    print("=" * 64)
    print("  [PC Browser]      : %s" % url)
    print("  [Same Wi-Fi]      : http://%s:%d" % (local_ip, port))
    if public_url:
        print("  [ANY OTHER WI-FI] : %s" % public_url)
        print("     (Works on 4G / 5G / Any Wi-Fi worldwide!)")
    print("-" * 64)
    print("  Admin login       : admin@nutriplan.app  /  Admin@123")
    print("  (running continuously 24/7 -- Ctrl+C to stop)")
    print("=" * 64)
    print()

    if "--no-browser" not in sys.argv and "--background" not in sys.argv:
        open_browser_later(url)

    try:
        from waitress import serve
        print("  Serving with multi-threaded WSGI engine (Waitress)...")
        serve(app, host="0.0.0.0", port=port, threads=8, channel_timeout=120)
    except ImportError:
        app.run(host="0.0.0.0", port=port, debug=False)



if __name__ == "__main__":
    main()

