# Dockerfile for digitalself
# Multi-stage or single-stage container build definition

FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend and orchestrator
COPY run.py .
COPY src ./src

EXPOSE 8000

CMD ["python", "run.py"]
