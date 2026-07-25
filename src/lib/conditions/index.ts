export {
  DAMAGE_TYPE_OPTIONS,
  CONDITION_OPTIONS,
  EFFECT_OPTIONS,
  CONCENTRATION_EFFECTS,
  CONDITION_IMMUNITY_MAP,
  IRV_OPTIONS,
} from '../irvOptions';

export { isConcentrating, stripConcentrationEffects, isIncapacitating } from '../concentrationCheck';

export {
  CONDITION_MECHANICS,
} from '../conditionMechanicsData';
export {
  buildConditionSummary,
  applyLongRestToConditions,
} from '../conditionDefinitions';
export type { ConditionMechanics } from '../conditionMechanicsData';

export {
  getEffectiveResistances,
  isDamageTypeMatch,
  effectiveAc,
  effectiveMaxHp,
  getHealthStatus,
} from '../combatLogic';

export {
  CONDITION_DESCRIPTIONS,
  getConditionDescription,
} from '../conditionDescriptions';
export type { ConditionDescription } from '../conditionDescriptions';
