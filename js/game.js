(() => {
  const SAVE_KEY = "knufforia-save-v2";
  const TICK_MS = 750;
  const AFK_CAP_HOURS = 8;
  const AFK_GOLD_PER_MIN = 2;

  const HERO_TEMPLATES = [
    { id: "lumi", name: "Lumi", img: "assets/heroes/hero-lumi.webp?v=3", atk: 12, maxHp: 110 },
    { id: "sora", name: "Sora", img: "assets/heroes/hero-sora.webp?v=3", atk: 11, maxHp: 105 },
    { id: "mika", name: "Mika", img: "assets/heroes/hero-mika.webp?v=3", atk: 14, maxHp: 100 },
    { id: "hana", name: "Hana", img: "assets/heroes/hero-hana.webp?v=3", atk: 10, maxHp: 120 },
    { id: "nori", name: "Nori", img: "assets/heroes/hero-nori.webp?v=3", atk: 13, maxHp: 95 },
  ];

  const ORC_POOL = [
    { name: "Knuffork", img: "assets/enemies/orc-grunt.webp?v=3", atk: 5, hpMul: 1 },
    { name: "Zahnork", img: "assets/enemies/orc-grunt.webp?v=3", atk: 6, hpMul: 1.05 },
    { name: "Keulenork", img: "assets/enemies/orc-brute.webp?v=3", atk: 7, hpMul: 1.2 },
    { name: "Moosork", img: "assets/enemies/orc-brute.webp?v=3", atk: 7, hpMul: 1.25 },
    { name: "Runenork", img: "assets/enemies/orc-shaman.webp?v=3", atk: 8, hpMul: 1.1 },
    { name: "Kriegsork", img: "assets/enemies/orc-warrior.webp?v=3", atk: 9, hpMul: 1.3 },
  ];

  const el = {
    screens: {
      battle: document.getElementById("screen-battle"),
      arena: document.getElementById("screen-arena"),
      shop: document.getElementById("screen-shop"),
    },
    gold: document.getElementById("gold"),
    goldShop: document.getElementById("gold-shop"),
    teamLevel: document.getElementById("team-level"),
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
    btnCloseHelp: document.getElementById("btn-close-help"),
    btnClaimAfk: document.getElementById("btn-claim-afk"),
    btnArenaFight: document.getElementById("btn-arena-fight"),
    arenaStatus: document.getElementById("arena-status"),
    arenaLog: document.getElementById("arena-log"),
    arenaWager: document.getElementById("arena-wager"),
    modalAfk: document.getElementById("modal-afk"),
    modalHelp: document.getElementById("modal-help"),
    afkText: document.getElementById("afk-text"),
    afkGold: document.getElementById("afk-gold"),
    travelOverlay: document.getElementById("travel-overlay"),
    travelText: document.getElementById("travel-text"),
  };

  const state = {
    screen: "battle",
    gold: 0,
    teamLevel: 1,
    exp: 0,
    atkBonus: 0,
    room: 1,
    heroes: [],
    enemies: [],
    side: "heroes", // whose turn chain
    index: 0,
    busyRoom: false,
    arenaBusy: false,
    lastSeen: Date.now(),
    pendingAfkGold: 0,
    paused: false,
  };

  function isBossRoom(room) {
    return room > 0 && room % 10 === 0;
  }

  function expToLevel(level) {
    return 20 + level * 10;
  }

  function upgradeCost() {
    return 25 + state.atkBonus * 8 + state.teamLevel * 3;
  }

  function healCost() {
    return 15 + state.teamLevel * 2 + Math.floor(state.room / 2);
  }

  function arenaWager() {
    return 25 + state.room * 6;
  }

  function makeHeroes() {
    return HERO_TEMPLATES.map((t) => ({
      ...t,
      atk: t.atk + state.atkBonus + (state.teamLevel - 1) * 2,
      maxHp: t.maxHp + (state.teamLevel - 1) * 10,
      hp: t.maxHp + (state.teamLevel - 1) * 10,
      dead: false,
    }));
  }

  function scaleForRoom(base, room) {
    return Math.floor(base * (1 + (room - 1) * 0.18));
  }

  function makeWave(room) {
    if (isBossRoom(room)) {
      const hp = scaleForRoom(220, room);
      return [
        {
          name: `Häuptling Raum ${room}`,
          img: "assets/enemies/orc-boss.webp?v=3",
          atk: scaleForRoom(14, room),
          maxHp: hp,
          hp,
          dead: false,
          boss: true,
        },
      ];
    }

    return Array.from({ length: 5 }, (_, i) => {
      const template = ORC_POOL[(room + i) % ORC_POOL.length];
      const maxHp = scaleForRoom(28 * template.hpMul, room);
      return {
        name: template.name,
        img: template.img,
        atk: scaleForRoom(template.atk, room),
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

  function unitNode(unit, side) {
    const wrap = document.createElement("div");
    wrap.className = `unit${unit.boss ? " boss-unit" : ""}${unit.dead ? " dead" : ""}`;
    wrap.dataset.id = unit.id || unit.name;
    wrap.dataset.side = side;
    wrap.innerHTML = `
      <img class="unit-art" src="${unit.img}" alt="" />
      <p class="unit-name">${unit.name}</p>
      <div class="unit-hp"><span style="width:${Math.max(0, (unit.hp / unit.maxHp) * 100)}%"></span></div>
    `;
    return wrap;
  }

  function renderLanes() {
    el.heroLane.innerHTML = "";
    el.enemyLane.innerHTML = "";
    const boss = state.enemies.length === 1 && state.enemies[0].boss;
    el.enemyLane.classList.toggle("boss-mode", !!boss);
    state.heroes.forEach((h) => el.heroLane.appendChild(unitNode(h, "heroes")));
    state.enemies.forEach((e) => el.enemyLane.appendChild(unitNode(e, "foes")));
  }

  function findUnitEl(side, index) {
    const lane = side === "heroes" ? el.heroLane : el.enemyLane;
    return lane.children[index] || null;
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

  function renderHud() {
    const goldText = Math.floor(state.gold).toLocaleString("de-DE");
    el.gold.textContent = goldText;
    el.goldShop.textContent = goldText;
    el.teamLevel.textContent = String(state.teamLevel);
    el.roomLevel.textContent = String(state.room);
    el.bossTag.classList.toggle("hidden", !isBossRoom(state.room));

    const need = expToLevel(state.teamLevel);
    el.expFill.style.width = `${Math.min(100, (state.exp / need) * 100)}%`;

    el.upgradeCost.textContent = `${upgradeCost()} Gold`;
    el.healCost.textContent = `${healCost()} Gold`;
    el.btnUpgrade.disabled = state.gold < upgradeCost();
    const wounded = state.heroes.some((h) => h.hp < h.maxHp);
    el.btnHeal.disabled = state.gold < healCost() || !wounded;

    const wager = arenaWager();
    el.arenaWager.textContent = String(wager);
    el.btnArenaFight.disabled = state.arenaBusy || state.gold < wager;

    // refresh hp bars without full rebuild when possible
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
    let need = expToLevel(state.teamLevel);
    while (state.exp >= need) {
      state.exp -= need;
      state.teamLevel += 1;
      state.heroes.forEach((h) => {
        h.atk += 2;
        h.maxHp += 10;
        if (!h.dead) h.hp = Math.min(h.maxHp, h.hp + 10);
      });
      setLog(`Team-Level ${state.teamLevel}! Alle Heldinnen werden stärker.`);
      need = expToLevel(state.teamLevel);
    }
  }

  function showScreen(name) {
    state.screen = name;
    state.paused = name !== "battle";
    Object.entries(el.screens).forEach(([key, node]) => {
      node.classList.toggle("active", key === name);
    });
    renderHud();
  }

  function nextRoom() {
    state.busyRoom = true;
    state.paused = true;
    const cleared = state.room;
    const goldGain = isBossRoom(cleared)
      ? 80 + cleared * 8
      : 18 + cleared * 4;
    const expGain = isBossRoom(cleared) ? 30 + cleared : 10 + Math.floor(cleared * 1.2);
    state.gold += goldGain;
    gainExp(expGain);

    el.travelText.textContent = isBossRoom(cleared)
      ? `Boss besiegt! Raum ${cleared + 1}…`
      : `Raum ${cleared} geschafft! Weiter…`;
    el.travelOverlay.classList.remove("hidden");

    setTimeout(() => {
      state.room += 1;
      // heal a bit between rooms
      state.heroes.forEach((h) => {
        h.dead = false;
        h.hp = Math.min(h.maxHp, Math.max(h.hp, Math.ceil(h.maxHp * 0.55)));
      });
      state.enemies = makeWave(state.room);
      state.side = "heroes";
      state.index = 0;
      renderLanes();
      setLog(
        isBossRoom(state.room)
          ? `Boss-Raum ${state.room}! Der Häuptling blockiert den Weg.`
          : `Raum ${state.room}: Neue Orks versperren den Pfad.`
      );
      el.travelOverlay.classList.add("hidden");
      state.busyRoom = false;
      state.paused = state.screen !== "battle";
      save();
      renderHud();
    }, 900);
  }

  function wipeRecover() {
    state.paused = true;
    setLog("Das Team fällt… aber steht wieder auf. Raum bleibt.");
    state.heroes.forEach((h) => {
      h.dead = false;
      h.hp = Math.ceil(h.maxHp * 0.45);
    });
    // soft reset current wave a bit
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

  function attackOnce() {
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

    // advance index to next living attacker
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

    const atkNode = findUnitEl(state.side === "heroes" ? "heroes" : "foes", atkIndex);
    const defNode = findUnitEl(state.side === "heroes" ? "foes" : "heroes", defIndex);

    if (atkNode) {
      atkNode.classList.remove("attack-hero", "attack-foe");
      void atkNode.offsetWidth;
      atkNode.classList.add(state.side === "heroes" ? "attack-hero" : "attack-foe");
    }
    if (defNode) {
      defNode.classList.remove("hurt");
      void defNode.offsetWidth;
      defNode.classList.add("hurt");
    }

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

    const next = state.index + 1;
    if (next >= attackers.length) {
      state.side = state.side === "heroes" ? "enemies" : "heroes";
      state.index = 0;
    } else {
      state.index = next;
    }

    renderHud();

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

  function doUpgrade() {
    const cost = upgradeCost();
    if (state.gold < cost) return;
    state.gold -= cost;
    state.atkBonus += 3;
    state.heroes.forEach((h) => {
      h.atk += 3;
    });
    setLog("Sternenklinge! Alle Heldinnen +3 ATK.");
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
    setLog("Kirschtrank! Das ganze Team ist geheilt.");
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
    el.arenaLog.textContent = "Lumi stellt sich dem Aren-Ork!";
    renderHud();

    let orcHp = 50 + state.room * 18 + state.atkBonus * 2;
    const orcAtk = 8 + Math.floor(state.room * 1.8);
    const teamAtk = state.heroes.reduce((s, h) => s + h.atk, 0) / state.heroes.length;
    let heroHp = state.heroes.reduce((s, h) => s + h.hp, 0);
    let round = 0;

    const timer = setInterval(() => {
      round += 1;
      const dmg = Math.floor(teamAtk + Math.random() * 6);
      orcHp -= dmg;
      el.arenaLog.textContent = `Runde ${round}: Team trifft für ${dmg}. Ork ${Math.max(0, Math.ceil(orcHp))} HP`;

      if (orcHp <= 0) {
        clearInterval(timer);
        const reward = Math.floor(wager * 2.5);
        state.gold += reward;
        gainExp(12 + state.room);
        state.arenaBusy = false;
        el.arenaStatus.textContent = "Sieg!";
        el.arenaLog.textContent = `Aren-Ork besiegt! +${reward} Gold`;
        save();
        renderHud();
        return;
      }

      heroHp -= Math.max(1, orcAtk - Math.floor(state.teamLevel / 3));
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
      gold: state.gold,
      teamLevel: state.teamLevel,
      exp: state.exp,
      atkBonus: state.atkBonus,
      room: state.room,
      heroes: state.heroes.map((h) => ({ id: h.id, hp: h.hp, maxHp: h.maxHp, atk: h.atk, dead: h.dead })),
      lastSeen: state.lastSeen,
    };
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
    } catch (_) {
      /* ignore */
    }
  }

  function load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return false;
      const data = JSON.parse(raw);
      state.gold = data.gold ?? 0;
      state.teamLevel = data.teamLevel ?? 1;
      state.exp = data.exp ?? 0;
      state.atkBonus = data.atkBonus ?? 0;
      state.room = data.room ?? 1;
      state.lastSeen = data.lastSeen ?? Date.now();
      state.heroes = makeHeroes();
      if (Array.isArray(data.heroes)) {
        data.heroes.forEach((saved) => {
          const h = state.heroes.find((x) => x.id === saved.id);
          if (!h) return;
          h.hp = saved.hp ?? h.maxHp;
          h.maxHp = saved.maxHp ?? h.maxHp;
          h.atk = saved.atk ?? h.atk;
          h.dead = !!saved.dead;
        });
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
    el.afkText.textContent =
      hours > 0
        ? `Dein Team hat ${hours} Std. ${rem} Min. gesammelt.`
        : `Dein Team hat ${rem} Min. gesammelt.`;
    el.afkGold.textContent = `+${gain.toLocaleString("de-DE")} Gold`;
    el.modalAfk.classList.remove("hidden");
  }

  // wire UI
  document.querySelectorAll("[data-screen]").forEach((btn) => {
    btn.addEventListener("click", () => showScreen(btn.dataset.screen));
  });
  document.querySelectorAll("[data-back]").forEach((btn) => {
    btn.addEventListener("click", () => showScreen("battle"));
  });
  el.btnUpgrade.addEventListener("click", doUpgrade);
  el.btnHeal.addEventListener("click", doHeal);
  el.btnArenaFight.addEventListener("click", runArenaFight);
  el.btnHelp.addEventListener("click", () => el.modalHelp.classList.remove("hidden"));
  el.btnCloseHelp.addEventListener("click", () => el.modalHelp.classList.add("hidden"));
  el.btnClaimAfk.addEventListener("click", () => {
    state.gold += state.pendingAfkGold;
    state.pendingAfkGold = 0;
    el.modalAfk.classList.add("hidden");
    save();
    renderHud();
  });

  const loaded = load();
  if (!loaded) state.heroes = makeHeroes();
  state.enemies = makeWave(state.room);
  state.side = "heroes";
  state.index = 0;
  renderLanes();
  showScreen("battle");
  setLog(
    isBossRoom(state.room)
      ? `Boss-Raum ${state.room} wartet.`
      : `Raum ${state.room}: Der Weg ist versperrt.`
  );
  showAfkIfNeeded();
  save();
  renderHud();

  setInterval(attackOnce, TICK_MS);
  setInterval(save, 15000);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") save();
  });
})();
