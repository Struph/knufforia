window.KnufforiaCreator = {
  STEPS: [
    { id: "name", title: "Name", lead: "Wie heißt dein Held?" },
    { id: "body", title: "Körper", lead: "3D-Basiskörper mit Skeleton-Rig (natürliche Pose)." },
    { id: "done", title: "Fertig", lead: "Rig steht – als Nächstes Haare, Gesicht & Outfits." },
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

  modelUrl(c) {
    const g = c.gender || c.body || "female";
    return g === "male" ? "assets/models/base-male.glb" : "assets/models/base-female.glb";
  },

  previewUrl(c) {
    const g = c.gender || c.body || "female";
    return g === "male" ? "assets/models/preview-male.png" : "assets/models/preview-female.png";
  },

  /** Battle/shop still use a 2D stand-in until 3D combat is wired. */
  avatarHtml(c, extraClass = "") {
    const src = this.previewUrl(c);
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
