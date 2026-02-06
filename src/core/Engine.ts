import { Dataset, Schema, DataQualityReport, ThresholdConfig } from '../types/data-quality';
import { SchemaValidator, CompletenessAnalyzer, AnomalyDetector, QualityScorer, DataQualityEngine as IEngine, RecordAnalyzer, DatasetSummaryGenerator } from './interfaces';
import { CustomSchemaValidator } from '../validators/SchemaValidator';
import { CustomCompletenessAnalyzer } from '../analyzers/CompletenessAnalyzer';
import { CustomAnomalyDetector } from '../analyzers/AnomalyDetector';
import { CustomRecordAnalyzer } from '../analyzers/RecordAnalyzer';
import { CustomDatasetSummaryGenerator } from '../summarizers/DatasetSummaryGenerator';
import { CustomQualityScorer } from '../scorers/QualityScorer';

export class DataQualityEngine implements IEngine {
  private validator: SchemaValidator;
  private analyzer: CompletenessAnalyzer;
  private detector: AnomalyDetector;
  private scorer: QualityScorer;
  private recordAnalyzer: RecordAnalyzer;
  private summaryGenerator: DatasetSummaryGenerator;
  private config: ThresholdConfig;
  private lastReport: DataQualityReport | null = null;

  constructor(
    validator?: SchemaValidator,
    analyzer?: CompletenessAnalyzer,
    detector?: AnomalyDetector,
    scorer?: QualityScorer,
    recordAnalyzer?: RecordAnalyzer,
    summaryGenerator?: DatasetSummaryGenerator,
    config?: ThresholdConfig
  ) {
    this.validator = validator || new CustomSchemaValidator();
    this.analyzer = analyzer || new CustomCompletenessAnalyzer();
    this.detector = detector || new CustomAnomalyDetector();
    this.scorer = scorer || new CustomQualityScorer();
    this.recordAnalyzer = recordAnalyzer || new CustomRecordAnalyzer();
    this.summaryGenerator = summaryGenerator || new CustomDatasetSummaryGenerator();
    this.config = {
      minQualityScoreForPass: config?.minQualityScoreForPass ?? 70,
      errorPercentageWarningLevel: config?.errorPercentageWarningLevel ?? 20
    };
  }

  analyze(dataset: Dataset, schema?: Schema): DataQualityReport {
    const inferredSchema = schema || this.inferSchema(dataset);
    const schemaResult = this.validator.validate(dataset, inferredSchema);
    const completeness = this.analyzer.analyze(dataset, inferredSchema);
    const anomalies = this.detector.detect(dataset, inferredSchema);
    const qualityScore = this.scorer.score(schemaResult, completeness, anomalies);
    const recordAnalysis = this.recordAnalyzer.analyze(dataset, inferredSchema);

    const totalRecords = dataset.records.length;
    const totalErrors = schemaResult.errors.length;
    const errorPercentage = totalRecords > 0 ? (totalErrors / totalRecords) * 100 : 0;
    const qualityStatus = this.computeQualityStatus(qualityScore.overallScore, errorPercentage);

    const tempReportForSummary: any = {
      schemaValidation: schemaResult,
      completeness,
      anomalies,
      qualityScore,
      recordAnalysis,
      qualityStatus,
      metadata: {
        recordCount: dataset.records.length,
        fieldCount: inferredSchema.fields.length,
        analysisTimestamp: new Date()
      }
    };
    const summary = this.summaryGenerator.generate(tempReportForSummary);

    const report: DataQualityReport = {
      schemaValidation: schemaResult,
      completeness,
      anomalies,
      qualityScore,
      recordAnalysis,
      summary,
      qualityStatus,
      metadata: {
        recordCount: dataset.records.length,
        fieldCount: inferredSchema.fields.length,
        analysisTimestamp: new Date()
      }
    };

    this.lastReport = report;
    return report;
  }

  private computeQualityStatus(overallScore: number, errorPercentage: number): 'pass' | 'warn' | 'fail' {
    const minPass = this.config.minQualityScoreForPass ?? 70;
    const warnLevel = this.config.errorPercentageWarningLevel ?? 20;
    if (overallScore >= minPass && errorPercentage <= warnLevel) {
      return 'pass';
    } else if (overallScore >= minPass - 40 || errorPercentage <= warnLevel * 3) {
      return 'warn';
    }
    return 'fail';
  }

  registerValidator(validator: SchemaValidator): void {
    this.validator = validator;
  }

  registerAnalyzer(analyzer: CompletenessAnalyzer): void {
    this.analyzer = analyzer;
  }

  registerDetector(detector: AnomalyDetector): void {
    this.detector = detector;
  }

  registerScorer(scorer: QualityScorer): void {
    this.scorer = scorer;
  }

  registerRecordAnalyzer(analyzer: RecordAnalyzer): void {
    this.recordAnalyzer = analyzer;
  }

  registerSummaryGenerator(generator: DatasetSummaryGenerator): void {
    this.summaryGenerator = generator;
  }

  getReport(): DataQualityReport | null {
    return this.lastReport;
  }

  private inferSchema(dataset: Dataset): Schema {
    if (dataset.records.length === 0) {
      return { fields: [] };
    }
    const sample = dataset.records[0];
    const fields = Object.keys(sample).map(key => ({
      name: key,
      type: this.inferType(sample[key]),
      required: true
    }));
    return { fields };
  }

  private inferType(value: any): 'string' | 'number' | 'boolean' | 'date' | 'object' | 'array' {
    if (value === null || value === undefined) return 'string';
    if (Array.isArray(value)) return 'array';
    if (value instanceof Date) return 'date';
    const t = typeof value;
    if (t === 'boolean') return 'boolean';
    if (t === 'number') return 'number';
    if (t === 'object') return 'object';
    return 'string';
  }
}
