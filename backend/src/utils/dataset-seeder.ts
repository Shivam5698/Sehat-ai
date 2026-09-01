import { datasetService } from '../services/dataset.service.js';

/**
 * Dataset Seeder
 * Populates the database with medical datasets from external sources
 * This runs on startup to ensure datasets are available for the AI service
 */

// Sample seed data for medical datasets
// In production, these would be fetched from external APIs/databases
const SEED_DATASETS = {
  // Symptom-Disease mapping dataset
  'symptom-disease-mapping': {
    name: 'symptom-disease-mapping',
    category: 'symptom-disease',
    description: 'Mapping of symptoms to potential diseases',
    language: 'en',
    source: 'internal-knowledge-base',
    data: [
      {
        symptom: 'fever',
        commonDiseases: ['influenza', 'covid-19', 'malaria', 'dengue'],
        severity: 'medium',
      },
      {
        symptom: 'cough',
        commonDiseases: ['common-cold', 'bronchitis', 'pneumonia', 'covid-19'],
        severity: 'medium',
      },
      {
        symptom: 'chest pain',
        commonDiseases: ['heart-attack', 'angina', 'pulmonary-embolism', 'pneumonia'],
        severity: 'high',
        emergency: true,
      },
      {
        symptom: 'shortness of breath',
        commonDiseases: ['asthma', 'pneumonia', 'heart-failure', 'pulmonary-embolism'],
        severity: 'high',
        emergency: true,
      },
    ],
  },

  // Emergency cases dataset
  'emergency-protocols': {
    name: 'emergency-protocols',
    category: 'emergency-cases',
    description: 'Emergency medical protocols and response guidelines',
    language: 'en',
    source: 'medical-standards',
    data: [
      {
        condition: 'cardiac-arrest',
        symptoms: ['unconsciousness', 'no-pulse', 'no-breathing'],
        protocol: 'immediate-cpr',
        responseTime: '< 5 minutes',
      },
      {
        condition: 'severe-allergic-reaction',
        symptoms: ['difficulty-breathing', 'swelling', 'anaphylaxis'],
        protocol: 'epinephrine-injection',
        responseTime: '< 10 minutes',
      },
      {
        condition: 'acute-stroke',
        symptoms: ['facial-drooping', 'arm-weakness', 'speech-difficulty'],
        protocol: 'emergency-scan-treatment',
        responseTime: '< 3 hours window',
      },
    ],
  },

  // Severity classification dataset
  'severity-levels': {
    name: 'severity-levels',
    category: 'severity-classification',
    description: 'Medical severity classification and scoring',
    language: 'en',
    source: 'medical-standards',
    data: [
      {
        level: 'low',
        score: '0-30',
        description: 'Minor symptoms, can be managed with home care',
        recommendation: 'self-care',
      },
      {
        level: 'medium',
        score: '31-60',
        description: 'Moderate symptoms requiring medical attention',
        recommendation: 'clinic-visit',
      },
      {
        level: 'high',
        score: '61-85',
        description: 'Severe symptoms requiring urgent care',
        recommendation: 'urgent-care-center',
      },
      {
        level: 'critical',
        score: '86-100',
        description: 'Life-threatening condition requiring emergency intervention',
        recommendation: 'emergency-room',
      },
    ],
  },

  // Medicine safety dataset
  'medicine-interactions': {
    name: 'medicine-interactions',
    category: 'medicine-safety',
    description: 'Drug interactions and safety information',
    language: 'en',
    source: 'pharmacological-database',
    data: [
      {
        drug: 'aspirin',
        interactions: ['ibuprofen', 'warfarin'],
        sideEffects: ['bleeding', 'stomach-upset'],
        warnings: 'do-not-combine-with-nsaids',
      },
      {
        drug: 'paracetamol',
        interactions: [],
        sideEffects: ['liver-damage-if-overdose'],
        warnings: 'limit-daily-dose',
      },
    ],
  },

  // Doctor specialization dataset
  'doctor-specializations': {
    name: 'doctor-specializations',
    category: 'doctor-specialization',
    description: 'Medical specializations and their focus areas',
    language: 'en',
    source: 'medical-standards',
    data: [
      {
        specialization: 'cardiology',
        focus: ['heart-disease', 'hypertension', 'arrhythmia'],
        expertise: 'cardiovascular-system',
      },
      {
        specialization: 'neurology',
        focus: ['stroke', 'seizures', 'migraines'],
        expertise: 'nervous-system',
      },
      {
        specialization: 'pulmonology',
        focus: ['asthma', 'pneumonia', 'copd'],
        expertise: 'respiratory-system',
      },
      {
        specialization: 'emergency-medicine',
        focus: ['trauma', 'acute-illness', 'life-threatening'],
        expertise: 'emergency-response',
      },
    ],
  },

  // Clinical guidelines dataset
  'clinical-guidelines': {
    name: 'clinical-guidelines',
    category: 'clinical-guidelines',
    description: 'Evidence-based clinical practice guidelines',
    language: 'en',
    source: 'medical-standards',
    data: [
      {
        condition: 'hypertension',
        threshold: '> 140/90 mmHg',
        treatment: 'lifestyle-modification-medication',
        monitoring: 'regular-bp-checks',
      },
      {
        condition: 'diabetes',
        threshold: 'fasting-glucose > 126 mg/dL',
        treatment: 'medication-diet-exercise',
        monitoring: 'hba1c-testing',
      },
    ],
  },
};

/**
 * Seed datasets into the database
 */
export async function seedDatasets() {
  try {
    console.log('[DatasetSeeder] Starting dataset population...');

    const results = {
      created: 0,
      updated: 0,
      failed: 0,
    };

    for (const [key, datasetPayload] of Object.entries(SEED_DATASETS)) {
      try {
        const dataset = await datasetService.upsertDataset(datasetPayload as any);
        console.log(`[DatasetSeeder] ✓ Processed dataset: ${key}`);
        
        // Track if this was a create or update
        // This is simplified - in production, you'd check the actual operation
        results.created++;
      } catch (error) {
        console.error(`[DatasetSeeder] ✗ Failed to seed ${key}:`, error);
        results.failed++;
      }
    }

    console.log('[DatasetSeeder] Seeding completed:', results);
    return results;
  } catch (error) {
    console.error('[DatasetSeeder] Fatal error during seeding:', error);
    throw error;
  }
}

/**
 * Optional: Fetch datasets from external sources (Hugging Face, GitHub, etc.)
 * This is a placeholder for future enhancement
 */
export async function fetchExternalDatasets() {
  // Example: Fetch from Hugging Face, GitHub, or other medical datasets
  // This would replace or supplement SEED_DATASETS
  console.log('[DatasetSeeder] External dataset fetching not yet implemented');
  
  // TODO: Implement external data source integration
  // Examples:
  // - Hugging Face medical datasets
  // - WHO guidelines API
  // - PubMed datasets
  // - Open medical knowledge bases
}
