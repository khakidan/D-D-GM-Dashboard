import { z } from 'zod';
import { DEFAULT_ABILITY_SCORES, DEFAULT_PROFICIENCIES } from './abilityScores';

export const CHARACTER_HEADERS = [
  'Player_ID', 'Player_Name', 'Character_Name',
  'AC', 'Max_HP', 'Temp_HP', 'Current_HP',
  'Current_Condition', 'Passive_Perception',
  'Current_Level', 'Status', 'Notes',
  'Resistances', 'Immunities', 'Vulnerabilities',
  'Temp_HP_Max', 'Temp_AC', 'Death_Saves_Fails',
  'Death_Saves_Successes', 'Class',
  'Hit_Dice_Config', 'Hit_Dice_Used', 'Resource_Pools',
  'Ability_Scores', 'Proficiencies', 'Spellcasting_Ability'
] as const;

export const NPC_HEADERS = [
  'NPC_ID', 'NPC_Name', 'AC', 'Max_HP', 'Notes',
  'Resistances', 'Immunities', 'Vulnerabilities',
  'Legendary_Actions', 'Legendary_Resistances',
  'Recharge_Abilities', 'Ability_Scores', 'Proficiencies',
  'Speed', 'Senses', 'Languages', 'Challenge_Rating',
  'Traits', 'Actions', 'Reactions', 'Legendary_Actions_List',
  'Spellcasting_Ability'
] as const;

export const ENCOUNTER_HEADERS = [
  'Encounter_ID', 'Encounter_Name', 'Location',
  'Difficulty', 'NPC_Definitions',
  'Current_Round', 'Active_Turn_ID'
] as const;

export const ENCOUNTER_COMBATANT_HEADERS = [
  'Encounter_Combatants_ID', 'Encounter_ID',
  'Player_ID', 'NPC_ID', 'Quantity', 'Initiative',
  'Condition_Timers', 'NPC_Current_HP',
  'NPC_Temp_HP', 'NPC_Temp_Conditions',
  'NPC_Temp_AC_Mod', 'NPC_Legendary_Actions_Remaining',
  'NPC_Legendary_Resistances_Remaining', 'NPC_Recharge_State'
] as const;

export const ENCOUNTER_LOG_HEADERS = [
  'id', 'encounterId', 'encounterName', 'location', 'date', 'durationRounds', 'outcome', 'partySnapshot', 'events', 'transcript'
] as const;

const idSchema = z
  .any()
  .transform((val) => (val == null ? '' : String(val).trim()))
  .refine((val) => val !== '', { message: 'ID cannot be empty' });

const stringDefault = (fallback: string) =>
  z.any().transform((val) => {
    if (val === '' || val == null) return fallback;
    return String(val);
  });

const nonEmptyString = z
  .any()
  .transform((val) => (val == null ? '' : String(val).trim()))
  .refine((val) => val !== '', { message: 'String cannot be empty' });

const nullDefault = () =>
  z.any().transform((val) => {
    if (val === '' || val == null) return null;
    return String(val);
  });

const coerceNumber = (fallback: number) =>
  z.any().transform((val) => {
    if (val === '' || val == null) return fallback;
    const n = Number(val);
    return Number.isNaN(n) ? fallback : n;
  });

const padRow = (length: number) => (val: unknown) => {
  if (!Array.isArray(val)) return val;
  const arr = [...val];
  while (arr.length < length) arr.push(undefined);
  return arr;
};

export const CharacterRowSchema = z.preprocess(padRow(CHARACTER_HEADERS.length), z.tuple([
  idSchema,                            // [0] id
  stringDefault(''),                   // [1] playerName
  nonEmptyString,                      // [2] characterName
  coerceNumber(10),                    // [3] ac
  coerceNumber(10),                    // [4] maxHp
  coerceNumber(0),                     // [5] tempHp
  coerceNumber(10),                    // [6] currentHp
  stringDefault(''),                   // [7] conditions
  coerceNumber(10),                    // [8] passivePerception
  coerceNumber(1),                     // [9] level
  coerceNumber(1),                     // [10] statusId
  stringDefault(''),                   // [11] notes
  stringDefault(''),                   // [12] resistances
  stringDefault(''),                   // [13] immunities
  stringDefault(''),                   // [14] vulnerabilities
  coerceNumber(0),                     // [15] tempHpMax
  coerceNumber(0),                     // [16] tempAc
  coerceNumber(0),                     // [17] deathSavesFails
  coerceNumber(0),                     // [18] deathSavesSuccesses
  stringDefault(''),                   // [19] class
  stringDefault(''),                   // [20] hitDiceConfig
  stringDefault('{}'),                 // [21] hitDiceUsed
  stringDefault('[]'),                 // [22] resourcePools
  stringDefault(JSON.stringify(DEFAULT_ABILITY_SCORES)), // [23] abilityScores
  stringDefault(JSON.stringify(DEFAULT_PROFICIENCIES)),  // [24] proficiencies
  stringDefault(''),                   // [25] spellcastingAbility
]));

export const NpcRowSchema = z.preprocess(padRow(NPC_HEADERS.length), z.tuple([
  idSchema,                            // [0] id
  stringDefault('Unknown NPC'),        // [1] name
  coerceNumber(10),                    // [2] ac
  coerceNumber(10),                    // [3] maxHp
  stringDefault(''),                   // [4] notes
  stringDefault(''),                   // [5] resistances
  stringDefault(''),                   // [6] immunities
  stringDefault(''),                   // [7] vulnerabilities
  coerceNumber(0),                     // [8] legendaryActions
  coerceNumber(0),                     // [9] legendaryResistances
  stringDefault(''),                   // [10] rechargeAbilities
  stringDefault(JSON.stringify(DEFAULT_ABILITY_SCORES)), // [11] abilityScores
  stringDefault(JSON.stringify(DEFAULT_PROFICIENCIES)),  // [12] proficiencies
  stringDefault(''),                   // [13] speed
  stringDefault(''),                   // [14] senses
  stringDefault(''),                   // [15] languages
  stringDefault(''),                   // [16] challengeRating
  stringDefault('[]'),                 // [17] traits
  stringDefault('[]'),                 // [18] actions
  stringDefault('[]'),                 // [19] reactions
  stringDefault('[]'),                 // [20] legendaryActionsList
  stringDefault(''),                   // [21] spellcastingAbility
]));

export const EncounterRowSchema = z.preprocess(padRow(ENCOUNTER_HEADERS.length), z.tuple([
  idSchema,                            // [0] id
  stringDefault('Unknown Encounter'),  // [1] name
  stringDefault(''),                   // [2] location
  coerceNumber(1),                     // [3] difficultyId
  stringDefault(''),                   // [4] NPC_Definitions
  coerceNumber(0),                     // [5] currentRound
  stringDefault(''),                   // [6] activeTurnId
]));

export const EncounterCombatantRowSchema = z.preprocess(padRow(ENCOUNTER_COMBATANT_HEADERS.length), z.tuple([
  idSchema,                            // [0] id
  idSchema,                            // [1] encounterId
  nullDefault(),                       // [2] playerId
  nullDefault(),                       // [3] npcId
  coerceNumber(1),                     // [4] quantity
  coerceNumber(0),                     // [5] initiative
  stringDefault(''),                   // [6] conditionTimers
  coerceNumber(-1),                    // [7] npcCurrentHp
  coerceNumber(0),                     // [8] npcTempHp
  stringDefault(''),                   // [9] npcCurrentConditions
  coerceNumber(0),                     // [10] npcTempAcMod
  coerceNumber(0),                     // [11] npcLegendaryActionsRemaining
  coerceNumber(0),                     // [12] npcLegendaryResistancesRemaining
  stringDefault('{}'),                 // [13] npcRechargeState
]));

export const StatusRowSchema = z.preprocess(padRow(2), z.tuple([
  idSchema,                            // [0] statusId
  stringDefault(''),                   // [1] statusName
]));

export const DifficultyRowSchema = z.preprocess(padRow(2), z.tuple([
  idSchema,                            // [0] difficultyId
  stringDefault(''),                   // [1] difficultyName
]));

export const ConditionRowSchema = z.preprocess(padRow(3), z.tuple([
  nonEmptyString,        // [0] name
  stringDefault(''),     // [1] description
  stringDefault('SRD'),  // [2] source
]));

export const SpellRowSchema = z.preprocess(padRow(14), z.tuple([
  nonEmptyString,        // [0] name
  coerceNumber(0),       // [1] level
  stringDefault(''),     // [2] school
  stringDefault(''),     // [3] castingTime
  stringDefault(''),     // [4] range
  stringDefault(''),     // [5] components
  stringDefault(''),     // [6] materials
  stringDefault(''),     // [7] duration
  stringDefault('false'),// [8] concentration
  stringDefault('false'),// [9] ritual
  stringDefault(''),     // [10] classes
  stringDefault(''),     // [11] description
  stringDefault(''),     // [12] higherLevel
  stringDefault('SRD'),  // [13] source
]));
