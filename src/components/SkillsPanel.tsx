import { useState } from "react";
import { getSkills, getMilestonesForSkill } from "../data/registry";
import { xpForLevel } from "../data/skills";
import { GameState, SkillId } from "../data/types";
import { GameIcon } from "./GameIcon";

export function SkillsPanel({ state }: { state: GameState }) {
  const SKILLS = getSkills();
  const skillIds = (Object.keys(SKILLS) as SkillId[]).filter(
    (id) => state.skills[id].xp > 0
  );

  const [collapsed, setCollapsed] = useState<Set<string>>(() => {
    try {
      const v = localStorage.getItem("sb_skill_collapsed");
      return v ? new Set(JSON.parse(v)) : new Set();
    } catch {
      return new Set();
    }
  });

  const toggleSkill = (id: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      try { localStorage.setItem("sb_skill_collapsed", JSON.stringify([...next])); } catch { /* */ }
      return next;
    });
  };

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

        const milestones = getMilestonesForSkill(id);
        const achieved = milestones.filter((m) => m.level <= skill.level);
        const upcoming = milestones.filter((m) => m.level > skill.level);
        const previewCount = 3;
        const preview = upcoming.slice(0, previewCount);
        const hasMilestones = achieved.length > 0 || preview.length > 0;
        const isCollapsed = collapsed.has(id);

        return (
          <div key={id} className="skill-card">
            <div
              className="skill-header"
              onClick={hasMilestones ? () => toggleSkill(id) : undefined}
              style={hasMilestones ? { cursor: "pointer" } : undefined}
            >
              <span className="skill-name">
                {hasMilestones && (
                  <span className={`collapse-arrow${isCollapsed ? " collapsed" : ""}`}>&#9662;</span>
                )}
                <GameIcon id={`skill_${id}`} /> {SKILLS[id].name}
              </span>
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
            {hasMilestones && !isCollapsed && (
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
