import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  SEASONS,
  SEASON_EFFECTS,
  WEATHER_TYPES,
  PLOT_DEFS,
  RECIPES,
  STAFF_ROLES,
  TRUCK_TYPES,
  ROUTES,
  CONTRACT_POOL,
  FARM_UPGRADES,
} from './constants';

const DEF = {
  cash: 300,
  day: 1,
  tick: 0,
  season: 0,
  level: 1,
  levelReqs: [],
  totalRevenue: 0,
  totalExpenses: 0,
  lifetimeEggs: 0,
  prestige: 0,
  prestigeMult: 1,
  farmStars: 0,
  farmTitle: '🌱 Rookie Farmer',

  inv: {
    egg: 0, feedWheat: 100, feedCorn: 50, water: 100,
    freeRange: 0, organic: 0, powdered: 0, mayo: 0, omelette: 0, cake: 0, custard: 0, vaccine: 0
  },
  invCap: { egg: 80, feedWheat: 200, feedCorn: 200, water: 200 },

  plots: [
    { id: 'p1', type: 'henCoop', level: 1, workers: [], stored: 0, eggCap: 20, cooldown: 0, autoHarvest: false, unlocked: true },
    { id: 'p2', type: 'feedFarm', level: 1, workers: [], stored: 0, rate: 0.5, cooldown: 0, autoHarvest: false, unlocked: true },
    { id: 'p3', type: 'waterWell', level: 1, workers: [], stored: 0, rate: 1.0, cooldown: 0, autoHarvest: false, unlocked: false },
    { id: 'p4', type: 'cornField', level: 0, workers: [], stored: 0, eggCap: 0, cooldown: 0, autoHarvest: false, unlocked: false },
    { id: 'p5', type: 'organicFarm', level: 0, workers: [], stored: 0, eggCap: 0, cooldown: 0, autoHarvest: false, unlocked: false },
    { id: 'p6', type: 'hatchery', level: 0, workers: [], stored: 0, eggCap: 0, cooldown: 0, autoHarvest: false, unlocked: false },
  ],

  factoryQueue: [],
  factorySlots: 1,
  factoryLevel: 1,

  staff: [],
  maxStaff: 3,

  trucks: [],
  maxTrucks: 1,

  contracts: [],
  contractsRefreshed: 0,
  rushMode: false,
  rushTimer: 0,

  // Spin wheel state
  spinWheelCooldown: 0,   // ticks remaining before next free spin
  spinProdBoost: 0,        // seconds remaining for 2x production boost
  festivalActive: 0,       // ticks remaining for market festival

  miniGames: [
    { id: 'puzzle_image', name: 'Photo Puzzle', unlocked: true, price: 0, desc: 'Reassemble a farm photo by swapping tiles.' },
    { id: 'fox_hunter', name: 'Fox Hunter', unlocked: false, price: 4000, desc: 'Tap foxes as they appear on screen.' },
    { id: 'tetris_tap', name: 'Tetris Tap', unlocked: false, price: 5000, desc: 'Drop blocks and clear rows in mini tetris.' },
    { id: 'spin_wheel', name: 'Lucky Wheel', unlocked: true, price: 0, desc: 'Spin for cash, boosts, or festival events!' },
  ],
  miniGameProgress: { puzzle_image: 0, fox_hunter: 0, tetris_tap: 0, spin_wheel: 0 },
  miniGameAchievements: {},
  activeMiniGame: null,

  ledger: [],
  dailyRevenue: 0,
  dailyExpenses: 0,

  upgrades: {},
  milestones: {},

  weather: { type: 'sunny', daysLeft: 2 },
  marketTrend: 1.0,
  frenzyActive: 0,

  // contractsFulfilledAtLevelStart: snapshot so level goals track delta
  contractsFulfilled: 0,
  contractsFulfilledAtLevelStart: 0,
};

class GameEngine {
  constructor() {
    this.G = JSON.parse(JSON.stringify(DEF));
    this.listeners = new Set();
    this.tickInterval = null;
    this.toasts = [];
    this.floaters = [];
    this.lastToastTime = 0;
    this.floatIdSeq = 0;
  }

  async load() {
    try {
      const s = await AsyncStorage.getItem('cft_rn');
      if (s) {
        let loadedG = JSON.parse(s);
        if (loadedG.lastSaveTs) {
          const diffSeconds = Math.floor((Date.now() - loadedG.lastSaveTs) / 1000);
          if (diffSeconds > 10) this.simulateOfflineMode(loadedG, diffSeconds);
        }
        this.G = { ...JSON.parse(JSON.stringify(DEF)), ...loadedG };
      }
    } catch (e) {
      console.warn('Save load error', e);
    }

    // Ensure arrays / defaults for saves made before new fields
    const defaults = {
      staff: [], trucks: [], contracts: [], factoryQueue: [], ledger: [],
      upgrades: {}, milestones: {}, contractsFulfilled: 0, contractsFulfilledAtLevelStart: 0,
      spinWheelCooldown: 0, spinProdBoost: 0, festivalActive: 0,
      miniGameProgress: { puzzle_image: 0, fox_hunter: 0, tetris_tap: 0, spin_wheel: 0 },
      miniGameAchievements: {},
    };
    Object.entries(defaults).forEach(([k, v]) => {
      if (this.G[k] == null) this.G[k] = v;
    });
    if (!this.G.inv) this.G.inv = { ...DEF.inv };

    // Migrate old puzzle_match mini-game to puzzle_image
    if (this.G.miniGames) {
      const hasPuzzleImage = this.G.miniGames.some(g => g.id === 'puzzle_image');
      if (!hasPuzzleImage) {
        this.G.miniGames = DEF.miniGames.map(defGame => {
          const existing = this.G.miniGames.find(g => g.id === defGame.id);
          return existing || defGame;
        });
      }
      // Always ensure spin_wheel exists
      if (!this.G.miniGames.some(g => g.id === 'spin_wheel')) {
        this.G.miniGames.push({ id: 'spin_wheel', name: 'Lucky Wheel', unlocked: true, price: 0, desc: 'Spin for cash, boosts, or festival events!' });
      }
    }

    if (this.G.contracts.length === 0) this.generateContracts(3);
    if (!this.G.farmStars) this.G.farmStars = Math.max(0, (this.G.level || 1) - 1);
    if (!this.G.farmTitle) this.G.farmTitle = this.getFarmRankTitle(this.G.level || 1);
    if (!this.G.levelReqs || this.G.levelReqs.length === 0) this.generateLevelGoals();

    this.startTick();
    this.notify();
  }

  simulateOfflineMode(gameState, diffSeconds) {
    const maxSeconds = Math.min(diffSeconds, 43200);
    const prodMult = this._getProductionMultiplier(gameState) * this._getCoopSpeed(gameState) * this._getCoopBonus(gameState);
    gameState.plots.forEach(plot => {
      if (!plot.unlocked || plot.level < 1) return;
      const def = PLOT_DEFS[plot.type];
      if (!def) return;
      const rate = def.baseRate * plot.level * prodMult * (1 / 60);
      if (def.output === 'egg') gameState.lifetimeEggs += rate * maxSeconds;
      const localCap = 100 * plot.level;
      plot.stored = Math.min(localCap, (plot.stored || 0) + rate * maxSeconds);
    });
  }

  async save() {
    this.G.lastSaveTs = Date.now();
    try { await AsyncStorage.setItem('cft_rn', JSON.stringify(this.G)); } catch (e) { }
  }

  async hardReset() {
    await AsyncStorage.removeItem('cft_rn');
    this.G = JSON.parse(JSON.stringify(DEF));
    this.notify();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    this.listeners.forEach(l => l({ ...this.G, toasts: [...this.toasts], floaters: [...this.floaters] }));
  }

  // ─── GETTERS ──────────────────────────────────────────────────────────────
  _getStaffBonus(gameState, skill) {
    let total = 0;
    gameState.staff.forEach(s => { if (s.skill === skill) total += s.value; });
    const hasMgr = gameState.staff.some(s => s.skill === 'megaBonus');
    if (hasMgr && total > 0) total *= 1.2;
    return total;
  }

  _getPriceMultiplier(gameState) {
    const season = SEASON_EFFECTS[gameState.season % 4];
    const weather = this._getCurrentWeather(gameState);
    const volatility = gameState.marketTrend || 1.0;
    const frenzy = (gameState.frenzyActive > 0) ? 2.0 : 1.0;
    const festival = (gameState.festivalActive > 0) ? 2.5 : 1.0;
    return season.price * weather.price * (1 + this._getStaffBonus(gameState, 'priceBonus')) * gameState.prestigeMult * volatility * frenzy * festival;
  }

  _getProductionMultiplier(gameState) {
    const season = SEASON_EFFECTS[gameState.season % 4];
    const weather = this._getCurrentWeather(gameState);
    const spinBoost = (gameState.spinProdBoost > 0) ? 2.0 : 1.0;
    return season.prod * weather.prod * spinBoost;
  }

  _getCurrentWeather(gameState) {
    const wt = WEATHER_TYPES.find(w => w.type === gameState.weather.type) || WEATHER_TYPES[0];
    return { prod: wt.prod, price: wt.price, icon: wt.icon, label: wt.label, type: wt.type };
  }

  _getCoopSpeed(gameState) { return 1 + (gameState.upgrades.coopSpeed || 0) * 0.2; }
  _getCoopBonus(gameState) { return 1 + this._getStaffBonus(gameState, 'coopBonus'); }
  _getFeedEff(gameState) { return Math.max(0.3, 1 - (gameState.upgrades.feedRate || 0) * 0.25); }
  _getPayroll(gameState) { return gameState.staff.reduce((a, s) => a + s.salary, 0); }
  _getFactorySpeed(gameState) { return 1 + this._getStaffBonus(gameState, 'factorySpeed'); }

  getPriceMultiplier() { return this._getPriceMultiplier(this.G); }
  getProductionMultiplier() { return this._getProductionMultiplier(this.G); }
  getCurrentWeather() { return this._getCurrentWeather(this.G); }
  getPayroll() { return this._getPayroll(this.G); }

  // ─── HELPERS ──────────────────────────────────────────────────────────────
  // Rate-limited toast: only one toast every 3 seconds to prevent spam
  showToast(msg, force = false) {
    const now = Date.now();
    if (!force && now - this.lastToastTime < 3000) return;
    this.lastToastTime = now;
    const id = now + Math.random();
    this.toasts.push({ id, msg });
    this.notify();
    setTimeout(() => {
      this.toasts = this.toasts.filter(t => t.id !== id);
      this.notify();
    }, 2800);
  }

  spawnFloat(text, x, y) {
    const id = this.floatIdSeq++;
    this.floaters.push({ id, text, x: (x || 200) - 40, y: (y || 400) - 20 });
    this.notify();
    setTimeout(() => {
      this.floaters = this.floaters.filter(f => f.id !== id);
      this.notify();
    }, 1000);
  }

  addLedger(desc, amount, type) {
    this.G.ledger.unshift({ desc, amount, type, day: this.G.day, ts: Date.now() });
    if (this.G.ledger.length > 30) this.G.ledger.pop();
  }

  // ─── TICK LOGIC ───────────────────────────────────────────────────────────
  startTick() {
    if (this.tickInterval) clearInterval(this.tickInterval);
    this.tickInterval = setInterval(() => this.gameLoop(), 1000);
  }

  gameLoop() {
    const G = this.G;
    G.tick++;

    if (G.tick % 120 === 0) this.advanceDay();
    this.producePlots();
    this.processFactory();
    this.autoTrucks();
    this.tickContracts();
    this.autoStaffActions();

    // Countdown boosts
    if (G.spinProdBoost > 0) G.spinProdBoost--;
    if (G.festivalActive > 0) G.festivalActive--;
    if (G.frenzyActive > 0) G.frenzyActive--;
    if (G.spinWheelCooldown > 0) G.spinWheelCooldown--;
    if (G.rushMode && G.rushTimer > 0) {
      G.rushTimer--;
      if (G.rushTimer === 0) {
        G.rushMode = false;
        this.showToast('⏱️ Rush ended! Back to normal trading.');
      }
    }

    if (G.tick % 30 === 0) {
      G.marketTrend = 0.8 + Math.random() * 0.4;
      if (Math.random() > 0.95) {
        G.frenzyActive = 10;
        this.showToast('🔥 MARKET FRENZY! Prices doubled for 10s!', true);
      }
    }

    if (G.tick % 2 === 0) this.checkLevelProgress();
    if (G.tick % 10 === 0) this.save();

    this.notify();
  }

  advanceDay() {
    const G = this.G;
    G.day++;
    G.season = Math.floor((G.day - 1) / 8) % 4;

    const payroll = this.getPayroll();
    if (payroll > 0) {
      if (G.cash >= payroll) {
        G.cash -= payroll;
        G.totalExpenses += payroll;
        G.dailyExpenses += payroll;
        this.addLedger(`Payroll (${G.staff.length} staff)`, -payroll, 'payroll');
      } else {
        this.showToast(`⚠️ Can't pay staff — morale dropping!`, true);
        G.staff.forEach(s => { s.morale = Math.max(0, (s.morale || 100) - 30); });
      }
    }

    if (G.contracts.filter(c => !c.accepted).length < 3) this.generateContracts(2);
    G.dailyRevenue = 0;
    G.dailyExpenses = 0;
    this.showToast(`🌅 Day ${G.day} — ${SEASONS[G.season % 4]}`, true);
    this.checkMilestones();

    if (G.weather.daysLeft <= 1) this.changeWeather();
    else G.weather.daysLeft--;
  }

  producePlots() {
    const prodMult = this._getProductionMultiplier(this.G) * this._getCoopSpeed(this.G) * this._getCoopBonus(this.G);
    const eff = this._getFeedEff(this.G);

    this.G.plots.forEach(plot => {
      if (!plot.unlocked || plot.level < 1) return;
      const def = PLOT_DEFS[plot.type];
      if (!def) return;

      const feedNeeds = def.feedNeeds || {};
      const hasFeed = Object.entries(feedNeeds).every(([item]) => (this.G.inv[item] || 0) > 0.001);

      plot.starving = !hasFeed;
      if (!hasFeed) return;

      Object.entries(feedNeeds).forEach(([item]) => {
        this.G.inv[item] = Math.max(0, (this.G.inv[item] || 0) - eff * 0.016);
      });

      const rate = def.baseRate * plot.level * prodMult * (1 / 60);
      const cap = 100 * plot.level;
      plot.stored = Math.min(cap, (plot.stored || 0) + rate);
      if (def.output === 'egg') this.G.lifetimeEggs += rate;
    });
  }

  processFactory() {
    if (this.G.factoryQueue.length === 0) return;
    const speed = this._getFactorySpeed(this.G);
    const active = this.G.factoryQueue.slice(0, this.G.factorySlots);

    active.forEach(job => {
      job.progress = (job.progress || 0) + (1 / job.totalTime) * speed;
    });

    // Separate completed jobs, keep incomplete
    const completed = this.G.factoryQueue.filter(q => q.progress >= 1 && this.G.factoryQueue.indexOf(q) < this.G.factorySlots);
    completed.forEach(job => {
      this.G.inv[job.output] = (this.G.inv[job.output] || 0) + job.qty;
      this.addLedger(`🏭 Produced ${job.qty}× ${job.name}`, 0, 'factory');
    });
    this.G.factoryQueue = this.G.factoryQueue.filter(q => q.progress < 1);
  }

  autoTrucks() {
    this.G.trucks.forEach(truck => {
      if (!truck.active || truck.status !== 'dispatched') return;
      truck.tripProgress = (truck.tripProgress || 0) + 1 / truck.tripTime;
      if (truck.tripProgress >= 1) {
        const route = ROUTES.find(r => r.id === truck.currentRoute);
        const pricePerUnit = (route?.basePrice || 2) * this.getPriceMultiplier();
        const earned = Math.floor(truck.load * pricePerUnit);

        this.G.cash += earned;
        this.G.totalRevenue += earned;
        this.G.dailyRevenue += earned;
        this.addLedger(`🚚 ${truck.name} → ${route?.name}`, earned, 'truck');

        if (Math.random() < 0.12) {
          const bonus = Math.floor(earned * 0.25);
          this.G.cash += bonus;
          this.G.totalRevenue += bonus;
          this.G.dailyRevenue += bonus;
          this.showToast(`🚀 Lucky route! +$${bonus} bonus!`);
        } else if (Math.random() < 0.08) {
          const delay = Math.floor(earned * 0.15);
          this.G.cash = Math.max(0, this.G.cash - delay);
          this.G.totalExpenses += delay;
          this.showToast(`🛑 Road delay: -$${delay}`);
        }

        truck.status = 'idle';
        truck.tripProgress = 0;
        truck.load = 0;
        this.showToast(`🚚 ${truck.name} returned! +$${earned}`, true);
      }
    });
  }

  autoStaffActions() {
    const G = this.G;

    // Auto-harvest (farmer or auto-collect upgrade)
    const hasFarmer = G.staff.some(s => s.skill === 'autoHarvest');
    const hasAutoCollect = G.upgrades.autoCollect;
    if ((hasFarmer || hasAutoCollect) && G.tick % 5 === 0) {
      G.plots.forEach(plot => {
        if (plot.unlocked && plot.level >= 1 && (plot.stored || 0) >= 1) {
          this.harvestPlot(plot.id, true);
        }
      });
    }

    // Auto-dispatch trucks (driver or delivery-assigned staff)
    const hasDriver = G.staff.some(s => s.skill === 'truckBonus');
    const hasDeliveryAssign = G.staff.some(s => s.assignedTask === 'delivery');
    if ((hasDriver || hasDeliveryAssign) && G.tick % 10 === 0) {
      G.trucks.forEach(truck => {
        if (!truck.active || truck.status !== 'idle') return;
        const availEggs = Math.floor(G.inv.egg || 0);
        const loadAmt = Math.min(availEggs, truck.cap);
        if (loadAmt >= truck.cap || loadAmt >= 50) {
          const tDef = TRUCK_TYPES.find(t => t.id === truck.type);
          if (tDef) {
            const routes = tDef.routes.map(rId => ROUTES.find(r => r.id === rId)).filter(Boolean);
            if (routes.length > 0) {
              const bestRoute = routes.sort((a, b) => b.basePrice - a.basePrice)[0];
              this.dispatchTruck(truck.id, bestRoute.id, true);
            }
          }
        }
      });
    }

    // FIX: Auto-craft for contracts — only queue if queue has space AND we don't already
    // have enough of the required item being produced or in stock
    if (G.staff.some(s => s.assignedTask === 'factory') && G.tick % 20 === 0) {
      this._autoCraftForContracts();
    }
  }

  // FIX: Completely rewrote auto-craft logic
  // - Only crafts when we actually need more of an item
  // - Won't double-deduct by trying to accept before factory finishes
  // - Silent — no toast spam
  _autoCraftForContracts() {
    const G = this.G;
    const openContracts = G.contracts.filter(c => !c.accepted);
    if (!openContracts.length) return;

    // First, try to fulfil any contract already satisfied by current inventory
    for (const contract of openContracts) {
      const have = Math.floor(G.inv[contract.want] || 0);
      if (have >= contract.qty) {
        this.acceptContract(contract.id);
        return; // one action per cycle
      }
    }

    // Then, queue crafting if we have queue space and ingredients
    if (G.factoryQueue.length >= G.factorySlots * 2) return;

    for (const contract of openContracts) {
      if (contract.want === 'egg') continue; // eggs don't need crafting
      const have = Math.floor(G.inv[contract.want] || 0);
      const alreadyQueued = G.factoryQueue.filter(q => q.output === contract.want).reduce((s, q) => s + q.qty, 0);
      if (have + alreadyQueued >= contract.qty) continue; // already covered

      const recipe = RECIPES.find(r => r.output === contract.want && r.unlockLevel <= (G.factoryLevel || 1));
      if (!recipe) continue;

      const canMake = Object.entries(recipe.inputs).every(([k, v]) => (G.inv[k] || 0) >= v);
      if (canMake) {
        this.queueRecipe(recipe.id);
        return; // one recipe per cycle
      }
    }
  }

  assignStaffTask(staffId, task) {
    const staff = this.G.staff.find(s => s.id === staffId);
    if (!staff) return;
    staff.assignedTask = task;
    this.showToast(`🛠️ ${staff.name} assigned to ${task}.`, true);
    this.notify();
  }

  startSupplyRush() {
    if (this.G.rushMode) { this.showToast('⚠️ A rush is already active!', true); return; }
    this.G.rushMode = true;
    this.G.rushTimer = 30;
    this.showToast('🔥 SUPPLY RUSH! +50% earnings for 30s', true);
    this.notify();
  }

  // ─── SPIN WHEEL ───────────────────────────────────────────────────────────
  spinWheel() {
    const G = this.G;
    if (G.spinWheelCooldown > 0) {
      this.showToast(`⏳ Next spin in ${G.spinWheelCooldown}s`, true);
      return null;
    }

    const prizes = [
      { label: '💰 $200 Cash', weight: 25, type: 'cash', value: 200 },
      { label: '💰 $500 Cash', weight: 15, type: 'cash', value: 500 },
      { label: '💰 $1000 Cash', weight: 5, type: 'cash', value: 1000 },
      { label: '⚡ 2x Production 60s', weight: 20, type: 'prod', value: 60 },
      { label: '⚡ 2x Production 120s', weight: 10, type: 'prod', value: 120 },
      { label: '🎪 Market Festival 60s', weight: 8, type: 'festival', value: 60 },
      { label: '📦 50 Free Eggs', weight: 12, type: 'eggs', value: 50 },
      { label: '😢 Nothing', weight: 5, type: 'nothing', value: 0 },
    ];

    // Weighted random pick
    const totalWeight = prizes.reduce((s, p) => s + p.weight, 0);
    let rand = Math.random() * totalWeight;
    let prize = prizes[prizes.length - 1];
    for (const p of prizes) { rand -= p.weight; if (rand <= 0) { prize = p; break; } }

    // Apply prize
    if (prize.type === 'cash') {
      G.cash += prize.value;
      G.totalRevenue += prize.value;
      this.addLedger(`🎰 Spin Wheel: ${prize.label}`, prize.value, 'spin');
    } else if (prize.type === 'prod') {
      G.spinProdBoost = prize.value;
    } else if (prize.type === 'festival') {
      G.festivalActive = prize.value;
      this.showToast('🎪 Market Festival! Prices 2.5x!', true);
    } else if (prize.type === 'eggs') {
      G.inv.egg = Math.min((G.invCap.egg || 80), (G.inv.egg || 0) + prize.value);
    }

    G.spinWheelCooldown = 120; // 2-minute cooldown
    G.miniGameProgress.spin_wheel = (G.miniGameProgress.spin_wheel || 0) + 1;

    this.notify();
    return prize; // return to UI for animation
  }

  unlockMiniGame(gameId) {
    const game = this.G.miniGames.find(g => g.id === gameId);
    if (!game || game.unlocked) { this.showToast('Already unlocked.', true); return; }
    if (this.G.cash < game.price) { this.showToast(`Need $${game.price} to unlock.`, true); return; }
    this.G.cash -= game.price;
    game.unlocked = true;
    this.showToast(`🕹️ ${game.name} unlocked!`, true);
    this.notify();
  }

  // Called from UI after a mini-game session ends with a score
  awardMiniGame(gameId, score) {
    const game = this.G.miniGames.find(g => g.id === gameId && g.unlocked);
    if (!game) return;

    const baseReward = ({ puzzle_image: 100, fox_hunter: 180, tetris_tap: 220 }[gameId] || 100);
    const streak = this.G.miniGameProgress[gameId] || 0;
    const bonus = Math.floor(Math.min(150, streak * 3));
    const reward = baseReward + bonus + Math.floor(score);

    this.G.cash += reward;
    this.G.totalRevenue += reward;
    this.addLedger(`🕹️ ${game.name} reward`, reward, 'minigame');
    this.G.miniGameProgress[gameId] = streak + 1;
    if (!this.G.miniGameAchievements) this.G.miniGameAchievements = {};
    this.G.miniGameAchievements[gameId] = (this.G.miniGameAchievements[gameId] || 0) + 1;

    if (this.G.miniGameAchievements[gameId] % 10 === 0) {
      this.G.farmStars = (this.G.farmStars || 0) + 1;
      this.showToast(`⭐ ${game.name} mastery! +1 Farm Star`, true);
    } else {
      this.showToast(`🕹️ +$${reward} from ${game.name}!`, true);
    }
    this.notify();
  }

  tickContracts() {
    this.G.contracts.forEach(c => {
      if (!c.accepted) c.ticksLeft = (c.ticksLeft || 600) - 1;
    });
    this.G.contracts = this.G.contracts.filter(c => c.accepted || c.ticksLeft > 0);
  }

  changeWeather() {
    const w = WEATHER_TYPES[Math.floor(Math.random() * WEATHER_TYPES.length)];
    this.G.weather = {
      type: w.type,
      daysLeft: w.days[0] + Math.floor(Math.random() * (w.days[1] - w.days[0] + 1)),
    };
  }

  generateContracts(count) {
    const pool = [...CONTRACT_POOL].sort(() => Math.random() - 0.5);
    for (let i = 0; i < count && i < pool.length; i++) {
      const base = pool[i];
      this.G.contracts.push({
        ...base,
        id: 'c_' + Date.now() + i,
        accepted: false,
        ticksLeft: 600,
        qty: Math.floor(base.qty * (0.7 + Math.random() * 0.6)),
      });
    }
  }

  checkMilestones() {
    const checks = [
      { id: 'first_sale', check: () => this.G.totalRevenue > 0, label: 'First Sale', icon: '🥚' },
      { id: 'cash_500', check: () => this.G.cash >= 500, label: '$500 Cash', icon: '💰' },
      { id: 'cash_2k', check: () => this.G.cash >= 2000, label: '$2,000 Cash', icon: '💵' },
      { id: 'factory_run', check: () => this.G.inv.powdered > 0 || this.G.inv.mayo > 0, label: 'Factory Run', icon: '🏭' },
      { id: 'staff_3', check: () => this.G.staff.length >= 3, label: 'Full Team (3)', icon: '👷' },
      { id: 'truck_fleet', check: () => this.G.trucks.length >= 2, label: '2 Trucks', icon: '🚚' },
      { id: 'contract_5', check: () => this.G.contractsFulfilled >= 5, label: '5 Contracts', icon: '📋' },
      { id: 'revenue_10k', check: () => this.G.totalRevenue >= 10000, label: '$10K Revenue', icon: '📈' },
    ];
    checks.forEach(m => {
      if (!this.G.milestones[m.id] && m.check()) {
        this.G.milestones[m.id] = true;
        this.showToast(`🏆 Milestone: "${m.label}"!`, true);
        this.G.cash += 100;
        this.addLedger(`🏆 Milestone: ${m.label}`, 100, 'milestone');
      }
    });
  }

  generateLevelGoals() {
    if (!this.G.level) this.G.level = 1;
    const lvl = this.G.level;
    const scale = Math.pow(1.5, lvl - 1);
    const reqs = [];

    // Snapshot contracts at level start so goal tracks DELTA, not lifetime total
    const contractsBase = this.G.contractsFulfilledAtLevelStart || 0;

    if (lvl === 1) {
      reqs.push({ type: 'revenue', amount: 1500, desc: 'Earn $1,500 Total Revenue' });
      reqs.push({ type: 'plotCount', amount: 3, desc: 'Unlock 3 Plots' });
    } else if (lvl === 2) {
      reqs.push({ type: 'cash', amount: 2000, desc: 'Hold $2,000 Cash' });
      reqs.push({ type: 'contractsDelta', base: contractsBase, amount: 3, desc: 'Fulfill 3 Contracts this level' });
    } else if (lvl === 3) {
      reqs.push({ type: 'item', target: 'mayo', amount: 10, desc: 'Have 10 Mayonnaise in Stock' });
      reqs.push({ type: 'staffCount', amount: 2, desc: 'Hire 2 Staff Members' });
    } else {
      // Financial goal
      if (Math.random() > 0.5) {
        reqs.push({ type: 'cash', amount: Math.floor(5000 * scale), desc: `Hold $${Math.floor(5000 * scale).toLocaleString()} Cash` });
      } else {
        reqs.push({ type: 'revenue', amount: Math.floor(10000 * scale), desc: `Earn $${Math.floor(10000 * scale).toLocaleString()} Revenue` });
      }

      // Operational goal
      if (Math.random() > 0.4) {
        const plotLvl = Math.min(12, Math.floor(2 + lvl / 2.5));
        reqs.push({ type: 'plotLevel', target: 'henCoop', amount: plotLvl, desc: `Upgrade Hen Coop to Lv ${plotLvl}` });
      } else {
        const count = Math.min(8, Math.floor(2 + lvl / 3));
        reqs.push({ type: 'staffCount', amount: count, desc: `Manage ${count} Staff` });
      }

      // Contract delta goal (NOT cumulative)
      const contractGoal = Math.max(3, Math.floor(5 * scale));
      reqs.push({ type: 'contractsDelta', base: contractsBase, amount: contractGoal, desc: `Fulfill ${contractGoal} Contracts this level` });

      if (lvl >= 7) {
        const targetPlots = Math.min(6, Math.max(4, Math.floor(3 + lvl / 3)));
        reqs.push({ type: 'plotCount', amount: targetPlots, desc: `Control ${targetPlots} Plots` });
      }
    }

    this.G.levelReqs = reqs;
  }

  getFarmRankTitle(level) {
    const titles = [
      '🌱 Rookie Farmer', '🚜 Apprentice Rancher', '🏡 Commercial Grower',
      '🌾 Farm Manager', '🧑‍🌾 Agro Tycoon', '🏭 Industrial Baron',
      '🌍 Global Distributor', '⭐ Legacy Legend', '🌌 Cosmic Cultivator', '👑 Harvest Sovereign',
    ];
    const idx = Math.max(0, Math.min(level - 1, titles.length - 1));
    return `${titles[idx]}${level > titles.length ? ` (Level ${level})` : ''}`;
  }

  checkLevelProgress() {
    if (!this.G.levelReqs || this.G.levelReqs.length === 0) this.generateLevelGoals();
    // Don't re-trigger if popup is already showing
    if (this.G.levelCompletePopup) return;

    let allMet = true;
    this.G.levelReqs.forEach(req => {
      let val = 0;
      if (req.type === 'revenue') val = this.G.totalRevenue;
      if (req.type === 'cash') val = this.G.cash;
      if (req.type === 'item') val = this.G.inv[req.target] || 0;
      if (req.type === 'contractsDelta') val = (this.G.contractsFulfilled || 0) - (req.base || 0);
      if (req.type === 'staffCount') val = this.G.staff.length;
      if (req.type === 'plotCount') val = this.G.plots.filter(p => p.unlocked).length;
      if (req.type === 'plotLevel') {
        const p = this.G.plots.find(p => p.type === req.target);
        val = p ? p.level : 0;
      }
      req.current = val;
      if (val < req.amount) allMet = false;
    });

    if (allMet) {
      this.G.levelCompletePopup = true;
      this.notify();
    }
  }

  advanceLevel() {
    this.G.levelCompletePopup = false;
    this.G.level++;
    this.G.prestigeMult += 0.5;
    this.G.prestige += 1;
    this.G.farmStars = (this.G.farmStars || 0) + 1;
    this.G.farmTitle = this.getFarmRankTitle(this.G.level);

    // Snapshot current contracts count so next level's delta goal starts from here
    this.G.contractsFulfilledAtLevelStart = this.G.contractsFulfilled || 0;

    this.generateLevelGoals();
    this.showToast(`🌟 Level ${this.G.level}! Multiplier now ${this.G.prestigeMult.toFixed(1)}x!`, true);
    this.save();
    this.notify();
  }

  // ─── PLAYER ACTIONS ───────────────────────────────────────────────────────
  harvestPlot(plotId, auto = false) {
    const plot = this.G.plots.find(p => p.id === plotId);
    if (!plot || !plot.unlocked || plot.level < 1) return;
    const def = PLOT_DEFS[plot.type];
    const stored = Math.floor(plot.stored || 0);
    const cap = this.G.invCap[def.output] || 999;
    const currentInv = this.G.inv[def.output] || 0;
    const spaceLeft = cap - currentInv;
    if (spaceLeft <= 0) { if (!auto) this.showToast(`Inventory full for ${def.output}!`, true); return; }

    if (!auto && def.output === 'egg' && Math.random() < 0.02) {
      this.G.cash += 500;
      this.showToast('✨ GOLDEN EGG! +$500!', true);
    }

    const tapBonus = auto ? 0 : Math.max(1, Math.floor(def.baseRate * plot.level * 0.2));
    const totalAvailable = stored + tapBonus;
    if (totalAvailable < 1 && auto) return;

    let toHarvest = Math.min(Math.floor(totalAvailable), spaceLeft);
    if (toHarvest > 0) {
      plot.stored = Math.max(0, plot.stored - Math.max(0, toHarvest - tapBonus));
      this.G.inv[def.output] = currentInv + toHarvest;
    }
    if (!auto) this.notify();
  }

  unlockPlot(plotId) {
    const plot = this.G.plots.find(p => p.id === plotId);
    if (!plot || plot.unlocked) return;
    const def = PLOT_DEFS[plot.type];
    if (this.G.cash < def.unlockCost) { this.showToast(`Need $${def.unlockCost} to unlock!`, true); return; }
    this.G.cash -= def.unlockCost;
    plot.unlocked = true;
    plot.level = 1;
    this.G.totalExpenses += def.unlockCost;
    this.addLedger(`Unlocked ${def.name}`, -def.unlockCost, 'unlock');
    this.showToast(`🎉 ${def.name} unlocked!`, true);
    this.notify();
  }

  upgradePlot(plotId) {
    const plot = this.G.plots.find(p => p.id === plotId);
    if (!plot) return;
    const def = PLOT_DEFS[plot.type];
    const cost = Math.floor(80 * Math.pow(1.8, plot.level));
    if (this.G.cash < cost) { this.showToast(`Need $${cost} to upgrade!`, true); return; }
    if (plot.level >= def.maxLevel) { this.showToast('Already max level!', true); return; }
    this.G.cash -= cost;
    plot.level++;
    this.G.totalExpenses += cost;
    this.addLedger(`Upgraded ${def.name} to Lv${plot.level}`, -cost, 'upgrade');
    this.showToast(`${def.name} → Level ${plot.level}!`, true);
    this.notify();
  }

  queueRecipe(recipeId) {
    const recipe = RECIPES.find(r => r.id === recipeId);
    if (!recipe) return false;
    if (recipe.unlockLevel > (this.G.factoryLevel || 1)) {
      this.showToast(`Factory Level ${recipe.unlockLevel} required.`, true);
      return false;
    }
    if (this.G.factoryQueue.length >= this.G.factorySlots * 2) {
      this.showToast('Factory queue full!', true);
      return false;
    }
    for (const [item, amt] of Object.entries(recipe.inputs)) {
      if ((this.G.inv[item] || 0) < amt) {
        this.showToast(`Need ${amt} ${item} for ${recipe.name}.`, true);
        return false;
      }
    }
    for (const [item, amt] of Object.entries(recipe.inputs)) this.G.inv[item] -= amt;
    this.G.factoryQueue.push({
      ...recipe, progress: 0, totalTime: recipe.time, id: 'q_' + Date.now(),
    });
    this.notify();
    return true;
  }

  sellSpot(goodId, qty) {
    const avail = Math.floor(this.G.inv[goodId] || 0);
    if (avail < qty) { this.showToast('Not enough stock!', true); return; }
    const priceMap = {
      egg: 2.2, freeRange: 5.5, organic: 7.8, powdered: 6.0, mayo: 14,
      omelette: 11.5, cake: 37, custard: 18, vaccine: 200, feedWheat: 0.8, water: 0.3,
    };
    const basePrice = priceMap[goodId] || 1;
    let earn = Math.floor(qty * basePrice * this.getPriceMultiplier());
    if (this.G.rushMode) earn = Math.floor(earn * 1.5);
    this.G.inv[goodId] -= qty;
    this.G.cash += earn;
    this.G.totalRevenue += earn;
    this.G.dailyRevenue += earn;
    this.addLedger(`Sold ${qty}× ${goodId}`, earn, 'sell');
    this.showToast(`Sold ${qty} ${goodId} for $${earn}`, true);
    this.notify();
  }

  acceptContract(contractId) {
    const c = this.G.contracts.find(x => x.id === contractId);
    if (!c || c.accepted) return;
    const avail = Math.floor(this.G.inv[c.want] || 0);
    if (avail < c.qty) { this.showToast(`Need ${c.qty} ${c.want}, have ${avail}`, true); return; }
    this.G.inv[c.want] -= c.qty;
    let earn = Math.floor(c.qty * c.pricePerUnit * this.getPriceMultiplier());
    if (this.G.rushMode) earn = Math.floor(earn * 1.5);
    this.G.cash += earn;
    this.G.totalRevenue += earn;
    this.G.dailyRevenue += earn;
    c.accepted = true;
    this.G.contractsFulfilled++;
    this.addLedger(`Contract: ${c.buyer}`, earn, 'contract');
    this.showToast(`✅ Contract fulfilled! +$${earn}`, true);
    this.checkMilestones();
    this.notify();
  }

  dispatchTruck(truckId, routeId, auto = false) {
    const truck = this.G.trucks.find(t => t.id === truckId);
    const route = ROUTES.find(r => r.id === routeId);
    if (!truck || !route) return;
    if (truck.status !== 'idle') { if (!auto) this.showToast('Truck already on the road!', true); return; }
    const truckDef = TRUCK_TYPES.find(t => t.id === truck.type);
    if (!truckDef.routes.includes(routeId)) { if (!auto) this.showToast(`Truck can't access ${route.name}`, true); return; }
    const loadAmt = Math.min(Math.floor(this.G.inv.egg || 0), truck.cap);
    if (loadAmt < 5) { if (!auto) this.showToast('Need at least 5 eggs to dispatch!', true); return; }
    this.G.inv.egg -= loadAmt;
    truck.status = 'dispatched';
    truck.currentRoute = routeId;
    truck.load = loadAmt;
    truck.tripProgress = 0;
    truck.tripTime = Math.floor((60 * route.dist) / (truckDef.speed || 1));
    if (!auto) this.showToast(`🚚 ${truck.name} → ${route.name} with ${loadAmt} eggs!`, true);
    this.notify();
  }

  hireStaff(roleId) {
    const role = STAFF_ROLES.find(r => r.id === roleId);
    if (!role) return;
    if (this.G.staff.length >= this.G.maxStaff) { this.showToast('Need more staff slots!', true); return; }
    if (this.G.staff.some(s => s.id === roleId)) { this.showToast('Already hired this role!', true); return; }
    const hireCost = role.salary * 7;
    if (this.G.cash < hireCost) { this.showToast(`Hiring costs $${hireCost}`, true); return; }
    this.G.cash -= hireCost;
    this.G.totalExpenses += hireCost;
    this.G.staff.push({ ...role, morale: 100, hiredDay: this.G.day });
    this.addLedger(`Hired ${role.name}`, -hireCost, 'hire');
    this.showToast(`👷 ${role.name} hired!`, true);
    this.notify();
  }

  fireStaff(roleId) {
    this.G.staff = this.G.staff.filter(s => s.id !== roleId);
    this.showToast('Employee let go.', true);
    this.notify();
  }

  buyTruck(typeId) {
    const tDef = TRUCK_TYPES.find(t => t.id === typeId);
    if (!tDef) return;
    if (this.G.trucks.length >= this.G.maxTrucks) { this.showToast('Need more fleet slots!', true); return; }
    if (this.G.trucks.some(t => t.type === typeId)) { this.showToast('Already own this type. Buy a fleet slot for another.', true); return; }
    if (this.G.cash < tDef.cost) { this.showToast(`Need $${tDef.cost}!`, true); return; }
    this.G.cash -= tDef.cost;
    this.G.totalExpenses += tDef.cost;
    this.G.trucks.push({
      id: 't_' + Date.now(), type: typeId, name: tDef.name, cap: tDef.cap,
      status: 'idle', tripProgress: 0, load: 0, currentRoute: null, active: true,
    });
    this.addLedger(`Bought ${tDef.name}`, -tDef.cost, 'purchase');
    this.showToast(`🚚 ${tDef.name} added to fleet!`, true);
    this.notify();
  }

  buyFarmUpgrade(upgradeId) {
    const upg = FARM_UPGRADES.find(u => u.id === upgradeId);
    if (!upg) return;
    const count = this.G.upgrades[upgradeId] || 0;
    if (count >= upg.max) { this.showToast('Already maxed!', true); return; }
    const cost = Math.floor(upg.cost * Math.pow(1.6, count));
    if (this.G.cash < cost) { this.showToast(`Need $${cost}!`, true); return; }
    this.G.cash -= cost;
    this.G.totalExpenses += cost;
    this.G.upgrades[upgradeId] = count + 1;
    this.addLedger(`Upgrade: ${upg.name}`, -cost, 'upgrade');
    if (upgradeId === 'eggCap') this.G.invCap.egg = (this.G.invCap.egg || 80) + 50;
    if (upgradeId === 'factSlots') this.G.factorySlots = Math.min(4, (this.G.factorySlots || 1) + 1);
    if (upgradeId === 'factLevel') this.G.factoryLevel = (this.G.factoryLevel || 1) + 1;
    if (upgradeId === 'staffSlot') this.G.maxStaff = (this.G.maxStaff || 3) + 1;
    if (upgradeId === 'truckSlot') this.G.maxTrucks = (this.G.maxTrucks || 1) + 1;
    if (upgradeId === 'autoCollect') this.G.upgrades.autoCollect = true;
    this.showToast(`✨ ${upg.name} upgraded!`, true);
    this.notify();
  }

  refreshContracts() {
    const active = this.G.contracts.filter(c => !c.accepted);
    const cost = active.length === 0 ? 0 : 50;
    if (cost > 0 && this.G.cash < cost) { this.showToast(`Refresh costs $${cost}`, true); return; }
    if (cost > 0) this.G.cash -= cost;
    this.G.contracts = this.G.contracts.filter(c => c.accepted);
    this.generateContracts(4);
    this.showToast(cost === 0 ? '🔁 Free refresh!' : 'Contracts refreshed!', true);
    this.notify();
  }

  // ─── DEV TOOLS ────────────────────────────────────────────────────────────
  cheatProgress() {
    if (!this.G.levelReqs) return;
    this.G.levelReqs.forEach(req => {
      if (req.type === 'revenue') this.G.totalRevenue = Math.max(this.G.totalRevenue, req.amount - 50);
      if (req.type === 'cash') this.G.cash = Math.max(this.G.cash, req.amount - 50);
      if (req.type === 'item') this.G.inv[req.target] = Math.max(this.G.inv[req.target] || 0, req.amount - 1);
      if (req.type === 'contractsDelta') this.G.contractsFulfilled = Math.max(this.G.contractsFulfilled, (req.base || 0) + req.amount - 1);
      if (req.type === 'staffCount') {
        while (this.G.staff.length < req.amount) {
          this.G.staff.push({ ...STAFF_ROLES[0], id: 'cheat_' + Math.random() });
        }
      }
    });
    this.showToast('🪄 Level goals at 95%!', true);
    this.notify();
  }
}

const gameStore = new GameEngine();
export default gameStore;