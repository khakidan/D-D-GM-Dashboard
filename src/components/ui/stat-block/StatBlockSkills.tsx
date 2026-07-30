import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import {
  AbilityName,
  SkillName,
  AbilityScores,
  Proficiencies,
  ALL_SKILLS,
  SKILL_ABILITY_MAP,
  getSkillBonus,
  abilitiesInOrder,
} from '../../../lib/abilityScores';
import { formatBonus } from '../../../lib/stringUtils';
import { IconButton } from '../inputs/IconButton';

export interface StatBlockSkillsProps {
  abilityScores: AbilityScores;
  skills: Proficiencies['skills'];
  jackOfAllTrades: boolean;
  effectiveProfBonus: number;
  readOnly: boolean;
  onSkillCycle: (skill: SkillName) => void;
  onSkillToggle?: (skill: SkillName) => void;
  onSkillChange?: (skill: SkillName, value: 'none' | 'proficient' | 'expertise') => void;
  onJackOfAllTradesToggle: () => void;
}

// Skill groupings by ability score
const skillsByAbility: Record<AbilityName, SkillName[]> = {
  STR: ['Athletics'],
  DEX: ['Acrobatics', 'Sleight of Hand', 'Stealth'],
  CON: [],
  INT: ['Arcana', 'History', 'Investigation', 'Nature', 'Religion'],
  WIS: ['Animal Handling', 'Insight', 'Medicine', 'Perception', 'Survival'],
  CHA: ['Deception', 'Intimidation', 'Performance', 'Persuasion'],
};

export const StatBlockSkills: React.FC<StatBlockSkillsProps> = ({
  abilityScores,
  skills,
  jackOfAllTrades,
  effectiveProfBonus,
  readOnly,
  onSkillCycle,
  onSkillToggle,
  onSkillChange,
  onJackOfAllTradesToggle,
}) => {
  const [skillsExpanded, setSkillsExpanded] = useState(false);

  const hasProficientSkills = Object.keys(skills).some(
    (s) => skills[s as SkillName] === 'proficient' || skills[s as SkillName] === 'expertise'
  );

  return (
    <div id="skills-section">
      {/* Section header row */}
      <div className="flex items-center justify-between pb-1.5 border-b border-[#e2e8f0]/40 mb-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-stone-600">
          Skills
        </span>
      </div>

      {/* COLLAPSED View */}
      {(readOnly || !skillsExpanded) && (
        <div className="space-y-1" id="skills-collapsed-list">
          {!hasProficientSkills ? (
            <div className="text-xs text-stone-500 italic" id="no-skills-msg">
              No skill proficiencies
            </div>
          ) : (
            ALL_SKILLS.filter(
              (skill) =>
                skills[skill] === 'proficient' ||
                skills[skill] === 'expertise'
            ).map((skill) => {
              const prof = skills[skill] ?? 'none';
              const score = abilityScores[SKILL_ABILITY_MAP[skill]];
              const bonus = getSkillBonus(score, prof, effectiveProfBonus, jackOfAllTrades);

              return (
                <div key={skill} className="flex items-center gap-1.5 py-0.5" id={`skill-collapsed-${skill.toLowerCase().replace(/\s+/g, '-')}`}>
                  <span className="text-[#2563eb] font-bold">●</span>
                  <span className="text-xs text-stone-800 font-medium">
                    {skill}
                    {prof === 'expertise' && (
                      <span className="text-[10px] text-[#567eff] ml-0.5">
                        (exp)
                      </span>
                    )}
                  </span>
                  <div className="flex-1" />
                  <span className="text-xs font-semibold text-[#2563eb]">
                    {formatBonus(bonus)}
                  </span>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* EXPANDED View */}
      {!readOnly && skillsExpanded && (
        <div className="space-y-3" id="skills-expanded-grouped">
          {abilitiesInOrder
            .filter((ability) => skillsByAbility[ability].length > 0)
            .map((ability) => (
              <div key={ability} className="space-y-0.5" id={`skill-group-${ability.toLowerCase()}`}>
                <div className="text-[10px] uppercase text-stone-600 mt-1 mb-0.5 font-semibold">
                  {ability} Skills
                </div>

                {skillsByAbility[ability].map((skill) => {
                  const prof = skills[skill] ?? 'none';
                  const score = abilityScores[ability];
                  const bonus = getSkillBonus(score, prof, effectiveProfBonus, jackOfAllTrades);
                  const isProf = prof === 'proficient' || prof === 'expertise';
                  const isExpert = prof === 'expertise';

                  return (
                    <div
                      key={skill}
                      className="flex items-center gap-2 py-0.5 rounded pl-0.5"
                      id={`skill-row-${skill.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      <input
                        type="checkbox"
                        id={`skill-chk-${skill.toLowerCase().replace(/\s+/g, '-')}`}
                        checked={isProf}
                        onChange={() => {
                          if (onSkillChange) {
                            onSkillChange(skill, isProf ? 'none' : 'proficient');
                          } else if (onSkillToggle) {
                            onSkillToggle(skill);
                          } else {
                            if (isProf) {
                              if (isExpert) {
                                onSkillCycle(skill);
                              } else {
                                onSkillCycle(skill);
                                onSkillCycle(skill);
                              }
                            } else {
                              onSkillCycle(skill);
                            }
                          }
                        }}
                        className="rounded border-[#e2e8f0] text-[#2563eb] focus:ring-[#2563eb] w-4 h-4 cursor-pointer"
                      />
                      <button
                        type="button"
                        id={`skill-exp-${skill.toLowerCase().replace(/\s+/g, '-')}`}
                        onClick={() => {
                          if (onSkillChange) {
                            onSkillChange(skill, isExpert ? 'proficient' : 'expertise');
                          } else {
                            if (isExpert) {
                              onSkillCycle(skill);
                              onSkillCycle(skill);
                            } else if (isProf) {
                              onSkillCycle(skill);
                            } else {
                              onSkillCycle(skill);
                              onSkillCycle(skill);
                            }
                          }
                        }}
                        className={`p-0.5 rounded cursor-pointer transition-colors focus:outline-none ${
                          isExpert ? 'text-amber-500 hover:text-amber-600' : 'text-stone-300 hover:text-stone-400'
                        }`}
                        title={isExpert ? "Remove Expertise" : "Add Expertise"}
                      >
                        <span className="text-sm select-none font-bold">
                          {isExpert ? '★' : '☆'}
                        </span>
                      </button>
                      <label
                        htmlFor={`skill-chk-${skill.toLowerCase().replace(/\s+/g, '-')}`}
                        className={`text-xs select-none cursor-pointer ${
                          isProf ? 'text-stone-800 font-semibold' : 'text-stone-400 font-normal'
                        }`}
                        id={`skill-label-${skill.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        {skill}
                        {isExpert && (
                          <span className="text-[10px] text-[#567eff] font-semibold ml-0.5">
                            (exp)
                          </span>
                        )}
                      </label>

                      <div className="flex-1" />

                      <span
                        className={`text-xs font-semibold ${
                          isProf ? 'text-[#2563eb]' : 'text-stone-400 font-normal'
                        }`}
                        id={`skill-bonus-${skill.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        {formatBonus(bonus)}
                      </span>
                    </div>
                  );
                })}
              </div>
            ))}
        </div>
      )}

      {/* Toggle button and Jack of All Trades row */}
      {!readOnly && (
        <div className="space-y-2 mt-2">
          <button
            type="button"
            onClick={() => setSkillsExpanded(!skillsExpanded)}
            className="text-xs text-[#2563eb] hover:underline cursor-pointer block text-left font-medium"
            id="skills-toggle-btn"
          >
            {skillsExpanded ? 'Show fewer skills' : 'Show all skills'}
          </button>

          <div className="flex items-center gap-1.5 pt-1.5 border-t border-[#e2e8f0]/40" id="jack-of-trades-row">
            <input
              type="checkbox"
              id="jack-of-all-trades-chk"
              checked={jackOfAllTrades}
              onChange={onJackOfAllTradesToggle}
              className="rounded border-[#e2e8f0] text-[#2563eb] focus:ring-[#2563eb]/30 w-4 h-4 cursor-pointer"
            />
            <label
              htmlFor="jack-of-all-trades-chk"
              className="text-xs text-stone-600 select-none cursor-pointer font-medium"
            >
              Jack of All Trades (½ proficiency to non-proficient skills)
            </label>
          </div>
        </div>
      )}
    </div>
  );
};
