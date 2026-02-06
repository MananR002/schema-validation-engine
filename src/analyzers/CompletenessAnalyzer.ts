import { Dataset, Schema, CompletenessMetrics } from '../types/data-quality';
import { CompletenessAnalyzer as ICompletenessAnalyzer } from '../core/interfaces';

export class CustomCompletenessAnalyzer implements ICompletenessAnalyzer {
  analyze(dataset: Dataset, schema?: Schema): CompletenessMetrics {
    if (dataset.records.length === 0) {
      return {
        overallCompleteness: 1,
        fieldCompleteness: {},
        recordCompleteness: [],
        missingValues: {}
      };
    }

    const fields = schema ? schema.fields.map(f => f.name) : Object.keys(dataset.records[0] || {});
    const totalRecords = dataset.records.length;
    const fieldMissing: Record<string, number> = {};
    const recordMissing: number[] = [];
    let totalMissing = 0;

    fields.forEach(field => {
      fieldMissing[field] = 0;
    });

    dataset.records.forEach(record => {
      let recordMiss = 0;
      fields.forEach(field => {
        const value = record[field];
        const isMissing = value === undefined || value === null || value === '' ||
                         (typeof value === 'string' && value.trim() === '');
        if (isMissing) {
          fieldMissing[field]++;
          recordMiss++;
          totalMissing++;
        }
      });
      recordMissing.push((fields.length - recordMiss) / fields.length);
    });

    const fieldCompleteness: Record<string, number> = {};
    const missingValues: Record<string, number> = {};
    fields.forEach(field => {
      const missCount = fieldMissing[field] || 0;
      fieldCompleteness[field] = totalRecords > 0 ? (1 - missCount / totalRecords) : 1;
      missingValues[field] = missCount;
    });

    const overallCompleteness = totalRecords > 0 && fields.length > 0 ?
      (1 - totalMissing / (totalRecords * fields.length)) : 1;

    return {
      overallCompleteness: Math.round(overallCompleteness * 100) / 100,
      fieldCompleteness,
      recordCompleteness: recordMissing,
      missingValues
    };
  }
}
