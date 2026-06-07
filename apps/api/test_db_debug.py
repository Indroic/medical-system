import asyncio

from hexcore.infrastructure.repositories.orms.sqlalchemy import BaseModel
from sqlalchemy.ext.asyncio import create_async_engine


async def main():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    print("Tables before create_all:", BaseModel.metadata.tables.keys())
    async with engine.begin() as conn:
        await conn.run_sync(BaseModel.metadata.create_all)
    print("Done")

asyncio.run(main())
