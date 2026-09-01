import { Router } from 'express';
import { datasetController } from '../controllers/dataset.controller.js';

export const datasetRouter = Router();

// Get all datasets or filter by category
datasetRouter.get('/', (req, res) => datasetController.getAllDatasets(req, res));

// Get dataset statistics
datasetRouter.get('/stats', (req, res) => datasetController.getStats(req, res));

// Search datasets
datasetRouter.get('/search', (req, res) => datasetController.searchDatasets(req, res));

// Seed datasets from external sources
datasetRouter.post('/seed', (req, res) => datasetController.seedDatasets(req, res));

// Get a single dataset with full data
datasetRouter.get('/:id', (req, res) => datasetController.getDataset(req, res));

// Delete a dataset
datasetRouter.delete('/:id', (req, res) => datasetController.deleteDataset(req, res));
