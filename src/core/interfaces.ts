import { Dataset, Schema, SchemaValidationResult, CompletenessMetrics, AnomalyIndicators, QualityScore, DataQualityReport, RecordValidationAnalysis, DatasetSummary } from '../types/data-quality';

export interface SchemaValidator {
  validate(dataset: Dataset, schema: Schema): SchemaValidationResult;
}

export interface CompletenessAnalyzer {
  analyze(dataset: Dataset, schema?: Schema): CompletenessMetrics;
}

export interface AnomalyDetector {
  detect(dataset: Dataset, schema?: Schema): AnomalyIndicators;
}

export interface QualityScorer {
  score(
    schemaResult: SchemaValidationResult,
    completeness: CompletenessMetrics,
    anomalies: AnomalyIndicators
  ): QualityScore;
}

export interface RecordAnalyzer {
  analyze(dataset: Dataset, schema: Schema): RecordValidationAnalysis;
}

export interface DatasetSummaryGenerator {
  generate(report: DataQualityReport): DatasetSummary;
}

export interface DataQualityEngine {
  analyze(dataset: Dataset, schema?: Schema): DataQualityReport;
  registerValidator(validator: SchemaValidator): void;
  registerAnalyzer(analyzer: CompletenessAnalyzer): void;
  registerDetector(detector: AnomalyDetector): void;
  registerScorer(scorer: QualityScorer): void;
  registerRecordAnalyzer(analyzer: RecordAnalyzer): void;
  registerSummaryGenerator(generator: DatasetSummaryGenerator): void;
  getReport(): DataQualityReport | null;
}
