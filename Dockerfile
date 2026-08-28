# Production 24/7 Dockerfile for NutriPlan (Universal Context)
FROM python:3.11-slim

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy all files from the build context
COPY . .

# Install dependencies (auto-detects location)
RUN if [ -f backend/requirements.txt ]; then \
        pip install --no-cache-dir -r backend/requirements.txt; \
    elif [ -f requirements.txt ]; then \
        pip install --no-cache-dir -r requirements.txt; \
    fi

EXPOSE 8000
ENV PORT=8000
ENV PYTHONUNBUFFERED=1

# Universal startup: runs from backend if present, or current directory
CMD ["python", "-c", "import os, sys; (os.chdir('backend') or sys.path.insert(0, os.getcwd())) if os.path.isdir('backend') else sys.path.insert(0, os.getcwd()); from app import app; from waitress import serve; port = int(os.environ.get('PORT', 8000)); print(f'NutriPlan 24/7 running on port {port}'); serve(app, host='0.0.0.0', port=port, threads=8)"]
