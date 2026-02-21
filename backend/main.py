"""
CQT Light — Backend FastAPI
Ponto de entrada do servidor de serviços backend.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.geo_router import router as geo_router
from api.dxf_router import router as dxf_router

app = FastAPI(
    title="CQT Light Backend",
    description="Serviços de geração DXF 2.5D e conversão de coordenadas geográficas para redes elétricas",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(geo_router, prefix="/api/geo", tags=["Georreferenciamento"])
app.include_router(dxf_router, prefix="/api/dxf", tags=["Geração DXF"])


@app.get("/health", tags=["Saúde"])
async def health_check():
    """Verifica a disponibilidade do servidor."""
    return {"status": "ok", "service": "cqt-light-backend"}
