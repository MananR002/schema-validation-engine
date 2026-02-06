import { Dataset, Schema, SchemaValidationResult } from '../types/data-quality';
import { SchemaValidator as ISchemaValidator } from '../core/interfaces';

export class CustomSchemaValidator implements ISchemaValidator {
  validate(dataset: Dataset, schema: Schema): SchemaValidationResult {
    const errors: Array<{field: string; message: string; recordIndex?: number}> = [];
    const missingFields: string[] = [];
    const typeMismatches: Array<{field: string; expectedType: string; actualType: string; recordIndex?: number}> = [];
    const schemaFields = new Set(schema.fields.map(f => f.name));

    if (dataset.records.length === 0) {
      return {
        isValid: true,
        errors: [],
        missingFields: [],
        typeMismatches: [],
        severityCategories: { low: 0, medium: 0, high: 0 },
        frequentFailingFields: [],
        recommendations: []
      };
    }

    schema.fields.forEach(field => {
      const isRequired = field.required !== false;
      let fieldMissing = false;

      dataset.records.forEach((record, index) => {
        const value = record[field.name];
        // Strict hasValue: exclude null/undef/empty strings for required
        const hasValue = value !== undefined && value !== null &&
                        !(typeof value === 'string' && value.trim() === '');

        if (isRequired && !hasValue) {
          if (!fieldMissing) {
            missingFields.push(field.name);
            fieldMissing = true;
          }
          errors.push({
            field: field.name,
            message: `Missing required field`,
            recordIndex: index
          });
        }

        if (hasValue) {
          const actualType = this.getType(value);
          if (actualType !== field.type) {
            typeMismatches.push({
              field: field.name,
              expectedType: field.type,
              actualType,
              recordIndex: index
            });
            errors.push({
              field: field.name,
              message: `Type mismatch`,
              recordIndex: index
            });
          }
        }
      });
    });

    const isValid = errors.length === 0 && missingFields.length === 0 && typeMismatches.length === 0;

    const { severityCategories, frequentFailingFields, recommendations } = this.generateErrorIntelligence(errors);

    return {
      isValid,
      errors,
      missingFields,
      typeMismatches,
      severityCategories,
      frequentFailingFields,
      recommendations
    };
  }

  private getType(value: any): string {
    if (value === null || value === undefined) return 'null';
    if (Array.isArray(value)) return 'array';
    if (value instanceof Date) return 'date';
    return typeof value;
  }

  private generateErrorIntelligence(errors: Array<{field: string; message: string; recordIndex?: number}>) {
    const severityCategories = { low: 0, medium: 0, high: 0 };
    const fieldErrorCount: Record<string, number> = {};
    const recommendations: string[] = [];

    errors.forEach(error => {
      let severity: 'low' | 'medium' | 'high' = 'medium';
      if (error.message.includes('Type mismatch')) {
        severity = 'high';
      } else if (error.message.includes('Missing')) {
        severity = 'medium';
      }
      severityCategories[severity]++;

      fieldErrorCount[error.field] = (fieldErrorCount[error.field] || 0) + 1;
    });

    const frequentFailingFields = Object.entries(fieldErrorCount)
      .map(([field, errorCount]) => ({ field, errorCount }))
      .sort((a, b) => b.errorCount - a.errorCount)
      .slice(0, 5);

    if (frequentFailingFields.length > 0) {
      recommendations.push(`Review top failing field: ${frequentFailingFields[0].field}`);
    }
    if (severityCategories.high > 0) {
      recommendations.push('Fix type mismatches by ensuring data conforms to schema');
    }
    if (severityCategories.medium > 0) {
      recommendations.push('Add missing required fields or make them optional in schema');
    }
    if (recommendations.length === 0) {
      recommendations.push('Dataset meets schema requirements');
    }

    return { severityCategories, frequentFailingFields, recommendations };
  }
}
