export type HealthCategory =
  | 'insufficient_data'
  | 'nourishment_needed'
  | 'pure_serenity'
  | 'self_care_goal'
  | 'health_priority';

export interface HealthMetricResult {
  bmi: number;
  formattedBmi: string;
  category: HealthCategory;
  status: string;
  color: string;
  badgeBg: string;
  description: string;
}

export interface HealthInputs {
  weight?: string | number | null;
  height?: string | number | null;
}

/**
 * Pure evaluation function for mindful BMI and wellness categorization.
 * Centralizes duplicate calculation and styling across Profile and Progress screens.
 */
export function evaluateHealthMetrics(inputs?: HealthInputs | null): HealthMetricResult | null {
  if (!inputs) return null;

  const rawWeight = typeof inputs.weight === 'number' ? inputs.weight : parseFloat(String(inputs.weight || '0'));
  const rawHeight = typeof inputs.height === 'number' ? inputs.height : parseFloat(String(inputs.height || '0'));

  if (isNaN(rawWeight) || isNaN(rawHeight) || rawWeight <= 0 || rawHeight <= 0) {
    return null;
  }

  // BMI formula: weight (kg) / (height (m) ^ 2)
  const heightInMeters = rawHeight / 100;
  const bmi = rawWeight / (heightInMeters * heightInMeters);

  if (!isFinite(bmi) || bmi <= 0) return null;

  const formattedBmi = bmi.toFixed(1);

  if (bmi < 18.5) {
    return {
      bmi,
      formattedBmi,
      category: 'nourishment_needed',
      status: 'Nourishment Needed',
      color: 'text-blue-500',
      badgeBg: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      description: 'Focus on nourishing nutrition, grounding breaths, and steady vitality.',
    };
  }

  if (bmi < 25) {
    return {
      bmi,
      formattedBmi,
      category: 'pure_serenity',
      status: 'Pure Serenity',
      color: 'text-soft-sage',
      badgeBg: 'bg-soft-sage/10 text-soft-sage border-soft-sage/20',
      description: 'Balanced mind and body in harmonious equilibrium.',
    };
  }

  if (bmi < 30) {
    return {
      bmi,
      formattedBmi,
      category: 'self_care_goal',
      status: 'Self-care Goal',
      color: 'text-amber-500',
      badgeBg: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
      description: 'Daily breathwork and gentle restorative movement support your journey.',
    };
  }

  return {
    bmi,
    formattedBmi,
    category: 'health_priority',
    status: 'Health Priority',
    color: 'text-rose-500',
    badgeBg: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
    description: 'Prioritize mindful stress reduction, cardiovascular breathing, and holistic rest.',
  };
}
