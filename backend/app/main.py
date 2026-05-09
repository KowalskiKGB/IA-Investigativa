"""FastAPI app entrypoint."""
from contextlib import asynccontextmanager
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routers import auth, casos, documentos, chat, grafo, correcoes, admin

log = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # bootstrap idempotente — cria tabelas e seed admin
    try:
        from app.bootstrap import bootstrap
        await bootstrap()
    except Exception:
        log.exception("Falha no bootstrap (continuando — talvez DB ainda não esteja pronto)")
    yield


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title="Investigação Documental — API",
        version="0.1.0",
        description="SaaS de investigação documental para advogados.",
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origin_regex=".*",  # qualquer origem (proxy/CF restringe em prod)
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["*"],
    )

    @app.get("/health", tags=["meta"])
    async def health():
        return {
            "status": "ok",
            "env": settings.app_env,
            "llm_configured": settings.has_llm,
        }

    app.include_router(auth.router, prefix="/auth", tags=["auth"])
    app.include_router(casos.router, prefix="/casos", tags=["casos"])
    app.include_router(documentos.router, prefix="/documentos", tags=["documentos"])
    app.include_router(chat.router, prefix="/chat", tags=["chat"])
    app.include_router(grafo.router, prefix="/grafo", tags=["grafo"])
    app.include_router(correcoes.router, prefix="/correcoes", tags=["correcoes"])
    app.include_router(admin.router, prefix="/admin", tags=["admin"])

    return app


app = create_app()
