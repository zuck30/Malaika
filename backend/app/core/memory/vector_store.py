import chromadb
from chromadb.utils import embedding_functions
import os
import time

class MemoryManager:
    def __init__(self):
        self.client = chromadb.PersistentClient(path="./chroma_db")
        self.embedding_fn = embedding_functions.DefaultEmbeddingFunction()
        self.collection = self.client.get_or_create_collection(
            name="elysia_memory",
            embedding_function=self.embedding_fn
        )

    def add_memory(self, text, metadata=None):
        timestamp = time.time()
        # Use a high number minus timestamp for IDs to get recent ones first with limit
        # Or just use count for simplicity if we want to retrieve by ID range
        count = self.collection.count()
        mem_id = f"msg_{count + 1:012d}"

        meta = metadata if metadata else {"type": "conversation"}
        meta["timestamp"] = timestamp

        self.collection.add(
            documents=[text],
            metadatas=[meta],
            ids=[mem_id]
        )

    def query_memory(self, query_text, n_results=5):
        results = self.collection.query(
            query_texts=[query_text],
            n_results=n_results
        )
        return results["documents"][0] if results["documents"] else []

    def get_recent_memories(self, n=10):
        """Fetch the most recent N memories, ensuring they are in chronological order."""
        count = self.collection.count()
        if count == 0:
            return []

        start_idx = max(1, count - n + 1)
        ids = [f"msg_{i:012d}" for i in range(start_idx, count + 1)]

        results = self.collection.get(
            ids=ids,
            include=["documents", "metadatas"]
        )

        if not results["documents"]:
            return []

        # ChromaDB .get() doesn't guarantee order by ID, so we sort them here
        combined = list(zip(results["ids"], results["documents"]))
        combined.sort(key=lambda x: x[0]) # Sort by msg_000... ID

        return [doc for _, doc in combined]

memory_manager = MemoryManager()
