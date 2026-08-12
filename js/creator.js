window.KnufforiaCreator = {
  STEPS: [
    { id: "name", title: "Name", lead: "Wie heißt dein Held?" },
    { id: "body", title: "Körper", lead: "Menschlicher Körpertyp – Fiesta-Anime-Stil." },
    { id: "hair", title: "Haare", lead: "Frisur und Haarfarbe wählen." },
    { id: "face", title: "Blick", lead: "Augenfarbe und Ausdruck." },
    { id: "style", title: "Outfit", lead: "Rüstung & Kleidung wie in Fiesta Online." },
    { id: "class", title: "Klasse", lead: "Kampfrolle und Startwerte." },
    { id: "done", title: "Fertig", lead: "Dein Held ist bereit fürs Abenteuer." },
  ],

  SKINS: ["#f3d0b8", "#e8b89a", "#d4a07e", "#c6866a", "#8d5524", "#f5e0d0", "#b07a5a", "#6b3f2a"],
  HAIR_COLORS: ["#2a2438", "#5a3a2a", "#c9a46a", "#f0c15a", "#ff7eb3", "#c9b6e8", "#6fbf9a", "#e85a4f", "#3a3f5c", "#f4f0ea"],
  EYE_COLORS: ["#3a8fd4", "#5a9a4a", "#8b5a2b", "#7a5fb0", "#2a1f18", "#d45a7a", "#4db89a", "#f0b35a"],
  CLOTH1: ["#4db89a", "#ff8f7a", "#6b7ab8", "#9ad88a", "#e8ecf4", "#f0c15a", "#e85a9a", "#5b6aa8"],
  CLOTH2: ["#2f8f76", "#d96858", "#2f3a68", "#5f9a58", "#8a93a8", "#c49a4a", "#b03d6e", "#3a3f5c"],
  ACCENTS: ["#ffd27a", "#9af0d8", "#fff0e8", "#7ad7ff", "#ff9ec8", "#e8eef8"],

  HAIR_STYLES: [
    { id: "long", label: "Lang" },
    { id: "short", label: "Kurz" },
    { id: "twin", label: "Zöpfe" },
    { id: "ponytail", label: "Pferdeschwanz" },
    { id: "messy", label: "Messy" },
  ],
  BODIES: [
    { id: "fem", label: "Feminin" },
    { id: "andro", label: "Androgyn" },
    { id: "masc", label: "Maskulin" },
  ],
  BROWS: [
    { id: "soft", label: "Sanft" },
    { id: "neutral", label: "Neutral" },
    { id: "fierce", label: "Hart" },
  ],
  ACCESSORIES: [
    { id: "none", label: "Keins" },
    { id: "flower", label: "Blume" },
    { id: "glasses", label: "Brille" },
    { id: "circlet", label: "Diadem" },
    { id: "scarf", label: "Schal" },
  ],
  OUTFITS: [
    { id: "mage", label: "Magierrobe", classId: "mage" },
    { id: "warrior", label: "Kampfpanzer", classId: "warrior" },
    { id: "healer", label: "Heilergewand", classId: "healer" },
    { id: "rogue", label: "Schattenrüstung", classId: "rogue" },
    { id: "ranger", label: "Waldläufer", classId: "ranger" },
  ],
  CLASSES: [
    { id: "mage", label: "Magier", atk: 14, maxHp: 100, desc: "Hoher Schaden, weniger HP", outfit: "mage" },
    { id: "warrior", label: "Krieger", atk: 12, maxHp: 130, desc: "Ausgewogen und robust", outfit: "warrior" },
    { id: "healer", label: "Heiler", atk: 10, maxHp: 140, desc: "Sehr viel Ausdauer", outfit: "healer" },
    { id: "rogue", label: "Schurke", atk: 16, maxHp: 90, desc: "Höchster Angriff", outfit: "rogue" },
    { id: "ranger", label: "Jäger", atk: 13, maxHp: 115, desc: "Allrounder", outfit: "ranger" },
  ],

  /* Fiesta-style painted sprites: body + hair + class */
  SPRITES: [
    { body: "fem", hair: "long", cls: "mage", file: "fem-long-mage.png" },
    { body: "fem", hair: "long", cls: "warrior", file: "fem-long-warrior.png" },
    { body: "fem", hair: "short", cls: "warrior", file: "fem-short-warrior.png" },
    { body: "fem", hair: "twin", cls: "healer", file: "fem-twin-healer.png" },
    { body: "fem", hair: "ponytail", cls: "rogue", file: "fem-pony-rogue.png" },
    { body: "fem", hair: "messy", cls: "ranger", file: "fem-messy-ranger.png" },
    { body: "masc", hair: "short", cls: "warrior", file: "masc-short-warrior.png" },
    { body: "masc", hair: "long", cls: "mage", file: "masc-long-mage.png" },
    { body: "masc", hair: "messy", cls: "rogue", file: "masc-messy-rogue.png" },
    { body: "masc", hair: "ponytail", cls: "ranger", file: "masc-pony-ranger.png" },
    { body: "masc", hair: "twin", cls: "healer", file: "masc-twin-healer.png" },
    { body: "andro", hair: "short", cls: "mage", file: "andro-short-mage.png" },
  ],

  HAIR_FILTERS: {
    "#2a2438": "hue-rotate(-15deg) saturate(0.55) brightness(0.45)",
    "#5a3a2a": "none",
    "#c9a46a": "hue-rotate(8deg) saturate(0.9) brightness(1.2)",
    "#f0c15a": "hue-rotate(28deg) saturate(1.45) brightness(1.25)",
    "#ff7eb3": "hue-rotate(295deg) saturate(1.55) brightness(1.15)",
    "#c9b6e8": "hue-rotate(220deg) saturate(1.1) brightness(1.2)",
    "#6fbf9a": "hue-rotate(95deg) saturate(1.2) brightness(1.05)",
    "#e85a4f": "hue-rotate(350deg) saturate(1.4) brightness(1.05)",
    "#3a3f5c": "hue-rotate(200deg) saturate(0.7) brightness(0.65)",
    "#f4f0ea": "saturate(0.15) brightness(1.45)",
  },

  defaults() {
    return {
      name: "",
      body: "fem",
      skin: "#f3d0b8",
      hairStyle: "long",
      hairColor: "#5a3a2a",
      eyeColor: "#3a8fd4",
      brow: "neutral",
      outfit: "mage",
      cloth1: "#4db89a",
      cloth2: "#2f8f76",
      accent: "#ffd27a",
      boot: "#3a2f45",
      accessory: "none",
      classId: "mage",
    };
  },

  classStats(classId) {
    return this.CLASSES.find((c) => c.id === classId) || this.CLASSES[0];
  },

  resolveSprite(c) {
    const body = c.body || "fem";
    const hair = c.hairStyle || "long";
    const cls = c.classId || c.outfit || "mage";
    const list = this.SPRITES;
    const score = (s) =>
      (s.body === body ? 8 : 0) + (s.hair === hair ? 4 : 0) + (s.cls === cls ? 3 : 0);
    let best = list[0];
    let bestScore = -1;
    list.forEach((s) => {
      const sc = score(s);
      if (sc > bestScore) {
        best = s;
        bestScore = sc;
      }
    });
    // Prefer exact body match even if hair/class weaker
    const bodyMatches = list.filter((s) => s.body === body);
    if (bodyMatches.length) {
      best = bodyMatches[0];
      bestScore = -1;
      bodyMatches.forEach((s) => {
        const sc = (s.hair === hair ? 4 : 0) + (s.cls === cls ? 3 : 0);
        if (sc > bestScore) {
          best = s;
          bestScore = sc;
        }
      });
    }
    return `assets/avatar/${best.file}`;
  },

  hairFilter(color) {
    return this.HAIR_FILTERS[color] || "none";
  },

  avatarHtml(c, extraClass = "") {
    const src = this.resolveSprite(c);
    const filter = this.hairFilter(c.hairColor);
    const acc =
      c.accessory && c.accessory !== "none"
        ? `<div class="av-acc ${c.accessory}" style="--av-accent:${c.accent || "#ffd27a"}"></div>`
        : "";
    const eyeTint = c.eyeColor || "#3a8fd4";
    return `
      <div class="avatar-rig avatar-art idle brow-${c.brow || "neutral"} ${extraClass}"
           style="--av-eye:${eyeTint};--av-accent:${c.accent || "#ffd27a"};--av-hair-filter:${filter}">
        <div class="av-shadow"></div>
        <div class="av-body">
          <img class="av-sprite" src="${src}" alt="" draggable="false" style="filter:${filter}" />
          <div class="av-eye-glow" aria-hidden="true"></div>
          ${acc}
        </div>
      </div>`;
  },
};
