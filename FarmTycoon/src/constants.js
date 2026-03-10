export const SEASONS = ['🌸 Spring', '☀️ Summer', '🍂 Autumn', '❄️ Winter'];
export const SEASON_EFFECTS = [
  { prod: 1.2, price: 1.0, label: '+20% production' },
  { prod: 1.0, price: 1.3, label: '+30% prices' },
  { prod: 0.8, price: 1.1, label: '-20% production, +10% prices' },
  { prod: 1.5, price: 0.9, label: '+50% production, -10% prices' },
];

export const WEATHER_TYPES = [
  { type: 'sunny', icon: '☀️', label: 'Clear skies', prod: 1.1, price: 1.0, days: [1, 3] },
  { type: 'rain', icon: '🌧️', label: 'Heavy rain', prod: 1.3, price: 1.0, days: [1, 2] },
  { type: 'storm', icon: '⛈️', label: 'Storm warning', prod: 0.5, price: 1.2, days: [1, 2] },
  { type: 'fog', icon: '🌫️', label: 'Morning fog', prod: 0.9, price: 1.0, days: [1, 2] },
  { type: 'heatwave', icon: '🔥', label: 'Heatwave', prod: 0.7, price: 1.4, days: [1, 3] },
  { type: 'perfect', icon: '🌤️', label: 'Perfect weather', prod: 1.5, price: 1.1, days: [1, 2] },
];

export const PLOT_DEFS = {
  henCoop: { icon: '🐔', name: 'Hen Coop', output: 'egg', baseRate: 10.0, feedNeeds: { feedWheat: 1, water: 1 }, unlockCost: 0, maxLevel: 8 },
  feedFarm: { icon: '🌾', name: 'Feed Farm', output: 'feedWheat', baseRate: 15.0, feedNeeds: { water: 1 }, unlockCost: 80, maxLevel: 6 },
  waterWell: { icon: '💧', name: 'Water Well', output: 'water', baseRate: 20.0, feedNeeds: {}, unlockCost: 120, maxLevel: 6 },
  organicFarm: { icon: '🌿', name: 'Organic Coop', output: 'organic', baseRate: 4.0, feedNeeds: { feedCorn: 2, water: 1 }, unlockCost: 400, maxLevel: 5 },
  hatchery: { icon: '🐣', name: 'Hatchery', output: 'freeRange', baseRate: 2.0, feedNeeds: { feedWheat: 1, feedCorn: 1, water: 2 }, unlockCost: 600, maxLevel: 4 },
  cornField: { icon: '🌽', name: 'Corn Field', output: 'feedCorn', baseRate: 12.0, feedNeeds: { water: 1 }, unlockCost: 150, maxLevel: 6 },
};

export const RECIPES = [
  { id: 'powdered', icon: '🥛', name: 'Powdered Eggs', time: 20, inputs: { egg: 8 }, output: 'powdered', qty: 3, sellPrice: 18, unlockLevel: 1 },
  { id: 'mayo', icon: '🫙', name: 'Mayonnaise Jar', time: 35, inputs: { egg: 5, water: 2 }, output: 'mayo', qty: 2, sellPrice: 28, unlockLevel: 1 },
  { id: 'omelette', icon: '🍳', name: 'Gourmet Omelette', time: 45, inputs: { egg: 6, feedWheat: 2 }, output: 'omelette', qty: 3, sellPrice: 35, unlockLevel: 2 },
  { id: 'freeRange', icon: '🥚', name: 'Free Range Pack', time: 15, inputs: { freeRange: 4 }, output: 'freeRange', qty: 4, sellPrice: 22, unlockLevel: 2 },
  { id: 'organic', icon: '🌿', name: 'Organic Box', time: 25, inputs: { organic: 4, water: 1 }, output: 'organic', qty: 4, sellPrice: 32, unlockLevel: 3 },
  { id: 'cake', icon: '🎂', name: 'Egg Cake', time: 80, inputs: { egg: 10, feedWheat: 5, water: 3 }, output: 'cake', qty: 2, sellPrice: 75, unlockLevel: 3 },
  { id: 'custard', icon: '🍮', name: 'Custard Batch', time: 60, inputs: { egg: 8, water: 4 }, output: 'custard', qty: 3, sellPrice: 55, unlockLevel: 4 },
  { id: 'vaccine', icon: '💉', name: 'Egg Protein Serum', time: 120, inputs: { organic: 3, freeRange: 2, egg: 5 }, output: 'vaccine', qty: 1, sellPrice: 200, unlockLevel: 5 },
];

export const STAFF_ROLES = [
  { id: 'farmer', icon: '👨‍🌾', name: 'Farmer', salary: 12, bonus: 'Harvests plots automatically', skill: 'autoHarvest', value: 1 },
  { id: 'driver', icon: '🚛', name: 'Truck Driver', salary: 18, bonus: 'Auto-dispatches full trucks', skill: 'truckBonus', value: 1 },
  { id: 'chef', icon: '👨‍🍳', name: 'Factory Chef', salary: 22, bonus: '+25% factory speed', skill: 'factorySpeed', value: 0.25 },
  { id: 'trader', icon: '📈', name: 'Market Trader', salary: 20, bonus: '+15% all sell prices', skill: 'priceBonus', value: 0.15 },
  { id: 'vet', icon: '🐾', name: 'Farm Vet', salary: 15, bonus: '+30% coop production', skill: 'coopBonus', value: 0.30 },
  { id: 'manager', icon: '🤵', name: 'Operations Mgr', salary: 35, bonus: 'All staff bonuses +20%', skill: 'megaBonus', value: 0.20 },
];

export const TRUCK_TYPES = [
  { id: 'van', icon: '🚐', name: 'Delivery Van', cap: 30, speed: 1.0, range: 1, cost: 300, routes: ['town'] },
  { id: 'truck', icon: '🚚', name: 'Medium Truck', cap: 80, speed: 0.9, range: 2, cost: 700, routes: ['town', 'city'] },
  { id: 'semi', icon: '🚛', name: 'Semi Truck', cap: 200, speed: 0.8, range: 3, cost: 1800, routes: ['town', 'city', 'export'] },
  { id: 'ref', icon: '❄️', name: 'Refrigerator Truck', cap: 100, speed: 0.85, range: 2, cost: 1200, routes: ['premium'] },
];

export const ROUTES = [
  { id: 'town', icon: '🏘️', name: 'Local Town', dist: 1, basePrice: 1.0, vol: 'low', bonus: '$2.5/egg' },
  { id: 'city', icon: '🏙️', name: 'City Market', dist: 2, basePrice: 1.4, vol: 'medium', bonus: '$3.8/egg' },
  { id: 'export', icon: '✈️', name: 'Export Deal', dist: 4, basePrice: 2.0, vol: 'high', bonus: '$6/egg' },
  { id: 'premium', icon: '👑', name: 'Premium Hotels', dist: 2, basePrice: 2.8, vol: 'low', bonus: '$8/egg' },
];

export const CONTRACT_POOL = [
  { buyer: '🍽️ Downtown Restaurant', want: 'egg', qty: 30, pricePerUnit: 3.5, urgent: false, lucrative: false },
  { buyer: '🏨 Grand Hotel Chain', want: 'omelette', qty: 8, pricePerUnit: 45, urgent: false, lucrative: true },
  { buyer: '🛒 FreshMart Superchain', want: 'egg', qty: 100, pricePerUnit: 2.8, urgent: false, lucrative: true },
  { buyer: '👑 Royal Catering', want: 'organic', qty: 12, pricePerUnit: 55, urgent: true, lucrative: true },
  { buyer: '💊 PharmaCorp', want: 'vaccine', qty: 3, pricePerUnit: 280, urgent: false, lucrative: true },
  { buyer: '☕ Café Élite', want: 'mayo', qty: 15, pricePerUnit: 32, urgent: true, lucrative: false },
  { buyer: '🎂 BakeryMasters', want: 'cake', qty: 5, pricePerUnit: 90, urgent: true, lucrative: true },
  { buyer: '🥗 Organic Co-op', want: 'freeRange', qty: 20, pricePerUnit: 28, urgent: false, lucrative: false },
  { buyer: '🏥 City Hospital', want: 'custard', qty: 10, pricePerUnit: 65, urgent: true, lucrative: false },
  { buyer: '🌍 Export Broker', want: 'powdered', qty: 25, pricePerUnit: 22, urgent: false, lucrative: true },
];

export const FARM_UPGRADES = [
  { id: 'eggCap', icon: '📦', name: 'Egg Storage +50', desc: 'Expand total egg capacity.', cost: 200, effect: 'invCap.egg += 50', repeatable: true, count: 0, max: 10 },
  { id: 'feedRate', icon: '🌾', name: 'Feed Efficiency', desc: '25% less feed consumed per cycle.', cost: 150, effect: 'feedEff', repeatable: true, count: 0, max: 5 },
  { id: 'coopSpeed', icon: '⚡', name: 'Coop Speed Boost', desc: 'All coops produce 20% faster.', cost: 180, effect: 'coopSpeed', repeatable: true, count: 0, max: 6 },
  { id: 'waterEff', icon: '💧', name: 'Water Recycler', desc: '50% less water used.', cost: 220, effect: 'waterEff', repeatable: false, count: 0, max: 1 },
  { id: 'factSlots', icon: '🏭', name: 'Factory Slot +1', desc: 'Process one more recipe at once.', cost: 350, effect: 'factorySlots++', repeatable: true, count: 0, max: 3 },
  { id: 'factLevel', icon: '🏗️', name: 'Factory Expansion', desc: 'Unlocks advanced recipes.', cost: 800, effect: 'factoryLevel++', repeatable: true, count: 0, max: 4 },
  { id: 'staffSlot', icon: '👷', name: 'Hire +1 Staff Slot', desc: 'Expand your team capacity.', cost: 250, effect: 'maxStaff++', repeatable: true, count: 0, max: 5 },
  { id: 'truckSlot', icon: '🚚', name: 'Fleet Slot +1', desc: 'Buy an additional truck.', cost: 500, effect: 'maxTrucks++', repeatable: true, count: 0, max: 4 },
  { id: 'autoCollect', icon: '🤖', name: 'Auto-Collect System', desc: 'All plots auto-harvest every 30s.', cost: 600, effect: 'autoCollect', repeatable: false, count: 0, max: 1 },
];
