export interface ConditionMechanics {
  speedZero: boolean;
  speedHalved: boolean;
  hpMaxHalved: boolean;
  incapacitates: boolean;
  outgoingAdvantage: boolean;
  outgoingDisadvantage: boolean;
  incomingAdvantage: boolean;
  incomingDisadvantage: boolean;
  critVulnerableInMelee: boolean;
  autoFailStr: boolean;
  autoFailDex: boolean;
  dexSaveDisadvantage: boolean;
  allSaveDisadvantage: boolean;
  turnStartNote?: string;
  removedByLongRest: boolean;
  tempAcModifier: number;
}

export const CONDITION_MECHANICS: Record<string, ConditionMechanics> = {
  blinded: {
    speedZero: false, speedHalved: false, hpMaxHalved: false,
    incapacitates: false,
    outgoingAdvantage: false, outgoingDisadvantage: true,
    incomingAdvantage: true, incomingDisadvantage: false,
    critVulnerableInMelee: false,
    autoFailStr: false, autoFailDex: false,
    dexSaveDisadvantage: false, allSaveDisadvantage: false,
    removedByLongRest: false,
    tempAcModifier: 0
  },
  charmed: {
    speedZero: false, speedHalved: false, hpMaxHalved: false,
    incapacitates: false,
    outgoingAdvantage: false, outgoingDisadvantage: false,
    incomingAdvantage: false, incomingDisadvantage: false,
    critVulnerableInMelee: false,
    autoFailStr: false, autoFailDex: false,
    dexSaveDisadvantage: false, allSaveDisadvantage: false,
    removedByLongRest: false,
    tempAcModifier: 0
  },
  deafened: {
    speedZero: false, speedHalved: false, hpMaxHalved: false,
    incapacitates: false,
    outgoingAdvantage: false, outgoingDisadvantage: false,
    incomingAdvantage: false, incomingDisadvantage: false,
    critVulnerableInMelee: false,
    autoFailStr: false, autoFailDex: false,
    dexSaveDisadvantage: false, allSaveDisadvantage: false,
    removedByLongRest: false,
    tempAcModifier: 0
  },
  frightened: {
    speedZero: false, speedHalved: false, hpMaxHalved: false,
    incapacitates: false,
    outgoingAdvantage: false, outgoingDisadvantage: true,
    incomingAdvantage: false, incomingDisadvantage: false,
    critVulnerableInMelee: false,
    autoFailStr: false, autoFailDex: false,
    dexSaveDisadvantage: false, allSaveDisadvantage: false,
    removedByLongRest: false,
    tempAcModifier: 0
  },
  grappled: {
    speedZero: true, speedHalved: false, hpMaxHalved: false,
    incapacitates: false,
    outgoingAdvantage: false, outgoingDisadvantage: false,
    incomingAdvantage: false, incomingDisadvantage: false,
    critVulnerableInMelee: false,
    autoFailStr: false, autoFailDex: false,
    dexSaveDisadvantage: false, allSaveDisadvantage: false,
    removedByLongRest: false,
    tempAcModifier: 0
  },
  incapacitated: {
    speedZero: false, speedHalved: false, hpMaxHalved: false,
    incapacitates: true,
    outgoingAdvantage: false, outgoingDisadvantage: false,
    incomingAdvantage: false, incomingDisadvantage: false,
    critVulnerableInMelee: false,
    autoFailStr: false, autoFailDex: false,
    dexSaveDisadvantage: false, allSaveDisadvantage: false,
    removedByLongRest: false,
    tempAcModifier: 0
  },
  invisible: {
    speedZero: false, speedHalved: false, hpMaxHalved: false,
    incapacitates: false,
    outgoingAdvantage: true, outgoingDisadvantage: false,
    incomingAdvantage: false, incomingDisadvantage: true,
    critVulnerableInMelee: false,
    autoFailStr: false, autoFailDex: false,
    dexSaveDisadvantage: false, allSaveDisadvantage: false,
    removedByLongRest: false,
    tempAcModifier: 0
  },
  paralyzed: {
    speedZero: true, speedHalved: false, hpMaxHalved: false,
    incapacitates: true,
    outgoingAdvantage: false, outgoingDisadvantage: false,
    incomingAdvantage: true, incomingDisadvantage: false,
    critVulnerableInMelee: true,
    autoFailStr: true, autoFailDex: true,
    dexSaveDisadvantage: false, allSaveDisadvantage: false,
    removedByLongRest: false,
    tempAcModifier: 0
  },
  petrified: {
    speedZero: true, speedHalved: false, hpMaxHalved: false,
    incapacitates: true,
    outgoingAdvantage: false, outgoingDisadvantage: false,
    incomingAdvantage: true, incomingDisadvantage: false,
    critVulnerableInMelee: false,
    autoFailStr: true, autoFailDex: true,
    dexSaveDisadvantage: false, allSaveDisadvantage: false,
    removedByLongRest: false,
    tempAcModifier: 0
  },
  poisoned: {
    speedZero: false, speedHalved: false, hpMaxHalved: false,
    incapacitates: false,
    outgoingAdvantage: false, outgoingDisadvantage: true,
    incomingAdvantage: false, incomingDisadvantage: false,
    critVulnerableInMelee: false,
    autoFailStr: false, autoFailDex: false,
    dexSaveDisadvantage: false, allSaveDisadvantage: false,
    removedByLongRest: false,
    tempAcModifier: 0
  },
  prone: {
    speedZero: false, speedHalved: false, hpMaxHalved: false,
    incapacitates: false,
    outgoingAdvantage: false, outgoingDisadvantage: true,
    incomingAdvantage: true, incomingDisadvantage: false,
    critVulnerableInMelee: false,
    autoFailStr: false, autoFailDex: false,
    dexSaveDisadvantage: false, allSaveDisadvantage: false,
    removedByLongRest: false,
    tempAcModifier: 0
  },
  restrained: {
    speedZero: true, speedHalved: false, hpMaxHalved: false,
    incapacitates: false,
    outgoingAdvantage: false, outgoingDisadvantage: true,
    incomingAdvantage: true, incomingDisadvantage: false,
    critVulnerableInMelee: false,
    autoFailStr: false, autoFailDex: false,
    dexSaveDisadvantage: true, allSaveDisadvantage: false,
    removedByLongRest: false,
    tempAcModifier: 0
  },
  stunned: {
    speedZero: true, speedHalved: false, hpMaxHalved: false,
    incapacitates: true,
    outgoingAdvantage: false, outgoingDisadvantage: false,
    incomingAdvantage: true, incomingDisadvantage: false,
    critVulnerableInMelee: false,
    autoFailStr: true, autoFailDex: true,
    dexSaveDisadvantage: false, allSaveDisadvantage: false,
    removedByLongRest: false,
    tempAcModifier: 0
  },
  unconscious: {
    speedZero: true, speedHalved: false, hpMaxHalved: false,
    incapacitates: true,
    outgoingAdvantage: false, outgoingDisadvantage: false,
    incomingAdvantage: true, incomingDisadvantage: false,
    critVulnerableInMelee: true,
    autoFailStr: true, autoFailDex: true,
    dexSaveDisadvantage: false, allSaveDisadvantage: false,
    removedByLongRest: false,
    tempAcModifier: 0
  },
  dodging: {
    speedZero: false, speedHalved: false, hpMaxHalved: false,
    incapacitates: false,
    outgoingAdvantage: false, outgoingDisadvantage: false,
    incomingAdvantage: false, incomingDisadvantage: true,
    critVulnerableInMelee: false,
    autoFailStr: false, autoFailDex: false,
    dexSaveDisadvantage: false, allSaveDisadvantage: false,
    removedByLongRest: true,
    tempAcModifier: 0
  },
  hasted: {
    speedZero: false, speedHalved: false, hpMaxHalved: false,
    incapacitates: false,
    outgoingAdvantage: false, outgoingDisadvantage: false,
    incomingAdvantage: false, incomingDisadvantage: false,
    critVulnerableInMelee: false,
    autoFailStr: false, autoFailDex: false,
    dexSaveDisadvantage: false, allSaveDisadvantage: false,
    removedByLongRest: true,
    tempAcModifier: 2
  },
  slowed: {
    speedZero: false, speedHalved: true, hpMaxHalved: false,
    incapacitates: false,
    outgoingAdvantage: false, outgoingDisadvantage: false,
    incomingAdvantage: false, incomingDisadvantage: false,
    critVulnerableInMelee: false,
    autoFailStr: false, autoFailDex: false,
    dexSaveDisadvantage: false, allSaveDisadvantage: false,
    removedByLongRest: true,
    tempAcModifier: -2
  },
  concentrating: {
    speedZero: false, speedHalved: false, hpMaxHalved: false,
    incapacitates: false,
    outgoingAdvantage: false, outgoingDisadvantage: false,
    incomingAdvantage: false, incomingDisadvantage: false,
    critVulnerableInMelee: false,
    autoFailStr: false, autoFailDex: false,
    dexSaveDisadvantage: false, allSaveDisadvantage: false,
    removedByLongRest: true,
    tempAcModifier: 0
  },
  raging: {
    speedZero: false, speedHalved: false, hpMaxHalved: false,
    incapacitates: false,
    outgoingAdvantage: false, outgoingDisadvantage: false,
    incomingAdvantage: false, incomingDisadvantage: false,
    critVulnerableInMelee: false,
    autoFailStr: false, autoFailDex: false,
    dexSaveDisadvantage: false, allSaveDisadvantage: false,
    removedByLongRest: true,
    tempAcModifier: 0
  },
  'exhaustion 1': {
    speedZero: false, speedHalved: false, hpMaxHalved: false,
    incapacitates: false,
    outgoingAdvantage: false, outgoingDisadvantage: true,
    incomingAdvantage: false, incomingDisadvantage: false,
    critVulnerableInMelee: false,
    autoFailStr: false, autoFailDex: false,
    dexSaveDisadvantage: false, allSaveDisadvantage: false,
    removedByLongRest: false,
    tempAcModifier: 0
  },
  'exhaustion 2': {
    speedZero: false, speedHalved: true, hpMaxHalved: false,
    incapacitates: false,
    outgoingAdvantage: false, outgoingDisadvantage: true,
    incomingAdvantage: false, incomingDisadvantage: false,
    critVulnerableInMelee: false,
    autoFailStr: false, autoFailDex: false,
    dexSaveDisadvantage: false, allSaveDisadvantage: false,
    removedByLongRest: false,
    tempAcModifier: 0
  },
  'exhaustion 3': {
    speedZero: false, speedHalved: true, hpMaxHalved: false,
    incapacitates: false,
    outgoingAdvantage: false, outgoingDisadvantage: true,
    incomingAdvantage: false, incomingDisadvantage: false,
    critVulnerableInMelee: false,
    autoFailStr: false, autoFailDex: false,
    dexSaveDisadvantage: false, allSaveDisadvantage: true,
    removedByLongRest: false,
    tempAcModifier: 0
  },
  'exhaustion 4': {
    speedZero: false, speedHalved: true, hpMaxHalved: true,
    incapacitates: false,
    outgoingAdvantage: false, outgoingDisadvantage: true,
    incomingAdvantage: false, incomingDisadvantage: false,
    critVulnerableInMelee: false,
    autoFailStr: false, autoFailDex: false,
    dexSaveDisadvantage: false, allSaveDisadvantage: true,
    removedByLongRest: false,
    tempAcModifier: 0
  },
  'exhaustion 5': {
    speedZero: true, speedHalved: false, hpMaxHalved: true,
    incapacitates: false,
    outgoingAdvantage: false, outgoingDisadvantage: true,
    incomingAdvantage: false, incomingDisadvantage: false,
    critVulnerableInMelee: false,
    autoFailStr: false, autoFailDex: false,
    dexSaveDisadvantage: false, allSaveDisadvantage: true,
    removedByLongRest: false,
    tempAcModifier: 0
  },
  'exhaustion 6': {
    speedZero: true, speedHalved: false, hpMaxHalved: true,
    incapacitates: true,
    outgoingAdvantage: false, outgoingDisadvantage: true,
    incomingAdvantage: true, incomingDisadvantage: false,
    critVulnerableInMelee: false,
    autoFailStr: false, autoFailDex: false,
    dexSaveDisadvantage: false, allSaveDisadvantage: true,
    removedByLongRest: false,
    tempAcModifier: 0
  },
  blessed: {
    speedZero: false, speedHalved: false, hpMaxHalved: false,
    incapacitates: false,
    outgoingAdvantage: false, outgoingDisadvantage: false,
    incomingAdvantage: false, incomingDisadvantage: false,
    critVulnerableInMelee: false,
    autoFailStr: false, autoFailDex: false,
    dexSaveDisadvantage: false, allSaveDisadvantage: false,
    removedByLongRest: true,
    tempAcModifier: 0
  },
  baned: {
    speedZero: false, speedHalved: false, hpMaxHalved: false,
    incapacitates: false,
    outgoingAdvantage: false, outgoingDisadvantage: false,
    incomingAdvantage: false, incomingDisadvantage: false,
    critVulnerableInMelee: false,
    autoFailStr: false, autoFailDex: false,
    dexSaveDisadvantage: false, allSaveDisadvantage: false,
    removedByLongRest: true,
    tempAcModifier: 0
  },
  hexed: {
    speedZero: false, speedHalved: false, hpMaxHalved: false,
    incapacitates: false,
    outgoingAdvantage: false, outgoingDisadvantage: false,
    incomingAdvantage: false, incomingDisadvantage: false,
    critVulnerableInMelee: false,
    autoFailStr: false, autoFailDex: false,
    dexSaveDisadvantage: false, allSaveDisadvantage: false,
    removedByLongRest: true,
    tempAcModifier: 0
  },
  "hunter's mark": {
    speedZero: false, speedHalved: false, hpMaxHalved: false,
    incapacitates: false,
    outgoingAdvantage: false, outgoingDisadvantage: false,
    incomingAdvantage: false, incomingDisadvantage: false,
    critVulnerableInMelee: false,
    autoFailStr: false, autoFailDex: false,
    dexSaveDisadvantage: false, allSaveDisadvantage: false,
    removedByLongRest: true,
    tempAcModifier: 0
  },
  'shield of faith': {
    speedZero: false, speedHalved: false, hpMaxHalved: false,
    incapacitates: false,
    outgoingAdvantage: false, outgoingDisadvantage: false,
    incomingAdvantage: false, incomingDisadvantage: false,
    critVulnerableInMelee: false,
    autoFailStr: false, autoFailDex: false,
    dexSaveDisadvantage: false, allSaveDisadvantage: false,
    removedByLongRest: true,
    tempAcModifier: 0
  },
  'spirit guardians': {
    speedZero: false, speedHalved: false, hpMaxHalved: false,
    incapacitates: false,
    outgoingAdvantage: false, outgoingDisadvantage: false,
    incomingAdvantage: false, incomingDisadvantage: false,
    critVulnerableInMelee: false,
    autoFailStr: false, autoFailDex: false,
    dexSaveDisadvantage: false, allSaveDisadvantage: false,
    removedByLongRest: true,
    tempAcModifier: 0
  },
  'spiritual weapon': {
    speedZero: false, speedHalved: false, hpMaxHalved: false,
    incapacitates: false,
    outgoingAdvantage: false, outgoingDisadvantage: false,
    incomingAdvantage: false, incomingDisadvantage: false,
    critVulnerableInMelee: false,
    autoFailStr: false, autoFailDex: false,
    dexSaveDisadvantage: false, allSaveDisadvantage: false,
    removedByLongRest: true,
    tempAcModifier: 0
  },
  blurred: {
    speedZero: false, speedHalved: false, hpMaxHalved: false,
    incapacitates: false,
    outgoingAdvantage: false, outgoingDisadvantage: false,
    incomingAdvantage: false, incomingDisadvantage: false,
    critVulnerableInMelee: false,
    autoFailStr: false, autoFailDex: false,
    dexSaveDisadvantage: false, allSaveDisadvantage: false,
    removedByLongRest: true,
    tempAcModifier: 0
  },
  polymorphed: {
    speedZero: false, speedHalved: false, hpMaxHalved: false,
    incapacitates: false,
    outgoingAdvantage: false, outgoingDisadvantage: false,
    incomingAdvantage: false, incomingDisadvantage: false,
    critVulnerableInMelee: false,
    autoFailStr: false, autoFailDex: false,
    dexSaveDisadvantage: false, allSaveDisadvantage: false,
    removedByLongRest: true,
    tempAcModifier: 0
  },
  fly: {
    speedZero: false, speedHalved: false, hpMaxHalved: false,
    incapacitates: false,
    outgoingAdvantage: false, outgoingDisadvantage: false,
    incomingAdvantage: false, incomingDisadvantage: false,
    critVulnerableInMelee: false,
    autoFailStr: false, autoFailDex: false,
    dexSaveDisadvantage: false, allSaveDisadvantage: false,
    removedByLongRest: true,
    tempAcModifier: 0
  },
  stoneskin: {
    speedZero: false, speedHalved: false, hpMaxHalved: false,
    incapacitates: false,
    outgoingAdvantage: false, outgoingDisadvantage: false,
    incomingAdvantage: false, incomingDisadvantage: false,
    critVulnerableInMelee: false,
    autoFailStr: false, autoFailDex: false,
    dexSaveDisadvantage: false, allSaveDisadvantage: false,
    removedByLongRest: true,
    tempAcModifier: 0
  },
  'fire shield': {
    speedZero: false, speedHalved: false, hpMaxHalved: false,
    incapacitates: false,
    outgoingAdvantage: false, outgoingDisadvantage: false,
    incomingAdvantage: false, incomingDisadvantage: false,
    critVulnerableInMelee: false,
    autoFailStr: false, autoFailDex: false,
    dexSaveDisadvantage: false, allSaveDisadvantage: false,
    removedByLongRest: true,
    tempAcModifier: 0
  },
  'mirror image': {
    speedZero: false, speedHalved: false, hpMaxHalved: false,
    incapacitates: false,
    outgoingAdvantage: false, outgoingDisadvantage: false,
    incomingAdvantage: false, incomingDisadvantage: false,
    critVulnerableInMelee: false,
    autoFailStr: false, autoFailDex: false,
    dexSaveDisadvantage: false, allSaveDisadvantage: false,
    removedByLongRest: true,
    tempAcModifier: 0
  },
  enlarged: {
    speedZero: false, speedHalved: false, hpMaxHalved: false,
    incapacitates: false,
    outgoingAdvantage: false, outgoingDisadvantage: false,
    incomingAdvantage: false, incomingDisadvantage: false,
    critVulnerableInMelee: false,
    autoFailStr: false, autoFailDex: false,
    dexSaveDisadvantage: false, allSaveDisadvantage: false,
    removedByLongRest: true,
    tempAcModifier: 0
  },
  reduced: {
    speedZero: false, speedHalved: false, hpMaxHalved: false,
    incapacitates: false,
    outgoingAdvantage: false, outgoingDisadvantage: false,
    incomingAdvantage: false, incomingDisadvantage: false,
    critVulnerableInMelee: false,
    autoFailStr: false, autoFailDex: false,
    dexSaveDisadvantage: false, allSaveDisadvantage: false,
    removedByLongRest: true,
    tempAcModifier: 0
  },
  'mage armor': {
    speedZero: false, speedHalved: false, hpMaxHalved: false,
    incapacitates: false,
    outgoingAdvantage: false, outgoingDisadvantage: false,
    incomingAdvantage: false, incomingDisadvantage: false,
    critVulnerableInMelee: false,
    autoFailStr: false, autoFailDex: false,
    dexSaveDisadvantage: false, allSaveDisadvantage: false,
    removedByLongRest: true,
    tempAcModifier: 0
  },
  'wild shaped': {
    speedZero: false, speedHalved: false, hpMaxHalved: false,
    incapacitates: false,
    outgoingAdvantage: false, outgoingDisadvantage: false,
    incomingAdvantage: false, incomingDisadvantage: false,
    critVulnerableInMelee: false,
    autoFailStr: false, autoFailDex: false,
    dexSaveDisadvantage: false, allSaveDisadvantage: false,
    removedByLongRest: true,
    tempAcModifier: 0
  },
  guided: {
    speedZero: false, speedHalved: false, hpMaxHalved: false,
    incapacitates: false,
    outgoingAdvantage: false, outgoingDisadvantage: false,
    incomingAdvantage: false, incomingDisadvantage: false,
    critVulnerableInMelee: false,
    autoFailStr: false, autoFailDex: false,
    dexSaveDisadvantage: false, allSaveDisadvantage: false,
    removedByLongRest: true,
    tempAcModifier: 0
  },
  firewall: {
    speedZero: false, speedHalved: false, hpMaxHalved: false,
    incapacitates: false,
    outgoingAdvantage: false, outgoingDisadvantage: false,
    incomingAdvantage: false, incomingDisadvantage: false,
    critVulnerableInMelee: false,
    autoFailStr: false, autoFailDex: false,
    dexSaveDisadvantage: false, allSaveDisadvantage: false,
    removedByLongRest: true,
    tempAcModifier: 0
  },
  'aid (boosted)': {
    speedZero: false, speedHalved: false, hpMaxHalved: false,
    incapacitates: false,
    outgoingAdvantage: false, outgoingDisadvantage: false,
    incomingAdvantage: false, incomingDisadvantage: false,
    critVulnerableInMelee: false,
    autoFailStr: false, autoFailDex: false,
    dexSaveDisadvantage: false, allSaveDisadvantage: false,
    removedByLongRest: true,
    tempAcModifier: 0
  }
};
