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
  consumption_entity: "",
  name: "Water Tank",
  capacity_liters: 1000,
  layout: "columns",
  card_height: "auto",
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
              name: "consumption_entity",
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
          consumption_entity: "Consumption entity",
          name: "Tank name",
          capacity_liters: "Tank capacity",
          layout: "Layout",
          card_height: "Card height",
          border_radius: "Corner radius",
          accent_color: "Accent color",
        })[schema.name] || schema.name,
      computeHelper: (schema) =>
        ({
          level_entity: "Sensor reporting tank level as 0–100%.",
          distance_entity: "Optional distance sensor, such as 36 cm.",
          pump_entity: "Optional pump entity. ON is shown as Pump ON.",
          consumption_entity:
            "Optional Water Consumption sensor. Uses today_liters, seven_day_liters and seven_day_average_l_day attributes.",
          card_height: "Use auto, 500px, 45vh, etc.",
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
      level_entity: "sensor.esp8266_text_tank_water_level",
      distance_entity: "sensor.esp8266_text_tank_water_level_distance",
      pump_entity: "switch.borewell_p110",
      consumption_entity: "",
      name: "Water Tank",
      capacity_liters: 1000,
      layout: "columns",
      card_height: "auto",
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
  }

  set hass(value) {
    this._hass = value;
    this._render();
  }

  get hass() {
    return this._hass;
  }

  getCardSize() {
    return 6;
  }

  getGridOptions() {
    return {
      rows: 6,
      columns: 12,
      min_rows: 4,
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
    if (seconds < 60) return "just now";
    if (seconds < 3600) return Math.floor(seconds / 60) + " min ago";
    if (seconds < 86400) return Math.floor(seconds / 3600) + " h ago";
    return Math.floor(seconds / 86400) + " d ago";
  }

  _findConsumptionEntity() {
    if (this._config.consumption_entity) return this._config.consumption_entity;
    const states = Object.values(this._hass?.states || {});
    const found = states.find((s) =>
      s.entity_id?.startsWith("sensor.") &&
      (
        s.attributes?.seven_day_liters !== undefined ||
        s.attributes?.seven_day_average_l_day !== undefined
      )
    );
    return found?.entity_id || "";
  }

  _metric(consumption, attr, fallback = "—") {
    const v = Number(consumption?.attributes?.[attr]);
    return Number.isFinite(v) ? this._fmt(v, 1) : fallback;
  }

  _render(force = false) {
    if (!this._hass || !this._config.level_entity) return;

    const c = this._config;
    const levelState = this._state(c.level_entity);
    const distanceState = this._state(c.distance_entity);
    const pumpState = this._state(c.pump_entity);
    const consumptionEntity = this._findConsumptionEntity();
    const consumptionState = this._state(consumptionEntity);

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
      consumptionState?.state,
      JSON.stringify(consumptionState?.attributes || {}),
      c.name,
      c.layout,
      c.capacity_liters,
      c.card_height,
      c.border_radius,
      c.accent_color,
    ].join("|");

    if (!force && signature === this._lastSignature) return;
    this._lastSignature = signature;

    const name = this._esc(c.name || "Water Tank");
    const radius = Number(c.border_radius ?? 24);
    const accent = this._esc(c.accent_color || "#2196f3");
    const fill = level;
    const distanceText = Number.isFinite(distance) ? this._fmt(distance, 1) + " cm" : "—";
    const updated = this._relativeTime(levelState?.last_changed);
    const today = this._metric(consumptionState, "today_liters");
    const seven = this._metric(consumptionState, "seven_day_liters");
    const average = this._metric(consumptionState, "seven_day_average_l_day");

    const statusText = pumpState ? (pumpOn ? "Pump ON" : "Pump OFF") : "Pump —";
    const statusClass = pumpOn ? "pump-on" : "pump-off";

    const bubbles = Array.from({ length: 12 }, (_, i) => {
      const left = 8 + ((i * 17) % 84);
      const size = 3 + (i % 4);
      const delay = (i * 0.75).toFixed(2);
      const duration = (4 + (i % 4)).toFixed(1);
      return `<i class="bubble" style="left:${left}%;width:${size}px;height:${size}px;animation-delay:${delay}s;animation-duration:${duration}s"></i>`;
    }).join("");

    const marks = [100, 75, 50, 25, 0].map((m) =>
      `<span style="bottom:${m}%"><b></b>${m}</span>`
    ).join("");

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display:block;
          --wt-accent:${accent};
          --wt-bg:rgba(7,16,29,.96);
          --wt-panel:rgba(255,255,255,.055);
          --wt-line:rgba(255,255,255,.10);
          --wt-text:rgba(255,255,255,.96);
          --wt-muted:rgba(220,235,250,.62);
        }
        * { box-sizing:border-box; }
        ha-card {
          position:relative;
          overflow:hidden;
          height:${this._esc(c.card_height || "auto")};
          min-height:410px;
          border-radius:${radius}px;
          padding:0;
          color:var(--wt-text);
          background:
            radial-gradient(circle at 12% 0%, rgba(255,255,255,.10), transparent 28%),
            radial-gradient(circle at 100% 100%, color-mix(in srgb, var(--wt-accent) 18%, transparent), transparent 35%),
            var(--wt-bg);
          border:1px solid var(--wt-line);
          box-shadow:0 18px 45px rgba(0,0,0,.28), inset 0 1px 0 rgba(255,255,255,.08);
        }
        .shell { position:relative; z-index:1; padding:18px; }
        .header { display:flex; justify-content:space-between; align-items:center; gap:12px; margin-bottom:14px; }
        .title { font-size:20px; font-weight:800; letter-spacing:.1px; }
        .subtitle { color:var(--wt-muted); font-size:11px; margin-top:3px; }
        .status {
          display:flex; align-items:center; gap:7px; padding:7px 11px; border-radius:999px;
          border:1px solid var(--wt-line); background:var(--wt-panel); font-size:11px; font-weight:800;
          white-space:nowrap;
        }
        .dot { width:7px; height:7px; border-radius:50%; background:#8793a1; box-shadow:0 0 8px rgba(255,255,255,.15); }
        .pump-on .dot { background:#55d66f; box-shadow:0 0 12px rgba(85,214,111,.75); animation:pulse 1.6s infinite; }
        .pump-on { color:#bff7c8; border-color:rgba(85,214,111,.30); background:rgba(85,214,111,.10); }
        .main { display:grid; grid-template-columns:minmax(230px,1fr) minmax(250px,1fr); gap:16px; }
        .hero, .metrics { border:1px solid var(--wt-line); background:rgba(255,255,255,.035); border-radius:20px; }
        .hero { min-height:340px; display:flex; align-items:center; justify-content:center; padding:20px; position:relative; overflow:hidden; }
        .hero-glow { position:absolute; width:240px; height:240px; border-radius:50%; background:var(--wt-accent); opacity:.08; filter:blur(45px); }
        .tank-wrap { position:relative; width:180px; height:280px; }
        .tank {
          position:absolute; inset:0; overflow:hidden; border-radius:34px 34px 28px 28px;
          border:2px solid rgba(255,255,255,.32);
          background:linear-gradient(90deg,rgba(255,255,255,.11),rgba(255,255,255,.025) 38%,rgba(255,255,255,.09));
          box-shadow:inset 12px 0 24px rgba(255,255,255,.055), inset -12px 0 24px rgba(0,0,0,.18), 0 16px 35px rgba(0,0,0,.25);
        }
        .tank::before {
          content:""; position:absolute; left:8%; right:8%; top:7px; height:9px; border-radius:50%;
          border:1px solid rgba(255,255,255,.28); background:rgba(255,255,255,.06); z-index:5;
        }
        .water {
          position:absolute; left:0; right:0; bottom:0; height:${fill}%;
          background:linear-gradient(180deg,rgba(100,181,246,.92),rgba(33,150,243,.78) 45%,rgba(13,71,161,.88));
          transition:height 1.2s cubic-bezier(.2,.7,.2,1);
          box-shadow:0 -8px 30px rgba(33,150,243,.24);
        }
        .water::before {
          content:""; position:absolute; left:-12%; top:-8px; width:124%; height:18px;
          border-radius:50%; background:rgba(170,225,255,.65);
          box-shadow:0 0 14px rgba(120,205,255,.55);
          animation:wave 3s ease-in-out infinite;
        }
        .water::after {
          content:""; position:absolute; inset:0;
          background:repeating-linear-gradient(100deg,transparent 0 32px,rgba(255,255,255,.035) 33px 36px);
          animation:flow 7s linear infinite;
        }
        .bubble { position:absolute; bottom:4%; border-radius:50%; background:rgba(255,255,255,.5); opacity:.0; animation:rise 5s linear infinite; z-index:2; }
        .tank-value { position:absolute; inset:0; z-index:8; display:flex; flex-direction:column; align-items:center; justify-content:center; text-shadow:0 2px 12px rgba(0,0,0,.45); }
        .percent { font-size:42px; font-weight:900; line-height:1; }
        .liters { margin-top:8px; font-size:14px; font-weight:700; opacity:.92; }
        .marks { position:absolute; right:-52px; top:0; bottom:0; width:44px; }
        .marks span { position:absolute; right:0; display:flex; align-items:center; gap:5px; transform:translateY(50%); color:var(--wt-muted); font-size:9px; }
        .marks b { display:block; width:18px; height:1px; background:rgba(255,255,255,.30); }
        .side { display:flex; flex-direction:column; gap:12px; min-width:0; }
        .big-number { padding:16px 18px; border-radius:18px; background:linear-gradient(145deg,rgba(255,255,255,.08),rgba(255,255,255,.025)); border:1px solid var(--wt-line); }
        .big-label { color:var(--wt-muted); font-size:11px; text-transform:uppercase; letter-spacing:.8px; }
        .big-value { margin-top:5px; font-size:34px; font-weight:900; line-height:1.1; }
        .big-value small { font-size:14px; color:var(--wt-muted); font-weight:700; }
        .metrics { padding:12px; display:grid; grid-template-columns:1fr 1fr; gap:9px; }
        .metric { padding:12px; border-radius:14px; background:var(--wt-panel); border:1px solid rgba(255,255,255,.07); min-width:0; }
        .metric-label { color:var(--wt-muted); font-size:10px; text-transform:uppercase; letter-spacing:.55px; }
        .metric-value { margin-top:4px; font-size:17px; font-weight:800; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .footer { display:flex; justify-content:space-between; gap:10px; color:var(--wt-muted); font-size:10px; padding:0 2px; }
        @keyframes wave { 0%,100% { transform:translateX(-4%) rotate(-1deg); } 50% { transform:translateX(4%) rotate(1deg); } }
        @keyframes flow { to { background-position:180px 0; } }
        @keyframes rise { 0% { transform:translateY(0) scale(.7); opacity:0; } 12% { opacity:.55; } 90% { opacity:.08; } 100% { transform:translateY(-260px) scale(1.15); opacity:0; } }
        @keyframes pulse { 50% { opacity:.45; } }
        @media (max-width:700px) {
          ha-card { min-height:0; }
          .shell { padding:14px; }
          .main { grid-template-columns:1fr; }
          .hero { min-height:310px; }
          .tank-wrap { width:155px; height:250px; }
          .percent { font-size:36px; }
        }
        @media (max-width:430px) {
          .header { align-items:flex-start; }
          .status { font-size:9px; padding:6px 8px; }
          .title { font-size:17px; }
          .metrics { grid-template-columns:1fr 1fr; }
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
              <div class="hero-glow"></div>
              <div class="tank-wrap">
                <div class="tank">
                  <div class="water">${bubbles}</div>
                  <div class="tank-value">
                    <div class="percent">${this._fmt(level, 1)}%</div>
                    <div class="liters">${this._fmt(liters, 0)} L</div>
                  </div>
                </div>
                <div class="marks">${marks}</div>
              </div>
            </section>

            <section class="side">
              <div class="big-number">
                <div class="big-label">Water remaining</div>
                <div class="big-value">${this._fmt(liters, 0)} <small>/ ${this._fmt(capacity, 0)} L</small></div>
              </div>

              <div class="metrics">
                <div class="metric">
                  <div class="metric-label">Distance</div>
                  <div class="metric-value">${distanceText}</div>
                </div>
                <div class="metric">
                  <div class="metric-label">Level</div>
                  <div class="metric-value">${this._fmt(level, 1)}%</div>
                </div>
                <div class="metric">
                  <div class="metric-label">Today</div>
                  <div class="metric-value">${today === "—" ? "—" : today + " L"}</div>
                </div>
                <div class="metric">
                  <div class="metric-label">7 Days</div>
                  <div class="metric-value">${seven === "—" ? "—" : seven + " L"}</div>
                </div>
                <div class="metric">
                  <div class="metric-label">Average</div>
                  <div class="metric-value">${average === "—" ? "—" : average + " L/d"}</div>
                </div>
                <div class="metric">
                  <div class="metric-label">Updated</div>
                  <div class="metric-value">${updated}</div>
                </div>
              </div>

              <div class="footer">
                <span>Animated glass tank</span>
                <span>Home Assistant</span>
              </div>
            </section>
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
