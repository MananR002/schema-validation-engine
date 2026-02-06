# Schema Validation Engine

Node.js based data quality intelligence engine for analyzing datasets and producing insights on schema validation, completeness, anomalies, and quality scores.

## What problem does this solve?

This engine solves common data quality challenges in datasets (e.g., from CSVs, APIs, DBs) by providing modular, extensible analysis: detects schema issues, measures completeness, flags anomalies, scores quality, and generates actionable recommendations/summaries. It helps ensure reliable data for analytics/ML without manual checks, with configurable thresholds for pass/fail.

## Installation

```bash
npm install
# (includes dev deps for TS, tests, demo)
```

## Project Structure

```
schema-validation-engine/
├── src/
│   ├── core/
│   │   ├── Engine.ts          # Core engine implementation
│   │   └── interfaces.ts      # Module interfaces
│   ├── types/
│   │   └── data-quality.ts    # Shared type definitions
│   ├── validators/
│   │   └── SchemaValidator.ts # Schema validation module
│   ├── analyzers/
│   │   ├── CompletenessAnalyzer.ts
│   │   ├── AnomalyDetector.ts # Anomaly detection
│   │   └── RecordAnalyzer.ts
│   ├── scorers/
│   │   └── QualityScorer.ts   # Scoring module
│   └── summarizers/
│       └── DatasetSummaryGenerator.ts # High-level summary from report
├── examples/
│   ├── data/                  # Sample datasets/schemas (JSON)
│   ├── basic-usage.ts
│   └── demo.ts                # Full demo script
├── tests/
├── package.json
└── tsconfig.json
```

## Usage

### Basic Setup
1. `npm install`
2. `npm run build` (compiles TS)
3. Run: `npm run example` (basic) or `npm run demo` (full with samples)

### Demo Script
`examples/demo.ts` loads JSON dataset/schema, runs analysis (with thresholds), prints summary + formatted report.

## Core Engine Interface

The `DataQualityEngine` class provides a unified interface for data quality analysis. It supports registration of custom modules for independent evolution of validation, analysis, and scoring components.

### Usage Example

```typescript
import { DataQualityEngine, Dataset, Schema } from './src';

// Create engine with defaults
const engine = new DataQualityEngine();

// Sample dataset
const dataset: Dataset = {
  records: [
    { id: 1, name: 'Alice', age: 30 },
    { id: 2, name: 'Bob', age: null }
  ]
};

// Optional schema
const schema: Schema = {
  fields: [
    { name: 'id', type: 'number', required: true },
    { name: 'name', type: 'string', required: true },
    { name: 'age', type: 'number', required: false }
  ]
};

// Analyze
const report = engine.analyze(dataset, schema);
console.log(report);
```

## Modularity

- **Validators**: Implement `SchemaValidator` interface
- **Analyzers**: Implement `CompletenessAnalyzer` or `AnomalyDetector`
- **Scorers**: Implement `QualityScorer`
- Register custom implementations via engine methods for extensibility

## Example Dataset, Schema, and Report Output

**Example Dataset:**
```typescript
const dataset: Dataset = {
  records: [
    { id: 1, name: 'Alice', age: 30, email: 'alice@example.com' },
    { id: 2, name: 'Bob', age: null, email: undefined }
  ],
  name: 'users'
};
```

**Example Schema:**
```typescript
const schema: Schema = {
  fields: [
    { name: 'id', type: 'number', required: true },
    { name: 'name', type: 'string', required: true },
    { name: 'age', type: 'number', required: false },
    { name: 'email', type: 'string', required: false }
  ]
};
```

**Example Report Output** (structured JSON from `engine.analyze(dataset, schema)`):
```json
{
  "schemaValidation": {
    "isValid": false,
    "errors": [...],
    "missingFields": ["age"],
    "typeMismatches": [],
    "severityCategories": { "low": 0, "medium": 2, "high": 0 },
    "frequentFailingFields": [{ "field": "age", "errorCount": 2 }],
    "recommendations": ["Review top failing field: age", "Add missing required fields..."]
  },
  "completeness": { "overallCompleteness": 0.75, "fieldCompleteness": {...}, "recordCompleteness": [1, 0.5], "missingValues": {...} },
  "anomalies": { "overallAnomalyScore": 0.25, "anomalies": [...], "suspiciousRecords": [1] },
  "qualityScore": { "overallScore": 75, "categoryScores": {...}, "insights": ["Review top failing...", "Low data completeness"] },
  "recordAnalysis": { "totalRecords": 2, "validRecords": 1, "invalidRecords": 1, "errorSummary": { "required:age": 1 }, "qualityScore": 50 },
  "summary": { "totalRecordsAnalyzed": 2, "totalErrorsFound": 2, "overallQualityScore": 75, "topFailingFields": [{ "field": "age", "errorCount": 2 }] },
  "metadata": { "recordCount": 2, "fieldCount": 4, "analysisTimestamp": "..." }
}
```

Full analysis logic to be implemented in subsequent phases.
