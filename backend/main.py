"""
CQT Light — Backend FastAPI
Ponto de entrada do servidor de serviços backend.
"""

from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request as StarletteRequest

from api.geo_router import router as geo_router
from api.dxf_router import router as dxf_router
from api.voltage_drop_router import router as voltage_drop_router
from api.kml_router import router as kml_router
from api.prodist_router import router as prodist_router
from api.ifc_router import router as ifc_router
from api.rede_router import router as rede_router

_LANDING_DIR = Path(__file__).resolve().parent.parent / "landing"


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Adiciona cabeçalhos de segurança HTTP em todas as respostas."""

    async def dispatch(self, request: StarletteRequest, call_next):
        """
        Processa a requisição e adiciona cabeçalhos de segurança na resposta.

        :param request: Requisição HTTP de entrada.
        :param call_next: Próximo handler na cadeia de middlewares.
        :returns: Resposta HTTP com cabeçalhos de segurança adicionados.
        """
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        return response

app = FastAPI(
    title="CQT Light Backend",
    description="Serviços de geração DXF 2.5D e conversão de coordenadas geográficas para redes elétricas",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(geo_router, prefix="/api/geo", tags=["Georreferenciamento"])
app.include_router(dxf_router, prefix="/api/dxf", tags=["Geração DXF"])
app.include_router(voltage_drop_router, prefix="/api/queda-tensao", tags=["Cálculo Elétrico"])
app.include_router(kml_router, prefix="/api/trace", tags=["Importação GPS"])
app.include_router(prodist_router, prefix="/api/prodist", tags=["ANEEL/PRODIST"])
app.include_router(ifc_router, prefix="/api/ifc", tags=["Half-way BIM"])
app.include_router(rede_router)


@app.get("/health", tags=["Saúde"])
async def health_check():
    """Verifica a disponibilidade do servidor."""
    return {"status": "ok", "service": "cqt-light-backend"}


@app.get("/", response_class=HTMLResponse, include_in_schema=False)
async def landing_page():
    """Serve a landing page do CQT Light."""
    index_file = _LANDING_DIR / "index.html"
    if index_file.exists():
        return index_file.read_text(encoding="utf-8")
    return HTMLResponse("<h1>CQT Light</h1>", status_code=200)


# Serve landing static assets (CSS, JS, images) if present
if _LANDING_DIR.exists():
    app.mount("/landing", StaticFiles(directory=str(_LANDING_DIR)), name="landing")
