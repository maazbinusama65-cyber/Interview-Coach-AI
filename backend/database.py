from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from config import settings

# asyncpg requires postgresql+asyncpg:// scheme
_url = settings.database_url.replace("postgresql://", "postgresql+asyncpg://", 1)
_url = _url.replace("postgres://", "postgresql+asyncpg://", 1)

engine = create_async_engine(_url, echo=False, pool_pre_ping=True)
AsyncSessionFactory = async_sessionmaker(engine, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionFactory() as session:
        yield session
