import { useMemo, useState } from "react";
import type { GameViewActions, GameViewModel } from "../types";

type BestiaryEntryId = "hunter" | "chaser" | "ghost" | "turret" | "helper" | "thrower";

type BestiaryEntry = {
  id: BestiaryEntryId;
  name: string;
  role: string;
  hearts: { kind: "count"; value: number } | { kind: "text"; value: string };
  damage: string;
  activity: string;
  description: string;
};

const BESTIARY_ENTRIES: BestiaryEntry[] = [
  {
    id: "hunter",
    name: "Hunter",
    role: "Main pursuit unit",
    hearts: { kind: "count", value: 3 },
    damage: "1 heart on contact",
    activity: "Day and night",
    description:
      "Hunters patrol in lines, scan with a vision cone, then chase your last known position. They can place chasers and turrets if you slip away.",
  },
  {
    id: "chaser",
    name: "Chaser",
    role: "Fast ground pressure",
    hearts: { kind: "count", value: 1 },
    damage: "1 heart on contact",
    activity: "Day and night (spawned by hunters)",
    description:
      "A chaser takes shortest routes through the maze and closes distance aggressively. Spikes can stun it and one sword hit removes it.",
  },
  {
    id: "ghost",
    name: "Ghost",
    role: "Night relay scout",
    hearts: { kind: "text", value: "Immune" },
    damage: "No direct damage",
    activity: "Night only",
    description:
      "Ghosts glide through walls on looped air paths. When one spots you, it relays your position to a patrol hunter and escorts that hunter toward you.",
  },
  {
    id: "turret",
    name: "Turret",
    role: "Static line-of-sight shooter",
    hearts: { kind: "text", value: "Bomb-destroyable" },
    damage: "1 heart per projectile hit",
    activity: "Day and night (hunter-built)",
    description:
      "Turrets sweep constantly, then lock into a narrow tracking beam when they see you. They fire repeatedly until line-of-sight is broken long enough.",
  },
  {
    id: "helper",
    name: "Helper",
    role: "Path patrol ambusher",
    hearts: { kind: "text", value: "Bomb-destroyable" },
    damage: "1 heart on contact",
    activity: "Day and night (artifact progression)",
    description:
      "Helpers run back and forth on generated patrol lines. They are lethal on contact and can clear traps and boosters as they move.",
  },
  {
    id: "thrower",
    name: "Arrow Thrower",
    role: "Embedded wall trap",
    hearts: { kind: "text", value: "Wall device" },
    damage: "1 heart per arrow hit",
    activity: "Day and night",
    description:
      "Arrow throwers are hidden in wall tiles and periodically fire down corridors. Destroying their wall section with bombs disables them.",
  },
];

type BestiaryMenuContentProps = {
  view: Pick<GameViewModel, "touchEnabled" | "bestiaryReturnToGame">;
  actions: Pick<GameViewActions, "onCloseBestiary">;
};

export function BestiaryMenuContent({ view, actions }: BestiaryMenuContentProps) {
  const [selectedId, setSelectedId] = useState<BestiaryEntryId>(BESTIARY_ENTRIES[0].id);
  const selected = useMemo(
    () => BESTIARY_ENTRIES.find((entry) => entry.id === selectedId) ?? BESTIARY_ENTRIES[0],
    [selectedId]
  );

  return (
    <>
      <div className="menu-title">Bestiary</div>
      <div className="menu-sub">Known monsters, enemies, and how they behave in the labyrinth.</div>
      <div className="bestiary-layout">
        <div className="bestiary-list" role="listbox" aria-label="Monsters and enemies">
          {BESTIARY_ENTRIES.map((entry) => {
            const active = entry.id === selected.id;
            return (
              <button
                key={entry.id}
                className={`bestiary-list-item${active ? " active" : ""}`}
                onClick={() => setSelectedId(entry.id)}
                type="button"
                role="option"
                aria-selected={active}
              >
                <span className="bestiary-list-portrait">{renderBestiaryImage(entry.id, "small")}</span>
                <span className="bestiary-list-copy">
                  <span className="bestiary-list-name">{entry.name}</span>
                  <span className="bestiary-list-role">{entry.role}</span>
                </span>
              </button>
            );
          })}
        </div>
        <article className="bestiary-detail" aria-live="polite">
          <div className="bestiary-detail-portrait">{renderBestiaryImage(selected.id, "large")}</div>
          <div className="bestiary-detail-heading">{selected.name}</div>
          <div className="bestiary-detail-role">{selected.role}</div>
          <div className="bestiary-stats">
            <div className="bestiary-stat">
              <span>Hearts</span>
              {renderHeartsStat(selected.hearts)}
            </div>
            <div className="bestiary-stat">
              <span>Damage</span>
              <strong>{selected.damage}</strong>
            </div>
            <div className="bestiary-stat">
              <span>Activity</span>
              <strong>{selected.activity}</strong>
            </div>
          </div>
          <p className="bestiary-description">{selected.description}</p>
        </article>
      </div>
      <div className="menu-options">
        <button className="menu-button" onClick={actions.onCloseBestiary}>
          Back
        </button>
      </div>
      <div className="menu-hint">
        {view.touchEnabled ? (
          view.bestiaryReturnToGame
            ? "Tap a creature to inspect details, then tap Back to return to paused game."
            : "Tap a creature to inspect details, then tap Back."
        ) : (
          <>
            Press <span className="keycap">Esc</span> to go back
          </>
        )}
      </div>
    </>
  );
}

function renderHeartsStat(hearts: BestiaryEntry["hearts"]) {
  if (hearts.kind === "text") {
    return <strong>{hearts.value}</strong>;
  }

  return (
    <span className="bestiary-hearts-row" aria-label={`${hearts.value} hearts`}>
      {Array.from({ length: hearts.value }, (_, index) => (
        <svg key={index} className="bestiary-heart-icon" viewBox="0 0 16 14" aria-hidden="true">
          <path d="M8 13C4.2 10.4 1 8.1 1 4.8 1 2.7 2.5 1 4.6 1 5.9 1 7.1 1.6 8 2.8 8.9 1.6 10.1 1 11.4 1 13.5 1 15 2.7 15 4.8c0 3.3-3.2 5.6-7 8.2z" />
        </svg>
      ))}
    </span>
  );
}

function renderBestiaryImage(id: BestiaryEntryId, size: "small" | "large") {
  const classes = `bestiary-avatar ${size}`;
  switch (id) {
    case "hunter":
      return (
        <svg className={classes} viewBox="0 0 64 64" aria-hidden="true">
          <rect x="2" y="2" width="60" height="60" fill="#0f3b2e" />
          <rect x="22" y="22" width="20" height="20" fill="#ffc06e" />
          <rect x="30" y="30" width="4" height="4" fill="#16120e" />
        </svg>
      );
    case "chaser":
      return (
        <svg className={classes} viewBox="0 0 64 64" aria-hidden="true">
          <rect x="2" y="2" width="60" height="60" fill="#0f3b2e" />
          <rect x="22" y="22" width="20" height="20" fill="#ff4e4e" />
        </svg>
      );
    case "ghost":
      return (
        <svg className={classes} viewBox="0 0 64 64" aria-hidden="true">
          <rect x="2" y="2" width="60" height="60" fill="#101523" />
          <circle cx="32" cy="31" r="15" fill="rgba(232,246,255,0.2)" />
          <circle cx="32" cy="31" r="10" fill="rgba(245,252,255,0.75)" />
          <circle cx="28" cy="29" r="1.5" fill="rgba(36,54,74,0.78)" />
          <circle cx="36" cy="29" r="1.5" fill="rgba(36,54,74,0.78)" />
          <ellipse cx="32" cy="35" rx="3" ry="1.6" fill="rgba(52,72,94,0.68)" />
          <path d="M14 50c12-5 24-5 36 0" stroke="rgba(255,255,255,0.34)" strokeWidth="2" fill="none" strokeDasharray="2 2" />
        </svg>
      );
    case "turret":
      return (
        <svg className={classes} viewBox="0 0 64 64" aria-hidden="true">
          <rect x="2" y="2" width="60" height="60" fill="#0f3b2e" />
          <rect x="22" y="22" width="20" height="20" fill="#aa3a3a" />
          <rect x="30" y="30" width="4" height="4" fill="#220e0e" />
          <path d="M32 32L46 24" stroke="rgba(255,160,160,0.95)" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "helper":
      return (
        <svg className={classes} viewBox="0 0 64 64" aria-hidden="true">
          <rect x="2" y="2" width="60" height="60" fill="#0f3b2e" />
          <rect x="22" y="22" width="20" height="20" fill="#8f2ad9" />
          <rect x="27" y="27" width="3" height="2" fill="#e9d6ff" />
          <rect x="34" y="27" width="3" height="2" fill="#e9d6ff" />
        </svg>
      );
    case "thrower":
      return (
        <svg className={classes} viewBox="0 0 64 64" aria-hidden="true">
          <rect x="2" y="2" width="60" height="60" fill="#0f3b2e" />
          <rect x="16" y="16" width="32" height="32" fill="#1f1f2b" />
          <rect x="22" y="31" width="17" height="2" fill="#7a8396" />
          <path d="M39 32h9" stroke="#7a8396" strokeWidth="2" />
          <path d="M46 29l6 3-6 3" fill="#7a8396" />
        </svg>
      );
  }
}
