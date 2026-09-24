/*
 * Water Tank Level Card
 * Animated glass tank + live consumption metrics
 * custom:water-tank-card
 */

const CARD_TYPE = "water-tank-card";

const DEFAULT_CONFIG = {
  level_entity: "",
  distance_entity: "",
  pump_entity: "",
  daily_consumption_entity: "",
  seven_day_consumption_entity: "",
  name: "Water Tank",
  capacity_liters: 1000,
  layout: "columns",
  card_height: "auto",
  tank_width: 105,
  tank_height: 178,
  border_radius: 24,
  accent_color: "#2196f3",
};

class WaterTankCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._hass = undefined;
    this._config = {};
    this._lastSignature = "";
    this._relativeTimer = null;
  }

  static getConfigForm() {
    return {
      schema: [
        {
          type: "expandable",
          name: "entities",
          title: "Tank entities",
          flatten: true,
          schema: [
            {
              name: "level_entity",
              required: true,
              selector: { entity: { domain: "sensor" } },
            },
            {
              name: "distance_entity",
              selector: { entity: { domain: "sensor" } },
            },
            {
              name: "pump_entity",
              selector: { entity: { domain: ["switch", "input_boolean"] } },
            },
            {
              name: "daily_consumption_entity",
              selector: { entity: { domain: "sensor" } },
            },
            {
              name: "seven_day_consumption_entity",
              selector: { entity: { domain: "sensor" } },
            },
          ],
        },
        {
          type: "expandable",
          name: "tank",
          title: "Tank settings",
          flatten: true,
          schema: [
            { name: "name", selector: { text: {} } },
            {
              name: "capacity_liters",
              selector: {
                number: {
                  min: 1,
                  max: 100000,
                  step: 1,
                  mode: "box",
                  unit_of_measurement: "L",
                },
              },
            },
            {
              name: "layout",
              selector: {
                select: {
                  options: [
                    { value: "columns", label: "Columns" },
                    { value: "rows", label: "Rows" },
                  ],
                  mode: "dropdown",
                },
              },
            },
          ],
        },
        {
          type: "expandable",
          name: "appearance",
          title: "Appearance",
          flatten: true,
          schema: [
            {
              name: "card_height",
              selector: { text: {} },
            },
            {
              name: "tank_width",
              selector: { number: { min: 50, max: 300, step: 1, mode: "slider", unit_of_measurement: "px" } },
            },
            {
              name: "tank_height",
              selector: { number: { min: 80, max: 500, step: 1, mode: "slider", unit_of_measurement: "px" } },
            },
            {
              name: "border_radius",
              selector: {
                number: {
                  min: 0,
                  max: 60,
                  step: 1,
                  mode: "slider",
                  unit_of_measurement: "px",
                },
              },
            },
            {
              name: "accent_color",
              selector: { text: {} },
            },
          ],
        },
      ],
      computeLabel: (schema) =>
        ({
          level_entity: "Water level entity",
          distance_entity: "Distance entity",
          pump_entity: "Pump entity",
          daily_consumption_entity: "Daily consumption entity",
          seven_day_consumption_entity: "7-day consumption entity",
          name: "Tank name",
          capacity_liters: "Tank capacity",
          layout: "Layout",
          card_height: "Card height",
          tank_width: "Tank width",
          tank_height: "Tank height",
          border_radius: "Corner radius",
          accent_color: "Accent color",
        })[schema.name] || schema.name,
      computeHelper: (schema) =>
        ({
          level_entity: "Sensor reporting tank level as 0–100%.",
          distance_entity: "Optional distance sensor, such as 36 cm.",
          pump_entity: "Optional pump entity. ON is shown as Pump ON.",
          daily_consumption_entity:
            "Optional daily consumption sensor. Its state is shown as L/d.",
          seven_day_consumption_entity:
            "Optional 7-day consumption sensor. Its state is shown as L.",
          card_height: "Use auto, 500px, 45vh, etc.",
          tank_width: "Width of the animated water tank.",
          tank_height: "Height of the animated water tank.",
          accent_color: "CSS color such as #2196f3.",
        })[schema.name],
      assertConfig: (config) => {
        if (!config.level_entity) {
          throw new Error("Water level entity is required.");
        }
        if (Number(config.capacity_liters) <= 0) {
          throw new Error("Tank capacity must be greater than 0.");
        }
      },
    };
  }

  static getStubConfig() {
    return {
      level_entity: "sensor.water_level_sensors_tank_water_level",
      distance_entity: "sensor.water_level_sensors_tank_water_level_distance",
      pump_entity: "switch.borewell_p110",
      daily_consumption_entity: "",
      seven_day_consumption_entity: "",
      name: "Water Tank",
      capacity_liters: 1000,
      layout: "columns",
      card_height: "auto",
      tank_width: 105,
      tank_height: 178,
      border_radius: 24,
      accent_color: "#2196f3",
    };
  }

  setConfig(config) {
    if (!config?.level_entity) {
      throw new Error("Water level entity is required.");
    }
    this._config = { ...DEFAULT_CONFIG, ...config };
    this._render(true);
    this._startRelativeTimer();
  }

  connectedCallback() {
    this._startRelativeTimer();
  }

  disconnectedCallback() {
    if (this._relativeTimer) {
      clearInterval(this._relativeTimer);
      this._relativeTimer = null;
    }
  }

  _startRelativeTimer() {
    if (this._relativeTimer) return;
    this._relativeTimer = setInterval(() => this._updateRelativeTime(), 1000);
  }

  _updateRelativeTime() {
    if (!this._hass || !this._config.level_entity) return;
    const el = this.shadowRoot?.querySelector("#updated-time");
    if (!el) return;
    const levelState = this._state(this._config.level_entity);
    el.textContent = "Updated " + this._relativeTime(levelState?.last_changed);
  }

  set hass(value) {
    this._hass = value;
    this._render();
  }

  get hass() {
    return this._hass;
  }

  getCardSize() {
    return 3;
  }

  getGridOptions() {
    return {
      rows: 3,
      columns: 12,
      min_rows: 3,
      min_columns: 6,
      max_columns: 12,
    };
  }

  _state(entity) {
    return entity && this._hass?.states?.[entity];
  }

  _number(entity, fallback = 0) {
    const n = Number(this._state(entity)?.state);
    return Number.isFinite(n) ? n : fallback;
  }

  _clamp(v, min, max) {
    return Math.min(max, Math.max(min, v));
  }

  _fmt(v, decimals = 1) {
    return Number(v).toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }

  _esc(v) {
    return String(v ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  _relativeTime(ts) {
    if (!ts) return "—";
    const seconds = Math.max(0, Math.floor((Date.now() - new Date(ts).getTime()) / 1000));
    if (seconds < 60) return seconds + " sec ago";
    if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      return minutes + " min ago";
    }
    if (seconds < 86400) {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return minutes ? hours + " h " + minutes + " min ago" : hours + " h ago";
    }
    return Math.floor(seconds / 86400) + " d ago";
  }

  _metricState(entity, fallback = "—") {
    const v = Number(this._state(entity)?.state);
    return Number.isFinite(v) ? this._fmt(v, 1) : fallback;
  }

  _render(force = false) {
    if (!this._hass || !this._config.level_entity) return;

    const c = this._config;
    const levelState = this._state(c.level_entity);
    const distanceState = this._state(c.distance_entity);
    const pumpState = this._state(c.pump_entity);
    const dailyConsumptionState = this._state(c.daily_consumption_entity);
    const sevenDayConsumptionState = this._state(c.seven_day_consumption_entity);
    const hasDailyConsumption = !!c.daily_consumption_entity && Number.isFinite(Number(dailyConsumptionState?.state));
    const hasSevenDayConsumption = !!c.seven_day_consumption_entity && Number.isFinite(Number(sevenDayConsumptionState?.state));

    const level = this._clamp(this._number(c.level_entity), 0, 100);
    const capacity = Math.max(1, Number(c.capacity_liters) || 1000);
    const liters = capacity * level / 100;
    const distance = Number(distanceState?.state);
    const pumpOn = ["on", "true", "1", "active"].includes(
      String(pumpState?.state || "").toLowerCase()
    );

    const signature = [
      level,
      distanceState?.state,
      pumpState?.state,
      dailyConsumptionState?.state,
      sevenDayConsumptionState?.state,
      c.name,
      c.layout,
      c.capacity_liters,
      c.card_height,
      c.tank_width,
      c.tank_height,
      c.border_radius,
      c.accent_color,
    ].join("|");

    if (!force && signature === this._lastSignature) return;
    this._lastSignature = signature;

    const name = this._esc(c.name || "Water Tank");
    const radius = Number(c.border_radius ?? 24);
    const tankWidth = Math.max(50, Number(c.tank_width) || 105);
    const tankHeight = Math.max(80, Number(c.tank_height) || 178);
    const accent = this._esc(c.accent_color || "#2196f3");
    const fill = level;
    const distanceText = Number.isFinite(distance) ? this._fmt(distance, 1) + " cm" : "—";
    const updated = this._relativeTime(levelState?.last_changed);
    const today = this._metricState(c.daily_consumption_entity);
    const seven = this._metricState(c.seven_day_consumption_entity);
    const dailyUnit = this._esc(dailyConsumptionState?.attributes?.unit_of_measurement || "L/d");
    const sevenDayUnit = this._esc(sevenDayConsumptionState?.attributes?.unit_of_measurement || "L");

    const statusText = pumpState ? (pumpOn ? "Pump ON" : "Pump OFF") : "Pump —";
    const statusClass = pumpOn ? "pump-on" : "pump-off";

    const bubbles = Array.from({ length: 12 }, (_, i) => {
      const left = 8 + ((i * 17) % 84);
      const size = 3 + (i % 4);
      const delay = (i * 0.75).toFixed(2);
      const duration = (4 + (i % 4)).toFixed(1);
      return `<i class="bubble" style="left:${left}%;width:${size}px;height:${size}px;animation-delay:${delay}s;animation-duration:${duration}s"></i>`;
    }).join("");


    this.shadowRoot.innerHTML = `
      <style>
        :host { display:block; --wt-accent:${accent}; --wt-bg:rgba(7,16,29,.96); --wt-panel:rgba(255,255,255,.055); --wt-line:rgba(255,255,255,.10); --wt-text:rgba(255,255,255,.96); --wt-muted:rgba(220,235,250,.62); }
        * { box-sizing:border-box; }
        ha-card { overflow:hidden; height:${this._esc(c.card_height || "auto")};
          min-height:0; border-radius:${radius}px; padding:0; color:var(--wt-text);
          background:radial-gradient(circle at 8% 0%,rgba(255,255,255,.07),transparent 30%),radial-gradient(circle at 100% 100%,color-mix(in srgb,var(--wt-accent) 12%,transparent),transparent 38%),var(--wt-bg);
          border:1px solid var(--wt-line); box-shadow:0 10px 28px rgba(0,0,0,.22),inset 0 1px 0 rgba(255,255,255,.06); }
        .shell { padding:10px 12px; }
        .header { display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:8px; }
        .title { font-size:17px;font-weight:800;line-height:1.1; }
        .subtitle { color:var(--wt-muted);font-size:9px;margin-top:3px; }
        .status { display:flex;align-items:center;gap:5px;padding:5px 8px;border-radius:999px;border:1px solid var(--wt-line);background:var(--wt-panel);font-size:9px;font-weight:800;white-space:nowrap; }
        .dot { width:6px;height:6px;border-radius:50%;background:#8793a1; }
        .pump-on .dot { background:#55d66f;box-shadow:0 0 8px rgba(85,214,111,.7);animation:pulse 1.6s infinite; }
        .pump-on { color:#bff7c8;border-color:rgba(85,214,111,.30);background:rgba(85,214,111,.10); }
        .main { display:grid;grid-template-columns:minmax(130px,.72fr) minmax(0,1.28fr);gap:9px;align-items:stretch; }
        .hero { min-height:${Math.max(205, tankHeight + 20)}px;border:none;background:transparent;border-radius:0;display:flex;align-items:center;justify-content:center;position:relative;overflow:visible;padding:7px; }
        .tank-wrap { position:relative;width:${tankWidth + 20}px;height:${tankHeight}px; }
        .tank { width:${tankWidth}px;height:${tankHeight}px;left:18px;right:auto;top:0;bottom:auto; }
        .tank { position:absolute;inset:0;overflow:hidden;border-radius:22px 22px 18px 18px;border:2px solid rgba(255,255,255,.27);background:linear-gradient(90deg,rgba(255,255,255,.10),rgba(255,255,255,.025) 38%,rgba(255,255,255,.07));box-shadow:inset 8px 0 15px rgba(255,255,255,.045),inset -8px 0 15px rgba(0,0,0,.16),0 10px 22px rgba(0,0,0,.22); }
        .tank::before { content:"";position:absolute;left:10%;right:10%;top:5px;height:7px;border-radius:50%;border:1px solid rgba(255,255,255,.24);background:rgba(255,255,255,.05);z-index:5; }
        .water { position:absolute;left:0;right:0;bottom:0;height:${fill}%;background:linear-gradient(180deg,rgba(100,181,246,.92),rgba(33,150,243,.78) 45%,rgba(13,71,161,.88));transition:height 1.2s cubic-bezier(.2,.7,.2,1);box-shadow:0 -5px 18px rgba(33,150,243,.22); }
        .water::before { content:"";position:absolute;left:-12%;top:-6px;width:124%;height:13px;border-radius:50%;background:rgba(170,225,255,.62);box-shadow:0 0 10px rgba(120,205,255,.45);animation:wave 3s ease-in-out infinite; }
        .water::after { content:"";position:absolute;inset:0;background:repeating-linear-gradient(100deg,transparent 0 28px,rgba(255,255,255,.035) 29px 32px);animation:flow 7s linear infinite; }
        .bubble { position:absolute;bottom:4%;border-radius:50%;background:rgba(255,255,255,.5);opacity:0;animation:rise 5s linear infinite;z-index:2; }
        .tank-value { position:absolute;inset:0;z-index:8;display:flex;flex-direction:column;align-items:center;justify-content:center;text-shadow:0 2px 8px rgba(0,0,0,.45); }
        .percent { font-size:27px;font-weight:900;line-height:1; }
        .liters { margin-top:4px;font-size:10px;font-weight:700;opacity:.92; }
        .side { min-width:0;display:flex;flex-direction:column;gap:7px; }
        .top-metrics { display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px; }
        .metric { min-width:0;padding:8px 6px;border-radius:10px;background:var(--wt-panel);border:1px solid rgba(255,255,255,.06); }
        .metric-label { color:var(--wt-muted);font-size:8px;text-transform:uppercase;letter-spacing:.45px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis; }
        .metric-value { margin-top:3px;font-size:12px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis; }
        .settings { flex:1;padding:8px 10px;border-radius:11px;background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.07);display:flex;flex-direction:column;justify-content:center;gap:6px; }
        .setting { display:flex;justify-content:space-between;align-items:center;gap:8px;min-width:0;font-size:10px; }
        .setting span { color:var(--wt-muted); }
        .setting b { font-size:10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis; }
        .bottom { display:flex;justify-content:space-between;align-items:center;gap:8px;padding:1px 2px 0;color:var(--wt-muted);font-size:9px; }
        .bottom strong { color:var(--wt-text);font-size:12px; }
        @keyframes wave { 0%,100% { transform:translateX(-4%) rotate(-1deg); }50% { transform:translateX(4%) rotate(1deg); } }
        @keyframes flow { to { background-position:180px 0; } }
        @keyframes rise { 0% { transform:translateY(0) scale(.7);opacity:0; }12% { opacity:.55; }90% { opacity:.08; }100% { transform:translateY(-160px) scale(1.15);opacity:0; } }
        @keyframes pulse { 50% { opacity:.45; } }
        @media (max-width:520px) {
          .shell { padding:9px 10px; }.header { margin-bottom:6px; }.title { font-size:16px; }.subtitle { font-size:8px; }.status { font-size:8px;padding:4px 7px; }
          .main { grid-template-columns:minmax(${Math.min(180, tankWidth + 42)}px,${Math.min(180, tankWidth + 42)}px) minmax(0,1fr);gap:7px; }.hero { min-height:${Math.max(180, tankHeight + 14)}px;border:none;background:transparent;padding:5px; }.tank-wrap { width:${tankWidth + 20}px;height:${tankHeight}px; }.tank { width:${tankWidth}px;height:${tankHeight}px;left:15px;right:auto;top:0;bottom:auto; }.inlet-pipe { left:-1px;bottom:-1px;transform:scale(.88);transform-origin:left bottom; }.percent { font-size:24px; }.liters { font-size:9px; }
          .top-metrics { gap:4px; }.metric { padding:7px 4px; }.metric-label { font-size:7px; }.metric-value { font-size:10px; }
          .settings { padding:7px 8px;gap:5px; }.setting,.setting b { font-size:9px; }.bottom { font-size:8px; }.bottom strong { font-size:11px; }
        }
      </style>

      <ha-card>
        <div class="shell">
          <div class="header">
            <div>
              <div class="title">${name}</div>
              <div class="subtitle">Live tank level • ${this._fmt(capacity, 0)} L capacity</div>
            </div>
            <div class="status ${statusClass}">
              <span class="dot"></span>${statusText}
            </div>
          </div>

          <div class="main">
            <section class="hero">
              <div class="tank-wrap">
                <div class="tank">
                  <div class="water">${bubbles}</div>
                  <div class="tank-value">
                    <div class="percent">${this._fmt(level, 1)}%</div>
                    <div class="liters">${this._fmt(liters, 0)} L</div>
                  </div>
                </div>
              </div>
            </section>
            <section class="side">
              <div class="top-metrics" style="grid-template-columns:repeat(${1 + Number(hasDailyConsumption) + Number(hasSevenDayConsumption)},minmax(0,1fr));">
                ${hasDailyConsumption ? `<div class="metric"><div class="metric-label">Daily</div><div class="metric-value">${today} ${dailyUnit}</div></div>` : ""}
                ${hasSevenDayConsumption ? `<div class="metric"><div class="metric-label">7 days</div><div class="metric-value">${seven} ${sevenDayUnit}</div></div>` : ""}
                <div class="metric"><div class="metric-label">Distance</div><div class="metric-value">${distanceText}</div></div>
              </div>
              <div class="settings">
                <div class="setting"><span>Source</span><b>Water Level Sensor</b></div>
                <div class="setting"><span>Range</span><b>0 → 100%</b></div>
                <div class="setting"><span>Level</span><b>${this._fmt(level, 1)}%</b></div>
                ${hasDailyConsumption ? `<div class="setting"><span>Today</span><b>${today} ${dailyUnit}</b></div>` : ""}
              </div>
            </section>
          </div>
          <div class="bottom"><span><strong>${this._fmt(liters, 0)}</strong> Liter left</span><span id="updated-time">Updated ${updated}</span></div>
                </div>
        </div>
      </ha-card>
    `;
  }
}

if (!customElements.get(CARD_TYPE)) {
  customElements.define(CARD_TYPE, WaterTankCard);
}

window.customCards = window.customCards || [];
window.customCards.push({
  type: CARD_TYPE,
  name: "Water Tank Card",
  description: "Animated glass water tank with live level, pump and consumption metrics.",
  preview: true,
  documentationURL: "https://github.com/DVishnuManiKanTh/Water-Tank-Level-Card",
  getEntitySuggestion: (hass, entityId) => {
    const state = hass?.states?.[entityId];
    if (!state || entityId.split(".")[0] !== "sensor") return null;
    const unit = state.attributes?.unit_of_measurement;
    if (unit !== "%" && state.attributes?.device_class !== "water") return null;
    return {
      config: {
        type: "custom:water-tank-card",
        ...WaterTankCard.getStubConfig(),
        level_entity: entityId,
      },
    };
  },
});

console.info(
  "%c Water Tank Card %c visual editor enabled ",
  "background:#2196f3;color:white;padding:3px 7px;border-radius:4px 0 0 4px",
  "background:#263238;color:#fff;padding:3px 7px;border-radius:0 4px 4px 0"
);
