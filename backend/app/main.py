"""FastAPI app entrypoint."""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routers import auth, casos, documentos, chat, grafo, correcoes


@asynccontextmanager
async def lifespan(app: FastAPI):
    # startup: lazy — sem bloquear se infra ainda não subiu
    yield
    # shutdown


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
        allow_origins=["*"] if settings.app_env == "development" else [],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
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

    return app


app = create_app()
