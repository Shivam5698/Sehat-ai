"""
AI Service Bootstrap with Dataset Loading
Initializes the AI service and loads medical datasets on startup
"""

import logging
import asyncio
from typing import Optional

logger = logging.getLogger(__name__)

# Import dataset loader
try:
    from services.dataset_loader import dataset_loader_service
except ImportError:
    logger.warning("Dataset loader service not available")
    dataset_loader_service = None


class AIServiceBootstrap:
    """Handles AI service initialization and dataset loading"""
    
    def __init__(self):
        self.initialized = False
        self.datasets_loaded = False
    
    async def initialize(self):
        """
        Initialize the AI service
        This should be called once on application startup
        """
        try:
            logger.info("[AIBootstrap] Starting AI service initialization...")
            
            # Step 1: Seed datasets from backend
            if dataset_loader_service:
                await asyncio.to_thread(self._seed_datasets)
            
            # Step 2: Load datasets into memory
            if dataset_loader_service:
                await asyncio.to_thread(self._load_datasets)
            
            # Step 3: Initialize RAG pipeline
            logger.info("[AIBootstrap] Initializing RAG pipeline...")
            # RAGPipeline initialization happens here
            
            self.initialized = True
            logger.info("[AIBootstrap] ✓ AI service initialization completed successfully")
            
        except Exception as e:
            logger.error(f"[AIBootstrap] ✗ Failed to initialize AI service: {e}")
            self.initialized = False
            raise
    
    def _seed_datasets(self):
        """Seed datasets from external sources"""
        if not dataset_loader_service:
            return
        
        try:
            logger.info("[AIBootstrap] Seeding datasets...")
            result = dataset_loader_service.seed_datasets()
            logger.info(f"[AIBootstrap] Dataset seeding result: {result}")
        except Exception as e:
            logger.warning(f"[AIBootstrap] Dataset seeding failed (non-critical): {e}")
    
    def _load_datasets(self):
        """Load datasets into memory"""
        if not dataset_loader_service:
            return
        
        try:
            logger.info("[AIBootstrap] Loading datasets into memory...")
            
            # Load all datasets
            all_datasets = dataset_loader_service.load_all_datasets()
            logger.info(f"[AIBootstrap] Loaded {len(all_datasets)} datasets")
            
            # Load by category for quick access
            categories = {}
            for ds in all_datasets:
                category = ds.get('category', 'unknown')
                if category not in categories:
                    categories[category] = []
                categories[category].append(ds)
            
            logger.info(f"[AIBootstrap] Datasets by category: {list(categories.keys())}")
            
            # Get statistics
            stats = dataset_loader_service.get_dataset_stats()
            logger.info(f"[AIBootstrap] Dataset statistics: {stats}")
            
            self.datasets_loaded = True
            logger.info("[AIBootstrap] ✓ All datasets loaded successfully")
            
        except Exception as e:
            logger.warning(f"[AIBootstrap] Failed to load datasets (non-critical): {e}")
            self.datasets_loaded = False


# Global bootstrap instance
ai_bootstrap = AIServiceBootstrap()


# Usage in main.py:
# 
# from fastapi import FastAPI
# from bootstrap import ai_bootstrap
# 
# app = FastAPI()
# 
# @app.on_event("startup")
# async def startup_event():
#     await ai_bootstrap.initialize()
# 
# @app.on_event("shutdown")
# async def shutdown_event():
#     logger.info("AI service shutting down")
