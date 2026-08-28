# Production 24/7 Dockerfile for NutriPlan (Backend-only Context)
FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000
ENV PORT=8000
ENV PYTHONUNBUFFERED=1

CMD ["python", "-c", "import os, sys; sys.path.insert(0, os.getcwd()); from app import app; from waitress import serve; port = int(os.environ.get('PORT', 8000)); print(f'NutriPlan 24/7 running on port {port}'); serve(app, host='0.0.0.0', port=port, threads=8)"]
