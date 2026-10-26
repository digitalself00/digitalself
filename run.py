"""
DigitalSelf — Root Orchestrator
Builds frontend, inits DB, and serves both Frontend and API on port 8000.
"""

import argparse
import os
import subprocess
import sys
import time
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent
FRONTEND_DIR = ROOT_DIR / "src" / "fe-react"
DESKTOP_DIR = ROOT_DIR / "desktop"


def get_python_executable():
    """Finds the virtual environment python if present, else sys.executable."""
    venv_python_win = ROOT_DIR / ".venv" / "Scripts" / "python.exe"
    venv_python_unix = ROOT_DIR / ".venv" / "bin" / "python"
    if venv_python_win.exists():
        return str(venv_python_win)
    elif venv_python_unix.exists():
        return str(venv_python_unix)
    return sys.executable


def build_frontend():
    """Builds the React frontend bundle into src/fe-react/dist."""
    dist_index = FRONTEND_DIR / "dist" / "index.html"
    print(">>> [DigitalSelf] Building React frontend for port 8000...")
    npm_cmd = "npm.cmd" if sys.platform == "win32" else "npm"
    try:
        subprocess.run(
            [npm_cmd, "run", "build"],
            cwd=str(FRONTEND_DIR),
            check=True,
            shell=(sys.platform == "win32"),
        )
        print(">>> [DigitalSelf] Frontend build ready in dist/.")
    except Exception as e:
        print(f">>> [DigitalSelf] Note on frontend build: {e}")
        if dist_index.exists():
            print(">>> [DigitalSelf] Proceeding with existing dist/ build.")


def initialize_database():
    """Initializes tables and seeds initial demo data."""
    print(">>> [DigitalSelf] Checking and initializing database schema...")
    py_exec = get_python_executable()
    try:
        subprocess.run(
            [py_exec, "-m", "src.BE.db.init_db"],
            cwd=str(ROOT_DIR),
            check=True,
        )
        print(">>> [DigitalSelf] Database initialized successfully.")
    except Exception as e:
        print(f">>> [DigitalSelf] Note on DB initialization: {e}")
        print(">>> [DigitalSelf] Make sure PostgreSQL is running or check your .env credentials.")


def start_backend():
    """Starts FastAPI uvicorn server on port 8000 (serves both API & Frontend)."""
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    print(f">>> [DigitalSelf] Launching Server on http://{host}:{port} ...")
    py_exec = get_python_executable()
    cmd = [
        py_exec,
        "-m",
        "uvicorn",
        "src.BE.main:app",
        "--host",
        host,
        "--port",
        str(port),
        "--reload",
    ]
    return subprocess.Popen(cmd, cwd=str(ROOT_DIR))


def start_desktop():
    """Launches Electron desktop companion connected to port 8000."""
    print(">>> [DigitalSelf] Launching Electron Desktop Companion on http://localhost:8000 ...")
    npx_cmd = "npx.cmd" if sys.platform == "win32" else "npx"
    cmd = [npx_cmd, "electron", "."]
    return subprocess.Popen(cmd, cwd=str(DESKTOP_DIR), shell=(sys.platform == "win32"))


def main():
    parser = argparse.ArgumentParser(description="DigitalSelf Orchestrator")
    parser.add_argument("--skip-build", action="store_true", help="Skip rebuilding the frontend")
    parser.add_argument("--init-db", action="store_true", help="Only initialize the database and exit")
    parser.add_argument("--desktop", action="store_true", help="Launch Electron desktop companion on port 8000")
    args = parser.parse_args()

    # Step 1: Initialize Database
    initialize_database()

    if args.init_db:
        print(">>> [DigitalSelf] DB initialization completed. Exiting.")
        return

    # Step 2: Build Frontend for Port 8000 (if needed)
    if not args.skip_build:
        build_frontend()

    processes = []
    try:
        # Step 3: Start Server on Port 8000
        server_proc = start_backend()
        processes.append(server_proc)

        # Step 4: Optional Desktop Shell
        if args.desktop:
            time.sleep(3)
            desk_proc = start_desktop()
            processes.append(desk_proc)

        print("\n" + "=" * 60)
        print("  DigitalSelf is running on port 8000!")
        print("  - Web App (Frontend): http://localhost:8000")
        print("  - API Documentation:  http://localhost:8000/docs")
        print("  - API Health Check:   http://localhost:8000/api/health")
        print("=" * 60 + "\n")
        print("Press Ctrl+C to terminate the server.\n")

        # Keep process alive
        for proc in processes:
            proc.wait()

    except KeyboardInterrupt:
        print("\n>>> [DigitalSelf] Shutting down services...")
    finally:
        for proc in processes:
            try:
                proc.terminate()
            except Exception:
                pass


if __name__ == "__main__":
    main()
