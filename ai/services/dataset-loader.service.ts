import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

export interface RemoteDataset {
  id: string;
  name: string;
  category: string;
  description: string;
  language: string;
  records: unknown[];
  source: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * DatasetLoaderService
 * Loads medical datasets from backend API instead of local files
 * Supports caching and fallback to local files if API is unavailable
 */
export class DatasetLoaderService {
  private backendUrl: string;
  private cache = new Map<string, RemoteDataset>();
  private cacheExpiry = new Map<string, number>();
  private readonly CACHE_DURATION = 60 * 60 * 1000; // 1 hour

  constructor(backendUrl?: string) {
    this.backendUrl = backendUrl || process.env.BACKEND_URL || 'http://localhost:4000';
  }

  /**
   * Load all datasets from backend
   */
  async loadAllDatasets(): Promise<RemoteDataset[]> {
    try {
      console.log(`[DatasetLoader] Fetching datasets from ${this.backendUrl}`);
      
      const response = await axios.get(`${this.backendUrl}/api/datasets`, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        }
      });

      const datasets: RemoteDataset[] = response.data.datasets || [];
      
      // Cache the datasets
      datasets.forEach(ds => {
        this.cache.set(ds.id, ds);
        this.cacheExpiry.set(ds.id, Date.now() + this.CACHE_DURATION);
      });

      console.log(`[DatasetLoader] Successfully loaded ${datasets.length} datasets`);
      return datasets;
    } catch (error) {
      console.error(`[DatasetLoader] Failed to load datasets from backend:`, error);
      return this.getFromCache();
    }
  }

  /**
   * Load a specific dataset by ID or category
   */
  async loadDataset(datasetId: string): Promise<RemoteDataset | null> {
    // Check cache first
    if (this.isCacheValid(datasetId)) {
      return this.cache.get(datasetId) || null;
    }

    try {
      const response = await axios.get(
        `${this.backendUrl}/api/datasets/${datasetId}`,
        { timeout: 10000 }
      );

      const dataset: RemoteDataset = response.data.dataset;
      this.cache.set(datasetId, dataset);
      this.cacheExpiry.set(datasetId, Date.now() + this.CACHE_DURATION);
      
      return dataset;
    } catch (error) {
      console.error(`[DatasetLoader] Failed to load dataset ${datasetId}:`, error);
      return this.cache.get(datasetId) || null;
    }
  }

  /**
   * Load datasets by category (e.g., 'symptoms', 'diseases', 'emergency-cases')
   */
  async loadDatasetsByCategory(category: string): Promise<RemoteDataset[]> {
    try {
      const response = await axios.get(
        `${this.backendUrl}/api/datasets?category=${category}`,
        { timeout: 10000 }
      );

      return response.data.datasets || [];
    } catch (error) {
      console.error(`[DatasetLoader] Failed to load datasets for category ${category}:`, error);
      return [];
    }
  }

  /**
   * Get cached datasets
   */
  private getFromCache(): RemoteDataset[] {
    return Array.from(this.cache.values());
  }

  /**
   * Check if cache entry is still valid
   */
  private isCacheValid(datasetId: string): boolean {
    const expiry = this.cacheExpiry.get(datasetId);
    return expiry !== undefined && expiry > Date.now();
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
    this.cacheExpiry.clear();
    console.log('[DatasetLoader] Cache cleared');
  }

  /**
   * Sync datasets from external sources (seed operation)
   * This is called during startup to populate the database
   */
  async seedDatasetsFromExternalSources(): Promise<void> {
    try {
      console.log('[DatasetLoader] Starting dataset seeding process...');
      
      const response = await axios.post(
        `${this.backendUrl}/api/datasets/seed`,
        {},
        { timeout: 30000 }
      );

      console.log('[DatasetLoader] Seeding completed:', response.data);
    } catch (error) {
      console.error('[DatasetLoader] Failed to seed datasets:', error);
      // This is non-critical, so we don't throw
    }
  }
}

// Singleton instance
export const datasetLoaderService = new DatasetLoaderService();
