window.KnufforiaPuppets = {
  _anims: new WeakMap(),

  orcPalettes: {
    orc: { skin: "#6fbf6a", hair: "#3d5c38", cloth: "#8a6a4a", clothDark: "#5a4030", skirt: "#6a5038", accent: "#c4a574", boot: "#2f2418" },
    orcBrute: { skin: "#5faf6a", hair: "#2f4a2f", cloth: "#6a6558", clothDark: "#3f3a32", skirt: "#524c42", accent: "#f0b35a", boot: "#241c14" },
    orcShaman: { skin: "#7ecf7a", hair: "#4a3a68", cloth: "#7a5fb0", clothDark: "#4a3878", skirt: "#5a4488", accent: "#7ad7ff", boot: "#2a2038" },
    orcBoss: { skin: "#4f9a58", hair: "#d4af37", cloth: "#6a3030", clothDark: "#3f1818", skirt: "#502020", accent: "#ffd27a", boot: "#1a1210" },
  },

  humanHtml(kind, facing = "right") {
    const base = `assets/heroes/${kind}`;
    const v = "v=7";
    return `
      <div class="human-rig ${facing === "left" ? "facing-left" : "facing-right"} idle" data-hero="${kind}">
        <div class="human-shadow"></div>
        <div class="pivot-feet">
          <div class="pivot-hip">
            <div class="pivot-torso">
              <img class="human-full" src="${base}/full.webp?${v}" alt="" draggable="false" />
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

  _stop(rig) {
    const list = this._anims.get(rig) || [];
    list.forEach((a) => {
      try {
        a.cancel();
      } catch (_) {
        /* ignore */
      }
    });
    this._anims.set(rig, []);
    const img = rig.querySelector(".human-full");
    if (img) {
      img.getAnimations?.().forEach((a) => a.cancel());
      img.style.transform = "";
    }
    rig.querySelectorAll(".pivot-feet, .pivot-hip, .pivot-torso, .p-body, .p-leg, .p-arm").forEach((el) => {
      el.getAnimations?.().forEach((a) => a.cancel());
      el.style.transform = "";
    });
  },

  _play(rig, animations) {
    const running = [];
    animations.forEach(([el, keyframes, options]) => {
      if (!el || !el.animate) return;
      running.push(el.animate(keyframes, options));
    });
    this._anims.set(rig, running);
  },

  setAnim(node, mode) {
    if (!node) return;
    const rig = node.classList?.contains("human-rig") || node.classList?.contains("puppet")
      ? node
      : node.querySelector?.(".human-rig, .puppet");
    if (!rig) return;

    this._stop(rig);
    rig.classList.remove("idle", "walk", "attack", "hurt");
    void rig.offsetWidth;
    rig.classList.add(mode || "idle");

    const isHuman = rig.classList.contains("human-rig");
    if (!isHuman) return; // orcs keep CSS keyframes

    const feet = rig.querySelector(".pivot-feet");
    const hip = rig.querySelector(".pivot-hip");
    const torso = rig.querySelector(".pivot-torso");
    const img = rig.querySelector(".human-full");
    const m = mode || "idle";

    if (m === "idle") {
      this._play(rig, [
        [
          hip,
          [
            { transform: "translateY(0px) rotate(0deg)" },
            { transform: "translateY(-4px) rotate(0deg)" },
            { transform: "translateY(0px) rotate(0deg)" },
          ],
          { duration: 1600, iterations: Infinity, easing: "ease-in-out" },
        ],
        [
          torso,
          [
            { transform: "rotate(-2deg)" },
            { transform: "rotate(2deg)" },
            { transform: "rotate(-2deg)" },
          ],
          { duration: 2200, iterations: Infinity, easing: "ease-in-out" },
        ],
      ]);
    } else if (m === "walk") {
      this._play(rig, [
        [
          feet,
          [
            { transform: "rotate(-12deg) translateY(0px)" },
            { transform: "rotate(0deg) translateY(-10px)" },
            { transform: "rotate(12deg) translateY(0px)" },
            { transform: "rotate(0deg) translateY(-10px)" },
            { transform: "rotate(-12deg) translateY(0px)" },
          ],
          { duration: 420, iterations: Infinity, easing: "ease-in-out" },
        ],
        [
          hip,
          [
            { transform: "rotate(8deg)" },
            { transform: "rotate(-8deg)" },
            { transform: "rotate(8deg)" },
          ],
          { duration: 420, iterations: Infinity, easing: "ease-in-out" },
        ],
        [
          torso,
          [
            { transform: "rotate(-6deg)" },
            { transform: "rotate(6deg)" },
            { transform: "rotate(-6deg)" },
          ],
          { duration: 420, iterations: Infinity, easing: "ease-in-out" },
        ],
        [
          img,
          [
            { transform: "scale(1, 1)" },
            { transform: "scale(1.04, 0.94)" },
            { transform: "scale(1, 1)" },
            { transform: "scale(1.04, 0.94)" },
            { transform: "scale(1, 1)" },
          ],
          { duration: 420, iterations: Infinity, easing: "ease-in-out" },
        ],
      ]);
    } else if (m === "attack") {
      this._play(rig, [
        [
          feet,
          [
            { transform: "rotate(0deg)" },
            { transform: "rotate(10deg)" },
            { transform: "rotate(-4deg)" },
            { transform: "rotate(0deg)" },
          ],
          { duration: 420, easing: "ease-in-out" },
        ],
        [
          hip,
          [
            { transform: "rotate(0deg) translateX(0px)" },
            { transform: "rotate(14deg) translateX(-4px)" },
            { transform: "rotate(-16deg) translateX(8px)" },
            { transform: "rotate(0deg) translateX(0px)" },
          ],
          { duration: 420, easing: "ease-in-out" },
        ],
        [
          torso,
          [
            { transform: "rotate(0deg)" },
            { transform: "rotate(18deg)" },
            { transform: "rotate(-20deg)" },
            { transform: "rotate(0deg)" },
          ],
          { duration: 420, easing: "ease-in-out" },
        ],
        [
          img,
          [
            { transform: "scale(1) rotate(0deg)" },
            { transform: "scale(1.06) rotate(6deg)" },
            { transform: "scale(1.08) rotate(-8deg)" },
            { transform: "scale(1) rotate(0deg)" },
          ],
          { duration: 420, easing: "ease-in-out" },
        ],
      ]);
    } else if (m === "hurt") {
      this._play(rig, [
        [
          hip,
          [
            { transform: "translateX(0px) rotate(0deg)" },
            { transform: "translateX(-8px) rotate(-8deg)" },
            { transform: "translateX(8px) rotate(6deg)" },
            { transform: "translateX(0px) rotate(0deg)" },
          ],
          { duration: 320, easing: "ease-in-out" },
        ],
      ]);
    }
  },
};
