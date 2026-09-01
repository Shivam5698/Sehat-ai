import requests
import json
import logging
from typing import List, Dict, Optional, Any
from datetime import datetime, timedelta

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class DatasetLoaderService:
    """
    Python Dataset Loader Service
    Loads medical datasets from the backend API instead of local files
    Supports caching and graceful fallback
    """
    
    def __init__(self, backend_url: Optional[str] = None):
        """
        Initialize the dataset loader service
        
        Args:
            backend_url: Backend API base URL (default: http://localhost:4000)
        """
        import os
        self.backend_url = backend_url or os.getenv('BACKEND_URL', 'http://localhost:4000')
        self.cache: Dict[str, Dict[str, Any]] = {}
        self.cache_expiry: Dict[str, datetime] = {}
        self.cache_duration = timedelta(hours=1)
    
    def load_all_datasets(self) -> List[Dict[str, Any]]:
        """
        Load all datasets from backend API
        
        Returns:
            List of dataset metadata
        """
        try:
            logger.info(f"[DatasetLoader] Fetching datasets from {self.backend_url}")
            
            response = requests.get(
                f"{self.backend_url}/api/datasets",
                timeout=10,
                headers={'Content-Type': 'application/json'}
            )
            response.raise_for_status()
            
            data = response.json()
            datasets = data.get('datasets', [])
            
            # Cache the datasets
            for ds in datasets:
                self.cache[ds['id']] = ds
                self.cache_expiry[ds['id']] = datetime.now() + self.cache_duration
            
            logger.info(f"[DatasetLoader] Successfully loaded {len(datasets)} datasets")
            return datasets
        
        except requests.RequestException as e:
            logger.error(f"[DatasetLoader] Failed to load datasets: {e}")
            return self._get_from_cache()
    
    def load_dataset(self, dataset_id: str) -> Optional[Dict[str, Any]]:
        """
        Load a specific dataset by ID
        
        Args:
            dataset_id: Dataset ID
            
        Returns:
            Dataset with full data or None
        """
        # Check cache first
        if self._is_cache_valid(dataset_id):
            cached = self.cache.get(dataset_id)
            if cached:
                return cached
        
        try:
            response = requests.get(
                f"{self.backend_url}/api/datasets/{dataset_id}",
                timeout=10
            )
            response.raise_for_status()
            
            data = response.json()
            dataset = data.get('dataset')
            
            if dataset:
                self.cache[dataset_id] = dataset
                self.cache_expiry[dataset_id] = datetime.now() + self.cache_duration
                return dataset
            
            return None
        
        except requests.RequestException as e:
            logger.error(f"[DatasetLoader] Failed to load dataset {dataset_id}: {e}")
            return self.cache.get(dataset_id)
    
    def load_datasets_by_category(self, category: str) -> List[Dict[str, Any]]:
        """
        Load datasets by category
        
        Args:
            category: Dataset category (e.g., 'symptoms', 'diseases', 'emergency-cases')
            
        Returns:
            List of datasets in that category
        """
        try:
            response = requests.get(
                f"{self.backend_url}/api/datasets?category={category}",
                timeout=10
            )
            response.raise_for_status()
            
            data = response.json()
            return data.get('datasets', [])
        
        except requests.RequestException as e:
            logger.error(f"[DatasetLoader] Failed to load datasets for category {category}: {e}")
            return []
    
    def search_datasets(self, query: str, category: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Search datasets
        
        Args:
            query: Search query
            category: Optional category filter
            
        Returns:
            List of matching datasets
        """
        try:
            url = f"{self.backend_url}/api/datasets/search?q={query}"
            if category:
                url += f"&category={category}"
            
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            return data.get('results', [])
        
        except requests.RequestException as e:
            logger.error(f"[DatasetLoader] Failed to search datasets: {e}")
            return []
    
    def get_dataset_stats(self) -> Dict[str, Any]:
        """
        Get dataset statistics
        
        Returns:
            Statistics about loaded datasets
        """
        try:
            response = requests.get(
                f"{self.backend_url}/api/datasets/stats",
                timeout=10
            )
            response.raise_for_status()
            
            data = response.json()
            return data.get('stats', {})
        
        except requests.RequestException as e:
            logger.error(f"[DatasetLoader] Failed to fetch stats: {e}")
            return {}
    
    def seed_datasets(self) -> Dict[str, Any]:
        """
        Trigger dataset seeding on the backend
        
        Returns:
            Seeding result
        """
        try:
            logger.info("[DatasetLoader] Triggering dataset seeding...")
            
            response = requests.post(
                f"{self.backend_url}/api/datasets/seed",
                timeout=30
            )
            response.raise_for_status()
            
            data = response.json()
            logger.info(f"[DatasetLoader] Seeding completed: {data}")
            
            return data.get('result', {})
        
        except requests.RequestException as e:
            logger.error(f"[DatasetLoader] Failed to seed datasets: {e}")
            return {}
    
    def _is_cache_valid(self, dataset_id: str) -> bool:
        """Check if cache entry is still valid"""
        expiry = self.cache_expiry.get(dataset_id)
        return expiry is not None and expiry > datetime.now()
    
    def _get_from_cache(self) -> List[Dict[str, Any]]:
        """Get all cached datasets"""
        return list(self.cache.values())
    
    def clear_cache(self):
        """Clear the cache"""
        self.cache.clear()
        self.cache_expiry.clear()
        logger.info("[DatasetLoader] Cache cleared")


# Singleton instance
dataset_loader_service = DatasetLoaderService()
