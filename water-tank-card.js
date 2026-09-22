class WaterTankCard extends HTMLElement {
  setConfig(config) {
    if (!config.level_entity) {
      throw new Error("water-tank-card: level_entity is required");
    }

    this.config = {
      name: "Water Tank",
      capacity_liters: 1000,
      ...config,
    };

    if (!this.shadowRoot) {
      this.attachShadow({ mode: "open" });
    }
  }

  set hass(hass) {
    this._hass = hass;
    this.render();
  }

  getCardSize() {
    return 6;
  }

  escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  getLevelColor(level) {
    if (level < 20) return "#ef4444";
    if (level < 40) return "#f59e0b";
    if (level < 60) return "#eab308";
    if (level < 80) return "#22c55e";
    return "#22a7ff";
  }

  render() {
    if (!this.shadowRoot || !this._hass) return;

    const c = this.config;
    const states = this._hass.states;

    let level = Number(states[c.level_entity]?.state);

    if (!Number.isFinite(level)) {
      level = 0;
    }

    level = Math.max(0, Math.min(100, level));

    const distance = Number(
      states[c.distance_entity]?.state
    );

    const pump =
      c.pump_entity &&
      states[c.pump_entity]?.state === "on";

    const capacity = Number(c.capacity_liters) || 1000;

    const liters = Math.round((capacity * level) / 100);

    const color = this.getLevelColor(level);

    const name = this.escapeHtml(
      c.name || "Water Tank"
    );

    const distanceText = Number.isFinite(distance)
      ? `${distance.toFixed(1)} cm`
      : "--";

    const pumpText = pump
      ? "PUMP ON"
      : "PUMP OFF";

    const pumpColor = pump
      ? "#22c55e"
      : "var(--secondary-text-color)";

    /*
     * Deterministic bubbles.
     * These don't use random numbers, so HA re-renders
     * won't produce strange visual changes.
     */
    const bubbles = [
      [18, 82, 2.2, 5.2],
      [31, 66, 1.5, 4.2],
      [44, 78, 2.5, 6.0],
      [57, 57, 1.7, 4.8],
      [69, 72, 2.0, 5.5],
      [79, 48, 1.4, 4.0],
      [25, 43, 1.3, 5.8],
      [51, 36, 1.8, 4.5],
      [64, 28, 1.2, 5.0],
    ];

    const bubbleHtml = bubbles
      .map(
        (b, i) => `
          <span
            class="bubble bubble-${i}"
            style="
              left:${b[0]}%;
              bottom:${b[1]}%;
              width:${b[2] * 2}px;
              height:${b[2] * 2}px;
              --rise:${b[3]}s;
            "
          ></span>
        `
      )
      .join("");

    /*
     * Tank level markings.
     */
    const markings = [100, 75, 50, 25, 0]
      .map(
        (value) => `
          <div
            class="mark mark-${value}"
            style="bottom:${value}%"
          >
            <span class="mark-line"></span>
            <span class="mark-label">${value}%</span>
          </div>
        `
      )
      .join("");

    /*
     * Water surface waves.
     */
    const waves = `
      <svg
        class="waves"
        viewBox="0 0 500 80"
        preserveAspectRatio="none"
      >
        <path
          class="wave wave-back"
          d="
            M0,40
            C55,15 105,65 165,40
            C225,15 275,65 335,40
            C395,15 445,65 500,40
            L500,80
            L0,80 Z
          "
        ></path>

        <path
          class="wave wave-front"
          d="
            M0,43
            C55,68 105,18 165,43
            C225,68 275,18 335,43
            C395,68 445,18 500,43
            L500,80
            L0,80 Z
          "
        ></path>
      </svg>
    `;

    this.shadowRoot.innerHTML = `
      <style>

        :host {
          display: block;
          width: 100%;
          box-sizing: border-box;
        }

        ha-card {
          overflow: hidden;
          position: relative;
          border-radius: 26px;

          background:
            radial-gradient(
              circle at 15% 10%,
              rgba(255,255,255,.14),
              transparent 28%
            ),
            radial-gradient(
              circle at 85% 90%,
              rgba(0,140,255,.13),
              transparent 35%
            ),
            linear-gradient(
              145deg,
              rgba(30,45,65,.92),
              rgba(8,18,30,.96)
            );

          border: 1px solid rgba(255,255,255,.12);

          box-shadow:
            0 15px 45px rgba(0,0,0,.30),
            inset 0 1px 0 rgba(255,255,255,.08);

          color: var(--primary-text-color);
        }

        * {
          box-sizing: border-box;
        }

        .container {
          padding: 18px;
          font-family: var(--primary-font-family);
        }

        /* =========================
           HEADER
           ========================= */

        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 12px;
        }

        .title {
          display: flex;
          align-items: center;
          gap: 9px;

          font-size: 20px;
          font-weight: 700;
          letter-spacing: .2px;
        }

        .title-icon {
          width: 34px;
          height: 34px;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 12px;

          background:
            linear-gradient(
              145deg,
              rgba(0,190,255,.25),
              rgba(0,90,255,.10)
            );

          box-shadow:
            inset 0 0 15px rgba(0,180,255,.12);
        }

        .title-icon svg {
          width: 22px;
          height: 22px;
          fill: #20bfff;
          filter: drop-shadow(0 0 6px rgba(0,180,255,.6));
        }

        .pump-status {
          display: flex;
          align-items: center;
          gap: 7px;

          padding: 7px 11px;
          border-radius: 20px;

          font-size: 11px;
          font-weight: 700;
          letter-spacing: .4px;

          color: ${pumpColor};

          background: ${
            pump
              ? "rgba(34,197,94,.12)"
              : "rgba(128,128,128,.10)"
          };

          border: 1px solid ${
            pump
              ? "rgba(34,197,94,.28)"
              : "rgba(255,255,255,.08)"
          };
        }

        .pump-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;

          background: ${pump ? "#22c55e" : "#888"};

          box-shadow:
            0 0 ${
              pump ? "10px rgba(34,197,94,.9)" : "none"
            };

          ${
            pump
              ? "animation:pulse 1.5s infinite;"
              : ""
          }
        }

        /* =========================
           MAIN LAYOUT
           ========================= */

        .main {
          display: grid;
          grid-template-columns: minmax(190px, 1fr) minmax(140px, .8fr);
          gap: 18px;
          align-items: center;
        }

        /* =========================
           GLASS TANK
           ========================= */

        .tank-area {
          position: relative;
          height: 330px;

          display: flex;
          align-items: center;
          justify-content: center;
        }

        .tank {
          position: relative;

          width: min(190px, 70%);
          height: 300px;

          border-radius:
            30px
            30px
            24px
            24px;

          overflow: hidden;

          background:
            linear-gradient(
              90deg,
              rgba(255,255,255,.13),
              rgba(255,255,255,.035) 22%,
              rgba(255,255,255,.02) 50%,
              rgba(255,255,255,.10) 78%,
              rgba(255,255,255,.035)
            );

          border:
            2px solid rgba(210,240,255,.38);

          box-shadow:
            inset 10px 0 25px rgba(255,255,255,.07),
            inset -10px 0 25px rgba(0,0,0,.14),
            inset 0 0 35px rgba(90,200,255,.07),
            0 14px 35px rgba(0,0,0,.28);
        }

        /*
         * Tank top rim
         */
        .tank::before {
          content: "";

          position: absolute;
          z-index: 10;

          top: -2px;
          left: 50%;

          width: 106%;
          height: 25px;

          transform: translateX(-50%);

          border-radius: 50%;

          border:
            2px solid rgba(220,245,255,.42);

          background:
            linear-gradient(
              180deg,
              rgba(255,255,255,.16),
              rgba(255,255,255,.03)
            );

          box-shadow:
            0 2px 8px rgba(0,0,0,.25),
            inset 0 2px 5px rgba(255,255,255,.13);
        }

        /*
         * Tank bottom rim
         */
        .tank::after {
          content: "";

          position: absolute;
          z-index: 10;

          bottom: -3px;
          left: 50%;

          width: 108%;
          height: 25px;

          transform: translateX(-50%);

          border-radius: 50%;

          border:
            2px solid rgba(180,230,255,.25);

          background:
            linear-gradient(
              180deg,
              rgba(255,255,255,.06),
              rgba(0,0,0,.12)
            );
        }

        /* =========================
           WATER
           ========================= */

        .water {
          position: absolute;

          left: 0;
          right: 0;
          bottom: 0;

          height: ${level}%;

          min-height: ${
            level > 0 ? "4px" : "0"
          };

          overflow: visible;

          transition:
            height 1.2s cubic-bezier(.22,.61,.36,1);

          background:
            linear-gradient(
              180deg,
              rgba(45,205,255,.82) 0%,
              rgba(0,160,255,.78) 32%,
              rgba(0,105,225,.88) 70%,
              rgba(20,70,190,.94) 100%
            );

          box-shadow:
            inset 12px 0 20px rgba(255,255,255,.06),
            inset -15px 0 25px rgba(0,40,150,.12),
            0 -4px 20px rgba(0,170,255,.22);
        }

        /*
         * Water shine
         */
        .water::after {
          content: "";

          position: absolute;

          left: 8%;
          right: 8%;
          top: 10%;
          bottom: 0;

          border-radius: 50%;

          background:
            linear-gradient(
              90deg,
              transparent,
              rgba(255,255,255,.10),
              transparent
            );

          animation:
            water-shine 4s ease-in-out infinite;
        }

        .waves {
          position: absolute;

          left: -20%;
          top: -17px;

          width: 140%;
          height: 45px;

          overflow: visible;

          filter:
            drop-shadow(
              0 0 5px rgba(70,220,255,.45)
            );
        }

        .wave {
          fill: rgba(170,240,255,.45);
        }

        .wave-back {
          opacity: .45;
          animation:
            wave-back 4s ease-in-out infinite;
        }

        .wave-front {
          fill: rgba(80,215,255,.68);
          opacity: .78;

          animation:
            wave-front 3.2s ease-in-out infinite;
        }

        /* =========================
           BUBBLES
           ========================= */

        .bubble {
          position: absolute;

          display: block;

          border-radius: 50%;

          border:
            1px solid rgba(255,255,255,.70);

          background:
            radial-gradient(
              circle at 30% 25%,
              rgba(255,255,255,.95),
              rgba(150,230,255,.22) 35%,
              transparent 70%
            );

          box-shadow:
            0 0 5px rgba(180,240,255,.35);

          animation:
            bubble-rise var(--rise) linear infinite;

          opacity: .7;
        }

        /* =========================
           GLASS REFLECTION
           ========================= */

        .reflection {
          position: absolute;

          z-index: 8;

          top: 8%;
          left: 10%;

          width: 22%;
          height: 80%;

          border-radius: 50%;

          background:
            linear-gradient(
              180deg,
              rgba(255,255,255,.32),
              rgba(255,255,255,.04),
              transparent
            );

          filter: blur(1px);

          transform: rotate(5deg);

          pointer-events: none;
        }

        .reflection-small {
          position: absolute;

          z-index: 8;

          top: 12%;
          right: 13%;

          width: 9%;
          height: 50%;

          border-radius: 50%;

          background:
            rgba(255,255,255,.14);

          filter: blur(2px);

          pointer-events: none;
        }

        /* =========================
           LEVEL MARKINGS
           ========================= */

        .marks {
          position: absolute;

          z-index: 12;

          top: 15px;
          bottom: 15px;

          left: calc(50% - 122px);

          width: 60px;

          pointer-events: none;
        }

        .mark {
          position: absolute;

          right: 0;

          display: flex;
          align-items: center;
          gap: 5px;

          transform: translateY(50%);
        }

        .mark-line {
          width: 17px;
          height: 1px;

          background:
            rgba(220,245,255,.65);
        }

        .mark-label {
          min-width: 35px;

          font-size: 9px;
          font-weight: 600;

          color:
            rgba(230,248,255,.72);

          text-shadow:
            0 1px 3px rgba(0,0,0,.7);
        }

        /* =========================
           CENTER VALUE
           ========================= */

        .tank-value {
          position: absolute;

          z-index: 20;

          inset: 0;

          display: flex;
          flex-direction: column;

          align-items: center;
          justify-content: center;

          pointer-events: none;

          color: white;

          text-align: center;

          text-shadow:
            0 2px 10px rgba(0,0,0,.65);
        }

        .percent {
          font-size: 37px;
          line-height: 1;

          font-weight: 800;

          letter-spacing: -1.5px;
        }

        .liters {
          margin-top: 8px;

          font-size: 14px;
          font-weight: 600;

          opacity: .92;
        }

        /* =========================
           RIGHT INFO
           ========================= */

        .info {
          display: flex;
          flex-direction: column;
          gap: 13px;
        }

        .gauge {
          position: relative;

          width: 150px;
          height: 150px;

          margin: 0 auto;

          border-radius: 50%;

          background:
            conic-gradient(
              ${color} ${level}%,
              rgba(255,255,255,.08) ${level}%
            );

          box-shadow:
            0 0 25px rgba(0,150,255,.08),
            inset 0 0 20px rgba(0,0,0,.16);
        }

        .gauge::before {
          content: "";

          position: absolute;

          inset: 8px;

          border-radius: 50%;

          background:
            linear-gradient(
              145deg,
              rgba(12,30,48,.98),
              rgba(8,17,29,.98)
            );

          box-shadow:
            inset 0 0 18px rgba(255,255,255,.04);
        }

        .gauge-content {
          position: absolute;

          inset: 0;

          z-index: 2;

          display: flex;
          flex-direction: column;

          align-items: center;
          justify-content: center;

          text-align: center;
        }

        .gauge-drop {
          font-size: 25px;

          margin-bottom: 3px;

          filter:
            drop-shadow(
              0 0 6px rgba(0,190,255,.55)
            );
        }

        .gauge-percent {
          font-size: 27px;
          font-weight: 800;

          line-height: 1;
        }

        .gauge-liters {
          margin-top: 7px;

          font-size: 12px;

          color:
            var(--secondary-text-color);
        }

        /* =========================
           DISTANCE
           ========================= */

        .distance-box {
          padding: 13px;

          border-radius: 17px;

          border:
            1px solid rgba(50,180,255,.28);

          background:
            linear-gradient(
              145deg,
              rgba(0,160,255,.11),
              rgba(0,90,180,.04)
            );

          box-shadow:
            inset 0 1px 0 rgba(255,255,255,.04);
        }

        .distance-title {
          font-size: 10px;

          color:
            var(--secondary-text-color);

          margin-bottom: 4px;
        }

        .distance-value {
          font-size: 22px;

          font-weight: 750;

          color: #65d5ff;
        }

        /* =========================
           PUMP BOX
           ========================= */

        .pump-box {
          padding: 12px 13px;

          border-radius: 17px;

          border:
            1px solid ${
              pump
                ? "rgba(34,197,94,.30)"
                : "rgba(255,255,255,.08)"
            };

          background:
            ${
              pump
                ? "rgba(34,197,94,.08)"
                : "rgba(255,255,255,.035)"
            };
        }

        .pump-box-title {
          font-size: 10px;

          color:
            var(--secondary-text-color);

          margin-bottom: 4px;
        }

        .pump-box-value {
          font-size: 17px;

          font-weight: 750;

          color: ${pumpColor};
        }

        /* =========================
           FOOTER
           ========================= */

        .footer {
          display: grid;

          grid-template-columns:
            repeat(3, 1fr);

          gap: 8px;

          margin-top: 14px;

          padding-top: 13px;

          border-top:
            1px solid rgba(255,255,255,.08);
        }

        .footer-item {
          text-align: center;
        }

        .footer-label {
          font-size: 9px;

          color:
            var(--secondary-text-color);

          margin-bottom: 3px;
        }

        .footer-value {
          font-size: 12px;

          font-weight: 700;
        }

        /* =========================
           ANIMATIONS
           ========================= */

        @keyframes wave-front {
          0%,100% {
            transform: translateX(-18px);
          }

          50% {
            transform: translateX(18px);
          }
        }

        @keyframes wave-back {
          0%,100% {
            transform: translateX(15px);
          }

          50% {
            transform: translateX(-15px);
          }
        }

        @keyframes bubble-rise {
          0% {
            transform:
              translateY(15px)
              scale(.65);

            opacity: 0;
          }

          15% {
            opacity: .75;
          }

          70% {
            opacity: .55;
          }

          100% {
            transform:
              translateY(-230px)
              scale(1.1);

            opacity: 0;
          }
        }

        @keyframes water-shine {
          0%,100% {
            transform: translateX(-20%);
            opacity: .25;
          }

          50% {
            transform: translateX(20%);
            opacity: .55;
          }
        }

        @keyframes pulse {
          0%,100% {
            opacity: 1;
            transform: scale(1);
          }

          50% {
            opacity: .45;
            transform: scale(.72);
          }
        }

        /* =========================
           MOBILE
           ========================= */

        @media (max-width: 520px) {

          .container {
            padding: 14px;
          }

          .main {
            grid-template-columns:
              1fr;
          }

          .tank-area {
            height: 310px;
          }

          .info {
            display: grid;

            grid-template-columns:
              1fr 1fr;
          }

          .gauge {
            grid-column:
              1 / -1;
          }

          .distance-box,
          .pump-box {
            min-width: 0;
          }
        }

      </style>

      <div class="container">

        <!-- HEADER -->

        <div class="header">

          <div class="title">

            <div class="title-icon">
              <svg viewBox="0 0 24 24">
                <path d="
                  M12 2
                  C12 2 5 9.2 5 14.2
                  C5 18.6 8.1 22 12 22
                  C15.9 22 19 18.6 19 14.2
                  C19 9.2 12 2 12 2Z
                "/>
              </svg>
            </div>

            <span>${name}</span>

          </div>

          <div class="pump-status">

            <span class="pump-dot"></span>

            ${pumpText}

          </div>

        </div>


        <!-- MAIN -->

        <div class="main">

          <!-- GLASS TANK -->

          <div class="tank-area">

            <div class="marks">
              ${markings}
            </div>

            <div class="tank">

              <div class="water">

                ${waves}

                ${bubbleHtml}

              </div>

              <div class="reflection"></div>

              <div class="reflection-small"></div>

              <div class="tank-value">

                <div class="percent">
                  ${level.toFixed(1)}%
                </div>

                <div class="liters">
                  ${liters.toLocaleString()} L
                </div>

              </div>

            </div>

          </div>


          <!-- INFORMATION -->

          <div class="info">

            <!-- GAUGE -->

            <div class="gauge">

              <div class="gauge-content">

                <div class="gauge-drop">💧</div>

                <div class="gauge-percent">
                  ${level.toFixed(1)}%
                </div>

                <div class="gauge-liters">
                  ${liters.toLocaleString()} /
                  ${capacity.toLocaleString()} L
                </div>

              </div>

            </div>


            <!-- DISTANCE -->

            <div class="distance-box">

              <div class="distance-title">
                WATER LEVEL DISTANCE
              </div>

              <div class="distance-value">
                ↕ ${distanceText}
              </div>

            </div>


            <!-- PUMP -->

            <div class="pump-box">

              <div class="pump-box-title">
                BOREWELL PUMP
              </div>

              <div class="pump-box-value">
                ${pump ? "● ON" : "● OFF"}
              </div>

            </div>

          </div>

        </div>


        <!-- FOOTER -->

        <div class="footer">

          <div class="footer-item">

            <div class="footer-label">
              TANK CAPACITY
            </div>

            <div class="footer-value">
              ${capacity.toLocaleString()} L
            </div>

          </div>


          <div class="footer-item">

            <div class="footer-label">
              CURRENT LEVEL
            </div>

            <div class="footer-value">
              ${liters.toLocaleString()} L
            </div>

          </div>


          <div class="footer-item">

            <div class="footer-label">
              LEVEL
            </div>

            <div class="footer-value">
              ${level.toFixed(1)}%
            </div>

          </div>

        </div>

      </div>
    `;
  }
}

customElements.define(
  "water-tank-card",
  WaterTankCard
);

window.customCards =
  window.customCards || [];

window.customCards.push({
  type: "water-tank-card",
  name: "Water Tank Card",
  description:
    "Glassy animated water tank card for Home Assistant",
  preview: true,
});
