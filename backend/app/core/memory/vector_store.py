
import chromadb
from chromadb.utils import embedding_functions
import os
import time
import json
import hashlib
from datetime import datetime
from collections import deque
import logging

logger = logging.getLogger(__name__)

class MemoryManager:
    def __init__(self):
        self.client = chromadb.PersistentClient(path="./chroma_db")
        self.embedding_fn = embedding_functions.DefaultEmbeddingFunction()
        
        # Main conversation memory
        self.collection = self.client.get_or_create_collection(
            name="Malaika_memory",
            embedding_function=self.embedding_fn
        )
        
        # User facts collection (separate for important user info)
        self.user_facts = self.client.get_or_create_collection(
            name="Malaika_user_facts",
            embedding_function=self.embedding_fn
        )
        
        # Simple working memory cache (last 50 exchanges)
        self.recent_cache = deque(maxlen=50)
        
        logger.info("Memory system initialized")

    def _generate_id(self, prefix="mem"):
        """Generate unique ID"""
        timestamp = int(time.time() * 1000)
        random_part = hashlib.md5(str(timestamp).encode()).hexdigest()[:6]
        return f"{prefix}_{timestamp}_{random_part}"

    def add_memory(self, text, metadata=None, user_id="default", memory_type="conversation"):
        """Add a memory with enhanced metadata"""
        timestamp = time.time()
        
        # Prepare metadata
        meta = {
            "type": memory_type,
            "timestamp": timestamp,
            "user_id": user_id,
            "importance": self._calculate_importance(text)
        }
        if metadata:
            meta.update(metadata)
        
        # Generate ID
        mem_id = self._generate_id()
        
        # Store in ChromaDB
        self.collection.add(
            documents=[text],
            metadatas=[meta],
            ids=[mem_id]
        )
        
        # cache recent memory
        self.recent_cache.append({
            "text": text,
            "metadata": meta,
            "id": mem_id
        })
        
        logger.debug(f"Memory added: {text[:50]}...")

    def add_user_fact(self, user_id, fact_key, fact_value):
        """Store important facts about users"""
        fact_text = f"{fact_key}: {fact_value}"
        fact_id = self._generate_id("fact")
        
        self.user_facts.add(
            documents=[fact_text],
            metadatas=[{
                "user_id": user_id,
                "fact_key": fact_key,
                "timestamp": time.time()
            }],
            ids=[fact_id]
        )
        
        logger.info(f"User fact stored for {user_id}: {fact_key}")

    def _calculate_importance(self, text):
        """Simple importance scoring"""
        important_keywords = {
            'name': 3, 'love': 2, 'hate': 2, 'remember': 2,
            'favorite': 2, 'birthday': 3, 'secret': 3,
            'always': 1, 'never': 1, 'feel': 1, 'dream': 1
        }
        
        score = 1  # Base score
        text_lower = text.lower()
        
        for word, boost in important_keywords.items():
            if word in text_lower:
                score += boost
        
        return min(score, 10)  # Cap at 10

    def query_memory(self, query_text, n_results=10, user_id=None, include_facts=True):
        """
        Query memories with optional filtering and fact inclusion
        """
        # Build where clause if user_id specified
        where = {"user_id": user_id} if user_id else None
        
        # Query main memory
        results = self.collection.query(
            query_texts=[query_text],
            n_results=n_results,
            where=where
        )
        
        memories = results["documents"][0] if results["documents"] else []
        
        # query user facts if requested
        if include_facts and user_id:
            fact_results = self.user_facts.query(
                query_texts=[query_text],
                n_results=3,
                where={"user_id": user_id}
            )
            
            if fact_results["documents"]:
                memories.extend(fact_results["documents"][0])
        
        return memories

    def get_recent_memories(self, n=20, user_id=None):
        """Get recent memories from cache or database"""
        # First try cache
        if len(self.recent_cache) >= n:
            cached = [m["text"] for m in self.recent_cache]
            if user_id:
                # Filter by user if needed
                cached = [m for m in self.recent_cache if m["metadata"].get("user_id") == user_id]
                return [item["text"] for item in cached][:n]
            return cached[:n]
        
        # Fall back to database query
        try:
            # Get all memories (you might want to optimize this)
            all_mems = self.collection.get(include=["documents", "metadatas"])
            
            if not all_mems["documents"]:
                return []
            
            # Filter by user if needed
            mems = []
            for doc, meta in zip(all_mems["documents"], all_mems["metadatas"]):
                if not user_id or meta.get("user_id") == user_id:
                    mems.append((doc, meta.get("timestamp", 0)))
            
            # Sort by timestamp and return recent
            mems.sort(key=lambda x: x[1], reverse=True)
            return [doc for doc, _ in mems[:n]]
            
        except Exception as e:
            logger.error(f"Error getting recent memories: {e}")
            return []

    def get_user_facts(self, user_id):
        """Get all facts about a specific user"""
        try:
            results = self.user_facts.get(
                where={"user_id": user_id},
                include=["documents"]
            )
            return results["documents"] if results["documents"] else []
        except:
            return []

    def get_important_memories(self, n=10, user_id=None):
        """Get most important memories"""
        try:
            # Get all memories
            all_mems = self.collection.get(include=["documents", "metadatas"])
            
            if not all_mems["documents"]:
                return []
            
            # Filter and sort by importance
            mems = []
            for doc, meta in zip(all_mems["documents"], all_mems["metadatas"]):
                if not user_id or meta.get("user_id") == user_id:
                    importance = meta.get("importance", 1)
                    mems.append((doc, importance))
            
            mems.sort(key=lambda x: x[1], reverse=True)
            return [doc for doc, _ in mems[:n]]
            
        except Exception as e:
            logger.error(f"Error getting important memories: {e}")
            return []

memory_manager = MemoryManager()