import { US_STATES, StateData } from "./gameData";

const STATE_POSITIONS: Record<string, { x: number; y: number; w: number; h: number }> = {
  WA: { x: 55,  y: 55,  w: 80, h: 45 },
  OR: { x: 55,  y: 105, w: 80, h: 50 },
  CA: { x: 50,  y: 160, w: 75, h: 160 },
  NV: { x: 90,  y: 160, w: 65, h: 110 },
  ID: { x: 130, y: 85,  w: 70, h: 90 },
  MT: { x: 155, y: 58,  w: 110, h: 65 },
  WY: { x: 175, y: 130, w: 90, h: 65 },
  UT: { x: 150, y: 200, w: 70, h: 80 },
  AZ: { x: 145, y: 270, w: 85, h: 90 },
  CO: { x: 200, y: 210, w: 90, h: 60 },
  NM: { x: 195, y: 275, w: 85, h: 85 },
  ND: { x: 255, y: 75,  w: 95, h: 55 },
  SD: { x: 255, y: 133, w: 95, h: 60 },
  NE: { x: 255, y: 195, w: 100, h: 55 },
  KS: { x: 260, y: 245, w: 100, h: 55 },
  OK: { x: 257, y: 302, w: 110, h: 55 },
  TX: { x: 235, y: 310, w: 135, h: 130 },
  MN: { x: 315, y: 80,  w: 85, h: 80 },
  IA: { x: 315, y: 193, w: 85, h: 55 },
  MO: { x: 320, y: 250, w: 85, h: 65 },
  AR: { x: 328, y: 315, w: 80, h: 55 },
  LA: { x: 330, y: 370, w: 80, h: 55 },
  WI: { x: 365, y: 118, w: 75, h: 70 },
  IL: { x: 365, y: 193, w: 60, h: 90 },
  MS: { x: 365, y: 325, w: 60, h: 70 },
  MI: { x: 400, y: 110, w: 80, h: 80 },
  IN: { x: 400, y: 200, w: 60, h: 70 },
  KY: { x: 392, y: 258, w: 90, h: 50 },
  TN: { x: 380, y: 305, w: 100, h: 50 },
  AL: { x: 388, y: 338, w: 60, h: 70 },
  OH: { x: 445, y: 185, w: 75, h: 70 },
  WV: { x: 455, y: 235, w: 65, h: 55 },
  VA: { x: 458, y: 268, w: 90, h: 48 },
  NC: { x: 450, y: 305, w: 100, h: 48 },
  SC: { x: 462, y: 335, w: 72, h: 52 },
  GA: { x: 430, y: 350, w: 75, h: 70 },
  FL: { x: 415, y: 385, w: 90, h: 90 },
  PA: { x: 480, y: 180, w: 85, h: 55 },
  NY: { x: 510, y: 130, w: 95, h: 70 },
  NJ: { x: 538, y: 195, w: 35, h: 50 },
  DE: { x: 543, y: 220, w: 28, h: 35 },
  MD: { x: 505, y: 225, w: 75, h: 38 },
  CT: { x: 553, y: 175, w: 35, h: 30 },
  RI: { x: 572, y: 168, w: 22, h: 25 },
  MA: { x: 553, y: 148, w: 55, h: 30 },
  VT: { x: 548, y: 118, w: 30, h: 40 },
  NH: { x: 562, y: 110, w: 30, h: 45 },
  ME: { x: 575, y: 80,  w: 50, h: 65 },
  AK: { x: 60,  y: 390, w: 100, h: 75 },
  HI: { x: 175, y: 415, w: 80, h: 40 },
};

const CLICKABLE_STATES = new Set(["TX", "CA", "FL", "NY", "IL", "WA", "CO", "GA"]);

interface USMapProps {
  onSelect: (state: StateData) => void;
  selected?: string | null;
}

export function USMap({ onSelect, selected }: USMapProps) {
  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <svg
        viewBox="0 0 680 480"
        className="w-full"
        style={{ filter: "drop-shadow(0 4px 24px rgba(0,0,0,0.10))" }}
      >
        {Object.entries(STATE_POSITIONS).map(([abbr, pos]) => {
          const stateData = US_STATES.find((s) => s.abbr === abbr);
          const isClickable = CLICKABLE_STATES.has(abbr);
          const isSelected = selected === abbr;

          return (
            <g key={abbr}>
              <rect
                x={pos.x}
                y={pos.y}
                width={pos.w}
                height={pos.h}
                rx={3}
                fill={
                  isSelected
                    ? "#059669"
                    : isClickable
                    ? "#d1fae5"
                    : "#e5e7eb"
                }
                stroke={
                  isSelected
                    ? "#047857"
                    : isClickable
                    ? "#6ee7b7"
                    : "#d1d5db"
                }
                strokeWidth={isSelected ? 2.5 : 1.5}
                style={{
                  cursor: isClickable ? "pointer" : "default",
                  transition: "fill 0.15s, stroke 0.15s",
                }}
                onClick={() => {
                  if (isClickable && stateData) onSelect(stateData);
                }}
                onMouseEnter={(e) => {
                  if (isClickable && !isSelected) {
                    (e.target as SVGRectElement).setAttribute("fill", "#a7f3d0");
                  }
                }}
                onMouseLeave={(e) => {
                  if (isClickable && !isSelected) {
                    (e.target as SVGRectElement).setAttribute("fill", "#d1fae5");
                  }
                }}
              />
              {pos.w > 45 && (
                <text
                  x={pos.x + pos.w / 2}
                  y={pos.y + pos.h / 2 + 4}
                  textAnchor="middle"
                  fontSize={pos.w > 70 ? 11 : 9}
                  fontWeight={isClickable ? "700" : "400"}
                  fill={isSelected ? "#fff" : isClickable ? "#065f46" : "#9ca3af"}
                  style={{ pointerEvents: "none", userSelect: "none" }}
                >
                  {abbr}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <p className="text-center text-xs text-muted-foreground mt-2">
        Green states are playable — more regions coming soon
      </p>
    </div>
  );
}
