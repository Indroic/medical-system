import uuid
from typing import BinaryIO

import aioboto3

from config import config


class S3StorageAdapter:
    def __init__(self) -> None:
        self.endpoint_url = config.s3_endpoint
        self.access_key = config.s3_access_key
        self.secret_key = config.s3_secret_key
        self.region = config.s3_region
        self.bucket_name = config.s3_bucket
        self.session = aioboto3.Session()

    async def _ensure_bucket_exists(self, s3_client) -> None:
        """Verifica si el bucket existe, y si no, lo crea (útil en dev/seaweedfs)."""
        try:
            await s3_client.head_bucket(Bucket=self.bucket_name)
        except Exception:
            # Creamos el bucket si no existe
            await s3_client.create_bucket(Bucket=self.bucket_name)

    async def guardar(self, nombre_archivo: str, contenido: bytes) -> str:
        """
        Sube un archivo binario a S3 y retorna la clave única (S3 key).
        """
        # Obtenemos extension del nombre de archivo, default png
        file_ext = "png"
        if "." in nombre_archivo:
            file_ext = nombre_archivo.rsplit(".", 1)[-1]
            
        file_name = f"estudios/{uuid.uuid4()}.{file_ext}"

        async with self.session.client(
            "s3",
            endpoint_url=self.endpoint_url,
            aws_access_key_id=self.access_key,
            aws_secret_access_key=self.secret_key,
            region_name=self.region,
        ) as s3_client:
            await self._ensure_bucket_exists(s3_client)
            await s3_client.put_object(
                Bucket=self.bucket_name,
                Key=file_name,
                Body=contenido,
            )
            return file_name

    async def download_file(self, s3_key: str) -> bytes:
        """
        Descarga el archivo desde S3 en memoria (bytes).
        """
        async with self.session.client(
            "s3",
            endpoint_url=self.endpoint_url,
            aws_access_key_id=self.access_key,
            aws_secret_access_key=self.secret_key,
            region_name=self.region,
        ) as s3_client:
            response = await s3_client.get_object(Bucket=self.bucket_name, Key=s3_key)
            return await response["Body"].read()

    async def exists(self, s3_key: str) -> bool:
        """
        Verifica si un archivo existe en S3.
        """
        async with self.session.client(
            "s3",
            endpoint_url=self.endpoint_url,
            aws_access_key_id=self.access_key,
            aws_secret_access_key=self.secret_key,
            region_name=self.region,
        ) as s3_client:
            try:
                await s3_client.head_object(Bucket=self.bucket_name, Key=s3_key)
                return True
            except Exception:
                return False
