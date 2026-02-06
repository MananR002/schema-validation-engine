import { Dataset, Schema, AnomalyIndicators } from '../types/data-quality';
import { AnomalyDetector as IAnomalyDetector } from '../core/interfaces';

export class CustomAnomalyDetector implements IAnomalyDetector {
  detect(dataset: Dataset, schema?: Schema): AnomalyIndicators {
    const anomalies: Array<{
      recordIndex: number;
      field: string;
      type: 'outlier' | 'unexpected' | 'inconsistent';
      severity: 'low' | 'medium' | 'high';
      message: string;
      value?: any;
    }> = [];
    const suspiciousRecords: number[] = [];

    if (dataset.records.length === 0) {
      return { overallAnomalyScore: 0, anomalies: [], suspiciousRecords: [] };
    }

    const fields = schema ? schema.fields.map(f => f.name) : Object.keys(dataset.records[0] || {});

    dataset.records.forEach((record, index) => {
      let recordAnomalies = 0;
      fields.forEach(field => {
        const value = record[field];
        const isMissing = value === undefined || value === null || value === '' ||
                         (typeof value === 'string' && value.trim() === '');

        if (isMissing) {
          anomalies.push({
            recordIndex: index,
            field,
            type: 'inconsistent',
            severity: 'medium',
            message: 'Missing or empty value',
            value
          });
          recordAnomalies++;
        }

        if (typeof value === 'number') {
          if (value < 0 && (field.includes('age') || field.includes('id'))) {
            anomalies.push({
              recordIndex: index,
              field,
              type: 'outlier',
              severity: 'low',
              message: 'Unexpected negative value',
              value
            });
            recordAnomalies++;
          }
          if (value > 1000 && field.includes('age')) {
            anomalies.push({
              recordIndex: index,
              field,
              type: 'outlier',
              severity: 'medium',
              message: 'Unusually high value',
              value
            });
            recordAnomalies++;
          }
        }

        if (schema) {
          const fieldDef = schema.fields.find(f => f.name === field);
          if (fieldDef && fieldDef.type === 'number' && typeof value !== 'number' && value != null) {
            anomalies.push({
              recordIndex: index,
              field,
              type: 'unexpected',
              severity: 'high',
              message: 'Unexpected non-numeric value',
              value
            });
            recordAnomalies++;
          }
        }
      });

      if (recordAnomalies > fields.length / 2) {
        suspiciousRecords.push(index);
      }
    });

    const overallAnomalyScore = anomalies.length > 0 ?
      Math.min(1, anomalies.length / (dataset.records.length * fields.length)) : 0;

    return {
      overallAnomalyScore: Math.round(overallAnomalyScore * 100) / 100,
      anomalies,
      suspiciousRecords
    };
  }
}
