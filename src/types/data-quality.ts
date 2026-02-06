export interface DataRecord {
  [key: string]: any;
}

export interface Dataset {
  records: DataRecord[];
  name?: string;
}

export interface SchemaField {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'object' | 'array';
  required?: boolean;
  format?: string;
}

export interface Schema {
  fields: SchemaField[];
  name?: string;
}

export interface SchemaValidationResult {
  isValid: boolean;
  errors: Array<{
    field: string;
    message: string;
    recordIndex?: number;
  }>;
  missingFields: string[];
  typeMismatches: Array<{
    field: string;
    expectedType: string;
    actualType: string;
    recordIndex?: number;
  }>;
  // Error intelligence extension
  severityCategories: {
    low: number;
    medium: number;
    high: number;
  };
  frequentFailingFields: Array<{
    field: string;
    errorCount: number;
  }>;
  recommendations: string[];
}

export interface CompletenessMetrics {
  overallCompleteness: number;
  fieldCompleteness: Record<string, number>;
  recordCompleteness: number[];
  missingValues: Record<string, number>;
}

export interface AnomalyIndicators {
  overallAnomalyScore: number;
  anomalies: Array<{
    recordIndex: number;
    field: string;
    type: 'outlier' | 'unexpected' | 'inconsistent';
    severity: 'low' | 'medium' | 'high';
    message: string;
    value?: any;
  }>;
  suspiciousRecords: number[];
}

export interface QualityScore {
  overallScore: number;
  categoryScores: {
    schema: number;
    completeness: number;
    anomalies: number;
  };
  insights: string[];
}

export interface DataQualityReport {
  schemaValidation: SchemaValidationResult;
  completeness: CompletenessMetrics;
  anomalies: AnomalyIndicators;
  qualityScore: QualityScore;
  recordAnalysis?: RecordValidationAnalysis;
  summary?: DatasetSummary;
  qualityStatus: 'pass' | 'warn' | 'fail'; // based on thresholds
  metadata: {
    recordCount: number;
    fieldCount: number;
    analysisTimestamp: Date;
  };
}

export interface RecordValidationAnalysis {
  totalRecords: number;
  validRecords: number;
  invalidRecords: number;
  errorSummary: Record<string, number>; // e.g. 'type:id': 2, 'required:name': 3
  qualityScore: number; // percentage based on valid records
}

export interface DatasetSummary {
  totalRecordsAnalyzed: number;
  totalErrorsFound: number;
  overallQualityScore: number;
  topFailingFields: Array<{
    field: string;
    errorCount: number;
  }>;
}

export interface ThresholdConfig {
  minQualityScoreForPass?: number; // e.g. 70 for pass
  errorPercentageWarningLevel?: number; // e.g. 20% errors triggers warning
}
