import type { TemperatureUnit } from "../types/weather";

export function TemperatureUnitToggle({
  unit,
  onChange,
}: {
  unit: TemperatureUnit;
  onChange: (unit: TemperatureUnit) => void;
}) {
  return (
    <div className="settings-row">
      <span className="settings-row-label">Temperature</span>
      <div className="temp-unit-toggle" role="group" aria-label="Temperature unit">
        <button
          type="button"
          className={unit === "celsius" ? "active" : ""}
          aria-pressed={unit === "celsius"}
          onClick={() => onChange("celsius")}
        >
          °C
        </button>
        <button
          type="button"
          className={unit === "fahrenheit" ? "active" : ""}
          aria-pressed={unit === "fahrenheit"}
          onClick={() => onChange("fahrenheit")}
        >
          °F
        </button>
      </div>
    </div>
  );
}
