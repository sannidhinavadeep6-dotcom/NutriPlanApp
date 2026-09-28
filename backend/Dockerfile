# Production Dockerfile for NutriPlan (Backend context)
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

CMD ["python", "start.py", "--no-browser"]
