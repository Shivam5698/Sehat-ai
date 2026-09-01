import { Request, Response } from 'express';
import { datasetService } from '../services/dataset.service.js';
import { seedDatasets } from '../utils/dataset-seeder.js';

export class DatasetController {
  /**
   * GET /api/datasets
   * Get all datasets with optional category filter
   */
  async getAllDatasets(req: Request, res: Response) {
    try {
      const { category } = req.query;

      let datasets;
      if (category) {
        datasets = await datasetService.getDatasetsByCategory(category as string);
      } else {
        datasets = await datasetService.getAllDatasets();
      }

      res.json({
        success: true,
        count: datasets.length,
        datasets,
      });
    } catch (error) {
      console.error('Error fetching datasets:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch datasets',
      });
    }
  }

  /**
   * GET /api/datasets/:id
   * Get a single dataset with full data
   */
  async getDataset(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const dataset = await datasetService.getDataset(id);

      if (!dataset) {
        return res.status(404).json({
          success: false,
          error: 'Dataset not found',
        });
      }

      res.json({
        success: true,
        dataset,
      });
    } catch (error) {
      console.error('Error fetching dataset:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch dataset',
      });
    }
  }

  /**
   * POST /api/datasets/seed
   * Seed datasets from external sources
   */
  async seedDatasets(req: Request, res: Response) {
    try {
      console.log('[DatasetController] Starting dataset seeding...');
      
      const result = await seedDatasets();

      res.json({
        success: true,
        message: 'Datasets seeded successfully',
        result,
      });
    } catch (error) {
      console.error('Error seeding datasets:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to seed datasets',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /api/datasets/stats
   * Get dataset statistics
   */
  async getStats(req: Request, res: Response) {
    try {
      const stats = await datasetService.getDatasetStats();

      res.json({
        success: true,
        stats,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch stats',
      });
    }
  }

  /**
   * GET /api/datasets/search
   * Search datasets by name or category
   */
  async searchDatasets(req: Request, res: Response) {
    try {
      const { q, category } = req.query;

      if (!q) {
        return res.status(400).json({
          success: false,
          error: 'Query parameter "q" is required',
        });
      }

      const results = await datasetService.searchDatasets(
        q as string,
        category as string | undefined
      );

      res.json({
        success: true,
        count: results.length,
        results,
      });
    } catch (error) {
      console.error('Error searching datasets:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to search datasets',
      });
    }
  }

  /**
   * DELETE /api/datasets/:id
   * Delete a dataset
   */
  async deleteDataset(req: Request, res: Response) {
    try {
      const { id } = req.params;

      await datasetService.deleteDataset(id);

      res.json({
        success: true,
        message: 'Dataset deleted successfully',
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        return res.status(404).json({
          success: false,
          error: 'Dataset not found',
        });
      }

      console.error('Error deleting dataset:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete dataset',
      });
    }
  }
}

export const datasetController = new DatasetController();
