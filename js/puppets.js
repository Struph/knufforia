window.KnufforiaPuppets = {
  palettes: {
    lumi: { skin: "#f0c2a8", hair: "#ff7eb3", cloth: "#4db89a", clothDark: "#2f8f76", accent: "#9af0d8", boot: "#3a2f45" },
    sora: { skin: "#f3c7b0", hair: "#c9b6e8", cloth: "#ff8f7a", clothDark: "#d96858", accent: "#fff0e8", boot: "#3a2f45" },
    mika: { skin: "#eebfa6", hair: "#6fbf9a", cloth: "#d8dce8", clothDark: "#8a93a8", accent: "#f0b35a", boot: "#2f3545" },
    hana: { skin: "#f2c8b0", hair: "#f0c15a", cloth: "#8fce7a", clothDark: "#5f9a58", accent: "#fff3a8", boot: "#4a3a2f" },
    nori: { skin: "#e8b89e", hair: "#3a3f5c", cloth: "#5b6aa8", clothDark: "#2f3a68", accent: "#ffd27a", boot: "#1f2438" },
    orc: { skin: "#6fbf6a", hair: "#3d5c38", cloth: "#8a6a4a", clothDark: "#5a4030", accent: "#c4a574", boot: "#2f2418" },
    orcBrute: { skin: "#5faf6a", hair: "#2f4a2f", cloth: "#6a6558", clothDark: "#3f3a32", accent: "#f0b35a", boot: "#241c14" },
    orcShaman: { skin: "#7ecf7a", hair: "#4a3a68", cloth: "#7a5fb0", clothDark: "#4a3878", accent: "#7ad7ff", boot: "#2a2038" },
    orcBoss: { skin: "#4f9a58", hair: "#d4af37", cloth: "#6a3030", clothDark: "#3f1818", accent: "#ffd27a", boot: "#1a1210" },
  },

  html(kind, facing = "right") {
    const p = this.palettes[kind] || this.palettes.lumi;
    const isOrc = String(kind).startsWith("orc");
    return `
      <div class="puppet ${facing === "left" ? "facing-left" : "facing-right"} ${isOrc ? "is-orc" : ""} idle"
           style="--skin:${p.skin};--hair:${p.hair};--cloth:${p.cloth};--cloth-dark:${p.clothDark};--accent:${p.accent};--boot:${p.boot}">
        <div class="p-shadow"></div>
        <div class="p-body">
          <div class="p-leg p-leg-l"><div class="p-thigh"></div><div class="p-shin"></div></div>
          <div class="p-leg p-leg-r"><div class="p-thigh"></div><div class="p-shin"></div></div>
          <div class="p-hip"></div>
          <div class="p-torso">
            <div class="p-arm p-arm-l"><div class="p-upper"></div><div class="p-fore"></div></div>
            <div class="p-chest"></div>
            <div class="p-arm p-arm-r"><div class="p-upper"></div><div class="p-fore"><div class="p-weapon"></div></div></div>
            <div class="p-head">
              <div class="p-hair"></div>
              <div class="p-face"><div class="p-eye l"></div><div class="p-eye r"></div></div>
            </div>
          </div>
        </div>
      </div>`;
  },

  setAnim(puppet, mode) {
    if (!puppet) return;
    puppet.classList.remove("idle", "walk", "attack", "hurt");
    puppet.classList.add(mode || "idle");
  },
};
