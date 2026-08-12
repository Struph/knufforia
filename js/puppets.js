window.KnufforiaPuppets = {
  orcPalettes: {
    orc: { skin: "#6fbf6a", hair: "#3d5c38", cloth: "#8a6a4a", clothDark: "#5a4030", skirt: "#6a5038", accent: "#c4a574", boot: "#2f2418" },
    orcBrute: { skin: "#5faf6a", hair: "#2f4a2f", cloth: "#6a6558", clothDark: "#3f3a32", skirt: "#524c42", accent: "#f0b35a", boot: "#241c14" },
    orcShaman: { skin: "#7ecf7a", hair: "#4a3a68", cloth: "#7a5fb0", clothDark: "#4a3878", skirt: "#5a4488", accent: "#7ad7ff", boot: "#2a2038" },
    orcBoss: { skin: "#4f9a58", hair: "#d4af37", cloth: "#6a3030", clothDark: "#3f1818", skirt: "#502020", accent: "#ffd27a", boot: "#1a1210" },
  },

  humanHtml(kind, facing = "right") {
    const src = `assets/heroes/${kind}/full.webp?v=6`;
    return `
      <div class="human-rig ${facing === "left" ? "facing-left" : "facing-right"} idle" data-hero="${kind}">
        <div class="human-shadow"></div>
        <div class="pivot-feet">
          <div class="pivot-hip">
            <div class="pivot-torso">
              <img class="human-full" src="${src}" alt="" draggable="false" />
            </div>
          </div>
        </div>
      </div>`;
  },

  orcHtml(kind, facing = "right") {
    const p = this.orcPalettes[kind] || this.orcPalettes.orc;
    return `
      <div class="puppet ${facing === "left" ? "facing-left" : "facing-right"} is-orc idle"
           style="--skin:${p.skin};--hair:${p.hair};--cloth:${p.cloth};--cloth-dark:${p.clothDark};--skirt:${p.skirt};--accent:${p.accent};--boot:${p.boot}">
        <div class="p-shadow"></div>
        <div class="p-body">
          <div class="p-leg p-leg-l"><div class="p-thigh"></div><div class="p-shin"></div></div>
          <div class="p-leg p-leg-r"><div class="p-thigh"></div><div class="p-shin"></div></div>
          <div class="p-skirt"></div>
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

  html(kind, facing = "right") {
    if (String(kind).startsWith("orc")) return this.orcHtml(kind, facing);
    return this.humanHtml(kind, facing);
  },

  setAnim(node, mode) {
    if (!node) return;
    const rig =
      node.classList?.contains("human-rig") || node.classList?.contains("puppet")
        ? node
        : node.querySelector?.(".human-rig, .puppet");
    if (!rig) return;
    rig.classList.remove("idle", "walk", "attack", "hurt");
    rig.classList.add(mode || "idle");
  },
};
