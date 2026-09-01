import { prisma } from '../database/client.js';

export interface CreateDatasetPayload {
  name: string;
  category: string;
  description?: string;
  language?: string;
  data: unknown[];
  source?: string;
}

export class DatasetService {
  /**
   * Create or update a dataset
   */
  async upsertDataset(payload: CreateDatasetPayload) {
    const dataJson = JSON.stringify(payload.data);
    
    const dataset = await prisma.dataset.upsert({
      where: { name: payload.name },
      create: {
        name: payload.name,
        category: payload.category,
        description: payload.description || '',
        language: payload.language || 'en',
        data: dataJson,
        source: payload.source || '',
        recordCount: payload.data.length,
      },
      update: {
        data: dataJson,
        recordCount: payload.data.length,
        updatedAt: new Date(),
      },
    });

    return dataset;
  }

  /**
   * Get all datasets
   */
  async getAllDatasets() {
    return await prisma.dataset.findMany({
      select: {
        id: true,
        name: true,
        category: true,
        description: true,
        language: true,
        recordCount: true,
        source: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get datasets by category
   */
  async getDatasetsByCategory(category: string) {
    return await prisma.dataset.findMany({
      where: { category },
      select: {
        id: true,
        name: true,
        category: true,
        description: true,
        language: true,
        recordCount: true,
        source: true,
      },
    });
  }

  /**
   * Get a single dataset with full data
   */
  async getDataset(id: string) {
    const dataset = await prisma.dataset.findUnique({
      where: { id },
    });

    if (!dataset) {
      return null;
    }

    // Parse JSON data
    return {
      id: dataset.id,
      name: dataset.name,
      category: dataset.category,
      description: dataset.description,
      language: dataset.language,
      records: JSON.parse(dataset.data),
      source: dataset.source,
      recordCount: dataset.recordCount,
      createdAt: dataset.createdAt,
      updatedAt: dataset.updatedAt,
    };
  }

  /**
   * Search datasets by name or category
   */
  async searchDatasets(query: string, category?: string) {
    const where: any = {
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ],
    };

    if (category) {
      where.category = category;
    }

    return await prisma.dataset.findMany({
      where,
      select: {
        id: true,
        name: true,
        category: true,
        description: true,
        language: true,
        recordCount: true,
      },
    });
  }

  /**
   * Delete a dataset
   */
  async deleteDataset(id: string) {
    return await prisma.dataset.delete({
      where: { id },
    });
  }

  /**
   * Get dataset statistics
   */
  async getDatasetStats() {
    const datasets = await prisma.dataset.findMany();
    const categories = new Map<string, number>();
    let totalRecords = 0;

    datasets.forEach((ds) => {
      const count = categories.get(ds.category) || 0;
      categories.set(ds.category, count + 1);
      totalRecords += ds.recordCount;
    });

    return {
      totalDatasets: datasets.length,
      totalRecords,
      categories: Object.fromEntries(categories),
    };
  }
}

export const datasetService = new DatasetService();
