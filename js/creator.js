window.KnufforiaCreator = {
  STEPS: [
    { id: "name", title: "Name", lead: "Wie heißt dein Held?" },
    { id: "body", title: "Körper", lead: "Körpertyp und Hautton wählen." },
    { id: "hair", title: "Haare", lead: "Frisur und Haarfarbe." },
    { id: "face", title: "Gesicht", lead: "Augen und Ausdruck." },
    { id: "style", title: "Outfit", lead: "Kleidung, Farben und Accessoire." },
    { id: "class", title: "Klasse", lead: "Deine Kampfrolle – Startwerte." },
    { id: "done", title: "Fertig", lead: "Sieht gut aus? Dann geht’s los." },
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
    { id: "fem", label: "Feminin", cls: "body-fem" },
    { id: "andro", label: "Androgyn", cls: "body-andro" },
    { id: "masc", label: "Maskulin", cls: "body-masc" },
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
    { id: "mage", label: "Magierrobe" },
    { id: "warrior", label: "Leichte Rüstung" },
    { id: "healer", label: "Heilergewand" },
    { id: "rogue", label: "Schattenoutfit" },
    { id: "ranger", label: "Waldläufer" },
  ],
  CLASSES: [
    { id: "mage", label: "Magierin", atk: 14, maxHp: 100, desc: "Hoher Schaden, weniger HP" },
    { id: "warrior", label: "Kriegerin", atk: 12, maxHp: 130, desc: "Ausgewogen und robust" },
    { id: "healer", label: "Heilerin", atk: 10, maxHp: 140, desc: "Sehr viel Ausdauer" },
    { id: "rogue", label: "Schurkin", atk: 16, maxHp: 90, desc: "Höchster Angriff" },
    { id: "ranger", label: "Jägerin", atk: 13, maxHp: 115, desc: "Allrounder" },
  ],

  defaults() {
    return {
      name: "",
      body: "fem",
      skin: "#f3d0b8",
      hairStyle: "long",
      hairColor: "#ff7eb3",
      eyeColor: "#3a8fd4",
      brow: "neutral",
      outfit: "mage",
      cloth1: "#4db89a",
      cloth2: "#2f8f76",
      accent: "#ffd27a",
      boot: "#3a2f45",
      accessory: "flower",
      classId: "mage",
    };
  },

  classStats(classId) {
    return this.CLASSES.find((c) => c.id === classId) || this.CLASSES[0];
  },

  avatarHtml(c, extraClass = "") {
    const body = this.BODIES.find((b) => b.id === c.body) || this.BODIES[0];
    const acc =
      c.accessory && c.accessory !== "none"
        ? `<div class="av-acc ${c.accessory}"></div>`
        : "";
    return `
      <div class="avatar-rig idle hair-${c.hairStyle} brow-${c.brow} outfit-${c.outfit} ${body.cls} ${extraClass}"
           style="--av-skin:${c.skin};--av-hair:${c.hairColor};--av-eye:${c.eyeColor};--av-cloth1:${c.cloth1};--av-cloth2:${c.cloth2};--av-accent:${c.accent};--av-boot:${c.boot || "#3a2f45"}">
        <div class="av-shadow"></div>
        <div class="av-body">
          <div class="av-leg l"><div class="av-thigh"></div><div class="av-shin"></div></div>
          <div class="av-leg r"><div class="av-thigh"></div><div class="av-shin"></div></div>
          <div class="av-skirt"></div>
          <div class="av-hips"></div>
          <div class="av-torso">
            <div class="av-arm l"><div class="av-upper"></div><div class="av-fore"></div></div>
            <div class="av-chest"></div>
            <div class="av-arm r"><div class="av-upper"></div><div class="av-fore"><div class="av-weapon"></div></div></div>
            <div class="av-neck"></div>
            <div class="av-head">
              <div class="av-hair-back"></div>
              <div class="av-face">
                <div class="av-brow l"></div><div class="av-brow r"></div>
                <div class="av-eye l"></div><div class="av-eye r"></div>
                <div class="av-mouth"></div>
              </div>
              <div class="av-hair-front"></div>
              ${acc}
            </div>
          </div>
        </div>
      </div>`;
  },
};
