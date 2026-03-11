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
    foxVisible: false,

    ledger: [],
    dailyRevenue: 0,
    dailyExpenses: 0,

    upgrades: {},
    milestones: {},

    weather: { type: 'sunny', daysLeft: 2 },
    marketTrend: 1.0,
    frenzyActive: 0,
    contractsFulfilled: 0,
};

class GameEngine {
    constructor() {
        this.G = JSON.parse(JSON.stringify(DEF));
        this.listeners = new Set();
        this.tickInterval = null;
        this.toasts = [];
        this.floaters = []; // For rendering visual popups

        // Offline progress tracking
        this.lastSaved = null;
        this.floatIdSeq = 0;
    }

    async load() {
        try {
            const s = await AsyncStorage.getItem('cft_rn');
            if (s) {
                let loadedG = JSON.parse(s);
                // compute offline progress
                let now = Date.now();
                if (loadedG.lastSaveTs) {
                    const diffSeconds = Math.floor((now - loadedG.lastSaveTs) / 1000);
                    if (diffSeconds > 10) {
                        console.log("Simulating offline ticks:", diffSeconds);
                        this.simulateOfflineMode(loadedG, diffSeconds);
                    }
                }

                this.G = {
                    ...JSON.parse(JSON.stringify(DEF)),
                    ...loadedG,
                };
            }
        } catch (e) {
            console.warn("Save load error", e);
        }

        // Ensure arrays
        if (!this.G.staff) this.G.staff = [];
        if (!this.G.trucks) this.G.trucks = [];
        if (!this.G.contracts) this.G.contracts = [];
        if (!this.G.factoryQueue) this.G.factoryQueue = [];
        if (!this.G.ledger) this.G.ledger = [];
        if (!this.G.upgrades) this.G.upgrades = {};
        if (!this.G.milestones) this.G.milestones = {};
        if (!this.G.contractsFulfilled) this.G.contractsFulfilled = 0;
        if (!this.G.inv) this.G.inv = { ...DEF.inv };

        if (this.G.contracts.length === 0) this.generateContracts(3);
        // Keep old saves consistent with new star/title progression
        if (this.G.farmStars == null) {
            this.G.farmStars = Math.max(0, (this.G.level || 1) - 1);
        }
        if (!this.G.farmTitle) {
            this.G.farmTitle = this.getFarmRankTitle(this.G.level || 1);
        }
        if (!this.G.levelReqs || this.G.levelReqs.length === 0) this.generateLevelGoals();

        this.startTick();
        this.notify();
    }

    simulateOfflineMode(gameState, diffSeconds) {
        // In a real game, idle ticks are simulated directly. 
        // To keep it simple, we cap offline progress at 12 hours (43200 seconds)
        const maxSeconds = Math.min(diffSeconds, 43200);
        let eggsProduced = 0;
        let revenueProduced = 0;

        // Let's just do a bulk calculation rather than per-tick to save CPU
        const prodMult = this._getProductionMultiplier(gameState) * this._getCoopSpeed(gameState) * this._getCoopBonus(gameState);
        gameState.plots.forEach(plot => {
            if (!plot.unlocked || plot.level < 1) return;
            const def = PLOT_DEFS[plot.type];
            if (!def) return;
            // Assume we have feed for offline (simplified)
            const rate = def.baseRate * plot.level * prodMult * (1 / 60); // per sec
            let totalOutput = rate * maxSeconds;

            if (def.output === 'egg') gameState.lifetimeEggs += totalOutput;

            const localCap = 100 * plot.level;
            plot.stored = Math.min(localCap, (plot.stored || 0) + totalOutput);
        });

        // We could add an offline modal here if we want 
    }

    async save() {
        this.G.lastSaveTs = Date.now();
        try {
            await AsyncStorage.setItem('cft_rn', JSON.stringify(this.G));
        } catch (e) { }
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
        // clone to trigger fast react updates
        this.listeners.forEach((l) => l({ ...this.G, toasts: [...this.toasts], floaters: [...this.floaters] }));
    }

    // ---- GETTERS -----
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
        const frenzy = (gameState.frenzyActive && gameState.tick % 2 === 0) ? 2.0 : 1.0;
        return season.price * weather.price * (1 + this._getStaffBonus(gameState, 'priceBonus')) * gameState.prestigeMult * volatility * frenzy;
    }

    _getProductionMultiplier(gameState) {
        const season = SEASON_EFFECTS[gameState.season % 4];
        const weather = this._getCurrentWeather(gameState);
        return season.prod * weather.prod;
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

    // ---- HELPERS -----
    showToast(msg) {
        const id = Date.now() + Math.random();
        this.toasts.push({ id, msg });
        this.notify();
        setTimeout(() => {
            this.toasts = this.toasts.filter((t) => t.id !== id);
            this.notify();
        }, 2800);
    }

    spawnFloat(text, x, y) {
        if (!x) x = 200;
        if (!y) y = 400;
        const id = this.floatIdSeq++;
        this.floaters.push({ id, text, x: x - 40, y: y - 20 });
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

    randomEventCheck() {
        // 5% chance every 10 seconds to get a fox
        if (Math.random() < 0.05) {
            // Trigger fox event
            this.spawnFox();
        }
    }

    spawnFox() {
        this.showToast('🦊 Fox Attack! Tap it quickly before it steals eggs!');
        // In react context, we will handle fox in a specific view component. Let's just create an event flag:
        this.G.foxVisible = true;
        this.notify();
        setTimeout(() => {
            if (this.G.foxVisible) {
                this.G.foxVisible = false;
                // Steal eggs!
                let eggsToSteal = Math.floor((this.G.inv.egg || 0) * 0.15); // steals 15%
                if (eggsToSteal > 0) {
                    this.G.inv.egg -= eggsToSteal;
                    this.showToast(`😢 The fox got away with ${eggsToSteal} eggs!`);
             }
             this.notify();
         }
      }, Math.random() * 2000 + 3000); // 3-5 seconds to tap
  }
  
  catchFox() {
      if (this.G.foxVisible) {
          this.G.foxVisible = false;
          let reward = 20 + Math.floor(Math.random() * 80);
          this.G.cash += reward;
          this.showToast(`🎉 You chased the fox! +$${reward}`);
          this.notify();
      }
  }

  // ---- TICK LOGIC -----
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

    if (G.tick % 30 === 0) {
      G.marketTrend = 0.8 + Math.random() * 0.4;
      if (Math.random() > 0.9) {
        G.frenzyActive = 10;
        this.showToast('🔥 MARKET FRENZY! Prices Doubled!');
      }
    }
    if (G.frenzyActive > 0) G.frenzyActive--;

    // 10 second loop
    if (G.tick % 10 === 0) {
        this.randomEventCheck();
    }

    this.autoStaffActions();

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
        this.showToast(`⚠️ Cannot pay staff! They're unhappy.`);
        G.staff.forEach((s) => {
          s.morale = Math.max(0, (s.morale || 100) - 30);
        });
      }
    }

    if (G.contracts.filter((c) => !c.accepted).length < 3) this.generateContracts(2);
    G.dailyRevenue = 0;
    G.dailyExpenses = 0;
    this.showToast(`🌅 Day ${G.day} — ${SEASONS[G.season % 4]}`);
    this.checkMilestones();

    if (G.weather.daysLeft <= 1) this.changeWeather();
    else G.weather.daysLeft--;
  }

  producePlots() {
    const prodMult = this._getProductionMultiplier(this.G) * this._getCoopSpeed(this.G) * this._getCoopBonus(this.G);
    const eff = this._getFeedEff(this.G);

    this.G.plots.forEach((plot) => {
      if (!plot.unlocked || plot.level < 1) return;
      const def = PLOT_DEFS[plot.type];
      if (!def) return;

      const feedNeeds = def.feedNeeds || {};
      const hasFeed = Object.entries(feedNeeds).every(
        ([item, amt]) => (this.G.inv[item] || 0) > 0.001
      );

      plot.starving = !hasFeed;
      if (!hasFeed) return;

      Object.entries(feedNeeds).forEach(([item, amt]) => {
        this.G.inv[item] = Math.max(0, (this.G.inv[item] || 0) - amt * eff * 0.016);
      });

      const rate = def.baseRate * plot.level * prodMult * (1 / 60);
      const cap = 100 * plot.level;
      plot.stored = Math.min(cap, (plot.stored || 0) + rate);

      if (def.output === 'egg') this.G.lifetimeEggs += rate;
    });
  }

  processFactory() {
    if (this.G.factoryQueue.length === 0) return;
    const active = this.G.factoryQueue.slice(0, this.G.factorySlots);
    const speed = this._getFactorySpeed(this.G);

    active.forEach((job) => {
      job.progress = (job.progress || 0) + (1 / job.totalTime) * speed;
      if (job.progress >= 1) {
        this.G.inv[job.output] = (this.G.inv[job.output] || 0) + job.qty;
        this.addLedger(`🏭 Produced ${job.qty}× ${job.name}`, 0, 'factory');
      }
    });

    this.G.factoryQueue = this.G.factoryQueue.filter((q) => q.progress < 1);
  }

  autoTrucks() {
    this.G.trucks.forEach((truck) => {
      if (!truck.active || truck.status !== 'dispatched') return;
      truck.tripProgress = (truck.tripProgress || 0) + 1 / truck.tripTime;
      if (truck.tripProgress >= 1) {
        const route = ROUTES.find((r) => r.id === truck.currentRoute);
        const pricePerEgg = (route?.basePrice || 2) * this.getPriceMultiplier();
        const earned = Math.floor(truck.load * pricePerEgg);
        
        this.G.cash += earned;
        this.G.totalRevenue += earned;
        this.G.dailyRevenue += earned;
        this.addLedger(`🚚 ${truck.name} delivered ${truck.load} units → ${route?.name}`, earned, 'truck');

        // Random route event for extra flavor
        if (Math.random() < 0.12) {
          const bonus = Math.floor(earned * 0.25);
          this.G.cash += bonus;
          this.G.totalRevenue += bonus;
          this.G.dailyRevenue += bonus;
          this.showToast(`🚀 Lucky route! +$${bonus} bonus from fast delivery.`);
        } else if (Math.random() < 0.08) {
          const delay = Math.floor(earned * 0.15);
          this.G.cash -= delay;
          this.G.totalExpenses += delay;
          this.showToast(`🛑 Road delay cost: -$${delay}.`);
        }

        truck.status = 'idle';
        truck.tripProgress = 0;
        truck.load = 0;
        this.showToast(`🚚 ${truck.name} returned! +$${earned}`);
      }
    });
  }

  autoStaffActions() {
    const hasFarmer = this.G.staff.some((s) => s.skill === 'autoHarvest');
    const hasAutoCollect = this.G.upgrades.autoCollect;
    if ((hasFarmer || hasAutoCollect) && this.G.tick % 5 === 0) {
      this.G.plots.forEach((plot) => {
        if (plot.unlocked && plot.level >= 1 && (plot.stored || 0) >= 1) {
          this.harvestPlot(plot.id, true);
        }
      });
    }

    const hasDriver = this.G.staff.some((s) => s.skill === 'truckBonus');
    const hasDeliveryAssign = this.G.staff.some((s) => s.assignedTask === 'delivery');
    if ((hasDriver || hasDeliveryAssign) && this.G.tick % 10 === 0) {
      this.G.trucks.forEach((truck) => {
        if (truck.active && truck.status === 'idle') {
          const availEggs = Math.floor(this.G.inv.egg || 0);
          const loadAmt = Math.min(availEggs, truck.cap);
          if (loadAmt >= truck.cap || loadAmt >= 50) {
            const tDef = TRUCK_TYPES.find((t) => t.id === truck.type);
            if (tDef) {
              const routes = tDef.routes.map((rId) => ROUTES.find((r) => r.id === rId)).filter(Boolean);
              if (routes.length > 0) {
                const skew = hasDeliveryAssign ? 0.1 : 0;
                const bestRoute = routes.sort((a, b) => (b.basePrice + (Math.random() * skew)) - (a.basePrice + (Math.random() * skew)))[0];
                this.dispatchTruck(truck.id, bestRoute.id, true);
              }
            }
          }
        }
      });
    }

    // Auto factory contract production by assigned staff
    if (this.G.staff.some((s) => s.assignedTask === 'factory')) {
      if (this.G.tick % 8 === 0) {
        this.autoCraftForContracts();
      }
    }

    // Rush event countdown
    if (this.G.rushMode && this.G.rushTimer > 0) {
      this.G.rushTimer -= 1;
      if (this.G.rushTimer === 0) {
        this.G.rushMode = false;
        this.showToast('⏱️ Rush ended! Back to normal trading.');
      }
    }
  }

  autoCraftForContracts() {
    const openContracts = this.G.contracts.filter((c) => !c.accepted);
    if (!openContracts.length) return;
    let queued = false;

    for (const contract of openContracts) {
      const needed = Math.max(0, contract.qty - (this.G.inv[contract.want] || 0));
      if (needed <= 0) continue;
      const recipe = RECIPES.find((r) => r.output === contract.want);
      if (!recipe) continue;
      const canQueue = Object.entries(recipe.inputs).every(([item, qty]) => (this.G.inv[item] || 0) >= qty);
      if (!canQueue) continue;
      if (this.G.factoryQueue.length >= this.G.factorySlots * 2) break;

      // queue one unit of this recipe
      this.queueRecipe(recipe.id);
      queued = true;
      if (queued) break;
    }

    if (queued) {
      this.showToast('👨‍🍳 Staff are preparing contract goods for you!');
    }
  }

  assignStaffTask(staffId, task) {
    const staff = this.G.staff.find((s) => s.id === staffId);
    if (!staff) return;
    staff.assignedTask = task;
    this.showToast(`🛠️ ${staff.name || staff.id} assigned to ${task}.`);
    this.notify();
  }

  startSupplyRush() {
    if (this.G.rushMode) {
      this.showToast('⚠️ A rush is already active!');
      return;
    }
    this.G.rushMode = true;
    this.G.rushTimer = 30; // 30 seconds
    this.showToast('🔥 SUPPLY RUSH STARTED! +50% earnings for 30s');
    this.notify();
  }

  tickContracts() {
    this.G.contracts.forEach((c) => {
      if (!c.accepted) c.ticksLeft = (c.ticksLeft || 600) - 1;
    });
    this.G.contracts = this.G.contracts.filter((c) => c.accepted || c.ticksLeft > 0);
  }

  changeWeather() {
    const w = WEATHER_TYPES[Math.floor(Math.random() * WEATHER_TYPES.length)];
    const daysRange = w.days;
    this.G.weather = {
      type: w.type,
      daysLeft: daysRange[0] + Math.floor(Math.random() * (daysRange[1] - daysRange[0] + 1)),
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
      { id: 'first_sale', label: 'First Sale', desc: 'Sell your first eggs', check: () => this.G.totalRevenue > 0 },
      { id: 'cash_500', label: '$500 Milestone', desc: 'Accumulate $500 cash', check: () => this.G.cash >= 500 },
      { id: 'cash_2k', label: '$2,000 Cash', desc: 'Reach $2,000 in the bank', check: () => this.G.cash >= 2000 },
      { id: 'factory_run', label: 'Factory Activated', desc: 'Complete your first recipe', check: () => this.G.inv.powdered > 0 || this.G.inv.mayo > 0 },
      { id: 'staff_3', label: 'Full Team', desc: 'Hire 3 staff members', check: () => this.G.staff.length >= 3 },
      { id: 'truck_fleet', label: 'Trucker Life', desc: 'Own 2 trucks', check: () => this.G.trucks.length >= 2 },
      { id: 'contract_5', label: 'Contract King', desc: 'Fulfill 5 contracts', check: () => this.G.contracts.filter((c) => c.accepted).length >= 5 },
      { id: 'revenue_10k', label: '$10K Revenue', desc: 'Total revenue $10,000+', check: () => this.G.totalRevenue >= 10000 },
    ];
    checks.forEach((m) => {
      if (!this.G.milestones[m.id] && m.check()) {
        this.G.milestones[m.id] = true;
        this.showToast(`🏆 Milestone: "${m.label}" achieved!`);
        this.G.cash += 100;
        this.addLedger(`🏆 Milestone Bonus: ${m.label}`, 100, 'milestone');
      }
    });
  }

  generateLevelGoals() {
    if (!this.G.level) this.G.level = 1;
    const lvl = this.G.level;
    const reqs = [];

    // Base multipliers for scaling
    const scale = Math.pow(1.5, lvl - 1);
    
    // Level 1: Introduction
    if (lvl === 1) {
      reqs.push({ type: 'revenue', amount: 1500, desc: 'Earn $1,500 Total Revenue' });
      reqs.push({ type: 'plotCount', amount: 3, desc: 'Unlock 3 Plots' });
    } 
    // Level 2: Expansion
    else if (lvl === 2) {
      reqs.push({ type: 'cash', amount: 2000, desc: 'Hold $2,000 Cash' });
      reqs.push({ type: 'contractsDone', amount: 3, desc: 'Fulfill 3 Contracts' });
    }
    // Level 3: Industrialization
    else if (lvl === 3) {
      reqs.push({ type: 'item', target: 'mayo', amount: 10, desc: 'Have 10 Mayonnaise in Stock' });
      reqs.push({ type: 'staffCount', amount: 2, desc: 'Hire 2 Staff Members' });
    }
    // Level 4+: Procedural Challenge
    else {
      // 1. Financial Goal (Revenue or Cash)
      const isCash = Math.random() > 0.5;
      if (isCash) {
          const amt = Math.floor(5000 * scale * (1 + lvl/25));
          reqs.push({ type: 'cash', amount: amt, desc: `Hold $${amt.toLocaleString()} Cash` });
      } else {
          const amt = Math.floor(10000 * scale * (1 + lvl/20));
          reqs.push({ type: 'revenue', amount: amt, desc: `Earn $${amt.toLocaleString()} Total Revenue` });
      }

      // 2. Operational Goal (Plot upgrade or staff growth)
      const isPlot = Math.random() > 0.4;
      if (isPlot) {
          const plotLvl = Math.min(12, Math.floor(2 + lvl/2.5));
          reqs.push({ type: 'plotLevel', target: 'henCoop', amount: plotLvl, desc: `Upgrade Hen Coop to Lv ${plotLvl}` });
      } else {
          const count = Math.min(8, Math.floor(2 + lvl/3));
          reqs.push({ type: 'staffCount', amount: count, desc: `Manage a team of ${count} Staff` });
      }

      // 3. Market Goal (Contracts or Store item)
      const isContract = Math.random() > 0.45;
      if (isContract) {
          const count = Math.max(10, Math.floor(this.G.contractsFulfilled + (6 * scale)));
          reqs.push({ type: 'contractsDone', amount: count, desc: `Fulfill ${count} Total Contracts` });
      } else {
          const advancedItems = ['powdered', 'mayo', 'omelette', 'cake', 'custard', 'vaccine'];
          const itemIndex = Math.min(advancedItems.length - 1, Math.max(0, lvl - 3));
          const targetItem = advancedItems[Math.floor(Math.random() * (itemIndex + 1))];
          const qty = Math.floor(10 * scale * (1 + lvl/15));
          reqs.push({ type: 'item', target: targetItem, amount: qty, desc: `Hoard ${qty} ${targetItem}s` });
      }

      // 4. Endgame stretch goal starts at lvl 7+ to keep progression meaningful
      if (lvl >= 7) {
          const targetPlots = Math.min(6, Math.max(4, Math.floor(3 + lvl / 3)));
          reqs.push({ type: 'plotCount', amount: targetPlots, desc: `Control at least ${targetPlots} Plots` });
      }

      // 5. Legendary mastery goal at lvl 12+
      if (lvl >= 12) {
          const requiredStaff = Math.min(10, Math.floor(3 + lvl / 2));
          reqs.push({ type: 'staffCount', amount: requiredStaff, desc: `Assemble ${requiredStaff} staff for Mega Operations` });
      }
    }

    this.G.levelReqs = reqs;
  }

  getFarmRankTitle(level) {
    const titles = [
      '🌱 Rookie Farmer',
      '🚜 Apprentice Rancher',
      '🏡 Commercial Grower',
      '🌾 Farm Manager',
      '🧑‍🌾 Agro Tycoon',
      '🏭 Industrial Baron',
      '🌍 Global Distributor',
      '⭐ Legacy Legend',
      '🌌 Cosmic Cultivator',
      '👑 Harvest Sovereign',
    ];
    const idx = Math.max(0, Math.min(level - 1, titles.length - 1));
    const suffix = level > titles.length ? ` (Level ${level})` : '';
    return `${titles[idx]}${suffix}`;
  }

  checkLevelProgress() {
    if (!this.G.levelReqs || this.G.levelReqs.length === 0) this.generateLevelGoals();
    
    let allMet = true;
    this.G.levelReqs.forEach((req) => {
      let val = 0;
      if (req.type === 'revenue') val = this.G.totalRevenue;
      if (req.type === 'cash') val = this.G.cash;
      if (req.type === 'item') val = this.G.inv[req.target] || 0;
      if (req.type === 'contractsDone') val = this.G.contractsFulfilled || 0;
      if (req.type === 'staffCount') val = this.G.staff.length || 0;
      if (req.type === 'plotCount') val = this.G.plots.filter(p => p.unlocked).length;
      if (req.type === 'plotLevel') {
          const p = this.G.plots.find(p => p.type === req.target);
          val = p ? p.level : 0;
      }

      req.current = val; // Store current for UI if needed
      if (val < req.amount) allMet = false;
    });

    if (allMet && !this.G.levelCompletePopup) {
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

    // Remove resets - we keep cash, inv, and plots!
    // Just generate the next set of goals

    this.generateLevelGoals();

    this.showToast(`🌟 Welcome to Level ${this.G.level}! Multiplier is now ${this.G.prestigeMult.toFixed(1)}x!`);
    this.save();
    this.notify();
  }

  // ---- PLAYER ACTIONS -----
  harvestPlot(plotId, auto = false, evCoords = null) {
    const plot = this.G.plots.find((p) => p.id === plotId);
    if (!plot || !plot.unlocked || plot.level < 1) return;

    const def = PLOT_DEFS[plot.type];
    let stored = Math.floor(plot.stored || 0);

    const cap = this.G.invCap[def.output] || 999;
    const currentInv = this.G.inv[def.output] || 0;
    const spaceLeft = cap - currentInv;

    if (spaceLeft <= 0) {
      if (!auto) this.showToast(`Inventory full for ${def.output}!`);
      return;
    }

    // Include 2% chance for golden egg if manually tapped
    if (!auto && def.output === 'egg' && Math.random() < 0.02) {
        this.G.cash += 500;
        this.showToast('✨ GOLDEN EGG! FOUND $500! ✨');
    }

    let tapBonus = 0;
    if (!auto) tapBonus = Math.max(1, Math.floor(def.baseRate * plot.level * 0.2));

    let totalAvailable = stored + tapBonus;
    if (totalAvailable < 1 && auto) return;

    let toHarvest = Math.floor(totalAvailable);
    if (toHarvest > spaceLeft) toHarvest = spaceLeft;

    if (toHarvest > 0) {
      const takeFromStorage = Math.max(0, toHarvest - tapBonus);
      plot.stored = Math.max(0, plot.stored - takeFromStorage);
      this.G.inv[def.output] = currentInv + toHarvest;

      if (!auto && evCoords) {
        this.spawnFloat(`+${toHarvest} ${def.icon}`, evCoords.x, evCoords.y);
      }
    }
    if (!auto) this.notify();
  }

  unlockPlot(plotId) {
    const plot = this.G.plots.find((p) => p.id === plotId);
    if (!plot || plot.unlocked) return;
    const def = PLOT_DEFS[plot.type];
    if (this.G.cash < def.unlockCost) {
      this.showToast(`Need $${def.unlockCost} to unlock!`);
      return;
    }
    this.G.cash -= def.unlockCost;
    plot.unlocked = true;
    plot.level = 1;
    this.G.totalExpenses += def.unlockCost;
    this.addLedger(`Unlocked ${def.name}`, -def.unlockCost, 'unlock');
    this.showToast(`🎉 ${def.name} unlocked!`);
    this.notify();
  }

  upgradePlot(plotId, coords = null) {
    const plot = this.G.plots.find((p) => p.id === plotId);
    if (!plot) return;
    const def = PLOT_DEFS[plot.type];
    const cost = Math.floor(80 * Math.pow(1.8, plot.level));
    if (this.G.cash < cost) {
      this.showToast(`Need $${cost} to upgrade!`);
      return;
    }
    if (plot.level >= def.maxLevel) {
      this.showToast('Already at max level!');
      return;
    }
    this.G.cash -= cost;
    plot.level++;
    this.G.totalExpenses += cost;
    this.addLedger(`Upgraded ${def.name} to Lv${plot.level}`, -cost, 'upgrade');
    if (coords) this.spawnFloat(`⬆️ Lv${plot.level}`, coords.x, coords.y);
    this.showToast(`${def.name} upgraded to Level ${plot.level}!`);
    this.notify();
  }

  queueRecipe(recipeId) {
    const recipe = RECIPES.find((r) => r.id === recipeId);
    if (!recipe) return;
    if (this.G.factoryQueue.length >= this.G.factorySlots * 2) {
      this.showToast('Factory queue full!');
      return;
    }
    for (const [item, amt] of Object.entries(recipe.inputs)) {
      if ((this.G.inv[item] || 0) < amt) {
        this.showToast(`Need ${amt} ${item} (Tap plots to harvest!)`);
        return;
      }
    }
    for (const [item, amt] of Object.entries(recipe.inputs)) this.G.inv[item] -= amt;
    this.G.factoryQueue.push({
      ...recipe,
      progress: 0,
      totalTime: recipe.time,
      startedAt: Date.now(),
      id: 'q_' + Date.now(),
    });
    this.showToast(`🏭 Started: ${recipe.name}`);
    this.notify();
  }

  sellSpot(goodId, qty, coords = null) {
    const avail = Math.floor(this.G.inv[goodId] || 0);
    if (avail < qty) {
      this.showToast('Not enough stock!');
      return;
    }
    const priceMap = {
      egg: 2.2, freeRange: 5.5, organic: 7.8, powdered: 6.0, mayo: 14, omelette: 11.5,
      cake: 37, custard: 18, vaccine: 200, feedWheat: 0.8, water: 0.3,
    };
    const basePrice = priceMap[goodId] || 1;
    let earn = Math.floor(qty * basePrice * this.getPriceMultiplier());
    if (this.G.rushMode) earn = Math.floor(earn * 1.5);

    this.G.inv[goodId] -= qty;
    this.G.cash += earn;
    this.G.totalRevenue += earn;
    this.G.dailyRevenue += earn;
    this.addLedger(`Sold ${qty}× ${goodId}`, earn, 'sell');
    
    if(coords) this.spawnFloat(`+$${earn}`, coords.x, coords.y);
    else this.showToast(`Sold ${qty} ${goodId} for $${earn}`);
    
    this.notify();
  }

  acceptContract(contractId, coords = null) {
    const c = this.G.contracts.find((x) => x.id === contractId);
    if (!c || c.accepted) return;
    const avail = Math.floor(this.G.inv[c.want] || 0);
    if (avail < c.qty) {
      this.showToast(`Need ${c.qty} ${c.want}, you have ${avail}`);
      return;
    }
    this.G.inv[c.want] -= c.qty;
    let earn = Math.floor(c.qty * c.pricePerUnit * this.getPriceMultiplier());
    if (this.G.rushMode) earn = Math.floor(earn * 1.5);
    this.G.cash += earn;
    this.G.totalRevenue += earn;
    this.G.dailyRevenue += earn;
    c.accepted = true;
    this.G.contractsFulfilled++;
    this.addLedger(`Contract: ${c.buyer}`, earn, 'contract');
    
    if(coords) this.spawnFloat(`+$${earn} 📋`, coords.x, coords.y);
    else this.showToast(`✅ Contract fulfilled! +$${earn}`);
    
    this.checkMilestones();
    this.notify();
  }

  dispatchTruck(truckId, routeId, auto = false) {
    const truck = this.G.trucks.find((t) => t.id === truckId);
    const route = ROUTES.find((r) => r.id === routeId);
    if (!truck || !route) return;
    if (truck.status !== 'idle') {
      if (!auto) this.showToast('Truck already on the road!');
      return;
    }
    const truckDef = TRUCK_TYPES.find((t) => t.id === truck.type);
    if (!truckDef.routes.includes(routeId)) {
      if (!auto) this.showToast(`This truck can't access ${route.name}`);
      return;
    }
    const loadAmt = Math.min(Math.floor(this.G.inv.egg || 0), truck.cap);
    if (loadAmt < 5) {
      if (!auto) this.showToast('Need at least 5 eggs to dispatch!');
      return;
    }
    this.G.inv.egg -= loadAmt;
    truck.status = 'dispatched';
    truck.currentRoute = routeId;
    truck.load = loadAmt;
    truck.tripProgress = 0;
    truck.tripTime = Math.floor((60 * route.dist) / (truckDef.speed || 1));
    if (!auto) this.showToast(`🚚 ${truck.name} dispatched to ${route.name} with ${loadAmt} eggs!`);
    this.notify();
  }

  hireStaff(roleId) {
    const role = STAFF_ROLES.find((r) => r.id === roleId);
    if (!role) return;
    if (this.G.staff.length >= this.G.maxStaff) {
      this.showToast(`Need more staff slots! Buy upgrade.`);
      return;
    }
    if (this.G.staff.some((s) => s.id === roleId)) {
      this.showToast('Already hired this role!');
      return;
    }
    const hireCost = role.salary * 7;
    if (this.G.cash < hireCost) {
      this.showToast(`Hiring costs $${hireCost} (7 days salary)`);
      return;
    }
    this.G.cash -= hireCost;
    this.G.totalExpenses += hireCost;
    this.G.staff.push({ ...role, morale: 100, hiredDay: this.G.day });
    this.addLedger(`Hired ${role.name}`, -hireCost, 'hire');
    this.showToast(`👷 ${role.name} hired!`);
    this.notify();
  }

  fireStaff(roleId) {
    this.G.staff = this.G.staff.filter((s) => s.id !== roleId);
    this.showToast('Employee let go.');
    this.notify();
  }

  buyTruck(typeId) {
    const tDef = TRUCK_TYPES.find((t) => t.id === typeId);
    if (!tDef) return;
    if (this.G.trucks.length >= this.G.maxTrucks) {
      this.showToast('Need more fleet slots!');
      return;
    }
    if (this.G.trucks.some((t) => t.type === typeId)) {
      this.showToast('You already own this truck type. Buy a fleet slot to add another.');
      return;
    }
    if (this.G.cash < tDef.cost) {
      this.showToast(`Need $${tDef.cost}!`);
      return;
    }
    this.G.cash -= tDef.cost;
    this.G.totalExpenses += tDef.cost;
    this.G.trucks.push({
      id: 't_' + Date.now(),
      type: typeId,
      name: tDef.name,
      cap: tDef.cap,
      status: 'idle',
      tripProgress: 0,
      load: 0,
      currentRoute: null,
      active: true,
    });
    this.addLedger(`Bought ${tDef.name}`, -tDef.cost, 'purchase');
    this.showToast(`🚚 ${tDef.name} added to fleet!`);
    this.notify();
  }

  buyFarmUpgrade(upgradeId) {
    const upg = FARM_UPGRADES.find((u) => u.id === upgradeId);
    if (!upg) return;
    const count = this.G.upgrades[upgradeId] || 0;
    if (count >= upg.max) {
      this.showToast('Already maxed!');
      return;
    }
    const cost = Math.floor(upg.cost * Math.pow(1.6, count));
    if (this.G.cash < cost) {
      this.showToast(`Need $${cost}!`);
      return;
    }
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

    this.showToast(`✨ ${upg.name} upgraded!`);
    this.notify();
  }

  refreshContracts() {
    const active = this.G.contracts.filter((c) => !c.accepted);
    const cost = active.length === 0 ? 0 : 50;
    if (cost > 0 && this.G.cash < cost) {
      this.showToast(`Refresh costs $${cost}`);
      return;
    }
    if (cost > 0) this.G.cash -= cost;

    this.G.contracts = this.G.contracts.filter((c) => c.accepted);
    this.generateContracts(4);
    this.G.contractsRefreshed = (this.G.contractsRefreshed || 0) + 1;
    this.showToast(cost === 0 ? '🔁 Free refresh after contract completion!' : 'Contracts refreshed!');
    this.notify();
  }
  // ---- DEV TOOLS ----
  cheatProgress() {
    if (!this.G.levelReqs) return;
    this.G.levelReqs.forEach(req => {
        if (req.type === 'revenue') this.G.totalRevenue = Math.max(this.G.totalRevenue, req.amount - 50);
        if (req.type === 'cash') this.G.cash = Math.max(this.G.cash, req.amount - 50);
        if (req.type === 'item') this.G.inv[req.target] = Math.max(this.G.inv[req.target] || 0, req.amount - 1);
        if (req.type === 'contractsDone') this.G.contractsFulfilled = Math.max(this.G.contractsFulfilled, req.amount - 1);
        if (req.type === 'staffCount') {
            while (this.G.staff.length < req.amount) {
                this.G.staff.push({ ...STAFF_ROLES[0], id: 'cheat_' + Math.random() });
            }
        }
    });
    this.showToast("🪄 Level goals set to 95% completion!");
    this.notify();
  }
}

const gameStore = new GameEngine();
export default gameStore;
