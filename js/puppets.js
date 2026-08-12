window.KnufforiaPuppets = {
  _anims: new WeakMap(),

  orcPalettes: {
    orc: { skin: "#6fbf6a", hair: "#3d5c38", cloth: "#8a6a4a", clothDark: "#5a4030", skirt: "#6a5038", accent: "#c4a574", boot: "#2f2418" },
    orcBrute: { skin: "#5faf6a", hair: "#2f4a2f", cloth: "#6a6558", clothDark: "#3f3a32", skirt: "#524c42", accent: "#f0b35a", boot: "#241c14" },
    orcShaman: { skin: "#7ecf7a", hair: "#4a3a68", cloth: "#7a5fb0", clothDark: "#4a3878", skirt: "#5a4488", accent: "#7ad7ff", boot: "#2a2038" },
    orcBoss: { skin: "#4f9a58", hair: "#d4af37", cloth: "#6a3030", clothDark: "#3f1818", skirt: "#502020", accent: "#ffd27a", boot: "#1a1210" },
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
    return this.orcHtml(kind, facing);
  },

  _stop(rig) {
    const list = this._anims.get(rig) || [];
    list.forEach((a) => {
      try {
        a.cancel();
      } catch (_) {}
    });
    this._anims.set(rig, []);
    rig.querySelectorAll(".av-body, .av-leg, .av-arm, .pivot-feet, .pivot-hip, .pivot-torso, .human-full, .p-body, .p-leg, .p-arm").forEach((el) => {
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
    const rig =
      node.classList?.contains("avatar-rig") ||
      node.classList?.contains("human-rig") ||
      node.classList?.contains("puppet")
        ? node
        : node.querySelector?.(".avatar-rig, .human-rig, .puppet");
    if (!rig) return;

    this._stop(rig);
    rig.classList.remove("idle", "walk", "attack", "hurt");
    void rig.offsetWidth;
    const m = mode || "idle";
    rig.classList.add(m);

    if (rig.classList.contains("avatar-rig")) {
      const body = rig.querySelector(".av-body");
      const sprite = rig.querySelector(".av-sprite");
      const isArt = rig.classList.contains("avatar-art");
      if (isArt) {
        if (m === "idle") {
          this._play(rig, [
            [body, [{ transform: "translateY(0)" }, { transform: "translateY(-5px)" }, { transform: "translateY(0)" }], { duration: 1800, iterations: Infinity, easing: "ease-in-out" }],
          ]);
        } else if (m === "walk") {
          this._play(rig, [
            [body, [
              { transform: "translateY(0) rotate(-2deg)" },
              { transform: "translateY(-6px) rotate(2deg)" },
              { transform: "translateY(0) rotate(-2deg)" },
            ], { duration: 360, iterations: Infinity, easing: "ease-in-out" }],
          ]);
        } else if (m === "attack") {
          this._play(rig, [
            [body, [
              { transform: "translateX(0) rotate(0)" },
              { transform: "translateX(10px) rotate(-6deg) scale(1.04)" },
              { transform: "translateX(0) rotate(0)" },
            ], { duration: 420, easing: "ease-in-out" }],
            [sprite, [
              { filter: sprite?.style.filter || "none" },
              { filter: `${sprite?.style.filter || "none"} brightness(1.15)` },
              { filter: sprite?.style.filter || "none" },
            ], { duration: 420, easing: "ease-in-out" }],
          ]);
        } else if (m === "hurt") {
          this._play(rig, [
            [body, [
              { transform: "translateX(0)" },
              { transform: "translateX(-8px) rotate(-4deg)" },
              { transform: "translateX(5px)" },
              { transform: "translateX(0)" },
            ], { duration: 300, easing: "ease-in-out" }],
          ]);
        }
        return;
      }
      const legL = rig.querySelector(".av-leg.l");
      const legR = rig.querySelector(".av-leg.r");
      const armL = rig.querySelector(".av-arm.l");
      const armR = rig.querySelector(".av-arm.r");
      if (m === "idle") {
        this._play(rig, [
          [body, [{ transform: "translateY(0)" }, { transform: "translateY(-4px)" }, { transform: "translateY(0)" }], { duration: 1600, iterations: Infinity, easing: "ease-in-out" }],
          [armR, [{ transform: "rotate(8deg)" }, { transform: "rotate(-6deg)" }, { transform: "rotate(8deg)" }], { duration: 1600, iterations: Infinity, easing: "ease-in-out" }],
        ]);
      } else if (m === "walk") {
        this._play(rig, [
          [legL, [{ transform: "rotate(24deg)" }, { transform: "rotate(-24deg)" }, { transform: "rotate(24deg)" }], { duration: 380, iterations: Infinity, easing: "ease-in-out" }],
          [legR, [{ transform: "rotate(-24deg)" }, { transform: "rotate(24deg)" }, { transform: "rotate(-24deg)" }], { duration: 380, iterations: Infinity, easing: "ease-in-out" }],
          [armL, [{ transform: "rotate(-20deg)" }, { transform: "rotate(20deg)" }, { transform: "rotate(-20deg)" }], { duration: 380, iterations: Infinity, easing: "ease-in-out" }],
          [armR, [{ transform: "rotate(20deg)" }, { transform: "rotate(-20deg)" }, { transform: "rotate(20deg)" }], { duration: 380, iterations: Infinity, easing: "ease-in-out" }],
          [body, [{ transform: "translateY(0)" }, { transform: "translateY(-5px)" }, { transform: "translateY(0)" }], { duration: 380, iterations: Infinity, easing: "ease-in-out" }],
        ]);
      } else if (m === "attack") {
        this._play(rig, [
          [armR, [{ transform: "rotate(20deg)" }, { transform: "rotate(-130deg)" }, { transform: "rotate(10deg)" }], { duration: 420, easing: "ease-in-out" }],
          [body, [{ transform: "rotate(0)" }, { transform: "rotate(-8deg) translateX(4px)" }, { transform: "rotate(0)" }], { duration: 420, easing: "ease-in-out" }],
        ]);
      } else if (m === "hurt") {
        this._play(rig, [
          [body, [{ transform: "translateX(0)" }, { transform: "translateX(-7px) rotate(-5deg)" }, { transform: "translateX(6px)" }, { transform: "translateX(0)" }], { duration: 300, easing: "ease-in-out" }],
        ]);
      }
      return;
    }

    // Orc puppets
    const body = rig.querySelector(".p-body");
    const legL = rig.querySelector(".p-leg-l");
    const legR = rig.querySelector(".p-leg-r");
    const armL = rig.querySelector(".p-arm-l");
    const armR = rig.querySelector(".p-arm-r");
    if (m === "idle") {
      this._play(rig, [
        [body, [{ transform: "translateY(0)" }, { transform: "translateY(-3px)" }, { transform: "translateY(0)" }], { duration: 1400, iterations: Infinity, easing: "ease-in-out" }],
      ]);
    } else if (m === "walk") {
      this._play(rig, [
        [legL, [{ transform: "rotate(20deg)" }, { transform: "rotate(-20deg)" }, { transform: "rotate(20deg)" }], { duration: 360, iterations: Infinity, easing: "ease-in-out" }],
        [legR, [{ transform: "rotate(-20deg)" }, { transform: "rotate(20deg)" }, { transform: "rotate(-20deg)" }], { duration: 360, iterations: Infinity, easing: "ease-in-out" }],
        [armL, [{ transform: "rotate(-16deg)" }, { transform: "rotate(16deg)" }, { transform: "rotate(-16deg)" }], { duration: 360, iterations: Infinity, easing: "ease-in-out" }],
        [armR, [{ transform: "rotate(16deg)" }, { transform: "rotate(-16deg)" }, { transform: "rotate(16deg)" }], { duration: 360, iterations: Infinity, easing: "ease-in-out" }],
      ]);
    } else if (m === "attack") {
      this._play(rig, [
        [armR, [{ transform: "rotate(10deg)" }, { transform: "rotate(-120deg)" }, { transform: "rotate(10deg)" }], { duration: 400, easing: "ease-in-out" }],
        [body, [{ transform: "rotate(0)" }, { transform: "rotate(-6deg)" }, { transform: "rotate(0)" }], { duration: 400, easing: "ease-in-out" }],
      ]);
    } else if (m === "hurt") {
      this._play(rig, [
        [body, [{ transform: "translateX(0)" }, { transform: "translateX(6px) rotate(4deg)" }, { transform: "translateX(0)" }], { duration: 280, easing: "ease-in-out" }],
      ]);
    }
  },
};
