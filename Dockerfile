# ========================================================
# Stage 1: Build Frontend (React + Vite)
# ========================================================
FROM node:20-alpine AS frontend-builder

WORKDIR /app/fe-react

# Install frontend dependencies
COPY src/fe-react/package.json src/fe-react/package-lock.json* ./
RUN npm install

# Copy frontend source files
COPY src/fe-react/ ./

# Build production bundle into /app/fe-react/dist
RUN npm run build


# ========================================================
# Stage 2: Production Container (FastAPI + Static Frontend)
# ========================================================
FROM python:3.11-slim AS production

LABEL maintainer="DigitalSelf Team"
LABEL description="Unified container serving DigitalSelf Frontend & API on port 8000"

# Avoid python bytecode generation and enable unbuffered output
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    APP_ENV=production \
    PORT=8000 \
    HOST=0.0.0.0

WORKDIR /app

# Install system dependencies (curl for container healthcheck)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy backend source code and root orchestrator
COPY run.py .
COPY src/BE/ ./src/BE/

# Copy built frontend from Stage 1 into backend static serving directory
COPY --from=frontend-builder /app/fe-react/dist ./src/fe-react/dist

# Expose unified application port
EXPOSE 8000

# Container healthcheck
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:8000/api/health || exit 1

# Start unified server using run.py (--skip-build avoids re-running npm inside python container)
CMD ["python", "run.py", "--skip-build"]
