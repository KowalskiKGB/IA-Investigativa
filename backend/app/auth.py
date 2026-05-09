"""Auth — JWT + bcrypt."""
from datetime import datetime, timedelta, timezone
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from passlib.context import CryptContext

from app.config import get_settings

_settings = get_settings()
_pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login", auto_error=False)


def hash_senha(s: str) -> str:
    return _pwd.hash(s)


def verifica_senha(plano: str, hash_: str) -> bool:
    return _pwd.verify(plano, hash_)


def gerar_token(usuario_id: str, cliente_id: str) -> str:
    exp = datetime.now(timezone.utc) + timedelta(minutes=_settings.jwt_ttl_minutes)
    payload = {"sub": str(usuario_id), "cli": str(cliente_id), "exp": exp}
    return jwt.encode(payload, _settings.jwt_secret, algorithm=_settings.jwt_algo)


class AuthContext:
    def __init__(self, usuario_id: str, cliente_id: str):
        self.usuario_id = usuario_id
        self.cliente_id = cliente_id


async def get_auth(token: str | None = Depends(oauth2_scheme)) -> AuthContext:
    if not token:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token ausente")
    try:
        payload = jwt.decode(token, _settings.jwt_secret, algorithms=[_settings.jwt_algo])
        return AuthContext(usuario_id=payload["sub"], cliente_id=payload["cli"])
    except (JWTError, KeyError):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token inválido")
