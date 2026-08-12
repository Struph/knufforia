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

  mountAll() {
    document.querySelectorAll(".anime-girl").forEach((node) => {
      if (!node.dataset.ready) {
        node.innerHTML = this.lumiSvg();
        node.dataset.ready = "1";
      }
    });
  },
};
