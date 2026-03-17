import { getMilestones } from "../data/milestones";
import { SKILL_ICONS } from "../data/icons";
import { SKILLS, xpForLevel } from "../data/skills";
import { GameState, SkillId } from "../data/types";

export function SkillsPanel({ state }: { state: GameState }) {
  const skillIds = (Object.keys(SKILLS) as SkillId[]).filter(
    (id) => state.skills[id].xp > 0
  );

  if (skillIds.length === 0) {
    return (
      <div>
        <div className="empty-panel">
          Start gathering to discover your skills.
        </div>
      </div>
    );
  }

  return (
    <div>
      {skillIds.map((id) => {
        const skill = state.skills[id];
        const currentLevelXp = xpForLevel(skill.level);
        const nextLevelXp = xpForLevel(skill.level + 1);
        const xpIntoLevel = skill.xp - currentLevelXp;
        const xpNeeded = nextLevelXp - currentLevelXp;
        const progress = xpNeeded > 0 ? xpIntoLevel / xpNeeded : 1;

        const milestones = getMilestones(id);
        const achieved = milestones.filter((m) => m.level <= skill.level);
        const upcoming = milestones.filter((m) => m.level > skill.level);
        // Show up to 3 upcoming milestones
        const previewCount = 3;
        const preview = upcoming.slice(0, previewCount);

        return (
          <div key={id} className="skill-card">
            <div className="skill-header">
              <span className="skill-name">{SKILL_ICONS[id]} {SKILLS[id].name}</span>
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
            {(achieved.length > 0 || preview.length > 0) && (
              <div className="milestone-list">
                {achieved.map((m, i) => (
                  <div key={`a-${i}`} className="milestone achieved">
                    <span className="milestone-level">Lvl {m.level}</span>
                    <span className="milestone-desc">{m.description}</span>
                  </div>
                ))}
                {preview.map((m, i) => (
                  <div key={`p-${i}`} className="milestone upcoming">
                    <span className="milestone-level">Lvl {m.level}</span>
                    <span className="milestone-desc">
                      {m.hidden ? "???" : m.description}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
