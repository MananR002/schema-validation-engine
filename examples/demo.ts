import * as fs from 'fs';
import { DataQualityEngine, Dataset, Schema, ThresholdConfig } from '../src';

const dataset: Dataset = JSON.parse(fs.readFileSync('./examples/data/sample-dataset.json', 'utf-8'));
const schema: Schema = JSON.parse(fs.readFileSync('./examples/data/sample-schema.json', 'utf-8'));

const config: ThresholdConfig = {
  minQualityScoreForPass: 80,
  errorPercentageWarningLevel: 15
};

const engine = new DataQualityEngine(undefined, undefined, undefined, undefined, undefined, undefined, config);
const report = engine.analyze(dataset, schema);

console.log('=== Data Quality Analysis Demo ===');
console.log('Dataset:', dataset.name);
console.log('Records analyzed:', report.metadata.recordCount);
console.log('\nSummary:');
console.dir(report.summary, { depth: null });
console.log('\nQuality Status:', report.qualityStatus);
console.log('Overall Score:', report.qualityScore.overallScore);
console.log('\nRecommendations:', report.schemaValidation.recommendations);
console.log('\nFull Report (key sections):');
console.dir({
  schemaValidation: report.schemaValidation,
  completeness: report.completeness,
  anomalies: report.anomalies,
  recordAnalysis: report.recordAnalysis
}, { depth: 2 });
