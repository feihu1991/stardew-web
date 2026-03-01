/**
 * Stardew Web - Game Engine v2.0
 * A pixel-art farming simulation game with enhanced features
 */

// ============================================
// CONFIGURATION
// ============================================
const CONFIG = {
    TILE_SIZE: 48,
    VIEWPORT_WIDTH: 15,
    VIEWPORT_HEIGHT: 11,
    PLAYER_SPEED: 4,
    TICK_RATE: 1000,
    MAX_ENERGY: 100,
};

// Color Palette
const COLORS = {
    grass: '#7ec850',
    grassDark: '#569130',
    soil: '#8b6914',
    soilDark: '#5c4a0f',
    water: '#4fc3f7',
    path: '#c9a86c',
    pathDark: '#a08050',
    fence: '#8b5a2b',
    fenceDark: '#5c3d1e',
    highlight: 'rgba(255, 255, 255, 0.3)',
};

// Day/Night colors
const TIME_COLORS = {
    morning: { sky: '#87ceeb', ambient: '#fffaf0' },
    noon: { sky: '#74b9ff', ambient: '#fff' },
    afternoon: { sky: '#fd9644', ambient: '#ffeaa7' },
    evening: { sky: '#a55eea', ambient: '#dff9fb' },
    night: { sky: '#2d3436', ambient: '#636e72' },
};

// ============================================
// GAME DATA
// ============================================
const CROPS = {
    carrot: { name: '胡萝卜', emoji: '🥕', growTime: 3, sellPrice: 30, seedCost: 10, season: ['spring'], color: '#ff7f50' },
    tomato: { name: '番茄', emoji: '🍅', growTime: 4, sellPrice: 50, seedCost: 20, season: ['summer'], color: '#ff6348' },
    corn: { name: '玉米', emoji: '🌽', growTime: 5, sellPrice: 80, seedCost: 30, season: ['summer', 'autumn'], color: '#ffd700' },
    potato: { name: '土豆', emoji: '🥔', growTime: 3, sellPrice: 25, seedCost: 8, season: ['spring', 'autumn'], color: '#d2b48c' },
    strawberry: { name: '草莓', emoji: '🍓', growTime: 4, sellPrice: 100, seedCost: 40, season: ['spring'], color: '#ff69b4' },
    pumpkin: { name: '南瓜', emoji: '🎃', growTime: 6, sellPrice: 150, seedCost: 50, season: ['autumn'], color: '#ff8c00' },
    eggplant: { name: '茄子', emoji: '🍆', growTime: 5, sellPrice: 70, seedCost: 25, season: ['summer'], color: '#9370db' },
    flower: { name: '向日葵', emoji: '🌻', growTime: 3, sellPrice: 40, seedCost: 15, season: ['spring', 'summer'], color: '#ffd700' },
};

const SEASONS = ['spring', 'summer', 'autumn', 'winter'];
const SEASON_NAMES = { spring: '春季', summer: '夏季', autumn: '秋季', winter: '冬季' };
const SEASON_EMOJIS = { spring: '🌸', summer: '☀️', autumn: '🍂', winter: '❄️' };

// ============================================
// GAME STATE
// ============================================
let gameState = {
    money: 500,
    day: 1,
    season: 'spring',
    year: 1,
    level: 1,
    exp: 0,
    energy: 100,
    maxEnergy: 100,
    timeOfDay: 'morning',
    inventory: {},
    farm: [],
    achievements: [],
    fish: [],
};

// Particles system
let particles = [];

// ============================================
// INITIALIZATION
// ============================================
function initFarm() {
    gameState.farm = [];
    for (let y = 0; y < 8; y++) {
        gameState.farm[y] = [];
        for (let x = 0; x < 10; x++) {
            gameState.farm[y][x] = { type: 'soil', crop: null, watered: false };
        }
    }
}

// ============================================
// CANVAS & RENDERING
// ============================================
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
let SCALE = 4;

function resizeCanvas() {
    const maxWidth = window.innerWidth - 32;
    const maxHeight = window.innerHeight - 150;
    const aspectRatio = CONFIG.VIEWPORT_WIDTH / CONFIG.VIEWPORT_HEIGHT;
    let width = maxWidth;
    let height = width / aspectRatio;
    if (height > maxHeight) { height = maxHeight; width = height * aspectRatio; }
    canvas.width = Math.floor(width);
    canvas.height = Math.floor(height);
    SCALE = Math.floor(width / CONFIG.VIEWPORT_WIDTH / CONFIG.TILE_SIZE);
}

// ============================================
// PLAYER
// ============================================
const player = { x: 5 * CONFIG.TILE_SIZE, y: 4 * CONFIG.TILE_SIZE, direction: 'down', moving: false, frame: 0 };

// ============================================
// INPUT HANDLING
// ============================================
const keys = {};
document.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;
    if (['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].includes(e.key.toLowerCase())) e.preventDefault();
});
document.addEventListener('keyup', (e) => keys[e.key.toLowerCase()] = false);

let touchStartX, touchStartY;
canvas.addEventListener('touchstart', (e) => { touchStartX = e.touches[0].clientX; touchStartY = e.touches[0].clientY; });
canvas.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;
    if (Math.abs(dx) > Math.abs(dy)) { if (dx > 30) keys['d'] = true; else if (dx < -30) keys['a'] = true; }
    else { if (dy > 30) keys['s'] = true; else if (dy < -30) keys['w'] = true; }
    setTimeout(() => { keys['w'] = keys['a'] = keys['s'] = keys['d'] = false; }, 200);
});

// ============================================
// PARTICLE SYSTEM
// ============================================
function createParticle(x, y, type = 'dust') {
    particles.push({ x, y, type, life: 1, vx: (Math.random() - 0.5) * 4, vy: (Math.random() - 0.5) * 4 - 2, size: Math.random() * 8 + 4, emoji: type === 'star' ? '✨' : type === 'heart' ? '💖' : type === 'coin' ? '💰' : '✨' });
}
function updateParticles() {
    particles = particles.filter(p => { p.x += p.vx; p.y += p.vy; p.vy += 0.1; p.life -= 0.02; return p.life > 0; });
}
function drawParticles() {
    particles.forEach(p => { ctx.globalAlpha = p.life; ctx.font = `${p.size * SCALE}px Arial`; ctx.textAlign = 'center'; ctx.fillText(p.emoji, p.x + CONFIG.TILE_SIZE * SCALE / 2, p.y + CONFIG.TILE_SIZE * SCALE / 2); });
    ctx.globalAlpha = 1;
}

// ============================================
// GAME LOGIC
// ============================================
function update() { handleMovement(); updateAnimation(); updateParticles(); updateTimeOfDay(); }

function handleMovement() {
    let dx = 0, dy = 0;
    if (keys['w'] || keys['arrowup']) { dy = -CONFIG.PLAYER_SPEED; player.direction = 'up'; }
    if (keys['s'] || keys['arrowdown']) { dy = CONFIG.PLAYER_SPEED; player.direction = 'down'; }
    if (keys['a'] || keys['arrowleft']) { dx = -CONFIG.PLAYER_SPEED; player.direction = 'left'; }
    if (keys['d'] || keys['arrowright']) { dx = CONFIG.PLAYER_SPEED; player.direction = 'right'; }
    player.moving = dx !== 0 || dy !== 0;
    if (player.moving && gameState.energy > 0) {
        if (player.x + dx >= 0 && player.x + dx < canvas.width - CONFIG.TILE_SIZE * SCALE) player.x += dx;
        if (player.y + dy >= 0 && player.y + dy < canvas.height - CONFIG.TILE_SIZE * SCALE) player.y += dy;
        if (Math.random() < 0.05) gameState.energy -= 0.5;
    }
}

function updateAnimation() { player.frame = player.moving ? (player.frame + 0.2) % 4 : 0; }

function updateTimeOfDay() {
    const hour = (gameState.day * 24) % 24;
    if (hour >= 6 && hour < 9) gameState.timeOfDay = 'morning';
    else if (hour >= 9 && hour < 14) gameState.timeOfDay = 'noon';
    else if (hour >= 14 && hour < 18) gameState.timeOfDay = 'afternoon';
    else if (hour >= 18 && hour < 21) gameState.timeOfDay = 'evening';
    else gameState.timeOfDay = 'night';
}

// ============================================
// FARMING
// ============================================
function getFarmTile(px, py) {
    const tileX = Math.floor(px / CONFIG.TILE_SIZE / SCALE);
    const tileY = Math.floor(py / CONFIG.TILE_SIZE / SCALE);
    if (tileX >= 0 && tileX < 10 && tileY >= 0 && tileY < 8) return { tile: gameState.farm[tileY][tileX], x: tileX, y: tileY };
    return null;
}

function interact() {
    if (gameState.energy <= 0) { showNotification('💤 累了，去睡觉吧！', 'warning'); return; }
    let targetX = player.x, targetY = player.y;
    switch (player.direction) { case 'up': targetY -= CONFIG.TILE_SIZE * SCALE; break; case 'down': targetY += CONFIG.TILE_SIZE * SCALE; break; case 'left': targetX -= CONFIG.TILE_SIZE * SCALE; break; case 'right': targetX += CONFIG.TILE_SIZE * SCALE; break; }
    const farmData = getFarmTile(targetX + CONFIG.TILE_SIZE * SCALE / 2, targetY + CONFIG.TILE_SIZE * SCALE / 2);
    if (farmData && farmData.tile) {
        const tile = farmData.tile;
        if (tile.crop) {
            if (tile.crop.stage >= CROPS[tile.crop.type].growTime) {
                const crop = CROPS[tile.crop.type];
                addItem(tile.crop.type, 1, 'crop'); addExp(15);
                for (let i = 0; i < 8; i++) createParticle(farmData.x, farmData.y, 'star');
                showNotification(`🎉 收获了 ${crop.emoji} ${crop.name}! +15经验`); gameState.energy -= 5;
                tile.crop = null; tile.watered = false;
            } else if (!tile.watered && gameState.energy >= 3) {
                tile.watered = true; gameState.energy -= 3;
                for (let i = 0; i < 5; i++) createParticle(farmData.x, farmData.y, 'dust');
                showNotification('💧 浇水成功！');
            } else if (gameState.energy < 3) showNotification('💤 累了，需要休息', 'warning');
            else showNotification('⏳ 作物还需要时间生长', 'warning');
        } else if (tile.type === 'soil') {
            const selectedSeed = getSelectedSeed();
            if (selectedSeed) {
                const crop = CROPS[selectedSeed];
                if (crop.season.includes(gameState.season)) {
                    if (gameState.inventory[selectedSeed]?.seeds > 0 && gameState.energy >= 5) {
                        gameState.inventory[selectedSeed].seeds--; tile.crop = { type: selectedSeed, stage: 0, planted: gameState.day }; gameState.energy -= 5;
                        for (let i = 0; i < 5; i++) createParticle(farmData.x, farmData.y, 'dust');
                        showNotification(`🌱 种下了 ${crop.emoji} ${crop.name}! -5体力`);
                    } else if (gameState.energy < 5) showNotification('💤 累了，去睡觉吧', 'warning');
                    else showNotification('❌ 没有种子了', 'error');
                } else showNotification('❌ 这个季节不能种这个作物', 'error');
            } else showNotification('🎒 请先在背包选择要种的种子', 'warning');
        }
    }
}

document.addEventListener('keydown', (e) => { if (e.key === ' ' || e.key === 'e') { e.preventDefault(); interact(); } });
canvas.addEventListener('click', interact);

// ============================================
// INVENTORY
// ============================================
let selectedSeed = null;
function addItem(itemId, amount, type = 'crop') {
    if (!gameState.inventory[itemId]) gameState.inventory[itemId] = { seeds: 0, crops: 0 };
    gameState.inventory[itemId][type === 'seed' ? 'seeds' : 'crops'] += amount;
    updateUI();
}
function getSelectedSeed() { return selectedSeed; }
function selectSeed(itemId) { selectedSeed = itemId; showNotification(`🎯 已选择: ${CROPS[itemId]?.emoji || itemId}`); }

// ============================================
// SHOP
// ============================================
function openShop() {
    const panel = document.getElementById('shop-panel');
    const grid = document.getElementById('shop-grid');
    grid.innerHTML = '';
    Object.entries(CROPS).forEach(([id, crop]) => {
        const canBuy = crop.season.includes(gameState.season);
        const item = document.createElement('div');
        item.className = 'shop-item';
        item.innerHTML = `<span class="item-icon">🌱</span><span class="item-name">${crop.name}种子</span><span class="item-price">💰${crop.seedCost}</span>${canBuy ? `<span class="sell-price">卖出: 💰${crop.sellPrice}</span>` : '<span style="color:#ef7d57">不当季</span>'}`;
        if (canBuy) item.onclick = () => buySeed(id);
        else { item.style.opacity = '0.5'; item.style.cursor = 'not-allowed'; }
        grid.appendChild(item);
    });
    // Fishing rod
    const rod = document.createElement('div');
    rod.className = 'shop-item';
    rod.innerHTML = `<span class="item-icon">🎣</span><span class="item-name">钓鱼竿</span><span class="item-price">💰500</span>`;
    rod.onclick = () => buyItem('fishingrod', 500);
    grid.appendChild(rod);
    // Sell section
    const sellHeader = document.createElement('div');
    sellHeader.style = 'grid-column:1/-1;text-align:center;color:#f4f4f4;padding:10px;border-top:2px solid #3b5dc9;margin-top:10px;';
    sellHeader.innerHTML = '<h3>出售作物</h3>';
    grid.appendChild(sellHeader);
    Object.entries(gameState.inventory).forEach(([id, inv]) => {
        if (inv.crops > 0) {
            const crop = CROPS[id];
            const item = document.createElement('div');
            item.className = 'shop-item';
            item.innerHTML = `<span class="item-icon">${crop.emoji}</span><span class="item-name">${crop.name}</span><span class="item-count">x${inv.crops}</span><span class="sell-price">卖出: 💰${crop.sellPrice}</span>`;
            item.onclick = () => sellCrop(id);
            grid.appendChild(item);
        }
    });
    if (gameState.fish.length > 0) {
        const fishHeader = document.createElement('div');
        fishHeader.style = 'grid-column:1/-1;text-align:center;color:#4fc3f7;padding:10px;border-top:2px solid #3b5dc9;';
        fishHeader.innerHTML = '<h3>出售鱼类</h3>';
        grid.appendChild(fishHeader);
        const fishCount = {}; gameState.fish.forEach(f => fishCount[f] = (fishCount[f] || 0) + 1);
        Object.entries(fishCount).forEach(([fishName, count]) => {
            const prices = { '🐟': 50, '🐠': 100, '🐡': 80, '🦑': 120, '🦐': 90 };
            const item = document.createElement('div');
            item.className = 'shop-item';
            item.innerHTML = `<span class="item-icon">${fishName}</span><span class="item-name">${fishName}</span><span class="item-count">x${count}</span><span class="sell-price">卖出: 💰${prices[fishName] || 50}</span>`;
            item.onclick = () => sellFish(fishName, prices[fishName] || 50);
            grid.appendChild(item);
        });
    }
    panel.classList.remove('hidden');
}

function buySeed(seedId) {
    const crop = CROPS[seedId];
    if (gameState.money >= crop.seedCost) { gameState.money -= crop.seedCost; addItem(seedId, 1, 'seed'); showNotification(`🛒 购买了 ${crop.emoji} ${crop.name}种子 x1`); openShop(); }
    else showNotification('💸 钱不够!', 'error');
}
function buyItem(itemId, cost) {
    if (itemId === 'fishingrod' && gameState.money >= cost) { gameState.money -= cost; gameState.inventory.fishingrod = (gameState.inventory.fishingrod || 0) + 1; showNotification('🎣 购买了钓鱼竿！'); openShop(); }
    else if (gameState.money < cost) showNotification('💸 钱不够!', 'error');
}
function sellCrop(cropId) {
    const crop = CROPS[cropId];
    if (gameState.inventory[cropId].crops > 0) { gameState.inventory[cropId].crops--; gameState.money += crop.sellPrice; showNotification(`💰 卖出了 ${crop.emoji} ${crop.name}, 获得 💰${crop.sellPrice}`); openShop(); }
}
function sellFish(fishEmoji, price) {
    const index = gameState.fish.indexOf(fishEmoji);
    if (index > -1) { gameState.fish.splice(index, 1); gameState.money += price; showNotification(`💰 卖出了 ${fishEmoji}, 获得 💰${price}`); openShop(); }
}

// ============================================
// INVENTORY PANEL
// ============================================
function openInventory() {
    const panel = document.getElementById('inventory-panel');
    const grid = document.getElementById('inventory-grid');
    grid.innerHTML = '';
    // Energy bar
    const energyBar = document.createElement('div');
    energyBar.style = 'grid-column:1/-1;background:rgba(59,93,201,0.2);border-radius:8px;padding:10px;margin-bottom:10px;';
    energyBar.innerHTML = `<div style="color:#f4f4f4;margin-bottom:5px;">⚡ 体力: ${gameState.energy}/${gameState.maxEnergy}</div><div style="background:#1a1c2c;height:20px;border-radius:10px;overflow:hidden;"><div style="background:linear-gradient(90deg,#4fc3f7,#2196f3);height:100%;width:${gameState.energy}%;transition:width 0.3s;"></div></div>`;
    grid.appendChild(energyBar);
    Object.entries(gameState.inventory).forEach(([id, inv]) => {
        if (inv.seeds > 0) {
            const crop = CROPS[id];
            const item = document.createElement('div');
            item.className = 'inventory-slot';
            item.innerHTML = `<span class="item-icon">🌱</span><span class="item-name">${crop.name}种子</span><span class="item-count">x${inv.seeds}</span>`;
            item.onclick = () => selectSeed(id);
            if (selectedSeed === id) { item.style.borderColor = '#ffd700'; item.style.boxShadow = '0 0 10px rgba(255,215,0,0.5)'; }
            grid.appendChild(item);
        }
    });
    Object.entries(gameState.inventory).forEach(([id, inv]) => {
        if (inv.crops > 0) {
            const crop = CROPS[id];
            const item = document.createElement('div');
            item.className = 'inventory-slot';
            item.innerHTML = `<span class="item-icon">${crop.emoji}</span><span class="item-name">${crop.name}</span><span class="item-count">x${inv.crops}</span>`;
            grid.appendChild(item);
        }
    });
    if (gameState.inventory.fishingrod > 0) {
        const rod = document.createElement('div');
        rod.className = 'inventory-slot';
        rod.innerHTML = `<span class="item-icon">🎣</span><span class="item-name">钓鱼竿</span><span class="item-count">x${gameState.inventory.fishingrod}</span>`;
        grid.appendChild(rod);
    }
    if (grid.children.length <= 1) grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:#a0a0a0;padding:20px;">背包是空的</div>';
    panel.classList.remove('hidden');
}

// ============================================
// UI
// ============================================
function updateUI() {
    document.getElementById('money-display').textContent = gameState.money;
    document.getElementById('day-display').textContent = `第${gameState.day}天`;
    document.getElementById('season-display').textContent = SEASON_EMOJIS[gameState.season] + SEASON_NAMES[gameState.season];
    document.getElementById('level-display').textContent = `Lv.${gameState.level}`;
}
function showNotification(message, type = 'success') {
    const area = document.getElementById('notification-area');
    const notif = document.createElement('div');
    notif.className = `notification ${type}`;
    notif.textContent = message;
    area.appendChild(notif);
    setTimeout(() => notif.remove(), 3000);
}
function addExp(amount) {
    gameState.exp += amount;
    const expNeeded = gameState.level * 100;
    if (gameState.exp >= expNeeded) {
        gameState.level++; gameState.exp -= expNeeded;
        gameState.maxEnergy = Math.min(100, 50 + gameState.level * 10);
        gameState.energy = gameState.maxEnergy;
        for (let i = 0; i < 20; i++) createParticle(player.x / CONFIG.TILE_SIZE / SCALE, player.y / CONFIG.TILE_SIZE / SCALE, 'star');
        showNotification(`🎉 升级了! 现在是 Lv.${gameState.level}! 体力上限提高!`, 'success');
    }
}

// ============================================
// GAME TICK
// ============================================
let tickCount = 0;
function gameTick() {
    tickCount++;
    gameState.farm.forEach(row => row.forEach(tile => { if (tile.crop && tile.watered) tile.crop.stage++; }));
    if (tickCount % 60 === 0) {
        gameState.day++;
        if (gameState.day % 28 === 0) {
            const seasonIndex = SEASONS.indexOf(gameState.season);
            gameState.season = SEASONS[(seasonIndex + 1) % 4];
            if (gameState.season === 'spring') gameState.year++;
            showNotification(`🌍 进入${SEASON_NAMES[gameState.season]}!`);
            gameState.farm.forEach(row => row.forEach(tile => tile.watered = false));
        }
        gameState.farm.forEach(row => row.forEach(tile => tile.watered = false));
        if (Math.random() < 0.3) { const foundCrops = Object.keys(CROPS); const randomCrop = foundCrops[Math.floor(Math.random() * foundCrops.length)]; addItem(randomCrop, Math.floor(Math.random() * 3) + 1, 'crop'); showNotification(`🎁 随机事件: 在田里发现了 ${CROPS[randomCrop].emoji}!`, 'success'); }
        gameState.energy = gameState.maxEnergy;
        updateUI();
    }
    if (tickCount % 30 === 0 && gameState.inventory.fishingrod > 0) {
        if (Math.random() < 0.2) { const fish = ['🐟', '🐠', '🐡', '🦑', '🦐'][Math.floor(Math.random() * 5)]; gameState.fish.push(fish); showNotification(`🎣 鱼儿上钩了: ${fish}! 点击商店出售`, 'success'); }
    }
}

// ============================================
// SAVE/LOAD
// ============================================
function saveGame() { localStorage.setItem('stardew-web-save-v2', JSON.stringify(gameState)); showNotification('💾 游戏已保存'); }
function loadGame() {
    const saveData = localStorage.getItem('stardew-web-save-v2');
    if (saveData) { try { const loaded = JSON.parse(saveData); gameState = { ...gameState, ...loaded }; showNotification('📂 游戏已加载'); } catch (e) { console.error('Load failed:', e); } }
}

// ============================================
// RENDERING
// ============================================
function drawBackground() {
    const colors = TIME_COLORS[gameState.timeOfDay];
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, colors.sky); gradient.addColorStop(1, colors.ambient);
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (gameState.timeOfDay === 'night') {
        ctx.fillStyle = '#fff';
        for (let i = 0; i < 20; i++) { const x = (i * 137) % canvas.width; const y = (i * 89) % (canvas.height * 0.6); ctx.globalAlpha = 0.3 + (Math.sin(Date.now() / 500 + i) * 0.2); ctx.fillRect(x, y, (i % 3) + 1, (i % 3) + 1); }
        ctx.globalAlpha = 1;
    }
}
function drawTile(tx, ty, type, crop = null) {
    const x = tx * CONFIG.TILE_SIZE * SCALE, y = ty * CONFIG.TILE_SIZE * SCALE, size = CONFIG.TILE_SIZE * SCALE, halfSize = size / 2;
    if (type === 'grass') { ctx.fillStyle = COLORS.grass; ctx.fillRect(x, y, size, size); ctx.fillStyle = COLORS.grassDark; ctx.fillRect(x, y, halfSize, halfSize); ctx.fillRect(x + halfSize, y + halfSize, halfSize, halfSize); }
    else if (type === 'soil') { ctx.fillStyle = COLORS.soil; ctx.fillRect(x, y, size, size); ctx.fillStyle = COLORS.soilDark; ctx.fillRect(x + 4, y + 4, size - 8, size - 8); for (let i = 0; i < 3; i++) ctx.fillRect(x + 6 + i * 14, y + 8, 6, size - 16); }
    if (crop?.stage >= CROPS[crop.type].growTime) { ctx.fillStyle = 'rgba(255, 215, 0, 0.4)'; ctx.fillRect(x, y, size, size); ctx.shadowColor = '#ffd700'; ctx.shadowBlur = 20; }
    else if (crop) { const cropData = CROPS[crop.type], growthPercent = crop.stage / cropData.growTime; if (crop.stage > 0) { ctx.font = `${14 * SCALE}px Arial`; ctx.textAlign = 'center'; ctx.fillText('💧', x + halfSize, y + halfSize - 6 * SCALE); } ctx.font = `${(14 + growthPercent * 18) * SCALE}px Arial`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.shadowBlur = 0; ctx.fillText(growthPercent >= 1 ? cropData.emoji : '🌱', x + halfSize, y + halfSize + 4 * SCALE); }
    ctx.shadowBlur = 0;
}
function drawPlayer() {
    const size = CONFIG.TILE_SIZE * SCALE, halfSize = size / 2;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'; ctx.beginPath(); ctx.ellipse(player.x + halfSize, player.y + size - 4 * SCALE, halfSize * 0.6, 8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#5c8a4d'; ctx.fillRect(player.x + 8 * SCALE, player.y + 16 * SCALE, size - 16 * SCALE, size - 20 * SCALE);
    ctx.fillStyle = '#f4c7a1'; ctx.fillRect(player.x + 10 * SCALE, player.y + 4 * SCALE, size - 20 * SCALE, 14 * SCALE);
    ctx.fillStyle = '#333'; const eyeOffsetX = player.direction === 'left' ? -4 : player.direction === 'right' ? 4 : 0, eyeOffsetY = player.direction === 'up' ? -2 : player.direction === 'down' ? 2 : 0;
    ctx.fillRect(player.x + 14 * SCALE + eyeOffsetX, player.y + 10 * SCALE + eyeOffsetY, 4 * SCALE, 4 * SCALE); ctx.fillRect(player.x + 26 * SCALE + eyeOffsetX, player.y + 10 * SCALE + eyeOffsetY, 4 * SCALE, 4 * SCALE);
    ctx.fillStyle = '#4a6741'; ctx.fillRect(player.x + 6 * SCALE, player.y, size - 12 * SCALE, 8 * SCALE); ctx.fillRect(player.x + 10 * SCALE, player.y - 4 * SCALE, size - 20 * SCALE, 6 * SCALE);
    ctx.fillStyle = COLORS.highlight; let indicatorX = player.x + halfSize, indicatorY = player.y;
    switch (player.direction) { case 'up': indicatorY -= 10 * SCALE; break; case 'down': indicatorY += size + 2 * SCALE; break; case 'left': indicatorX -= 10 * SCALE; indicatorY += halfSize; break; case 'right': indicatorX += 10 * SCALE; indicatorY += halfSize; break; }
    ctx.beginPath(); ctx.arc(indicatorX, indicatorY, 4 * SCALE, 0, Math.PI * 2); ctx.fill();
}
function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height); drawBackground();
    for (let y = 0; y < CONFIG.VIEWPORT_HEIGHT; y++) { for (let x = 0; x < CONFIG.VIEWPORT_WIDTH; x++) { let type = 'grass'; if (x >= 1 && x <= 10 && y >= 1 && y <= 8) type = 'soil'; let crop = null; if (x >= 1 && x <= 10 && y >= 1 && y <= 8) { const fx = x - 1, fy = y - 1; if (gameState.farm[fy]?.[fx]) crop = gameState.farm[fy][fx].crop; } drawTile(x, y, type, crop); } }
    for (let x = 0; x < CONFIG.VIEWPORT_WIDTH; x++) { ctx.font = `${24 * SCALE}px Arial`; ctx.textAlign = 'center'; ctx.fillText('🪵', x * CONFIG.TILE_SIZE * SCALE + 24 * SCALE, 9 * CONFIG.TILE_SIZE * SCALE + 30 * SCALE); }
    drawPlayer(); drawParticles();
    ctx.font = `${48 * SCALE}px Arial`; ctx.textAlign = 'right'; ctx.fillText(SEASON_EMOJIS[gameState.season], canvas.width - 20, 50);
}

// ============================================
// MAIN LOOP
// ============================================
function gameLoop() { update(); render(); requestAnimationFrame(gameLoop); }

function init() {
    resizeCanvas(); initFarm(); loadGame(); updateUI();
    window.addEventListener('resize', resizeCanvas);
    document.getElementById('inventory-btn').onclick = openInventory;
    document.getElementById('shop-btn').onclick = openShop;
    document.getElementById('save-btn').onclick = saveGame;
    document.querySelectorAll('.close-btn').forEach(btn => btn.onclick = () => btn.closest('.modal').classList.add('hidden'));
    document.querySelectorAll('.modal').forEach(modal => modal.onclick = (e) => { if (e.target === modal) modal.classList.add('hidden'); });
    setInterval(gameTick, CONFIG.TICK_RATE);
    showNotification('🎮 欢迎来到星露谷网页版 v2.0! 🌾 使用 WASD 移动，空格交互');
    gameLoop();
}

window.onload = init;
