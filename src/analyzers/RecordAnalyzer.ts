import { Dataset, Schema, RecordValidationAnalysis } from '../types/data-quality';
import { RecordAnalyzer as IRecordAnalyzer } from '../core/interfaces';

export class CustomRecordAnalyzer implements IRecordAnalyzer {
  analyze(dataset: Dataset, schema: Schema): RecordValidationAnalysis {
    const totalRecords = dataset.records.length;
    if (totalRecords === 0) {
      return {
        totalRecords: 0,
        validRecords: 0,
        invalidRecords: 0,
        errorSummary: {},
        qualityScore: 0
      };
    }

    let validRecords = 0;
    const errorSummary: Record<string, number> = {};

    dataset.records.forEach((record, recordIndex) => {
      let recordValid = true;
      schema.fields.forEach(field => {
        const value = record[field.name];
        const isRequired = field.required !== false;
        // Strict hasValue: exclude null/undef/empty strings
        const hasValue = value !== undefined && value !== null &&
                        !(typeof value === 'string' && value.trim() === '');

        if (isRequired && !hasValue) {
          recordValid = false;
          const key = `required:${field.name}`;
          errorSummary[key] = (errorSummary[key] || 0) + 1;
        }

        if (hasValue) {
          const actualType = this.getType(value);
          if (actualType !== field.type) {
            recordValid = false;
            const key = `type:${field.name}`;
            errorSummary[key] = (errorSummary[key] || 0) + 1;
          }
        }
      });

      if (recordValid) {
        validRecords++;
      }
    });

    const invalidRecords = totalRecords - validRecords;
    const qualityScore = totalRecords > 0 ? Math.round((validRecords / totalRecords) * 100) : 0;

    return {
      totalRecords,
      validRecords,
      invalidRecords,
      errorSummary,
      qualityScore
    };
  }

  private getType(value: any): string {
    if (Array.isArray(value)) return 'array';
    if (value instanceof Date) return 'date';
    return typeof value;
  }
}
