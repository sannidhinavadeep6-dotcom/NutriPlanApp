# Production Dockerfile for NutriPlan on Render / Cloud
FROM python:3.11-slim

WORKDIR /app

# Install build tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy application source code
COPY backend ./backend
COPY database ./database
COPY frontend/dist ./frontend/dist

EXPOSE 8000
ENV PORT=8000
ENV PYTHONUNBUFFERED=1

# Start the Flask app using Waitress WSGI on dynamic PORT
CMD ["python", "backend/start.py", "--no-browser"]
