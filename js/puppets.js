window.KnufforiaPuppets = {
  palettes: {
    lumi: {
      skin: "#f0c2a8",
      hair: "#ff7eb3",
      cloth: "#5fd0b4",
      clothDark: "#2f8f76",
      skirt: "#3fa892",
      accent: "#9af0d8",
      boot: "#3a2f45",
      glow: "rgba(154,240,216,0.5)",
      face: "assets/faces/face-lumi.webp?v=5",
    },
    sora: {
      skin: "#f3c7b0",
      hair: "#c9b6e8",
      cloth: "#ff9a88",
      clothDark: "#d96858",
      skirt: "#ef7f6e",
      accent: "#fff0e8",
      boot: "#3a2f45",
      glow: "rgba(255,160,140,0.45)",
      face: "assets/faces/face-sora.webp?v=5",
    },
    mika: {
      skin: "#eebfa6",
      hair: "#6fbf9a",
      cloth: "#e8ecf4",
      clothDark: "#8a93a8",
      skirt: "#b8c0d4",
      accent: "#f0b35a",
      boot: "#2f3545",
      glow: "rgba(240,179,90,0.4)",
      face: "assets/faces/face-mika.webp?v=5",
    },
    hana: {
      skin: "#f2c8b0",
      hair: "#f0c15a",
      cloth: "#9ad88a",
      clothDark: "#5f9a58",
      skirt: "#7ec46e",
      accent: "#fff3a8",
      boot: "#4a3a2f",
      glow: "rgba(180,230,140,0.45)",
      face: "assets/faces/face-hana.webp?v=5",
    },
    nori: {
      skin: "#e8b89e",
      hair: "#3a3f5c",
      cloth: "#6b7ab8",
      clothDark: "#2f3a68",
      skirt: "#4f5f98",
      accent: "#ffd27a",
      boot: "#1f2438",
      glow: "rgba(120,140,220,0.45)",
      face: "assets/faces/face-nori.webp?v=5",
    },
    orc: {
      skin: "#6fbf6a",
      hair: "#3d5c38",
      cloth: "#8a6a4a",
      clothDark: "#5a4030",
      skirt: "#6a5038",
      accent: "#c4a574",
      boot: "#2f2418",
      glow: "rgba(0,0,0,0)",
    },
    orcBrute: {
      skin: "#5faf6a",
      hair: "#2f4a2f",
      cloth: "#6a6558",
      clothDark: "#3f3a32",
      skirt: "#524c42",
      accent: "#f0b35a",
      boot: "#241c14",
      glow: "rgba(0,0,0,0)",
    },
    orcShaman: {
      skin: "#7ecf7a",
      hair: "#4a3a68",
      cloth: "#7a5fb0",
      clothDark: "#4a3878",
      skirt: "#5a4488",
      accent: "#7ad7ff",
      boot: "#2a2038",
      glow: "rgba(122,215,255,0.35)",
    },
    orcBoss: {
      skin: "#4f9a58",
      hair: "#d4af37",
      cloth: "#6a3030",
      clothDark: "#3f1818",
      skirt: "#502020",
      accent: "#ffd27a",
      boot: "#1a1210",
      glow: "rgba(255,210,122,0.35)",
    },
  },

  html(kind, facing = "right") {
    const p = this.palettes[kind] || this.palettes.lumi;
    const isOrc = String(kind).startsWith("orc");
    const face = p.face
      ? `<img class="p-face-art" src="${p.face}" alt="" draggable="false" />`
      : `<div class="p-hair"></div><div class="p-face"><div class="p-eye l"></div><div class="p-eye r"></div></div>`;
    const noFace = p.face ? "" : "no-face";

    return `
      <div class="puppet ${facing === "left" ? "facing-left" : "facing-right"} ${isOrc ? "is-orc" : ""} ${noFace} idle"
           style="--skin:${p.skin};--hair:${p.hair};--cloth:${p.cloth};--cloth-dark:${p.clothDark};--skirt:${p.skirt};--accent:${p.accent};--boot:${p.boot};--glow:${p.glow}">
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
            <div class="p-head">${face}</div>
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
