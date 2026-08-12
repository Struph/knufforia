/* Shared anime-girl SVG for Lumi */
window.KnufforiaCharacters = {
  _uid: 0,
  lumiSvg() {
    const id = `lumi${++this._uid}`;
    return `
<svg viewBox="0 0 200 260" xmlns="http://www.w3.org/2000/svg" class="lumi-svg" aria-hidden="true">
  <defs>
    <linearGradient id="${id}-hair" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#ffb3d9"/>
      <stop offset="45%" stop-color="#ff7eb3"/>
      <stop offset="100%" stop-color="#e85a9a"/>
    </linearGradient>
    <linearGradient id="${id}-skin" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffe8d6"/>
      <stop offset="100%" stop-color="#ffd0b5"/>
    </linearGradient>
    <linearGradient id="${id}-dress" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#9af0d8"/>
      <stop offset="100%" stop-color="#4db89a"/>
    </linearGradient>
    <linearGradient id="${id}-eye" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#7ad7ff"/>
      <stop offset="100%" stop-color="#3a8fd4"/>
    </linearGradient>
  </defs>

  <path d="M42 78 C38 30 70 12 100 14 C130 12 162 30 158 78 C168 120 170 170 160 210 C145 185 130 175 100 175 C70 175 55 185 40 210 C30 170 32 120 42 78Z" fill="url(#${id}-hair)"/>
  <path d="M72 155 C78 145 122 145 128 155 C140 175 150 220 148 245 C120 238 80 238 52 245 C50 220 60 175 72 155Z" fill="url(#${id}-dress)"/>
  <path d="M78 168 C90 160 110 160 122 168 C118 178 82 178 78 168Z" fill="#fff7ef" opacity="0.55"/>
  <path d="M72 168 C58 175 50 195 48 210" stroke="#ffd0b5" stroke-width="10" stroke-linecap="round" fill="none"/>
  <path d="M128 168 C142 175 150 195 152 210" stroke="#ffd0b5" stroke-width="10" stroke-linecap="round" fill="none"/>
  <rect x="92" y="132" width="16" height="18" rx="6" fill="url(#${id}-skin)"/>
  <ellipse cx="100" cy="95" rx="42" ry="46" fill="url(#${id}-skin)"/>
  <path d="M58 88 C62 50 85 40 100 42 C115 40 138 50 142 88 C130 70 118 62 100 60 C82 62 70 70 58 88Z" fill="url(#${id}-hair)"/>
  <path d="M78 58 C88 72 92 88 90 100" stroke="#ff9ec8" stroke-width="5" stroke-linecap="round" fill="none" opacity="0.7"/>
  <path d="M58 95 C52 130 55 160 62 185" stroke="url(#${id}-hair)" stroke-width="14" stroke-linecap="round" fill="none"/>
  <path d="M142 95 C148 130 145 160 138 185" stroke="url(#${id}-hair)" stroke-width="14" stroke-linecap="round" fill="none"/>
  <ellipse cx="82" cy="98" rx="11" ry="14" fill="#fff"/>
  <ellipse cx="118" cy="98" rx="11" ry="14" fill="#fff"/>
  <ellipse cx="83" cy="100" rx="7" ry="10" fill="url(#${id}-eye)"/>
  <ellipse cx="119" cy="100" rx="7" ry="10" fill="url(#${id}-eye)"/>
  <circle cx="85" cy="97" r="3" fill="#fff"/>
  <circle cx="121" cy="97" r="3" fill="#fff"/>
  <path d="M70 88 Q82 82 94 88" stroke="#5a3d4a" stroke-width="2.2" fill="none" stroke-linecap="round"/>
  <path d="M106 88 Q118 82 130 88" stroke="#5a3d4a" stroke-width="2.2" fill="none" stroke-linecap="round"/>
  <ellipse cx="68" cy="112" rx="8" ry="4" fill="#ff8fb3" opacity="0.45"/>
  <ellipse cx="132" cy="112" rx="8" ry="4" fill="#ff8fb3" opacity="0.45"/>
  <path d="M94 118 Q100 124 106 118" stroke="#d4688a" stroke-width="2.4" fill="none" stroke-linecap="round"/>
  <g transform="translate(138 58)">
    <circle r="7" fill="#fff3a8"/>
    <circle cx="-8" cy="0" r="5" fill="#ff9ec8"/>
    <circle cx="8" cy="0" r="5" fill="#ff9ec8"/>
    <circle cx="0" cy="-8" r="5" fill="#ff9ec8"/>
    <circle cx="0" cy="8" r="5" fill="#ff9ec8"/>
  </g>
  <g fill="#fff7ef" opacity="0.9">
    <circle cx="40" cy="70" r="2.5"/>
    <circle cx="165" cy="110" r="2"/>
    <circle cx="30" cy="150" r="1.8"/>
  </g>
</svg>`;
  },

  orcSvg(variant = "grunt") {
    const id = `orc${++this._uid}`;
    const skins = {
      grunt: { skin: "#7bc96f", skinDeep: "#4f9a4a", armor: "#c4a574", accent: "#e85a4f" },
      brute: { skin: "#6bbf8a", skinDeep: "#3d8f5c", armor: "#8a7a6a", accent: "#f0b35a" },
      shaman: { skin: "#8fd18a", skinDeep: "#5aa85a", armor: "#9b7edb", accent: "#7ad7ff" },
      boss: { skin: "#5faf6a", skinDeep: "#2f6f3a", armor: "#d4af37", accent: "#ff6b6b" },
    };
    const c = skins[variant] || skins.grunt;
    const tusks = variant === "brute" || variant === "boss";
    const horn = variant === "shaman" || variant === "boss";

    return `
<svg viewBox="0 0 200 240" xmlns="http://www.w3.org/2000/svg" class="orc-svg" aria-hidden="true">
  <defs>
    <linearGradient id="${id}-skin" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${c.skin}"/>
      <stop offset="100%" stop-color="${c.skinDeep}"/>
    </linearGradient>
    <linearGradient id="${id}-armor" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${c.armor}"/>
      <stop offset="100%" stop-color="#6a5540"/>
    </linearGradient>
  </defs>

  <!-- legs -->
  <rect x="72" y="175" width="20" height="42" rx="8" fill="url(#${id}-skin)"/>
  <rect x="108" y="175" width="20" height="42" rx="8" fill="url(#${id}-skin)"/>
  <ellipse cx="82" cy="218" rx="14" ry="8" fill="#3a2f45"/>
  <ellipse cx="118" cy="218" rx="14" ry="8" fill="#3a2f45"/>

  <!-- body -->
  <ellipse cx="100" cy="150" rx="48" ry="42" fill="url(#${id}-skin)"/>
  <path d="M60 140 C70 120 130 120 140 140 C145 165 135 185 100 188 C65 185 55 165 60 140Z" fill="url(#${id}-armor)"/>
  <circle cx="100" cy="150" r="8" fill="${c.accent}"/>

  <!-- arms -->
  <path d="M58 145 C40 155 34 180 38 200" stroke="url(#${id}-skin)" stroke-width="16" stroke-linecap="round" fill="none"/>
  <path d="M142 145 C160 155 166 180 162 200" stroke="url(#${id}-skin)" stroke-width="16" stroke-linecap="round" fill="none"/>
  <!-- club -->
  <g transform="translate(155 175) rotate(25)">
    <rect x="-6" y="0" width="12" height="36" rx="4" fill="#7a4d2e"/>
    <ellipse cx="0" cy="42" rx="16" ry="12" fill="#5a3a22"/>
    <circle cx="-4" cy="40" r="3" fill="#c4a574"/>
  </g>

  <!-- head -->
  <ellipse cx="100" cy="88" rx="46" ry="42" fill="url(#${id}-skin)"/>
  ${horn ? `<path d="M70 55 L62 28 L78 50Z" fill="#f0e0c0"/><path d="M130 55 L138 28 L122 50Z" fill="#f0e0c0"/>` : ""}

  <!-- ears -->
  <path d="M54 85 L38 70 L52 98Z" fill="url(#${id}-skin)"/>
  <path d="M146 85 L162 70 L148 98Z" fill="url(#${id}-skin)"/>

  <!-- brows + eyes -->
  <path d="M70 78 L92 82" stroke="#2f4a2f" stroke-width="4" stroke-linecap="round"/>
  <path d="M130 78 L108 82" stroke="#2f4a2f" stroke-width="4" stroke-linecap="round"/>
  <ellipse cx="82" cy="95" rx="10" ry="11" fill="#fff7ef"/>
  <ellipse cx="118" cy="95" rx="10" ry="11" fill="#fff7ef"/>
  <circle cx="84" cy="96" r="5" fill="#2a1f18"/>
  <circle cx="120" cy="96" r="5" fill="#2a1f18"/>
  <circle cx="86" cy="94" r="1.8" fill="#fff"/>
  <circle cx="122" cy="94" r="1.8" fill="#fff"/>

  <!-- tusks + mouth -->
  <path d="M88 118 Q100 128 112 118" stroke="#2f4a2f" stroke-width="3" fill="none" stroke-linecap="round"/>
  ${tusks
    ? `<path d="M86 118 L82 132 L90 120Z" fill="#fff7ef"/><path d="M114 118 L118 132 L110 120Z" fill="#fff7ef"/>`
    : `<path d="M92 120 L90 128 L94 121Z" fill="#fff7ef"/><path d="M108 120 L110 128 L106 121Z" fill="#fff7ef"/>`}

  <!-- nose -->
  <ellipse cx="100" cy="108" rx="8" ry="5" fill="${c.skinDeep}"/>
</svg>`;
  },

  mountAll() {
    document.querySelectorAll(".anime-girl").forEach((node) => {
      if (!node.dataset.ready) {
        node.innerHTML = this.lumiSvg();
        node.dataset.ready = "1";
      }
    });
  },

  mountOrc(node, variant = "grunt") {
    if (!node) return;
    node.innerHTML = this.orcSvg(variant);
    node.dataset.variant = variant;
  },
};
