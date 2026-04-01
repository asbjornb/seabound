import { useState, useMemo } from "react";
import { getActionById, getRecipeById } from "../data/registry";
import {
  areCountsEnabled,
  getMaxRoutines,
  getMaxSteps,
  ROUTINE_UPGRADES,
} from "../data/routines";
import type { ActionDef, GameState, RecipeDef, Routine, RoutineStep } from "../data/types";
import { GameIcon } from "./GameIcon";

interface Props {
  state: GameState;
  availableActions: ActionDef[];
  availableRecipes: RecipeDef[];
  onSaveRoutine: (routine: Routine) => void;
  onDeleteRoutine: (routineId: string) => void;
  onStartRoutine: (routineId: string) => void;
  onStopRoutine: () => void;
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function StepDisplay({ step, index }: { step: RoutineStep; index: number }) {
  const name =
    step.actionType === "gather"
      ? getActionById(step.actionId)?.name
      : getRecipeById(step.actionId)?.name;
  return (
    <span className="routine-step-badge">
      <span className="routine-step-num">{index + 1}</span>
      {step.count > 0 && <span className="routine-step-count">{step.count}x</span>}
      <GameIcon id={step.actionType === "gather" ? `biome_beach` : `tab_craft`} size={14} />
      {name ?? step.actionId}
    </span>
  );
}

function RoutineEditor({
  initial,
  maxSteps,
  countsEnabled,
  availableActions,
  availableRecipes,
  onSave,
  onCancel,
}: {
  initial: Routine;
  maxSteps: number;
  countsEnabled: boolean;
  availableActions: ActionDef[];
  availableRecipes: RecipeDef[];
  onSave: (routine: Routine) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial.name);
  const [steps, setSteps] = useState<RoutineStep[]>(
    initial.steps.length > 0
      ? initial.steps
      : [{ actionId: "", actionType: "gather", count: 0 }]
  );

  // Build option groups: gather actions, then craft recipes (repeatable first)
  const gatherOptions = availableActions.filter((a) => a.panel === "gather");
  const craftOptions = availableRecipes.filter(
    (r) => r.panel === "craft" && (r.repeatable || !r.buildingOutput)
  );

  const updateStep = (idx: number, patch: Partial<RoutineStep>) => {
    setSteps((prev) => prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  };

  const removeStep = (idx: number) => {
    setSteps((prev) => prev.filter((_, i) => i !== idx));
  };

  const addStep = () => {
    if (steps.length < maxSteps) {
      setSteps((prev) => [...prev, { actionId: "", actionType: "gather", count: 0 }]);
    }
  };

  const canSave = name.trim().length > 0 && steps.length >= 2 && steps.every((s) => s.actionId);

  const handleSave = () => {
    if (!canSave) return;
    onSave({ ...initial, name: name.trim(), steps });
  };

  return (
    <div className="routine-editor">
      <div className="routine-editor-field">
        <label>Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="My routine"
          maxLength={30}
          className="routine-name-input"
        />
      </div>

      <div className="routine-editor-steps">
        {steps.map((step, idx) => (
          <div key={idx} className="routine-editor-step">
            <span className="routine-step-num">{idx + 1}</span>
            <select
              value={step.actionType + ":" + step.actionId}
              onChange={(e) => {
                const val = e.target.value;
                const [type, ...rest] = val.split(":");
                const id = rest.join(":");
                updateStep(idx, {
                  actionType: type as "gather" | "craft",
                  actionId: id,
                });
              }}
              className="routine-action-select"
            >
              <option value="gather:">-- Pick action --</option>
              {gatherOptions.length > 0 && (
                <optgroup label="Gather">
                  {gatherOptions.map((a) => (
                    <option key={a.id} value={`gather:${a.id}`}>
                      {a.name}
                    </option>
                  ))}
                </optgroup>
              )}
              {craftOptions.length > 0 && (
                <optgroup label="Craft">
                  {craftOptions.map((r) => (
                    <option key={r.id} value={`craft:${r.id}`}>
                      {r.name}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
            {countsEnabled && (
              <input
                type="number"
                min={0}
                max={99}
                value={step.count}
                onChange={(e) => updateStep(idx, { count: Math.max(0, parseInt(e.target.value) || 0) })}
                className="routine-count-input"
                title="Completions before advancing (0 = until stop)"
              />
            )}
            {steps.length > 1 && (
              <button className="routine-remove-step" onClick={() => removeStep(idx)} title="Remove step">
                &times;
              </button>
            )}
          </div>
        ))}
      </div>

      {steps.length < maxSteps && (
        <button className="routine-add-step" onClick={addStep}>
          + Add step
        </button>
      )}
      {!countsEnabled && (
        <div className="routine-hint">
          Each step runs until its output is full or resources are exhausted, then advances.
        </div>
      )}
      {countsEnabled && (
        <div className="routine-hint">
          Set a count to stop after N completions, or leave at 0 to run until full/exhausted.
        </div>
      )}

      <div className="routine-editor-buttons">
        <button className="routine-save-btn" onClick={handleSave} disabled={!canSave}>
          Save
        </button>
        <button className="routine-cancel-btn" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}

export function RoutinesPanel({
  state,
  availableActions,
  availableRecipes,
  onSaveRoutine,
  onDeleteRoutine,
  onStartRoutine,
  onStopRoutine,
}: Props) {
  const [editing, setEditing] = useState<Routine | null>(null);

  const maxRoutines = useMemo(() => getMaxRoutines(state), [state]);
  const maxSteps = useMemo(() => getMaxSteps(state), [state]);
  const countsEnabled = useMemo(() => areCountsEnabled(state), [state]);

  // Determine which upgrades the player has unlocked
  const unlockedUpgrades = useMemo(
    () => ROUTINE_UPGRADES.filter((u) => state.buildings.includes(u.buildingId)),
    [state.buildings]
  );
  const lockedUpgrades = useMemo(
    () => ROUTINE_UPGRADES.filter((u) => !state.buildings.includes(u.buildingId)),
    [state.buildings]
  );

  const activeRoutineId = state.activeRoutine?.routineId ?? null;

  const handleCreate = () => {
    setEditing({
      id: generateId(),
      name: "",
      steps: [],
    });
  };

  const handleEdit = (routine: Routine) => {
    // Stop routine if it's running before editing
    if (activeRoutineId === routine.id) {
      onStopRoutine();
    }
    setEditing(structuredClone(routine));
  };

  const handleSave = (routine: Routine) => {
    onSaveRoutine(routine);
    setEditing(null);
  };

  if (editing) {
    return (
      <div className="routines-panel">
        <div className="section-title">
          {state.routines.some((r) => r.id === editing.id) ? "Edit" : "New"} Routine
        </div>
        <RoutineEditor
          initial={editing}
          maxSteps={maxSteps}
          countsEnabled={countsEnabled}
          availableActions={availableActions}
          availableRecipes={availableRecipes}
          onSave={handleSave}
          onCancel={() => setEditing(null)}
        />
      </div>
    );
  }

  return (
    <div className="routines-panel">
      {state.routines.length === 0 && (
        <div className="routine-intro">
          <p>
            You are getting used to toiling on the island and are developing routines for your days.
          </p>
          <p className="routine-intro-hint">
            Create a routine to chain actions together. Each step runs until it naturally completes,
            then the next step starts automatically. The routine loops back to the beginning when done.
          </p>
        </div>
      )}

      {state.routines.map((routine) => {
        const isActive = activeRoutineId === routine.id;
        const currentStep = isActive ? state.activeRoutine!.currentStep : -1;
        return (
          <div key={routine.id} className={`routine-card${isActive ? " active" : ""}`}>
            <div className="routine-card-header">
              <span className="routine-card-name">{routine.name}</span>
              <div className="routine-card-buttons">
                {isActive ? (
                  <button className="stop-btn" onClick={onStopRoutine}>
                    Stop
                  </button>
                ) : (
                  <button className="routine-run-btn" onClick={() => onStartRoutine(routine.id)}>
                    Run
                  </button>
                )}
                <button className="routine-edit-btn" onClick={() => handleEdit(routine)}>
                  Edit
                </button>
                <button
                  className="routine-delete-btn"
                  onClick={() => {
                    if (confirm(`Delete "${routine.name}"?`)) {
                      onDeleteRoutine(routine.id);
                    }
                  }}
                >
                  Del
                </button>
              </div>
            </div>
            <div className="routine-steps-list">
              {routine.steps.map((step, idx) => (
                <span
                  key={idx}
                  className={`routine-step-inline${isActive && idx === currentStep ? " current" : ""}`}
                >
                  <StepDisplay step={step} index={idx} />
                  {idx < routine.steps.length - 1 && <span className="routine-arrow">&rarr;</span>}
                </span>
              ))}
              {isActive && (
                <span className="routine-loop-indicator">&circlearrowright;</span>
              )}
            </div>
          </div>
        );
      })}

      {state.routines.length < maxRoutines && (
        <button className="routine-create-btn" onClick={handleCreate}>
          + New Routine
        </button>
      )}

      {(unlockedUpgrades.length > 0 || lockedUpgrades.length > 0) && (
        <div className="routine-upgrades">
          <div className="section-title">Upgrades</div>
          {unlockedUpgrades.map((u) => (
            <div key={u.buildingId} className="routine-upgrade unlocked">
              {u.description}
            </div>
          ))}
          {lockedUpgrades.map((u) => (
            <div key={u.buildingId} className="routine-upgrade locked">
              ??? (requires a new building)
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
