class WaterTankCard extends HTMLElement {
  setConfig(config) {
    if (!config.level_entity) throw new Error("level_entity is required");
    this.config = config;
    this.attachShadow({mode:"open"});
  }
  set hass(hass) { this._hass=hass; this.render(); }
  getCardSize() { return 4; }

  render() {
    if (!this.shadowRoot || !this._hass) return;
    const c=this.config, s=this._hass.states;
    let level=Number(s[c.level_entity]?.state);
    if (!Number.isFinite(level)) level=0;
    level=Math.max(0,Math.min(100,level));
    const d=Number(s[c.distance_entity]?.state);
    const pump=c.pump_entity && s[c.pump_entity]?.state==="on";
    const color=level<20?"#ef4444":level<40?"#f59e0b":level<60?"#eab308":level<80?"#22c55e":"#16a34a";
    this.shadowRoot.innerHTML=`
      <ha-card><style>
      ha-card{overflow:hidden;border-radius:22px;background:linear-gradient(145deg,rgba(255,255,255,.13),rgba(255,255,255,.035))}
      .wrap{padding:18px;font-family:var(--primary-font-family)}.top,.bottom{display:flex;justify-content:space-between;align-items:center}
      .name{font-size:18px;font-weight:600}.pump{padding:5px 10px;border-radius:14px;font-size:12px;background:${pump?"rgba(34,197,94,.2)":"rgba(128,128,128,.12)"};color:${pump?"#22c55e":"var(--secondary-text-color)"}
      .tank{position:relative;height:220px;margin:18px auto 8px;max-width:170px;border:3px solid rgba(255,255,255,.28);border-radius:28px 28px 20px 20px;overflow:hidden;background:rgba(255,255,255,.06);box-shadow:inset 0 0 22px rgba(255,255,255,.08)}
      .water{position:absolute;left:0;right:0;bottom:0;height:${level}%;background:linear-gradient(180deg,rgba(96,190,255,.72),rgba(30,105,220,.88));transition:height .8s ease}
      .water:before{content:"";position:absolute;top:-7px;left:-10%;width:120%;height:14px;border-radius:50%;background:rgba(150,220,255,.45);animation:wave 2.4s ease-in-out infinite}
      .value{position:absolute;inset:0;display:flex;flex-direction:column;justify-content:center;align-items:center;color:white;text-shadow:0 2px 7px rgba(0,0,0,.5)}
      .percent{font-size:42px;font-weight:700}.distance{font-size:14px;opacity:.9}.bottom{color:var(--secondary-text-color);font-size:13px}
      @keyframes wave{0%,100%{transform:translateX(-2%)}50%{transform:translateX(2%)}}
      </style><div class="wrap"><div class="top"><div class="name">${c.name||"Water Tank"}</div><div class="pump">${pump?"PUMP ON":"PUMP OFF"}</div></div>
      <div class="tank"><div class="water"></div><div class="value"><div class="percent">${level.toFixed(1)}%</div><div class="distance">${Number.isFinite(d)?d.toFixed(1)+" cm":""}</div></div></div>
      <div class="bottom"><span>0%</span><span>${c.capacity_liters?c.capacity_liters+" L":""}</span><span>100%</span></div></div></ha-card>`;
  }
}
customElements.define("water-tank-card",WaterTankCard);
window.customCards=window.customCards||[];
window.customCards.push({type:"water-tank-card",name:"Water Tank Card",description:"Animated Home Assistant water tank card"});
