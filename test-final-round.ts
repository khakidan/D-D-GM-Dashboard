import { generateTranscript } from './src/lib/combatLog';

const dummyLog = {
  encounterId: 'e1',
  encounterName: 'Test Encounter',
  location: 'Test Location',
  startedAt: new Date().toISOString(),
  currentRound: 3,
  partySnapshot: [],
  initiativeOrder: [],
  events: [
    { id: '1', timestamp: '1', round: 1, type: 'round-start', actorId: null, actorName: null, targetId: null, targetName: null, isManualAdjustment: false },
    { id: '2', timestamp: '2', round: 3, type: 'damage', actorId: 'pc1', actorName: 'Hero', targetId: 'npc1', targetName: 'Goblin', value: 10, isManualAdjustment: false, hpBefore: 10, hpAfter: 0, actionType: 'attack' },
    { id: '3', timestamp: '3', round: 3, type: 'combatant-defeated', actorId: 'pc1', actorName: 'Hero', targetId: 'npc1', targetName: 'Goblin', isManualAdjustment: false },
    { id: '4', timestamp: '4', round: 3, type: 'combat-end', actorId: null, actorName: null, targetId: null, targetName: null, isManualAdjustment: false }
  ]
};

const transcript = generateTranscript(dummyLog as any, 'Victory');
console.log('TRANSCRIPT:\n', transcript);
