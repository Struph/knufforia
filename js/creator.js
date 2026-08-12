window.KnufforiaCreator = {
  STEPS: [
    { id: "name", title: "Name", lead: "Wie heißt dein Held?" },
    { id: "body", title: "Körper", lead: "Wähle deinen 2D-Helden (Fiesta-Stil)." },
    { id: "done", title: "Fertig", lead: "Bereit fürs Abenteuer – Outfits folgen später." },
  ],

  BODIES: [
    { id: "female", label: "Frau" },
    { id: "male", label: "Mann" },
  ],

  CLASSES: [
    { id: "mage", label: "Magier", atk: 14, maxHp: 100, desc: "Hoher Schaden, weniger HP", outfit: "mage" },
    { id: "warrior", label: "Krieger", atk: 12, maxHp: 130, desc: "Ausgewogen und robust", outfit: "warrior" },
    { id: "healer", label: "Heiler", atk: 10, maxHp: 140, desc: "Sehr viel Ausdauer", outfit: "healer" },
    { id: "rogue", label: "Schurke", atk: 16, maxHp: 90, desc: "Höchster Angriff", outfit: "rogue" },
    { id: "ranger", label: "Jäger", atk: 13, maxHp: 115, desc: "Allrounder", outfit: "ranger" },
  ],

  defaults() {
    return {
      name: "",
      body: "female",
      gender: "female",
      skin: "#f3d0b8",
      hairStyle: "shoulder",
      hairColor: "#3a1a58",
      eyeColor: "#b01828",
      brow: "neutral",
      outfit: "rogue",
      cloth1: "#2a2a32",
      cloth2: "#4a4a58",
      accent: "#c0c0d0",
      boot: "#1a1a22",
      accessory: "none",
      classId: "rogue",
    };
  },

  classStats(classId) {
    return this.CLASSES.find((c) => c.id === classId) || this.CLASSES[0];
  },

  /** Canonical 2D hero art for creator, battle, and shop. */
  spriteUrl(c) {
    const g = c.gender || c.body || "female";
    return g === "male" ? "assets/avatar/base-male.png" : "assets/avatar/base-female.png";
  },

  previewUrl(c) {
    return this.spriteUrl(c);
  },

  avatarHtml(c, extraClass = "") {
    const src = this.spriteUrl(c);
    const name = (c.name || "Held").replace(/</g, "");
    return `
      <div class="avatar-rig avatar-art idle ${extraClass}">
        <div class="av-shadow"></div>
        <div class="av-body">
          <img class="av-sprite" src="${src}" alt="${name}" draggable="false" />
        </div>
      </div>`;
  },
};
