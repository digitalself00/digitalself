"""
DigitalSelf — Root Orchestrator
Initializes PostgreSQL / DB models, runs backend (FastAPI/Uvicorn),
and optionally runs frontend and desktop companion.
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


def initialize_database():
    """Initializes tables and seeds initial demo data."""
    print(">>> [DigitalSelf] Checking and initializing database schema...")
    py_exec = get_python_executable()
    try:
        res = subprocess.run([py_exec, "-m", "src.BE.db.init_db"], cwd=str(ROOT_DIR), check=True)
        print(">>> [DigitalSelf] Database initialized successfully.")
    except Exception as e:
        print(f">>> [DigitalSelf] Note on DB initialization: {e}")
        print(">>> [DigitalSelf] Make sure PostgreSQL is running or check your .env credentials.")


def get_python_executable():
    """Finds the virtual environment python if present, else sys.executable."""
    venv_python_win = ROOT_DIR / ".venv" / "Scripts" / "python.exe"
    venv_python_unix = ROOT_DIR / ".venv" / "bin" / "python"
    if venv_python_win.exists():
        return str(venv_python_win)
    elif venv_python_unix.exists():
        return str(venv_python_unix)
    return sys.executable


def start_backend():
    """Starts FastAPI uvicorn server."""
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    print(f">>> [DigitalSelf] Launching FastAPI Backend on http://{host}:{port} ...")
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


def start_frontend():
    """Starts React Vite dev server."""
    print(">>> [DigitalSelf] Launching Frontend Vite server on http://localhost:5173 ...")
    npm_cmd = "npm.cmd" if sys.platform == "win32" else "npm"
    cmd = [npm_cmd, "run", "dev"]
    return subprocess.Popen(cmd, cwd=str(FRONTEND_DIR), shell=(sys.platform == "win32"))


def start_desktop():
    """Launches Electron desktop companion."""
    print(">>> [DigitalSelf] Launching Electron Desktop Companion...")
    npx_cmd = "npx.cmd" if sys.platform == "win32" else "npx"
    cmd = [npx_cmd, "electron", "."]
    return subprocess.Popen(cmd, cwd=str(DESKTOP_DIR), shell=(sys.platform == "win32"))


def main():
    parser = argparse.ArgumentParser(description="DigitalSelf Orchestrator")
    parser.add_argument("--backend-only", action="store_true", help="Start only the FastAPI backend")
    parser.add_argument("--init-db", action="store_true", help="Only initialize the database and exit")
    parser.add_argument("--desktop", action="store_true", help="Launch Electron desktop wrapper alongside servers")
    args = parser.parse_args()

    # Step 1: Initialize Database
    initialize_database()

    if args.init_db:
        print(">>> [DigitalSelf] DB initialization completed. Exiting.")
        return

    processes = []
    try:
        # Step 2: Start Backend
        be_proc = start_backend()
        processes.append(be_proc)

        # Step 3: Start Frontend (unless backend-only)
        if not args.backend_only:
            time.sleep(1)
            fe_proc = start_frontend()
            processes.append(fe_proc)

            # Step 4: Optional Desktop Launch
            if args.desktop:
                time.sleep(3)
                desk_proc = start_desktop()
                processes.append(desk_proc)

        print("\n" + "=" * 60)
        print("  DigitalSelf is running!")
        print("  - Backend API: http://localhost:8000")
        print("  - API Documentation: http://localhost:8000/docs")
        if not args.backend_only:
            print("  - Frontend UI: http://localhost:5173")
        print("=" * 60 + "\n")
        print("Press Ctrl+C to terminate all services.\n")

        # Keep alive
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
