import asyncio
import logging
from typing import Dict, Any, List, Optional
from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings

logger = logging.getLogger("healthform.database")

class InMemoryCollection:
    """In-memory collection fallback mimicking Motor async collection methods."""
    def __init__(self, name: str):
        self.name = name
        self.docs: List[Dict[str, Any]] = []

    async def insert_one(self, doc: Dict[str, Any]):
        doc_copy = dict(doc)
        if "_id" not in doc_copy:
            doc_copy["_id"] = str(len(self.docs) + 1)
        self.docs.append(doc_copy)
        class InsertResult:
            def __init__(self, id_):
                self.inserted_id = id_
        return InsertResult(doc_copy["_id"])

    async def find_one(self, query: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        for d in self.docs:
            match = True
            for k, v in query.items():
                if d.get(k) != v:
                    match = False
                    break
            if match:
                return dict(d)
        return None

    def find(self, query: Optional[Dict[str, Any]] = None):
        matching = []
        for d in self.docs:
            if not query:
                matching.append(dict(d))
            else:
                match = True
                for k, v in query.items():
                    if d.get(k) != v:
                        match = False
                        break
                if match:
                    matching.append(dict(d))
        
        class Cursor:
            def __init__(self, items):
                self.items = items
            def sort(self, key, direction=-1):
                reverse = (direction == -1)
                self.items = sorted(self.items, key=lambda x: x.get(key, ""), reverse=reverse)
                return self
            async def to_list(self, length: Optional[int] = None):
                if length is None:
                    return self.items
                return self.items[:length]
            def __aiter__(self):
                self._iter = iter(self.items)
                return self
            async def __anext__(self):
                try:
                    return next(self._iter)
                except StopIteration:
                    raise StopAsyncIteration

        return Cursor(matching)

    async def update_one(self, query: Dict[str, Any], update: Dict[str, Any]):
        for d in self.docs:
            match = True
            for k, v in query.items():
                if d.get(k) != v:
                    match = False
                    break
            if match:
                if "$set" in update:
                    d.update(update["$set"])
                return
        return

    async def delete_one(self, query: Dict[str, Any]):
        for i, d in enumerate(self.docs):
            match = True
            for k, v in query.items():
                if d.get(k) != v:
                    match = False
                    break
            if match:
                del self.docs[i]
                return
        return

    async def count_documents(self, query: Dict[str, Any]) -> int:
        c = 0
        for d in self.docs:
            match = True
            for k, v in query.items():
                if d.get(k) != v:
                    match = False
                    break
            if match:
                c += 1
        return c


class DatabaseManager:
    def __init__(self):
        self.client: Optional[AsyncIOMotorClient] = None
        self.db = None
        self.is_connected: bool = False
        self.fallback_collections: Dict[str, InMemoryCollection] = {}

    async def connect(self):
        try:
            self.client = AsyncIOMotorClient(
                settings.MONGODB_URI,
                serverSelectionTimeoutMS=2000
            )
            # Test connection
            await self.client.admin.command('ping')
            self.db = self.client[settings.DATABASE_NAME]
            self.is_connected = True
            logger.info(f"Connected to MongoDB at {settings.MONGODB_URI}/{settings.DATABASE_NAME}")
        except Exception as e:
            self.is_connected = False
            self.client = None
            self.db = None
            logger.warning(f"MongoDB connection failed ({e}). Falling back to resilient In-Memory storage.")

    def get_collection(self, name: str):
        if self.is_connected and self.db is not None:
            return self.db[name]
        if name not in self.fallback_collections:
            self.fallback_collections[name] = InMemoryCollection(name)
        return self.fallback_collections[name]

    async def close(self):
        if self.client:
            self.client.close()
            logger.info("MongoDB client closed")

db_manager = DatabaseManager()

def get_users_col():
    return db_manager.get_collection("users")

def get_reports_col():
    return db_manager.get_collection("reports")

def get_parameters_col():
    return db_manager.get_collection("parameters")

def get_analyses_col():
    return db_manager.get_collection("analyses")

def get_claims_col():
    return db_manager.get_collection("claims")

def get_benchmarks_col():
    return db_manager.get_collection("benchmarks")
