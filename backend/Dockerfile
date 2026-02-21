FROM python:3.11-slim

LABEL maintainer="CQT Light Team"
LABEL description="CQT Light Backend — FastAPI DXF/Geo Service"

WORKDIR /app

# Dependências do sistema (para pyproj/GDAL)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libproj-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
