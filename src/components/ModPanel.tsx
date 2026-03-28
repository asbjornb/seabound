import { useCallback, useEffect, useRef, useState } from "react";
import {
  deleteModPack,
  exportModPack,
  getActiveModId,
  importModPack,
  listModPacks,
  saveModPack,
  switchToMod,
  ValidationResult,
} from "../data/modding";

interface Props {
  onClose: () => void;
  onModSwitch: () => void;
}

interface ModInfo {
  id: string;
  name: string;
  version: string;
}

export function ModPanel({ onClose, onModSwitch }: Props) {
  const [mods, setMods] = useState<ModInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeModId = getActiveModId();

  const refreshMods = useCallback(async () => {
    try {
      const list = await listModPacks();
      setMods(list);
    } catch {
      setMods([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refreshMods();
  }, [refreshMods]);

  const handleImport = useCallback(
    async (file: File) => {
      setImportStatus(null);
      setValidation(null);
      const text = await file.text();
      const result = importModPack(text);
      setValidation(result);

      if (result.valid && result.pack) {
        try {
          await saveModPack(result.pack);
          setImportStatus(`Imported "${result.pack.name}" (${result.pack.id})`);
          refreshMods();
        } catch (e) {
          setImportStatus(`Failed to save: ${e}`);
        }
      }
    },
    [refreshMods]
  );

  const handleSwitch = useCallback(
    async (modId: string) => {
      try {
        await switchToMod(modId);
        onModSwitch();
      } catch (e) {
        setImportStatus(`Failed to switch: ${e}`);
      }
    },
    [onModSwitch]
  );

  const handleDelete = useCallback(
    async (modId: string) => {
      if (modId === activeModId) {
        setImportStatus("Can't delete the active mod. Switch to base game first.");
        return;
      }
      await deleteModPack(modId);
      refreshMods();
    },
    [activeModId, refreshMods]
  );

  return (
    <div className="mod-panel-overlay" onClick={onClose}>
      <div className="mod-panel" onClick={(e) => e.stopPropagation()}>
        <div className="mod-panel-header">
          <h2>Mods</h2>
          <button className="mod-panel-close" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="mod-panel-body">
          <div className="mod-section">
            <div className="mod-section-title">Active</div>
            <div className="mod-active">
              {activeModId === "base" ? "Base Game (SeaBound)" : activeModId}
            </div>
          </div>

          <div className="mod-section">
            <div className="mod-section-title">Actions</div>
            <div className="mod-actions">
              <button className="mod-btn" onClick={() => exportModPack()}>
                Export current data pack
              </button>
              <button
                className="mod-btn"
                onClick={() => fileInputRef.current?.click()}
              >
                Import mod pack
              </button>
              {activeModId !== "base" && (
                <button
                  className="mod-btn"
                  onClick={() => handleSwitch("base")}
                >
                  Switch to base game
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              style={{ display: "none" }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImport(file);
                e.target.value = "";
              }}
            />
          </div>

          {validation && (
            <div className="mod-section">
              <div className="mod-section-title">Validation</div>
              {validation.valid ? (
                <div className="mod-valid">Valid mod pack</div>
              ) : (
                <div className="mod-invalid">
                  {validation.errors.map((e, i) => (
                    <div key={i} className="mod-error">
                      Error: {e}
                    </div>
                  ))}
                </div>
              )}
              {validation.warnings.length > 0 && (
                <div className="mod-warnings">
                  {validation.warnings.map((w, i) => (
                    <div key={i} className="mod-warning">
                      Warning: {w}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {importStatus && (
            <div className="mod-status">{importStatus}</div>
          )}

          {!loading && mods.length > 0 && (
            <div className="mod-section">
              <div className="mod-section-title">Installed Mods</div>
              {mods.map((mod) => (
                <div key={mod.id} className="mod-item">
                  <div className="mod-item-info">
                    <span className="mod-item-name">{mod.name}</span>
                    <span className="mod-item-version">v{mod.version}</span>
                    {mod.id === activeModId && (
                      <span className="mod-item-active">(active)</span>
                    )}
                  </div>
                  <div className="mod-item-actions">
                    {mod.id !== activeModId && (
                      <button
                        className="mod-btn-sm"
                        onClick={() => handleSwitch(mod.id)}
                      >
                        Activate
                      </button>
                    )}
                    <button
                      className="mod-btn-sm danger"
                      onClick={() => handleDelete(mod.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mod-section">
            <div className="mod-section-title">How to create a mod</div>
            <div className="mod-guide">
              <ol>
                <li>Click "Export current data pack" to download the base game data as JSON.</li>
                <li>Edit the JSON file — add resources, recipes, actions, skills, etc.</li>
                <li>Change the "id" field to a unique name for your mod.</li>
                <li>Click "Import mod pack" to load it. Validation errors will be shown.</li>
                <li>Click "Activate" to play with the mod. Each mod gets its own save.</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
