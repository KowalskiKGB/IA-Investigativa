"""Storage S3-compatível (MinIO em dev, S3 em prod)."""
import io
import boto3
from botocore.client import Config

from app.config import get_settings

_s = get_settings()


def _client():
    return boto3.client(
        "s3",
        endpoint_url=_s.minio_endpoint,
        aws_access_key_id=_s.minio_root_user,
        aws_secret_access_key=_s.minio_root_password,
        config=Config(signature_version="s3v4"),
        region_name="us-east-1",
    )


def garantir_bucket(nome: str | None = None) -> str:
    nome = nome or _s.minio_bucket
    cli = _client()
    try:
        cli.head_bucket(Bucket=nome)
    except Exception:
        cli.create_bucket(Bucket=nome)
    return nome


def upload_bytes(key: str, dados: bytes, content_type: str = "application/octet-stream") -> str:
    bucket = garantir_bucket()
    _client().put_object(Bucket=bucket, Key=key, Body=dados, ContentType=content_type)
    return f"s3://{bucket}/{key}"


def download_bytes(key: str) -> bytes:
    bucket = garantir_bucket()
    obj = _client().get_object(Bucket=bucket, Key=key)
    return obj["Body"].read()


def deletar_arquivo(key: str) -> None:
    """Remove um objeto do bucket."""
    bucket = garantir_bucket()
    _client().delete_object(Bucket=bucket, Key=key)


def url_assinada(key: str, expira_segundos: int = 3600) -> str:
    bucket = garantir_bucket()
    return _client().generate_presigned_url(
        "get_object",
        Params={"Bucket": bucket, "Key": key},
        ExpiresIn=expira_segundos,
    )
