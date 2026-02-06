import { SchemaValidationResult, CompletenessMetrics, AnomalyIndicators, QualityScore } from '../types/data-quality';
import { QualityScorer as IQualityScorer } from '../core/interfaces';

export class CustomQualityScorer implements IQualityScorer {
  score(
    schemaResult: SchemaValidationResult,
    completeness: CompletenessMetrics,
    anomalies: AnomalyIndicators
  ): QualityScore {
    const schemaScore = schemaResult.isValid ? 100 : Math.max(0, 100 - (schemaResult.errors.length * 10));
    const completenessScore = Math.round(completeness.overallCompleteness * 100);
    const anomalyScore = Math.max(0, 100 - (anomalies.overallAnomalyScore * 100));
    const overallScore = Math.round((schemaScore + completenessScore + anomalyScore) / 3);

    const insights: string[] = [];
    if (!schemaResult.isValid) insights.push('Schema issues detected');
    schemaResult.recommendations.forEach(rec => insights.push(rec));
    if (completeness.overallCompleteness < 0.8) insights.push('Low data completeness');
    if (anomalies.overallAnomalyScore > 0.2) insights.push('Anomalies present');
    if (overallScore < 70) insights.push('Overall quality needs improvement');

    return {
      overallScore,
      categoryScores: {
        schema: schemaScore,
        completeness: completenessScore,
        anomalies: anomalyScore
      },
      insights
    };
  }
}
