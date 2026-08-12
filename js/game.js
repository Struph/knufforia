(() => {
  const SAVE_KEY = "knufforia-save-v1";
  const TICK_MS = 900;
  const AFK_CAP_HOURS = 8;
  const AFK_GOLD_PER_MIN = 2;

  const PLACE_NAMES = {
    battle: "Kampfhain",
    arena: "Sternenarena",
    shop: "Mondbasar",
  };

  const ENEMIES = [
    { name: "Knuffork", variant: "grunt" },
    { name: "Zahnork", variant: "grunt" },
    { name: "Moosork", variant: "brute" },
    { name: "Keulenork", variant: "brute" },
    { name: "Runenork", variant: "shaman" },
    { name: "Nebelork", variant: "shaman" },
    { name: "Kriegsork", variant: "boss" },
    { name: "Häuptling Grobzahn", variant: "boss" },
  ];

  const el = {
    screens: {
      world: document.getElementById("screen-world"),
      battle: document.getElementById("screen-battle"),
      arena: document.getElementById("screen-arena"),
      shop: document.getElementById("screen-shop"),
    },
    gold: document.getElementById("gold"),
    goldWorld: document.getElementById("gold-world"),
    goldShop: document.getElementById("gold-shop"),
    levelWorld: document.getElementById("level-world"),
    heroLevel: document.getElementById("hero-level"),
    stage: document.getElementById("stage"),
    heroHp: document.getElementById("hero-hp"),
    enemyHp: document.getElementById("enemy-hp"),
    heroPower: document.getElementById("hero-power"),
    enemyPower: document.getElementById("enemy-power"),
    enemyName: document.getElementById("enemy-name"),
    heroSprite: document.getElementById("hero-sprite"),
    enemySprite: document.getElementById("enemy-sprite"),
    battleFx: document.getElementById("battle-fx"),
    log: document.getElementById("log"),
    expFill: document.getElementById("exp-fill"),
    expText: document.getElementById("exp-text"),
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
    screen: "world",
    gold: 0,
    heroLevel: 1,
    exp: 0,
    atk: 10,
    maxHp: 100,
    hp: 100,
    stage: 1,
    enemy: null,
    lastSeen: Date.now(),
    pendingAfkGold: 0,
    arenaBusy: false,
  };

  function expToLevel(level) {
    return 16 + level * 8;
  }

  function upgradeCost() {
    return 20 + state.atk * 3;
  }

  function healCost() {
    return 12 + Math.floor(state.heroLevel * 1.5);
  }

  function arenaWager() {
    return 20 + state.stage * 8;
  }

  function enemyStats(stage) {
    const template = ENEMIES[(stage - 1) % ENEMIES.length];
    const maxHp = 24 + stage * 14;
    return {
      name: template.name,
      variant: template.variant,
      maxHp,
      hp: maxHp,
      atk: 4 + Math.floor(stage * 1.6),
    };
  }

  function spawnEnemy() {
    state.enemy = enemyStats(state.stage);
    el.enemyName.textContent = state.enemy.name;
    window.KnufforiaCharacters.mountOrc(el.enemySprite, state.enemy.variant);
    render();
  }

  function setLog(text) {
    el.log.textContent = text;
  }

  function floatText(text, x, y, kind = "") {
    const node = document.createElement("div");
    node.className = `float-text${kind ? ` ${kind}` : ""}`;
    node.textContent = text;
    node.style.left = `${x}px`;
    node.style.top = `${y}px`;
    document.body.appendChild(node);
    setTimeout(() => node.remove(), 900);
  }

  function centerOf(node) {
    const r = node.getBoundingClientRect();
    return { x: r.left + r.width / 2 - 12, y: r.top + 8 };
  }

  function showScreen(name) {
    state.screen = name;
    Object.entries(el.screens).forEach(([key, node]) => {
      node.classList.toggle("active", key === name);
    });
    if (name === "battle" && !state.enemy) spawnEnemy();
    render();
  }

  function travelTo(name) {
    const label = PLACE_NAMES[name] || name;
    el.travelText.textContent = `Unterwegs nach ${label}…`;
    el.travelOverlay.classList.remove("hidden");
    setTimeout(() => {
      el.travelOverlay.classList.add("hidden");
      showScreen(name);
    }, 700);
  }

  function render() {
    const goldText = Math.floor(state.gold).toLocaleString("de-DE");
    el.gold.textContent = goldText;
    el.goldWorld.textContent = goldText;
    el.goldShop.textContent = goldText;
    el.levelWorld.textContent = String(state.heroLevel);
    el.heroLevel.textContent = String(state.heroLevel);
    el.stage.textContent = String(state.stage);
    el.heroPower.textContent = `ATK ${state.atk}`;
    el.heroHp.style.width = `${Math.max(0, (state.hp / state.maxHp) * 100)}%`;

    const need = expToLevel(state.heroLevel);
    el.expFill.style.width = `${Math.min(100, (state.exp / need) * 100)}%`;
    el.expText.textContent = `EXP ${state.exp} / ${need}`;

    el.upgradeCost.textContent = `${upgradeCost()} Gold`;
    el.healCost.textContent = `${healCost()} Gold`;
    el.btnUpgrade.disabled = state.gold < upgradeCost();
    el.btnHeal.disabled = state.gold < healCost() || state.hp >= state.maxHp;

    const wager = arenaWager();
    el.arenaWager.textContent = String(wager);
    el.btnArenaFight.disabled = state.arenaBusy || state.gold < wager;

    if (state.enemy) {
      el.enemyPower.textContent = `HP ${Math.max(0, Math.ceil(state.enemy.hp))}`;
      el.enemyHp.style.width = `${Math.max(0, (state.enemy.hp / state.enemy.maxHp) * 100)}%`;
    }
  }

  function gainExp(amount) {
    state.exp += amount;
    let need = expToLevel(state.heroLevel);
    while (state.exp >= need) {
      state.exp -= need;
      state.heroLevel += 1;
      state.atk += 2;
      state.maxHp += 12;
      state.hp = state.maxHp;
      setLog(`Level up! Lumi ist jetzt Stufe ${state.heroLevel}.`);
      need = expToLevel(state.heroLevel);
    }
  }

  function defeatEnemy() {
    const goldGain = 8 + state.stage * 3;
    const expGain = 5 + Math.floor(state.stage * 1.4);
    state.gold += goldGain;
    gainExp(expGain);
    setLog(`${state.enemy.name} besiegt! +${goldGain} Gold, +${expGain} EXP`);
    const p = centerOf(el.enemySprite);
    floatText(`+${goldGain}★`, p.x, p.y);
    state.stage += 1;
    spawnEnemy();
  }

  function battleTick() {
    if (state.screen !== "battle" || !state.enemy || state.arenaBusy) return;

    el.heroSprite.classList.remove("attack");
    void el.heroSprite.offsetWidth;
    el.heroSprite.classList.add("attack");
    el.battleFx.classList.add("hit");
    setTimeout(() => el.battleFx.classList.remove("hit"), 160);

    const heroDmg = state.atk + Math.floor(Math.random() * 3);
    state.enemy.hp -= heroDmg;
    el.enemySprite.classList.remove("hurt");
    void el.enemySprite.offsetWidth;
    el.enemySprite.classList.add("hurt");
    const ep = centerOf(el.enemySprite);
    floatText(`-${heroDmg}`, ep.x, ep.y, "dmg");

    if (state.enemy.hp <= 0) {
      defeatEnemy();
      save();
      render();
      return;
    }

    const enemyDmg = Math.max(1, state.enemy.atk - Math.floor(state.heroLevel / 3));
    state.hp = Math.max(0, state.hp - enemyDmg);

    if (state.hp <= 0) {
      state.hp = Math.ceil(state.maxHp * 0.45);
      state.stage = Math.max(1, state.stage - 1);
      spawnEnemy();
      setLog("Lumi braucht eine Pause… ein Kapitel zurück, aber Gold bleibt!");
    } else {
      setLog(`Lumi trifft für ${heroDmg}. ${state.enemy.name} kontert für ${enemyDmg}.`);
    }

    save();
    render();
  }

  function doUpgrade() {
    const cost = upgradeCost();
    if (state.gold < cost) return;
    state.gold -= cost;
    state.atk += 3;
    el.arenaLog.textContent = `Sternenklinge gekauft! ATK jetzt ${state.atk}.`;
    setLog(`Upgrade! ATK ist jetzt ${state.atk}.`);
    save();
    render();
  }

  function doHeal() {
    const cost = healCost();
    if (state.gold < cost || state.hp >= state.maxHp) return;
    state.gold -= cost;
    state.hp = state.maxHp;
    setLog("Kirschtrank! Lumi fühlt sich wieder flauschig.");
    save();
    render();
  }

  function runArenaFight() {
    const wager = arenaWager();
    if (state.arenaBusy || state.gold < wager) return;

    state.arenaBusy = true;
    state.gold -= wager;
    el.arenaStatus.textContent = "Kampf läuft…";
    el.arenaLog.textContent = "Lumi stellt sich dem Aren-Ork!";
    render();

    const enemyHp = 40 + state.stage * 22 + state.atk;
    const enemyAtk = 6 + Math.floor(state.stage * 2.2);
    let hp = enemyHp;
    let heroHp = state.hp;
    let rounds = 0;

    const timer = setInterval(() => {
      rounds += 1;
      const dmg = state.atk + Math.floor(Math.random() * 4);
      hp -= dmg;
      el.arenaLog.textContent = `Runde ${rounds}: Lumi trifft für ${dmg}. Ork noch ${Math.max(0, Math.ceil(hp))} HP.`;

      if (hp <= 0) {
        clearInterval(timer);
        const reward = Math.floor(wager * 2.5);
        state.gold += reward;
        gainExp(8 + state.stage);
        state.hp = Math.max(heroHp, Math.ceil(state.maxHp * 0.6));
        state.arenaBusy = false;
        el.arenaStatus.textContent = "Sieg!";
        el.arenaLog.textContent = `Aren-Ork besiegt! +${reward} Gold`;
        save();
        render();
        return;
      }

      const hit = Math.max(1, enemyAtk - Math.floor(state.heroLevel / 4));
      heroHp = Math.max(0, heroHp - hit);

      if (heroHp <= 0) {
        clearInterval(timer);
        state.hp = Math.ceil(state.maxHp * 0.35);
        state.arenaBusy = false;
        el.arenaStatus.textContent = "Niederlage";
        el.arenaLog.textContent = "Der Aren-Ork war zu stark. Einsatz verloren.";
        save();
        render();
      }
    }, 700);
  }

  function save() {
    state.lastSeen = Date.now();
    const payload = {
      gold: state.gold,
      heroLevel: state.heroLevel,
      exp: state.exp,
      atk: state.atk,
      maxHp: state.maxHp,
      hp: state.hp,
      stage: state.stage,
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
      if (!raw) return;
      const data = JSON.parse(raw);
      state.gold = data.gold ?? 0;
      state.heroLevel = data.heroLevel ?? 1;
      state.exp = data.exp ?? 0;
      state.atk = data.atk ?? 10;
      state.maxHp = data.maxHp ?? 100;
      state.hp = data.hp ?? state.maxHp;
      state.stage = data.stage ?? 1;
      state.lastSeen = data.lastSeen ?? Date.now();
    } catch (_) {
      /* ignore */
    }
  }

  function computeAfk() {
    const now = Date.now();
    const minutes = Math.floor((now - state.lastSeen) / 60000);
    if (minutes < 2) return 0;
    const capped = Math.min(minutes, AFK_CAP_HOURS * 60);
    return capped * AFK_GOLD_PER_MIN;
  }

  function showAfkIfNeeded() {
    const gain = computeAfk();
    if (gain <= 0) return;
    state.pendingAfkGold = gain;
    const hours = Math.floor(gain / AFK_GOLD_PER_MIN / 60);
    const mins = Math.floor(gain / AFK_GOLD_PER_MIN) % 60;
    const timeLabel = hours > 0 ? `${hours} Std. ${mins} Min.` : `${mins} Min.`;
    el.afkText.textContent = `Lumi hat ${timeLabel} für dich gesammelt (max. ${AFK_CAP_HOURS} Std.).`;
    el.afkGold.textContent = `+${gain.toLocaleString("de-DE")} Gold`;
    el.modalAfk.classList.remove("hidden");
  }

  function claimAfk() {
    state.gold += state.pendingAfkGold;
    state.pendingAfkGold = 0;
    el.modalAfk.classList.add("hidden");
    save();
    render();
  }

  document.querySelectorAll(".place[data-screen]").forEach((btn) => {
    btn.addEventListener("click", () => travelTo(btn.dataset.screen));
  });

  document.querySelectorAll("[data-back]").forEach((btn) => {
    btn.addEventListener("click", () => showScreen("world"));
  });

  el.btnUpgrade.addEventListener("click", doUpgrade);
  el.btnHeal.addEventListener("click", doHeal);
  el.btnArenaFight.addEventListener("click", runArenaFight);
  el.btnHelp.addEventListener("click", () => el.modalHelp.classList.remove("hidden"));
  el.btnCloseHelp.addEventListener("click", () => el.modalHelp.classList.add("hidden"));
  el.btnClaimAfk.addEventListener("click", claimAfk);

  window.KnufforiaCharacters.mountAll();
  load();
  spawnEnemy();
  showScreen("world");
  showAfkIfNeeded();
  save();

  setInterval(battleTick, TICK_MS);
  setInterval(save, 15000);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") save();
  });
})();
