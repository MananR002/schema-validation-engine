import { DataQualityEngine, Dataset, Schema } from '../src';

describe('DataQualityEngine', () => {
  let engine: DataQualityEngine;

  beforeEach(() => {
    engine = new DataQualityEngine();
  });

  it('handles valid dataset', () => {
    const dataset: Dataset = {
      records: [
        { id: 1, name: 'Alice', age: 30 },
        { id: 2, name: 'Bob', age: 25 }
      ]
    };
    const schema: Schema = {
      fields: [
        { name: 'id', type: 'number', required: true },
        { name: 'name', type: 'string', required: true },
        { name: 'age', type: 'number', required: true }
      ]
    };
    const report = engine.analyze(dataset, schema);
    expect(report.schemaValidation.isValid).toBe(true);
    expect(report.schemaValidation.errors.length).toBe(0);
    expect(report.schemaValidation.severityCategories.low).toBe(0);
    expect(report.schemaValidation.recommendations[0]).toContain('meets schema');
    expect(report.completeness.overallCompleteness).toBe(1);
    expect(report.anomalies.anomalies.length).toBe(0);
    expect(report.recordAnalysis?.validRecords).toBe(2);
    expect(report.recordAnalysis?.qualityScore).toBe(100);
    expect(report.summary?.totalRecordsAnalyzed).toBe(2);
    expect(report.summary?.totalErrorsFound).toBe(0);
    expect(report.summary?.overallQualityScore).toBe(100);
    expect(report.qualityStatus).toBe('pass');
  });

  it('detects missing required fields', () => {
    const dataset: Dataset = {
      records: [
        { id: 1, name: 'Alice' },
        { id: 2, name: null }
      ]
    };
    const schema: Schema = {
      fields: [
        { name: 'id', type: 'number', required: true },
        { name: 'name', type: 'string', required: true },
        { name: 'age', type: 'number', required: true }
      ]
    };
    const report = engine.analyze(dataset, schema);
    expect(report.schemaValidation.isValid).toBe(false);
    expect(report.schemaValidation.missingFields).toContain('age');
    expect(report.schemaValidation.severityCategories.medium).toBeGreaterThan(0);
    expect(report.schemaValidation.frequentFailingFields.length).toBeGreaterThan(0);
    expect(report.schemaValidation.recommendations.length).toBeGreaterThan(0);
    expect(report.recordAnalysis?.invalidRecords).toBe(2);
    expect(report.recordAnalysis?.qualityScore).toBe(0);
    expect(report.qualityStatus).toBe('warn');
  });

  it('detects wrong type fields', () => {
    const dataset: Dataset = {
      records: [
        { id: '1', name: 'Alice', age: '30' },
        { id: 2, name: 'Bob', age: 25 }
      ]
    };
    const schema: Schema = {
      fields: [
        { name: 'id', type: 'number', required: true },
        { name: 'name', type: 'string', required: true },
        { name: 'age', type: 'number', required: true }
      ]
    };
    const report = engine.analyze(dataset, schema);
    expect(report.schemaValidation.typeMismatches.length).toBeGreaterThan(0);
    expect(report.schemaValidation.isValid).toBe(false);
    expect(report.schemaValidation.severityCategories.high).toBeGreaterThan(0);
    expect(report.schemaValidation.recommendations.length).toBeGreaterThan(0);
    expect(report.qualityStatus).toBe('warn');
  });

  it('handles mixed dataset', () => {
    const dataset: Dataset = {
      records: [
        { id: 1, name: 'Alice', age: 30, email: 'valid@example.com' },
        { id: 2, name: '', age: null, email: undefined },
        { id: '3', name: 'Bob', age: 'invalid' }
      ]
    };
    const schema: Schema = {
      fields: [
        { name: 'id', type: 'number', required: true },
        { name: 'name', type: 'string', required: true },
        { name: 'age', type: 'number', required: false },
        { name: 'email', type: 'string', required: false }
      ]
    };
    const report = engine.analyze(dataset, schema);
    expect(report.schemaValidation.errors.length).toBeGreaterThan(0);
    expect(report.completeness.overallCompleteness).toBeLessThan(1);
    expect(report.recordAnalysis?.validRecords).toBe(1);
    expect(report.recordAnalysis?.errorSummary).toHaveProperty('required:name'); // from empty string
    expect(report.recordAnalysis?.errorSummary).toHaveProperty('type:id');
    expect(report.recordAnalysis?.errorSummary).toHaveProperty('type:age'); // from string in optional num field
    expect(report.qualityStatus).toBe('warn');
  });

  it('uses default thresholds for quality status', () => {
    // covered in other tests via beforeEach default engine
    const dataset: Dataset = { records: [{ id: 1, name: 'ok' }] };
    const schema: Schema = { fields: [{ name: 'id', type: 'number', required: true }, { name: 'name', type: 'string', required: true }] };
    const report = engine.analyze(dataset, schema);
    expect(report.qualityStatus).toBe('pass');
  });

  it('applies custom thresholds for pass/warn/fail', () => {
    const customEngine = new DataQualityEngine(undefined, undefined, undefined, undefined, undefined, undefined, {
      minQualityScoreForPass: 90,
      errorPercentageWarningLevel: 10
    });
    const dataset: Dataset = {
      records: [{ id: 1, name: 'Alice', age: 30 }]
    };
    const schema: Schema = {
      fields: [
        { name: 'id', type: 'number', required: true },
        { name: 'name', type: 'string', required: true },
        { name: 'age', type: 'number', required: true }
      ]
    };
    const report = customEngine.analyze(dataset, schema);
    expect(report.qualityStatus).toBe('pass'); // high score, low errors

    // Test fail case with custom low threshold + high errors
    const lowScoreEngine = new DataQualityEngine(undefined, undefined, undefined, undefined, undefined, undefined, { minQualityScoreForPass: 95 });
    const failDataset: Dataset = { records: [{ id: 'bad', name: null }] };
    const failSchema: Schema = { fields: [{ name: 'id', type: 'number', required: true }, { name: 'name', type: 'string', required: true }] };
    const failReport = lowScoreEngine.analyze(failDataset, failSchema);
    expect(failReport.qualityStatus).toBe('fail');
  });
});
