import { DataQualityReport, DatasetSummary } from '../types/data-quality';
import { DatasetSummaryGenerator as IDatasetSummaryGenerator } from '../core/interfaces';

export class CustomDatasetSummaryGenerator implements IDatasetSummaryGenerator {
  generate(report: DataQualityReport): DatasetSummary {
    const totalRecordsAnalyzed = report.metadata.recordCount;
    const totalErrorsFound = report.schemaValidation.errors.length;

    const topFailingFields = report.schemaValidation.frequentFailingFields.slice(0, 3);

    return {
      totalRecordsAnalyzed,
      totalErrorsFound,
      overallQualityScore: report.qualityScore.overallScore,
      topFailingFields
    };
  }
}
