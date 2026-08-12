(() => {
  const SAVE_KEY = "knufforia-save-v5";
  const AFK_CAP_HOURS = 8;
  const AFK_GOLD_PER_MIN = 2;
  const FORMATION_SLOTS = ["front-a", "front-b", "mid", "back-a", "back-b"];
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  const ORC_POOL = [
    { name: "Knuffork", puppet: "orc", atk: 5, hpMul: 1 },
    { name: "Zahnork", puppet: "orc", atk: 6, hpMul: 1.05 },
    { name: "Keulenork", puppet: "orcBrute", atk: 7, hpMul: 1.2 },
    { name: "Moosork", puppet: "orcBrute", atk: 7, hpMul: 1.25 },
    { name: "Runenork", puppet: "orcShaman", atk: 8, hpMul: 1.1 },
    { name: "Kriegsork", puppet: "orc", atk: 9, hpMul: 1.3 },
  ];

  const C = window.KnufforiaCreator;

  const el = {
    screens: {
      create: document.getElementById("screen-create"),
      battle: document.getElementById("screen-battle"),
      arena: document.getElementById("screen-arena"),
      shop: document.getElementById("screen-shop"),
    },
    createPreview: document.getElementById("create-preview"),
    createBody: document.getElementById("create-body"),
    createSteps: document.getElementById("create-steps"),
    createStepNum: document.getElementById("create-step-num"),
    createNameLive: document.getElementById("create-name-live"),
    createClassLive: document.getElementById("create-class-live"),
    btnCreateBack: document.getElementById("btn-create-back"),
    btnCreateNext: document.getElementById("btn-create-next"),
    gold: document.getElementById("gold"),
    goldShop: document.getElementById("gold-shop"),
    heroLevel: document.getElementById("hero-level"),
    roomLevel: document.getElementById("room-level"),
    bossTag: document.getElementById("boss-tag"),
    heroLane: document.getElementById("hero-lane"),
    enemyLane: document.getElementById("enemy-lane"),
    log: document.getElementById("log"),
    expFill: document.getElementById("exp-fill"),
    upgradeCost: document.getElementById("upgrade-cost"),
    healCost: document.getElementById("heal-cost"),
    btnUpgrade: document.getElementById("btn-upgrade"),
    btnHeal: document.getElementById("btn-heal"),
    btnHelp: document.getElementById("btn-help"),
    btnHelpBattle: document.getElementById("btn-help-battle"),
    btnCloseHelp: document.getElementById("btn-close-help"),
    btnClaimAfk: document.getElementById("btn-claim-afk"),
    btnArenaFight: document.getElementById("btn-arena-fight"),
    arenaStatus: document.getElementById("arena-status"),
    arenaLog: document.getElementById("arena-log"),
    arenaWager: document.getElementById("arena-wager"),
    arenaPreview: document.getElementById("arena-preview"),
    shopPreview: document.getElementById("shop-preview"),
    modalAfk: document.getElementById("modal-afk"),
    modalHelp: document.getElementById("modal-help"),
    afkText: document.getElementById("afk-text"),
    afkGold: document.getElementById("afk-gold"),
    travelOverlay: document.getElementById("travel-overlay"),
    travelText: document.getElementById("travel-text"),
  };

  const state = {
    screen: "create",
    character: null,
    draft: C.defaults(),
    createStep: 0,
    gold: 0,
    heroLevel: 1,
    exp: 0,
    atkBonus: 0,
    room: 1,
    heroes: [],
    enemies: [],
    side: "heroes",
    index: 0,
    busyRoom: false,
    arenaBusy: false,
    lastSeen: Date.now(),
    pendingAfkGold: 0,
    paused: true,
    combatStarted: false,
  };

  function isBossRoom(room) {
    return room > 0 && room % 10 === 0;
  }
  function expToLevel(level) {
    return 24 + level * 12;
  }
  function upgradeCost() {
    return 25 + state.atkBonus * 8 + state.heroLevel * 3;
  }
  function healCost() {
    return 15 + state.heroLevel * 2 + Math.floor(state.room / 2);
  }
  function arenaWager() {
    return 25 + state.room * 6;
  }
  function scaleForRoom(base, room) {
    return Math.floor(base * (1 + (room - 1) * 0.16));
  }

  function buildHeroFromCharacter(ch) {
    const cls = C.classStats(ch.classId);
    const atk = cls.atk + state.atkBonus + (state.heroLevel - 1) * 2;
    const maxHp = cls.maxHp + (state.heroLevel - 1) * 14;
    return {
      id: "player",
      name: ch.name || "Held",
      character: ch,
      atk,
      maxHp,
      hp: maxHp,
      dead: false,
      custom: true,
    };
  }

  function makeWave(room) {
    if (isBossRoom(room)) {
      const hp = scaleForRoom(180, room);
      return [
        {
          name: `Häuptling Raum ${room}`,
          puppet: "orcBoss",
          atk: scaleForRoom(12, room),
          maxHp: hp,
          hp,
          dead: false,
          boss: true,
        },
      ];
    }
    return Array.from({ length: 5 }, (_, i) => {
      const t = ORC_POOL[(room + i) % ORC_POOL.length];
      const maxHp = scaleForRoom(22 * t.hpMul, room);
      return {
        name: t.name,
        puppet: t.puppet,
        atk: scaleForRoom(t.atk, room),
        maxHp,
        hp: maxHp,
        dead: false,
        boss: false,
      };
    });
  }

  function living(list) {
    return list.filter((u) => !u.dead && u.hp > 0);
  }
  function firstLiving(list) {
    return list.find((u) => !u.dead && u.hp > 0) || null;
  }

  function unitNode(unit, side, slot) {
    const wrap = document.createElement("div");
    const solo = side === "heroes";
    wrap.className = `unit ${solo ? "solo-hero" : unit.boss ? "boss-unit" : `slot-${slot}`}${unit.dead ? " dead" : ""}`;
    wrap.dataset.side = side;
    if (unit.custom && unit.character) {
      wrap.innerHTML = `
        ${C.avatarHtml(unit.character)}
        <p class="unit-name">${unit.name}</p>
        <div class="unit-hp"><span style="width:${Math.max(0, (unit.hp / unit.maxHp) * 100)}%"></span></div>`;
    } else {
      const facing = side === "heroes" ? "right" : "left";
      wrap.innerHTML = `
        ${window.KnufforiaPuppets.html(unit.puppet || "orc", facing)}
        <p class="unit-name">${unit.name}</p>
        <div class="unit-hp"><span style="width:${Math.max(0, (unit.hp / unit.maxHp) * 100)}%"></span></div>`;
      if (unit.boss) wrap.querySelector(".puppet")?.classList.add("boss");
    }
    return wrap;
  }

  function renderLanes() {
    el.heroLane.innerHTML = "";
    el.enemyLane.innerHTML = "";
    const boss = state.enemies.length === 1 && state.enemies[0]?.boss;
    el.enemyLane.classList.toggle("boss-mode", !!boss);
    state.heroes.forEach((h) => el.heroLane.appendChild(unitNode(h, "heroes", "mid")));
    state.enemies.forEach((e, i) => {
      const slot = boss ? "mid" : FORMATION_SLOTS[i] || "mid";
      el.enemyLane.appendChild(unitNode(e, "foes", slot));
    });
    requestAnimationFrame(() => {
      el.heroLane.querySelectorAll(".avatar-rig, .puppet").forEach((r) => window.KnufforiaPuppets.setAnim(r, "idle"));
      el.enemyLane.querySelectorAll(".puppet").forEach((r) => window.KnufforiaPuppets.setAnim(r, "idle"));
    });
  }

  function findUnitEl(side, index) {
    const lane = side === "heroes" ? el.heroLane : el.enemyLane;
    return lane.children[index] || null;
  }

  function homeTransform(node) {
    if (node.classList.contains("solo-hero") || node.classList.contains("boss-unit")) {
      return "translate(-50%, -50%)";
    }
    return "translate(0px, 0px)";
  }

  function sparkAt(node) {
    if (!node) return;
    const r = node.getBoundingClientRect();
    const spark = document.createElement("div");
    spark.className = "hit-spark";
    spark.style.left = `${r.left + r.width * 0.55}px`;
    spark.style.top = `${r.top + r.height * 0.35}px`;
    document.body.appendChild(spark);
    const arc = document.createElement("div");
    arc.className = "slash-arc";
    arc.style.left = `${r.left + r.width * 0.35}px`;
    arc.style.top = `${r.top + r.height * 0.25}px`;
    document.body.appendChild(arc);
    setTimeout(() => {
      spark.remove();
      arc.remove();
    }, 360);
  }

  function floatText(text, node, kind = "") {
    if (!node) return;
    const r = node.getBoundingClientRect();
    const tip = document.createElement("div");
    tip.className = `float-text${kind ? ` ${kind}` : ""}`;
    tip.textContent = text;
    tip.style.left = `${r.left + r.width / 2 - 10}px`;
    tip.style.top = `${r.top + 8}px`;
    document.body.appendChild(tip);
    setTimeout(() => tip.remove(), 850);
  }

  function setLog(text) {
    el.log.textContent = text;
  }

  function refreshSidePreviews() {
    if (!state.character) return;
    if (el.arenaPreview) el.arenaPreview.innerHTML = C.avatarHtml(state.character);
    if (el.shopPreview) el.shopPreview.innerHTML = C.avatarHtml(state.character);
  }

  function renderHud() {
    const goldText = Math.floor(state.gold).toLocaleString("de-DE");
    el.gold.textContent = goldText;
    el.goldShop.textContent = goldText;
    el.heroLevel.textContent = String(state.heroLevel);
    el.roomLevel.textContent = String(state.room);
    el.bossTag.classList.toggle("hidden", !isBossRoom(state.room));
    const need = expToLevel(state.heroLevel);
    el.expFill.style.width = `${Math.min(100, (state.exp / need) * 100)}%`;
    el.upgradeCost.textContent = `${upgradeCost()} Gold`;
    el.healCost.textContent = `${healCost()} Gold`;
    el.btnUpgrade.disabled = state.gold < upgradeCost();
    const wounded = state.heroes.some((h) => h.hp < h.maxHp);
    el.btnHeal.disabled = state.gold < healCost() || !wounded;
    el.arenaWager.textContent = String(arenaWager());
    el.btnArenaFight.disabled = state.arenaBusy || state.gold < arenaWager();

    state.heroes.forEach((h, i) => {
      const node = el.heroLane.children[i];
      if (!node) return;
      node.classList.toggle("dead", h.dead);
      const bar = node.querySelector(".unit-hp > span");
      if (bar) bar.style.width = `${Math.max(0, (h.hp / h.maxHp) * 100)}%`;
    });
    state.enemies.forEach((e, i) => {
      const node = el.enemyLane.children[i];
      if (!node) return;
      node.classList.toggle("dead", e.dead);
      const bar = node.querySelector(".unit-hp > span");
      if (bar) bar.style.width = `${Math.max(0, (e.hp / e.maxHp) * 100)}%`;
    });
  }

  function gainExp(amount) {
    state.exp += amount;
    let need = expToLevel(state.heroLevel);
    while (state.exp >= need) {
      state.exp -= need;
      state.heroLevel += 1;
      state.heroes.forEach((h) => {
        h.atk += 2;
        h.maxHp += 14;
        if (!h.dead) h.hp = Math.min(h.maxHp, h.hp + 14);
      });
      setLog(`Level up! ${state.character?.name || "Held"} ist jetzt Stufe ${state.heroLevel}.`);
      need = expToLevel(state.heroLevel);
    }
  }

  function showScreen(name) {
    state.screen = name;
    state.paused = name !== "battle";
    Object.entries(el.screens).forEach(([key, node]) => {
      node.classList.toggle("active", key === name);
    });
    if (name === "shop" || name === "arena") refreshSidePreviews();
    renderHud();
  }

  function startAdventure() {
    state.heroes = [buildHeroFromCharacter(state.character)];
    state.enemies = makeWave(state.room);
    state.side = "heroes";
    state.index = 0;
    renderLanes();
    showScreen("battle");
    setLog(`${state.character.name} betritt Raum ${state.room}.`);
    showAfkIfNeeded();
    save();
    if (!state.combatStarted) {
      state.combatStarted = true;
      combatLoop();
    }
    state.paused = false;
  }

  /* ===== Creator UI ===== */
  let viewerReady = false;

  async function ensureViewer() {
    if (!window.KnufforiaViewer3D) return;
    await window.KnufforiaViewer3D.mount(el.createPreview);
    viewerReady = true;
  }

  async function renderCreatePreview() {
    el.createNameLive.textContent = state.draft.name.trim() || "Dein Held";
    const g = state.draft.gender || state.draft.body || "female";
    el.createClassLive.textContent = g === "male" ? "Mann · Basis" : "Frau · Basis";
    try {
      await ensureViewer();
      await window.KnufforiaViewer3D.show(g);
    } catch (err) {
      el.createPreview.innerHTML = C.avatarHtml(state.draft);
    }
  }

  function chips(options, key) {
    return `<div class="option-row">${options
      .map(
        (o) =>
          `<button type="button" class="option-chip ${state.draft[key] === o.id ? "active" : ""}" data-key="${key}" data-val="${o.id}">${o.label}</button>`
      )
      .join("")}</div>`;
  }

  function renderCreateStep() {
    const step = C.STEPS[state.createStep];
    el.createStepNum.textContent = String(state.createStep + 1);
    el.createSteps.innerHTML = C.STEPS.map(
      (s, i) =>
        `<button type="button" class="create-step-dot ${i === state.createStep ? "active" : ""} ${i < state.createStep ? "done" : ""}" data-goto="${i}">${s.title}</button>`
    ).join("");

    let html = `<h2>${step.title}</h2><p class="lead">${step.lead}</p><div class="create-grid">`;

    if (step.id === "name") {
      html += `<div class="create-field"><label for="in-name">Heldenname</label>
        <input id="in-name" type="text" maxlength="16" placeholder="z. B. Liora" value="${state.draft.name.replace(/"/g, "&quot;")}" /></div>`;
    } else if (step.id === "body") {
      html += `<div class="create-field"><label>Geschlecht</label>${chips(C.BODIES, "body")}</div>
        <p class="lead">3D-Basiskörper mit Unterwäsche. Drehen: Finger über dem Modell wischen.</p>`;
    } else if (step.id === "done") {
      const g = state.draft.gender || state.draft.body || "female";
      html += `<p class="lead"><strong>${state.draft.name.trim() || "Dein Held"}</strong> · ${g === "male" ? "Mann" : "Frau"}</p>
        <p class="lead">Als Nächstes: Haare, Gesicht, Outfits auf diesem 3D-Körper.</p>`;
    }

    html += `</div>`;
    el.createBody.innerHTML = html;
    el.btnCreateBack.disabled = state.createStep === 0;
    el.btnCreateNext.textContent = step.id === "done" ? "Abenteuer starten" : "Weiter";
    renderCreatePreview();
  }

  function bindCreateEvents() {
    el.createBody.addEventListener("input", (e) => {
      if (e.target.id === "in-name") {
        state.draft.name = e.target.value.slice(0, 16);
        renderCreatePreview();
      }
    });
    el.createBody.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-key]");
      if (!btn) return;
      const key = btn.dataset.key;
      const val = btn.dataset.val;
      state.draft[key] = val;
      if (key === "body") {
        state.draft.gender = val === "male" ? "male" : "female";
        state.draft.body = state.draft.gender;
      }
      renderCreateStep();
    });
    el.createSteps.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-goto]");
      if (!btn) return;
      const goto = Number(btn.dataset.goto);
      if (goto <= state.createStep) {
        state.createStep = goto;
        renderCreateStep();
      }
    });
    el.btnCreateBack.addEventListener("click", () => {
      if (state.createStep > 0) {
        state.createStep -= 1;
        renderCreateStep();
      }
    });
    el.btnCreateNext.addEventListener("click", () => {
      const step = C.STEPS[state.createStep];
      if (step.id === "name" && !state.draft.name.trim()) {
        state.draft.name = "Liora";
      }
      if (step.id === "done") {
        state.character = {
          ...state.draft,
          name: state.draft.name.trim() || "Liora",
          gender: state.draft.gender || state.draft.body || "female",
          body: state.draft.gender || state.draft.body || "female",
        };
        state.gold = 40;
        state.heroLevel = 1;
        state.exp = 0;
        state.atkBonus = 0;
        state.room = 1;
        startAdventure();
        return;
      }
      state.createStep = Math.min(state.createStep + 1, C.STEPS.length - 1);
      renderCreateStep();
    });
  }

  /* ===== Combat ===== */
  async function moveUnitToTarget(node, targetNode) {
    node.style.transition = "none";
    node.style.transform = homeTransform(node);
    void node.offsetWidth;
    const a = node.getBoundingClientRect();
    const b = targetNode.getBoundingClientRect();
    const gap = 42;
    let dx = b.left + b.width / 2 - (a.left + a.width / 2);
    let dy = b.top + b.height / 2 - (a.top + a.height / 2);
    const len = Math.hypot(dx, dy) || 1;
    dx -= (dx / len) * gap;
    dy -= (dy / len) * gap;
    node.classList.add("combat-active");
    node.style.transition = "transform 0.55s cubic-bezier(0.22, 0.9, 0.28, 1)";
    if (node.classList.contains("solo-hero") || node.classList.contains("boss-unit")) {
      node.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
    } else {
      node.style.transform = `translate(${dx}px, ${dy}px)`;
    }
    await wait(560);
  }

  async function moveUnitHome(node) {
    node.classList.add("combat-returning");
    node.style.transition = "transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)";
    node.style.transform = homeTransform(node);
    await wait(520);
    node.classList.remove("combat-active", "combat-returning");
    node.style.transition = "";
  }

  async function choreographedAttack(attacker, atkIndex, target, defIndex, side) {
    const atkNode = findUnitEl(side === "heroes" ? "heroes" : "foes", atkIndex);
    const defNode = findUnitEl(side === "heroes" ? "foes" : "heroes", defIndex);
    if (!atkNode || !defNode) return;
    const puppet = atkNode.querySelector(".avatar-rig, .puppet");
    const defPuppet = defNode.querySelector(".avatar-rig, .puppet");
    if (!puppet) return;

    atkNode.style.zIndex = "30";
    window.KnufforiaPuppets.setAnim(puppet, "walk");
    await wait(30);
    await moveUnitToTarget(atkNode, defNode);
    window.KnufforiaPuppets.setAnim(puppet, "attack");
    await wait(200);
    sparkAt(defNode);
    if (defPuppet) window.KnufforiaPuppets.setAnim(defPuppet, "hurt");

    const dmg = attacker.atk + Math.floor(Math.random() * 4);
    target.hp = Math.max(0, target.hp - dmg);
    floatText(`-${dmg}`, defNode, "dmg");
    if (target.hp <= 0) {
      target.dead = true;
      target.hp = 0;
      setLog(`${attacker.name} besiegt ${target.name}!`);
    } else {
      setLog(`${attacker.name} trifft ${target.name} für ${dmg}.`);
    }
    renderHud();
    await wait(220);
    if (defPuppet) window.KnufforiaPuppets.setAnim(defPuppet, "idle");
    window.KnufforiaPuppets.setAnim(puppet, "walk");
    await moveUnitHome(atkNode);
    window.KnufforiaPuppets.setAnim(puppet, "idle");
    atkNode.style.zIndex = "";
  }

  function nextRoom() {
    state.busyRoom = true;
    state.paused = true;
    const cleared = state.room;
    const goldGain = isBossRoom(cleared) ? 90 + cleared * 8 : 20 + cleared * 4;
    const expGain = isBossRoom(cleared) ? 34 + cleared : 12 + Math.floor(cleared * 1.3);
    state.gold += goldGain;
    gainExp(expGain);
    el.travelText.textContent = isBossRoom(cleared) ? `Boss besiegt! Raum ${cleared + 1}…` : `Raum ${cleared} geschafft!`;
    el.travelOverlay.classList.remove("hidden");
    setTimeout(() => {
      state.room += 1;
      state.heroes.forEach((h) => {
        h.dead = false;
        h.hp = Math.min(h.maxHp, Math.max(h.hp, Math.ceil(h.maxHp * 0.6)));
      });
      state.enemies = makeWave(state.room);
      state.side = "heroes";
      state.index = 0;
      renderLanes();
      setLog(isBossRoom(state.room) ? `Boss-Raum ${state.room}!` : `Raum ${state.room}: Neue Orks.`);
      el.travelOverlay.classList.add("hidden");
      state.busyRoom = false;
      state.paused = state.screen !== "battle";
      save();
      renderHud();
    }, 900);
  }

  function wipeRecover() {
    state.paused = true;
    setLog("Niederlage… dein Held steht wieder auf.");
    state.heroes.forEach((h) => {
      h.dead = false;
      h.hp = Math.ceil(h.maxHp * 0.5);
    });
    state.enemies = makeWave(state.room);
    state.side = "heroes";
    state.index = 0;
    renderLanes();
    setTimeout(() => {
      state.paused = state.screen !== "battle";
      save();
      renderHud();
    }, 700);
  }

  async function attackOnce() {
    if (state.paused || state.busyRoom || state.screen !== "battle") return;
    if (window.matchMedia("(orientation: portrait) and (max-width: 920px)").matches) return;
    if (!living(state.enemies).length) {
      nextRoom();
      return;
    }
    if (!living(state.heroes).length) {
      wipeRecover();
      return;
    }

    const attackers = state.side === "heroes" ? state.heroes : state.enemies;
    const defenders = state.side === "heroes" ? state.enemies : state.heroes;
    let tries = 0;
    while (tries < attackers.length && (attackers[state.index].dead || attackers[state.index].hp <= 0)) {
      state.index = (state.index + 1) % attackers.length;
      tries += 1;
    }
    if (tries >= attackers.length) {
      state.side = state.side === "heroes" ? "enemies" : "heroes";
      state.index = 0;
      return;
    }

    const atkIndex = state.index;
    const attacker = attackers[atkIndex];
    const target = firstLiving(defenders);
    if (!target) {
      if (defenders === state.enemies) nextRoom();
      else wipeRecover();
      return;
    }
    const defIndex = defenders.indexOf(target);
    const side = state.side;
    state.paused = true;
    await choreographedAttack(attacker, atkIndex, target, defIndex, side);
    state.paused = state.screen !== "battle" || state.busyRoom;

    if (atkIndex + 1 >= attackers.length) {
      state.side = side === "heroes" ? "enemies" : "heroes";
      state.index = 0;
    } else {
      state.index = atkIndex + 1;
    }

    if (!living(state.enemies).length) {
      nextRoom();
      return;
    }
    if (!living(state.heroes).length) {
      wipeRecover();
      return;
    }
    save();
  }

  async function combatLoop() {
    while (true) {
      try {
        await attackOnce();
      } catch (_) {}
      await wait(220);
    }
  }

  function doUpgrade() {
    const cost = upgradeCost();
    if (state.gold < cost) return;
    state.gold -= cost;
    state.atkBonus += 3;
    state.heroes.forEach((h) => {
      h.atk += 3;
    });
    setLog("Sternenklinge! ATK +3.");
    save();
    renderHud();
  }

  function doHeal() {
    const cost = healCost();
    if (state.gold < cost) return;
    state.gold -= cost;
    state.heroes.forEach((h) => {
      h.dead = false;
      h.hp = h.maxHp;
    });
    setLog("Kirschtrank! Volle Heilung.");
    renderLanes();
    save();
    renderHud();
  }

  function runArenaFight() {
    const wager = arenaWager();
    if (state.arenaBusy || state.gold < wager) return;
    state.arenaBusy = true;
    state.gold -= wager;
    el.arenaStatus.textContent = "Kampf…";
    renderHud();
    const hero = state.heroes[0];
    let orcHp = 55 + state.room * 16 + state.atkBonus * 2;
    const orcAtk = 8 + Math.floor(state.room * 1.7);
    let heroHp = hero?.hp || 50;
    let round = 0;
    const timer = setInterval(() => {
      round += 1;
      const dmg = (hero?.atk || 10) + Math.floor(Math.random() * 5);
      orcHp -= dmg;
      el.arenaLog.textContent = `Runde ${round}: ${dmg} Schaden. Ork ${Math.max(0, Math.ceil(orcHp))} HP`;
      if (orcHp <= 0) {
        clearInterval(timer);
        const reward = Math.floor(wager * 2.5);
        state.gold += reward;
        gainExp(14 + state.room);
        state.arenaBusy = false;
        el.arenaStatus.textContent = "Sieg!";
        el.arenaLog.textContent = `+${reward} Gold`;
        save();
        renderHud();
        return;
      }
      heroHp -= Math.max(1, orcAtk - Math.floor(state.heroLevel / 3));
      if (heroHp <= 0) {
        clearInterval(timer);
        state.arenaBusy = false;
        el.arenaStatus.textContent = "Niederlage";
        el.arenaLog.textContent = "Einsatz verloren.";
        save();
        renderHud();
      }
    }, 650);
  }

  function save() {
    state.lastSeen = Date.now();
    const payload = {
      character: state.character,
      gold: state.gold,
      heroLevel: state.heroLevel,
      exp: state.exp,
      atkBonus: state.atkBonus,
      room: state.room,
      heroHp: state.heroes[0]?.hp,
      lastSeen: state.lastSeen,
    };
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
    } catch (_) {}
  }

  function load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return false;
      const data = JSON.parse(raw);
      if (!data.character || !data.character.name) return false;
      state.character = data.character;
      state.gold = data.gold ?? 0;
      state.heroLevel = data.heroLevel ?? 1;
      state.exp = data.exp ?? 0;
      state.atkBonus = data.atkBonus ?? 0;
      state.room = data.room ?? 1;
      state.lastSeen = data.lastSeen ?? Date.now();
      state.heroes = [buildHeroFromCharacter(state.character)];
      if (typeof data.heroHp === "number") {
        state.heroes[0].hp = Math.max(1, Math.min(state.heroes[0].maxHp, data.heroHp));
      }
      return true;
    } catch (_) {
      return false;
    }
  }

  function computeAfk() {
    const minutes = Math.floor((Date.now() - state.lastSeen) / 60000);
    if (minutes < 2) return 0;
    return Math.min(minutes, AFK_CAP_HOURS * 60) * AFK_GOLD_PER_MIN;
  }

  function showAfkIfNeeded() {
    const gain = computeAfk();
    if (gain <= 0) return;
    state.pendingAfkGold = gain;
    const mins = Math.floor(gain / AFK_GOLD_PER_MIN);
    const hours = Math.floor(mins / 60);
    const rem = mins % 60;
    el.afkText.textContent = hours > 0 ? `${hours} Std. ${rem} Min. AFK-Gold.` : `${rem} Min. AFK-Gold.`;
    el.afkGold.textContent = `+${gain.toLocaleString("de-DE")} Gold`;
    el.modalAfk.classList.remove("hidden");
  }

  // Wire UI
  document.querySelectorAll("[data-screen]").forEach((btn) => {
    btn.addEventListener("click", () => showScreen(btn.dataset.screen));
  });
  document.querySelectorAll("[data-back]").forEach((btn) => {
    btn.addEventListener("click", () => showScreen("battle"));
  });
  el.btnUpgrade.addEventListener("click", doUpgrade);
  el.btnHeal.addEventListener("click", doHeal);
  el.btnArenaFight.addEventListener("click", runArenaFight);
  const openHelp = () => el.modalHelp.classList.remove("hidden");
  el.btnHelp?.addEventListener("click", openHelp);
  el.btnHelpBattle?.addEventListener("click", openHelp);
  el.btnCloseHelp.addEventListener("click", () => el.modalHelp.classList.add("hidden"));
  el.btnClaimAfk.addEventListener("click", () => {
    state.gold += state.pendingAfkGold;
    state.pendingAfkGold = 0;
    el.modalAfk.classList.add("hidden");
    save();
    renderHud();
  });

  bindCreateEvents();

  const hasSave = load();
  if (hasSave) {
    state.enemies = makeWave(state.room);
    renderLanes();
    showScreen("battle");
    setLog(`${state.character.name} ist zurück in Raum ${state.room}.`);
    showAfkIfNeeded();
    save();
    state.combatStarted = true;
    state.paused = false;
    combatLoop();
  } else {
    showScreen("create");
    renderCreateStep();
  }

  setInterval(save, 15000);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") save();
  });
})();
