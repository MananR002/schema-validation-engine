import { DataQualityEngine, Dataset, Schema } from '../src';

const engine = new DataQualityEngine();

const dataset: Dataset = {
  records: [
    { id: 1, name: 'Alice', email: 'alice@example.com' },
    { id: 2, name: 'Bob', email: null }
  ],
  name: 'sample-dataset'
};

const schema: Schema = {
  fields: [
    { name: 'id', type: 'number', required: true },
    { name: 'name', type: 'string', required: true },
    { name: 'email', type: 'string', required: false }
  ],
  name: 'user-schema'
};

const report = engine.analyze(dataset, schema);
console.dir(report, { depth: null });
