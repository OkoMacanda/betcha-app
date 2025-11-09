import gameRulesData from '@/data/gameRules.json';

export interface RuleInput {
  name: string;
  type: 'number' | 'text' | 'boolean' | 'select';
  default: any;
  min?: number;
  max?: number;
  options?: string[];
  label: string;
  unit?: string;
}

export interface GameRule {
  id: string;
  name: string;
  category: string;
  description: string;
  inputs: RuleInput[];
  win_condition: {
    type: string;
    params: Record<string, any>;
  };
  evidence_required: string[];
  auto_verifiable: boolean;
  typical_duration?: string;
  difficulty?: string;
  popularity?: number;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validate rule structure
 */
export function validateRule(rule: Partial<GameRule>): ValidationResult {
  const errors: string[] = [];

  // Check required fields
  if (!rule.name || rule.name.trim() === '') {
    errors.push('Rule name is required');
  }

  if (!rule.category || rule.category.trim() === '') {
    errors.push('Category is required');
  }

  if (!rule.description || rule.description.trim() === '') {
    errors.push('Description is required');
  }

  if (!rule.win_condition || !rule.win_condition.type) {
    errors.push('Win condition is required');
  }

  if (!rule.evidence_required || rule.evidence_required.length === 0) {
    errors.push('At least one evidence type is required');
  }

  // Validate inputs
  if (rule.inputs) {
    const inputErrors = validateCustomInputs(rule.inputs);
    if (!inputErrors.valid) {
      errors.push(...inputErrors.errors);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Generate natural language description from rule
 */
export function generateRuleDescription(rule: GameRule): string {
  const { win_condition, inputs } = rule;

  let description = '';

  switch (win_condition.type) {
    case 'first_to_score':
      const target = inputs.find((i) => i.name === 'points_to_win')?.default || 21;
      const margin = inputs.find((i) => i.name === 'win_by')?.default || 0;
      description = `First player to score ${target} points${margin > 0 ? ` with a margin of ${margin}` : ''} wins`;
      break;

    case 'most_correct':
      const rounds = inputs.find((i) => i.name === 'rounds')?.default || 10;
      description = `Player with most correct answers out of ${rounds} rounds wins`;
      break;

    case 'fastest_time':
      const distance = inputs.find((i) => i.name === 'distance')?.default;
      description = `Fastest time${distance ? ` over ${distance}km` : ''} wins`;
      break;

    case 'highest_score':
      description = 'Player with highest score at the end wins';
      break;

    case 'most_reps':
      description = 'Player who completes the most repetitions wins';
      break;

    case 'longest_time':
      description = 'Player who holds position longest wins';
      break;

    case 'best_of_games':
      const games = inputs.find((i) => i.name === 'games')?.default || 3;
      description = `Best of ${games} games wins`;
      break;

    default:
      description = rule.description;
  }

  return description;
}

/**
 * Build rule from questionnaire answers
 */
export function buildRuleFromAnswers(
  answers: Record<string, any>
): GameRule {
  const {
    name,
    category,
    description,
    win_condition_type,
    evidence_types,
    auto_verifiable,
    ...inputValues
  } = answers;

  // Build inputs array from provided values
  const inputs: RuleInput[] = Object.entries(inputValues).map(([key, value]) => ({
    name: key,
    type: typeof value === 'number' ? 'number' : 'text',
    default: value,
    label: key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
  }));

  return {
    id: `custom-${Date.now()}`,
    name,
    category,
    description,
    inputs,
    win_condition: {
      type: win_condition_type,
      params: inputValues,
    },
    evidence_required: evidence_types || ['video', 'score_sheet'],
    auto_verifiable: auto_verifiable || false,
    difficulty: 'medium',
    popularity: 50,
  };
}

/**
 * Validate custom rule inputs
 */
export function validateCustomInputs(inputs: RuleInput[]): ValidationResult {
  const errors: string[] = [];

  inputs.forEach((input, index) => {
    if (!input.name || input.name.trim() === '') {
      errors.push(`Input ${index + 1}: name is required`);
    }

    if (!input.type) {
      errors.push(`Input ${index + 1}: type is required`);
    }

    if (input.type === 'number') {
      if (input.min !== undefined && input.max !== undefined && input.min > input.max) {
        errors.push(`Input ${input.name}: min cannot be greater than max`);
      }
    }

    if (input.type === 'select' && (!input.options || input.options.length === 0)) {
      errors.push(`Input ${input.name}: select type requires options`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get rule template by ID
 */
export function getRuleTemplate(templateId: string): GameRule | null {
  const rules = gameRulesData as GameRule[];
  return rules.find((rule) => rule.id === templateId) || null;
}

/**
 * Get all rule templates
 */
export function getAllRuleTemplates(): GameRule[] {
  return gameRulesData as GameRule[];
}

/**
 * Get rules by category
 */
export function getRulesByCategory(category: string): GameRule[] {
  const rules = gameRulesData as GameRule[];
  return rules.filter((rule) => rule.category === category);
}

/**
 * Get available categories
 */
export function getCategories(): string[] {
  const rules = gameRulesData as GameRule[];
  const categories = new Set(rules.map((rule) => rule.category));
  return Array.from(categories);
}

/**
 * Search rules by query
 */
export function searchRules(query: string): GameRule[] {
  const rules = gameRulesData as GameRule[];
  const lowercaseQuery = query.toLowerCase();

  return rules.filter(
    (rule) =>
      rule.name.toLowerCase().includes(lowercaseQuery) ||
      rule.description.toLowerCase().includes(lowercaseQuery) ||
      rule.category.toLowerCase().includes(lowercaseQuery)
  );
}

/**
 * Clone and modify template
 */
export function cloneTemplate(
  templateId: string,
  modifications: Partial<GameRule>
): GameRule | null {
  const template = getRuleTemplate(templateId);
  if (!template) return null;

  return {
    ...template,
    ...modifications,
    id: `custom-${Date.now()}`, // New ID for custom rule
  };
}

/**
 * Get popular rules
 */
export function getPopularRules(limit: number = 10): GameRule[] {
  const rules = gameRulesData as GameRule[];
  return rules
    .filter((rule) => rule.popularity !== undefined)
    .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
    .slice(0, limit);
}

/**
 * Get rules by difficulty
 */
export function getRulesByDifficulty(difficulty: string): GameRule[] {
  const rules = gameRulesData as GameRule[];
  return rules.filter((rule) => rule.difficulty === difficulty);
}

/**
 * Convert rule to JSON for database storage
 */
export function ruleToJSON(rule: GameRule): string {
  return JSON.stringify({
    inputs: rule.inputs,
    win_condition: rule.win_condition,
    evidence_required: rule.evidence_required,
    auto_verifiable: rule.auto_verifiable,
  });
}

/**
 * Parse rule from JSON
 */
export function parseRuleJSON(json: string): Partial<GameRule> {
  try {
    return JSON.parse(json);
  } catch (error) {
    console.error('Failed to parse rule JSON:', error);
    return {};
  }
}

/**
 * Get recommended evidence types for win condition
 */
export function getRecommendedEvidence(winConditionType: string): string[] {
  const evidenceMap: Record<string, string[]> = {
    first_to_score: ['video', 'score_sheet'],
    most_correct: ['score_sheet', 'video'],
    fastest_time: ['video', 'timer', 'gps_track'],
    highest_score: ['score_sheet', 'photo'],
    most_reps: ['video', 'rep_count'],
    longest_time: ['video', 'timer'],
    checkmate_or_resign: ['game_link', 'screenshot'],
    best_of_games: ['score_sheet'],
    yes_no: ['video', 'photo'],
  };

  return evidenceMap[winConditionType] || ['video', 'photo'];
}

/**
 * Estimate challenge duration
 */
export function estimateDuration(rule: GameRule): string {
  if (rule.typical_duration) {
    return rule.typical_duration;
  }

  // Estimate based on win condition and inputs
  const { win_condition, inputs } = rule;

  switch (win_condition.type) {
    case 'first_to_score':
      return '15-45 minutes';
    case 'fastest_time':
      return '5-30 minutes';
    case 'most_correct':
      const rounds = inputs.find((i) => i.name === 'rounds')?.default || 10;
      return `${rounds * 2}-${rounds * 5} minutes`;
    case 'best_of_games':
      return '30-90 minutes';
    default:
      return '15-60 minutes';
  }
}
