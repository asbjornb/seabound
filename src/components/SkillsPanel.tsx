import { SKILLS, xpForLevel } from "../data/skills";
import { GameState, SkillId } from "../data/types";

export function SkillsPanel({ state }: { state: GameState }) {
  const skillIds = Object.keys(SKILLS) as SkillId[];

  return (
    <div>
      {skillIds.map((id) => {
        const skill = state.skills[id];
        const currentLevelXp = xpForLevel(skill.level);
        const nextLevelXp = xpForLevel(skill.level + 1);
        const xpIntoLevel = skill.xp - currentLevelXp;
        const xpNeeded = nextLevelXp - currentLevelXp;
        const progress = xpNeeded > 0 ? xpIntoLevel / xpNeeded : 1;

        return (
          <div key={id} className="skill-card">
            <div className="skill-header">
              <span className="skill-name">{SKILLS[id].name}</span>
              <span className="skill-level">Lvl {skill.level}</span>
            </div>
            <div className="xp-bar">
              <div
                className="xp-fill"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
            <div className="xp-text">
              {xpIntoLevel} / {xpNeeded} XP to next level ({skill.xp} total)
            </div>
          </div>
        );
      })}
    </div>
  );
}
