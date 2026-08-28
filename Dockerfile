# Production 24/7 Docker container for NutriPlan
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements and install
COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy backend source code (including pre-built Angular static files)
COPY backend/ ./backend/

WORKDIR /app/backend

# Expose port
EXPOSE 8000

ENV PORT=8000
ENV PYTHONUNBUFFERED=1

# Run with Waitress WSGI production server
CMD ["python", "-c", "from app import app; from waitress import serve; import os; port = int(os.environ.get('PORT', 8000)); print(f'Starting 24/7 NutriPlan server on port {port}'); serve(app, host='0.0.0.0', port=port, threads=8)"]
