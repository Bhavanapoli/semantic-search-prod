import os
from motor.motor_asyncio import AsyncIOMotorClient
from utils.logger import get_logger

logger = get_logger(__name__)

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME   = os.getenv("MONGO_DB_NAME", "semantic_search")

client: AsyncIOMotorClient = None
db = None


async def connect_db():
    global client, db
    try:
        client = AsyncIOMotorClient(MONGO_URI, serverSelectionTimeoutMS=5000)
        await client.admin.command("ping")
        db = client[DB_NAME]
        await _create_indexes()
        logger.info(f"MongoDB connected: {DB_NAME}")
    except Exception as e:
        logger.error(f"MongoDB connection failed: {e}")


async def disconnect_db():
    global client
    if client:
        client.close()
        logger.info("MongoDB disconnected")


async def _create_indexes():
    await db.users.create_index("email", unique=True)
    await db.users.create_index("username", unique=True)
    await db.papers.create_index("title")
    await db.papers.create_index("uploaded_by")
    await db.queries.create_index("user_id")
    await db.queries.create_index("timestamp")
    await db.uploads.create_index("user_id")


def get_db():
    return db
