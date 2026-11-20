// data/synthetic/generate.ts
// Script to generate synthetic metrics for the demo

const generateSyntheticData = () => {
  const metrics = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    cohortSize: 500,
    medianTimeToContact: { value: 42, unit: 'days' },
    referralCompletionRate: 0.68,
    falseReassuranceCases: 2,
    equityBreakdown: {
      '25-34': 0.72,
      '35-44': 0.64
    }
  };

  console.log(JSON.stringify(metrics, null, 2));
};

generateSyntheticData();
