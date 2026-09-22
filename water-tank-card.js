/*
 * Water Tank Level Card
 * Custom Lovelace card with built-in Home Assistant visual editor.
 *
 * Card type:
 *   custom:water-tank-card
 *
 * Designed for Home Assistant 2026.x
 */

const CARD_TYPE = "water-tank-card";

const DEFAULT_CONFIG = {
  type: `custom:${CARD_TYPE}`,
  level_entity: "",
  distance_entity: "",
  pump_entity: "",
  name: "Water Tank",
  capacity_liters: 1000,
  card_height: "500px",
  tank_height: "360px",
  tank_width: "210px",
  border_radius: 26,
  background:
    "linear-gradient(145deg, rgba(20,35,52,0.96), rgba(5,15,27,0.98))",
};

class WaterTankCard extends HTMLElement {
  constructor() {
    super();

    this.attachShadow({ mode: "open" });

    this._hass = undefined;
    this._config = {};
    this._lastSignature = "";
  }

  /* =========================================================
     HOME ASSISTANT VISUAL EDITOR
     ========================================================= */

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

              selector: {
                entity: {
                  domain: "sensor",
                },
              },
            },

            {
              name: "distance_entity",

              selector: {
                entity: {
                  domain: "sensor",
                },
              },
            },

            {
              name: "pump_entity",

              selector: {
                entity: {
                  domain: ["switch", "input_boolean"],
                },
              },
            },
          ],
        },

        {
          type: "expandable",
          name: "tank",
          title: "Tank settings",
          flatten: true,

          schema: [
            {
              name: "name",

              selector: {
                text: {},
              },
            },

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

              selector: {
                text: {},
              },
            },

            {
              name: "tank_height",

              selector: {
                text: {},
              },
            },

            {
              name: "tank_width",

              selector: {
                text: {},
              },
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
              name: "background",

              selector: {
                text: {
                  multiline: true,
                },
              },
            },
          ],
        },
      ],

      computeLabel: (schema) => {
        const labels = {
          level_entity: "Water level entity",
          distance_entity: "Distance entity",
          pump_entity: "Pump entity",
          name: "Tank name",
          capacity_liters: "Tank capacity",
          card_height: "Card height",
          tank_height: "Tank height",
          tank_width: "Tank width",
          border_radius: "Corner radius",
          background: "Card background",
        };

        return labels[schema.name] || schema.name;
      },

      computeHelper: (schema) => {
        const helpers = {
          level_entity:
            "Sensor should normally report the tank level as 0–100%.",

          distance_entity:
            "Optional distance sensor, for example 36 cm.",

          pump_entity:
            "Optional pump entity. ON is shown as Pump ON.",

          card_height:
            "CSS size such as 500px, 45vh, or auto.",

          tank_height:
            "CSS size such as 360px.",

          tank_width:
            "CSS size such as 210px.",

          background:
            "CSS background. A linear-gradient() gives the glass effect.",
        };

        return helpers[schema.name] || undefined;
      },

      assertConfig: (config) => {
        if (!config.level_entity) {
          throw new Error("Water level entity is required.");
        }

        if (
          config.capacity_liters !== undefined &&
          Number(config.capacity_liters) <= 0
        ) {
          throw new Error("Tank capacity must be greater than 0.");
        }
      },
    };
  }

  /* =========================================================
     DEFAULT CONFIG FOR CARD PICKER
     ========================================================= */

  static getStubConfig() {
    return {
      level_entity: "sensor.esp8266_text_tank_water_level",
      distance_entity:
        "sensor.esp8266_text_tank_water_level_distance",
      pump_entity: "switch.borewell_p110",

      name: "Water Tank",

      capacity_liters: 1000,

      card_height: "500px",
      tank_height: "360px",
      tank_width: "210px",

      border_radius: 26,

      background:
        "linear-gradient(145deg, rgba(20,35,52,0.96), rgba(5,15,27,0.98))",
    };
  }

  /* =========================================================
     SET CONFIG
     ========================================================= */

  setConfig(config) {
    if (!config || !config.level_entity) {
      throw new Error("Water level entity is required.");
    }

    this._config = {
      ...DEFAULT_CONFIG,
      ...config,
    };

    this._render(true);
  }

  /* =========================================================
     HOME ASSISTANT HASS
     ========================================================= */

  set hass(value) {
    this._hass = value;

    this._render();
  }

  get hass() {
    return this._hass;
  }

  /* =========================================================
     CARD SIZE
     ========================================================= */

  getCardSize() {
    const height = parseInt(
      this._config?.card_height,
      10
    );

    if (Number.isFinite(height)) {
      return Math.max(
        4,
        Math.ceil(height / 50)
      );
    }

    return 6;
  }

  /* =========================================================
     SECTIONS VIEW GRID
     ========================================================= */

  getGridOptions() {
    return {
      rows: 6,
      columns: 12,

      min_rows: 4,
      min_columns: 6,

      max_columns: 12,
    };
  }

  /* =========================================================
     GET ENTITY STATE
     ========================================================= */

  _state(entity) {
    if (
      !entity ||
      !this._hass ||
      !this._hass.states
    ) {
      return undefined;
    }

    return this._hass.states[entity];
  }

  /* =========================================================
     NUMBER
     ========================================================= */

  _number(entity, fallback = 0) {
    const state = this._state(entity);

    const number = Number(
      state?.state
    );

    return Number.isFinite(number)
      ? number
      : fallback;
  }

  /* =========================================================
     HTML ESCAPE
     ========================================================= */

  _escape(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  /* =========================================================
     CLAMP
     ========================================================= */

  _clamp(value, min, max) {
    return Math.min(
      max,
      Math.max(min, value)
    );
  }

  /* =========================================================
     NUMBER FORMAT
     ========================================================= */

  _formatNumber(value, decimals = 1) {
    return Number(value).toLocaleString(
      undefined,
      {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }
    );
  }

  /* =========================================================
     RELATIVE TIME
     ========================================================= */

  _relativeTime(timestamp) {
    if (!timestamp) {
      return "—";
    }

    const diff = Math.max(
      0,
      Math.floor(
        (
          Date.now() -
          new Date(timestamp).getTime()
        ) / 1000
      )
    );

    if (diff < 60) {
      return "just now";
    }

    if (diff < 3600) {
      return `${Math.floor(diff / 60)} min ago`;
    }

    if (diff < 86400) {
      return `${Math.floor(diff / 3600)} h ago`;
    }

    return `${Math.floor(diff / 86400)} d ago`;
  }

  /* =========================================================
     RENDER
     ========================================================= */

  _render(force = false) {
    if (
      !this._hass ||
      !this._config?.level_entity
    ) {
      return;
    }

    const c = this._config;

    /* -------------------------------------------------------
       ENTITIES
       ------------------------------------------------------- */

    const levelState =
      this._state(c.level_entity);

    const distanceState =
      this._state(c.distance_entity);

    const pumpState =
      this._state(c.pump_entity);

    /* -------------------------------------------------------
       LEVEL
       ------------------------------------------------------- */

    const level = this._clamp(
      this._number(
        c.level_entity
      ),
      0,
      100
    );

    /* -------------------------------------------------------
       CAPACITY
       ------------------------------------------------------- */

    const capacity =
      Math.max(
        1,
        Number(c.capacity_liters) || 1000
      );

    /* -------------------------------------------------------
       LITERS
       ------------------------------------------------------- */

    const liters =
      (capacity * level) / 100;

    /* -------------------------------------------------------
       DISTANCE
       ------------------------------------------------------- */

    const distance =
      distanceState
        ? Number(distanceState.state)
        : Number.NaN;

    /* -------------------------------------------------------
       PUMP
       ------------------------------------------------------- */

    const pumpOn =
      pumpState &&
      [
        "on",
        "true",
        "1",
        "active",
      ].includes(
        String(
          pumpState.state
        ).toLowerCase()
      );

    /* -------------------------------------------------------
       RENDER SIGNATURE
       ------------------------------------------------------- */

    const signature = [
      level,
      distanceState?.state,
      pumpState?.state,

      c.name,
      c.card_height,
      c.tank_height,
      c.tank_width,
      c.border_radius,
      c.background,
    ].join("|");

    if (
      !force &&
      signature === this._lastSignature
    ) {
      return;
    }

    this._lastSignature =
      signature;

    /* -------------------------------------------------------
       CONFIG VALUES
       ------------------------------------------------------- */

    const fillHeight =
      Math.max(
        0,
        Math.min(
          100,
          level
        )
      );

    const tankHeight =
      c.tank_height ||
      "360px";

    const tankWidth =
      c.tank_width ||
      "210px";

    const cardHeight =
      c.card_height ||
      "500px";

    const radius =
      Number(
        c.border_radius ?? 26
      );

    /* -------------------------------------------------------
       BUBBLES
       ------------------------------------------------------- */

    const bubbleData = [
      [12, 13, 4, 11],
      [28, 8, 3, 15],
      [43, 18, 5, 9],
      [58, 10, 3, 13],
      [73, 21, 4, 10],
      [87, 7, 3, 16],
      [22, 28, 2, 12],
      [67, 30, 2, 14],
    ];

    const bubbles =
      bubbleData
        .map(
          (
            [
              left,
              bottom,
              size,
              delay,
            ]
          ) =>
            `
            <span
              class="bubble"
              style="
                left:${left}%;
                bottom:${bottom}%;
                width:${size}px;
                height:${size}px;
                animation-delay:${delay}s
              "
            ></span>
            `
        )
        .join("");

    /* -------------------------------------------------------
       SCALE MARKINGS
       ------------------------------------------------------- */

    const marks =
      [
        100,
        75,
        50,
        25,
        0,
      ]
        .map(
          (mark) =>
            `
            <div
              class="mark"
              style="bottom:${mark}%"
            >
              <span>${mark}</span>
            </div>
            `
        )
        .join("");

    /* -------------------------------------------------------
       DISPLAY VALUES
       ------------------------------------------------------- */

    const tankLiters =
      this._formatNumber(
        liters,
        0
      );

    const distanceText =
      Number.isFinite(distance)
        ? `${this._formatNumber(
            distance,
            1
          )} cm`
        : "—";

    const pumpClass =
      pumpOn
        ? "on"
        : "off";

    const pumpText =
      pumpState
        ? pumpOn
          ? "PUMP ON"
          : "PUMP OFF"
        : "PUMP —";

    const updated =
      levelState?.last_changed
        ? this._relativeTime(
            levelState.last_changed
          )
        : "—";

    const name =
      this._escape(
        c.name ||
        "Water Tank"
      );

    /* -------------------------------------------------------
       CIRCULAR GAUGE
       ------------------------------------------------------- */

    const gaugeRadius = 46;

    const gaugeCircumference =
      2 *
      Math.PI *
      gaugeRadius;

    const gaugeOffset =
      gaugeCircumference -
      (
        level / 100
      ) *
        gaugeCircumference;

    /* =======================================================
       SHADOW DOM
       ======================================================= */

    this.shadowRoot.innerHTML = `

      <style>

        :host {
          display: block;
          width: 100%;
          box-sizing: border-box;

          --wt-blue: #2196f3;
          --wt-blue-light: #64b5f6;

          --wt-text:
            rgba(255,255,255,.96);

          --wt-muted:
            rgba(220,235,250,.68);
        }

        * {
          box-sizing: border-box;
        }

        /* =====================================================
           CARD
           ===================================================== */

        ha-card {

          position: relative;

          height:
            ${this._escape(
              cardHeight
            )};

          min-height: 300px;

          overflow: hidden;

          padding: 0;

          border-radius:
            ${radius}px;

          background:
            ${c.background ||
            DEFAULT_CONFIG.background};

          color:
            var(--wt-text);

          border:
            1px solid
            rgba(255,255,255,.11);

          box-shadow:

            0 18px 45px
            rgba(0,0,0,.28),

            inset 0 1px 0
            rgba(255,255,255,.09);
        }

        ha-card::before {

          content: "";

          position: absolute;

          inset: 0;

          pointer-events: none;

          background:

            radial-gradient(
              circle at 15% 5%,
              rgba(255,255,255,.12),
              transparent 28%
            ),

            radial-gradient(
              circle at 90% 100%,
              rgba(33,150,243,.11),
              transparent 32%
            );
        }

        /* =====================================================
           MAIN LAYOUT
           ===================================================== */

        .wrap {

          position: relative;

          height: 100%;

          width: 100%;

          display: grid;

          grid-template-columns:
            minmax(190px, 1.1fr)
            minmax(180px, .9fr);

          gap: 14px;

          padding: 20px;
        }

        /* =====================================================
           LEFT SIDE
           ===================================================== */

        .left {

          min-width: 0;

          display: flex;

          flex-direction: column;

          align-items: center;

          justify-content:
            space-between;
        }

        /* =====================================================
           TITLE
           ===================================================== */

        .title {

          width: 100%;

          text-align: center;

          font-size:
            clamp(
              17px,
              2.2vw,
              24px
            );

          font-weight: 700;

          letter-spacing: .2px;

          text-shadow:
            0 2px 12px
            rgba(0,0,0,.35);
        }

        /* =====================================================
           TANK AREA
           ===================================================== */

        .tank-area {

          position: relative;

          display: flex;

          justify-content: center;

          align-items: center;

          flex: 1;

          width: 100%;

          min-height: 0;

          margin: 5px 0;
        }

        /* =====================================================
           TANK
           ===================================================== */

        .tank {

          position: relative;

          height:
            ${this._escape(
              tankHeight
            )};

          width:
            ${this._escape(
              tankWidth
            )};

          max-height:
            calc(100% - 4px);

          max-width: 70%;

          min-width: 120px;

          border-radius:
            28px 28px 24px 24px;

          overflow: hidden;

          border:
            2px solid
            rgba(255,255,255,.28);

          background:

            linear-gradient(
              90deg,
              rgba(255,255,255,.12),
              rgba(255,255,255,.025) 17%,
              rgba(255,255,255,.02) 80%,
              rgba(255,255,255,.13)
            );

          box-shadow:

            inset 10px 0 18px
            rgba(255,255,255,.045),

            inset -10px 0 18px
            rgba(0,0,0,.16),

            0 15px 30px
            rgba(0,0,0,.25);
        }

        /* =====================================================
           GLASS REFLECTION
           ===================================================== */

        .tank::before {

          content: "";

          position: absolute;

          left: 8%;

          top: 2%;

          bottom: 3%;

          width: 9%;

          border-radius:
            999px;

          background:

            linear-gradient(
              180deg,
              rgba(255,255,255,.50),
              rgba(255,255,255,.06)
            );

          filter:
            blur(.4px);

          opacity: .55;

          z-index: 8;

          pointer-events: none;
        }

        .tank::after {

          content: "";

          position: absolute;

          inset: 0;

          border-radius:
            inherit;

          box-shadow:

            inset 0 0 0 1px
            rgba(255,255,255,.10),

            inset 0 -18px 30px
            rgba(0,0,0,.14);

          pointer-events: none;

          z-index: 9;
        }

        /* =====================================================
           WATER
           ===================================================== */

        .water {

          position: absolute;

          left: -4%;

          width: 108%;

          bottom: 0;

          height:
            ${fillHeight}%;

          min-height:
            ${
              fillHeight > 0
                ? "2px"
                : "0"
            };

          background:

            linear-gradient(
              180deg,
              rgba(100,181,246,.90) 0%,
              rgba(33,150,243,.88) 45%,
              rgba(3,93,174,.95) 100%
            );

          box-shadow:

            0 -5px 18px
            rgba(33,150,243,.34),

            inset 0 8px 15px
            rgba(255,255,255,.13);

          transition:
            height 1s ease;

          overflow: hidden;

          z-index: 3;
        }

        /* =====================================================
           WATER WAVES
           ===================================================== */

        .water::before,
        .water::after {

          content: "";

          position: absolute;

          top: -6px;

          left: -10%;

          width: 120%;

          height: 18px;

          border-radius: 50%;

          background:
            rgba(255,255,255,.18);

          filter:
            blur(.3px);
        }

        .water::before {

          animation:
            wave1 3.5s
            ease-in-out
            infinite;
        }

        .water::after {

          top: -2px;

          opacity: .35;

          animation:
            wave2 5s
            ease-in-out
            infinite reverse;
        }

        @keyframes wave1 {

          0%,
          100% {
            transform:
              translateX(-4%)
              scaleY(1);
          }

          50% {
            transform:
              translateX(4%)
              scaleY(.65);
          }
        }

        @keyframes wave2 {

          0%,
          100% {
            transform:
              translateX(4%)
              scaleY(.75);
          }

          50% {
            transform:
              translateX(-4%)
              scaleY(1.1);
          }
        }

        /* =====================================================
           BUBBLES
           ===================================================== */

        .bubble {

          position: absolute;

          border-radius: 50%;

          border:
            1px solid
            rgba(255,255,255,.45);

          background:
            rgba(255,255,255,.13);

          animation:
            bubble 7s
            linear
            infinite;

          opacity: .75;
        }

        @keyframes bubble {

          0% {

            transform:
              translateY(20px)
              scale(.7);

            opacity: 0;
          }

          12% {
            opacity: .7;
          }

          80% {
            opacity: .35;
          }

          100% {

            transform:
              translateY(-150px)
              scale(1.05);

            opacity: 0;
          }
        }

        /* =====================================================
           WATER TEXT
           ===================================================== */

        .water-label {

          position: absolute;

          inset: 0;

          z-index: 10;

          display: flex;

          align-items: center;

          justify-content: center;

          flex-direction: column;

          pointer-events: none;

          text-shadow:
            0 2px 8px
            rgba(0,0,0,.45);
        }

        .percent {

          font-size:
            clamp(
              27px,
              4vw,
              44px
            );

          font-weight: 800;

          line-height: 1;
        }

        .liters {

          margin-top: 7px;

          font-size: 14px;

          color:
            rgba(255,255,255,.86);
        }

        /* =====================================================
           TANK MARKINGS
           ===================================================== */

        .marks {

          position: absolute;

          right: -48px;

          top: 0;

          bottom: 0;

          width: 42px;

          z-index: 12;
        }

        .mark {

          position: absolute;

          left: 0;

          width: 100%;

          height: 1px;

          display: flex;

          align-items: center;

          color:
            rgba(255,255,255,.55);

          font-size: 10px;
        }

        .mark::before {

          content: "";

          width: 18px;

          height: 1px;

          margin-right: 5px;

          background:
            rgba(255,255,255,.34);
        }

        .mark span {

          white-space:
            nowrap;
        }

        /* =====================================================
           BOTTOM META
           ===================================================== */

        .bottom-meta {

          display: flex;

          gap: 9px;

          flex-wrap: wrap;

          justify-content: center;

          color:
            var(--wt-muted);

          font-size: 11px;
        }

        .meta-pill {

          padding:
            6px 9px;

          border-radius:
            999px;

          background:
            rgba(255,255,255,.055);

          border:
            1px solid
            rgba(255,255,255,.08);

          backdrop-filter:
            blur(8px);
        }

        /* =====================================================
           RIGHT SIDE
           ===================================================== */

        .right {

          min-width: 0;

          display: flex;

          flex-direction: column;

          justify-content: center;

          align-items: center;

          gap: 15px;
        }

        /* =====================================================
           CIRCULAR GAUGE
           ===================================================== */

        .gauge {

          position: relative;

          width:
            min(190px, 70%);

          aspect-ratio: 1;

          display: grid;

          place-items: center;
        }

        .gauge svg {

          width: 100%;

          height: 100%;

          transform:
            rotate(-90deg);
        }

        .track {

          fill: none;

          stroke:
            rgba(255,255,255,.09);

          stroke-width: 10;
        }

        .progress {

          fill: none;

          stroke:
            url(#wtGradient);

          stroke-width: 10;

          stroke-linecap:
            round;

          stroke-dasharray:
            ${gaugeCircumference};

          stroke-dashoffset:
            ${gaugeOffset};

          transition:
            stroke-dashoffset 1s ease;

          filter:
            drop-shadow(
              0 0 7px
              rgba(33,150,243,.35)
            );
        }

        .gauge-center {

          position: absolute;

          inset: 0;

          display: flex;

          flex-direction: column;

          align-items: center;

          justify-content: center;
        }

        .gauge-percent {

          font-size: 34px;

          font-weight: 800;
        }

        .gauge-small {

          margin-top: 4px;

          color:
            var(--wt-muted);

          font-size: 12px;
        }

        /* =====================================================
           INFORMATION BOXES
           ===================================================== */

        .info {

          width:
            min(260px, 100%);

          display: grid;

          grid-template-columns:
            1fr 1fr;

          gap: 9px;
        }

        .info-box {

          min-width: 0;

          padding: 11px;

          border-radius: 16px;

          background:
            rgba(255,255,255,.055);

          border:
            1px solid
            rgba(255,255,255,.08);

          backdrop-filter:
            blur(10px);
        }

        .info-label {

          color:
            var(--wt-muted);

          font-size: 10px;

          text-transform:
            uppercase;

          letter-spacing: .7px;
        }

        .info-value {

          margin-top: 4px;

          font-size: 15px;

          font-weight: 700;

          overflow: hidden;

          text-overflow: ellipsis;

          white-space: nowrap;
        }

        /* =====================================================
           PUMP
           ===================================================== */

        .pump {

          width:
            min(260px, 100%);

          text-align: center;

          padding:
            10px 14px;

          border-radius:
            999px;

          font-size: 12px;

          font-weight: 800;

          letter-spacing: .5px;

          border:
            1px solid
            rgba(255,255,255,.09);

          background:
            rgba(255,255,255,.055);
        }

        .pump.on {

          color:
            #b9f6c5;

          background:
            rgba(76,175,80,.20);

          border-color:
            rgba(76,175,80,.35);

          box-shadow:
            0 0 18px
            rgba(76,175,80,.10);
        }

        .pump.off {

          color:
            rgba(255,255,255,.62);
        }

        /* =====================================================
           FOOTER
           ===================================================== */

        .footer {

          width:
            min(260px, 100%);

          color:
            rgba(220,235,250,.48);

          text-align: center;

          font-size: 10px;
        }

        /* =====================================================
           MOBILE
           ===================================================== */

        @media (max-width: 560px) {

          ha-card {
            min-height: 460px;
          }

          .wrap {

            grid-template-columns:
              1fr;

            grid-template-rows:
              1fr auto;

            padding: 14px;

            gap: 4px;
          }

          .right {

            display: grid;

            grid-template-columns:
              100px 1fr;

            gap: 10px;

            align-items: center;
          }

          .gauge {

            width: 100px;
          }

          .gauge-percent {

            font-size: 23px;
          }

          .gauge-small {

            font-size: 9px;
          }

          .info {

            width: 100%;
          }

          .pump,
          .footer {

            grid-column:
              1 / -1;
          }

          .tank {

            max-width: 55%;
          }
        }

      </style>

      <ha-card>

        <div class="wrap">

          <!-- =================================================
               LEFT
               ================================================= -->

          <section class="left">

            <div class="title">
              ${name}
            </div>

            <div class="tank-area">

              <div class="tank">

                <div class="water">

                  ${bubbles}

                </div>

                <div class="water-label">

                  <div class="percent">
                    ${this._formatNumber(
                      level,
                      1
                    )}%
                  </div>

                  <div class="liters">
                    ${tankLiters} L
                  </div>

                </div>

              </div>

              <div class="marks">
                ${marks}
              </div>

            </div>

            <div class="bottom-meta">

              <div class="meta-pill">
                Capacity
                ${this._formatNumber(
                  capacity,
                  0
                )} L
              </div>

              <div class="meta-pill">
                Updated
                ${updated}
              </div>

            </div>

          </section>

          <!-- =================================================
               RIGHT
               ================================================= -->

          <section class="right">

            <!-- GAUGE -->

            <div class="gauge">

              <svg
                viewBox="0 0 120 120"
                aria-hidden="true"
              >

                <defs>

                  <linearGradient
                    id="wtGradient"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                  >

                    <stop
                      offset="0%"
                      stop-color="#90caf9"
                    />

                    <stop
                      offset="45%"
                      stop-color="#2196f3"
                    />

                    <stop
                      offset="100%"
                      stop-color="#0d47a1"
                    />

                  </linearGradient>

                </defs>

                <circle
                  class="track"
                  cx="60"
                  cy="60"
                  r="${gaugeRadius}"
                />

                <circle
                  class="progress"
                  cx="60"
                  cy="60"
                  r="${gaugeRadius}"
                />

              </svg>

              <div class="gauge-center">

                <div class="gauge-percent">
                  ${this._formatNumber(
                    level,
                    1
                  )}%
                </div>

                <div class="gauge-small">
                  ${tankLiters}
                  /
                  ${this._formatNumber(
                    capacity,
                    0
                  )} L
                </div>

              </div>

            </div>

            <!-- INFO -->

            <div class="info">

              <div class="info-box">

                <div class="info-label">
                  Distance
                </div>

                <div class="info-value">
                  ${distanceText}
                </div>

              </div>

              <div class="info-box">

                <div class="info-label">
                  Level
                </div>

                <div class="info-value">
                  ${this._formatNumber(
                    level,
                    1
                  )}%
                </div>

              </div>

            </div>

            <!-- PUMP -->

            <div
              class="pump ${pumpClass}"
            >
              ${pumpText}
            </div>

            <!-- FOOTER -->

            <div class="footer">
              Animated glass tank • live Home Assistant data
            </div>

          </section>

        </div>

      </ha-card>
    `;
  }
}

/* ===========================================================
   REGISTER CUSTOM ELEMENT
   =========================================================== */

if (
  !customElements.get(CARD_TYPE)
) {
  customElements.define(
    CARD_TYPE,
    WaterTankCard
  );
}

/* ===========================================================
   HOME ASSISTANT CARD PICKER
   =========================================================== */

window.customCards =
  window.customCards || [];

window.customCards.push({

  type: CARD_TYPE,

  name:
    "Water Tank Card",

  description:
    "Animated glass water tank with built-in visual editor.",

  preview: true,

  documentationURL:
    "https://github.com/DVishnuManiKanTh/Water-Tank-Level-Card",

  /* =========================================================
     ENTITY SUGGESTION
     ========================================================= */

  getEntitySuggestion:
    (hass, entityId) => {

      const state =
        hass?.states?.[entityId];

      if (
        !state ||
        entityId.split(".")[0] !==
          "sensor"
      ) {
        return null;
      }

      const unit =
        state.attributes
          ?.unit_of_measurement;

      if (
        unit !== "%" &&
        state.attributes
          ?.device_class !==
          "water"
      ) {
        return null;
      }

      return {

        config: {

          ...WaterTankCard.getStubConfig(),

          level_entity:
            entityId,
        },
      };
    },
});

/* ===========================================================
   CONSOLE MESSAGE
   =========================================================== */

console.info(

  `%c ${CARD_TYPE} %c visual editor enabled `,

  "background:#2196f3;color:white;padding:3px 7px;border-radius:4px 0 0 4px",

  "background:#263238;color:#fff;padding:3px 7px;border-radius:0 4px 4px 0"

);
