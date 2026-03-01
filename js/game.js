/**
 * Stardew Web - Game Engine v3.0
 * Beautiful Pixel Art Farm Game
 */

const CONFIG = {
    TILE_SIZE: 16,
    VIEWPORT_WIDTH: 20,
    VIEWPORT_HEIGHT: 15,
    PLAYER_SPEED: 2,
    TICK_RATE: 1000,
};

const COLORS = {
    grass1: '#7ec850', grass2: '#6ab83f', grass3: '#8ed462', grassDark: '#569130',
    soil1: '#8b6914', soil2: '#704f0f', soil3: '#a07d1a',
    path1: '#c9a86c', path2: '#b8956a', pathDark: '#8a6a42',
    water1: '#4fc3f7', water2: '#29b6f6',
    wood1: '#8b5a2b', wood2: '#6b4423', wood3: '#a06b3c',
    wallLight: '#d4a574', wallDark: '#b8896a',
    roof: '#c0392b', roofDark: '#a93226',
    uiGold: '#ffd700',
};

const CROPS = {
    carrot: { name: '胡萝卜', emoji: '🥕', growTime: 3, sellPrice: 30, seedCost: 10, season: 'spring' },
    tomato: { name: '番茄', emoji: '🍅', growTime: 4, sellPrice: 50, seedCost: 20, season: 'summer' },
    corn: { name: '玉米', emoji: '🌽', growTime: 5, sellPrice: 80, seedCost: 30, season: 'summer' },
    potato: { name: '土豆', emoji: '🥔', growTime: 3, sellPrice: 25, seedCost: 8, season: 'spring' },
    strawberry: { name: '草莓', emoji: '🍓', growTime: 4, sellPrice: 100, seedCost: 40, season: 'spring' },
    pumpkin: { name: '南瓜', emoji: '🎃', growTime: 6, sellPrice: 150, seedCost: 50, season: 'autumn' },
};

const SEASONS = ['spring', 'summer', 'autumn', 'winter'];
const SEASON_NAMES = { spring: '春季', summer: '夏季', autumn: '秋季', winter: '冬季' };

let gameState = {
    money: 500, day: 1, season: 'spring', year: 1, level: 1, exp: 0,
    energy: 100, maxEnergy: 100, timeOfDay: 8, weather: 'sunny',
    inventory: {}, farm: [], fish: [],
};

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
let SCALE = 3;

function initFarm() {
    gameState.farm = [];
    for (let y = 0; y < 10; y++) {
        gameState.farm[y] = [];
        for (let x = 0; x < 14; x++) {
            gameState.farm[y][x] = { type: 'soil', crop: null, watered: false };
        }
    }
}

function resizeCanvas() {
    const maxWidth = window.innerWidth - 32;
    const maxHeight = window.innerHeight - 150;
    const aspectRatio = CONFIG.VIEWPORT_WIDTH / CONFIG.VIEWPORT_HEIGHT;
    let width = maxWidth;
    let height = width / aspectRatio;
    if (height > maxHeight) { height = maxHeight; width = height * aspectRatio; }
    canvas.width = Math.floor(width);
    canvas.height = Math.floor(height);
    SCALE = Math.floor(Math.min(width / CONFIG.VIEWPORT_WIDTH / CONFIG.TILE_SIZE, height / CONFIG.VIEWPORT_HEIGHT / CONFIG.TILE_SIZE));
    SCALE = Math.max(SCALE, 2);
}

const player = { x: 7 * CONFIG.TILE_SIZE * SCALE, y: 6 * CONFIG.TILE_SIZE * SCALE, direction: 'down', moving: false, frame: 0 };

const keys = {};
document.addEventListener('keydown', (e) => { keys[e.key.toLowerCase()] = true; if (['w','a','s','d','arrow'].some(k => e.key.toLowerCase().startsWith(k))) e.preventDefault(); });
document.addEventListener('keyup', (e) => keys[e.key.toLowerCase()] = false);

function drawBackground() {
    let gradient;
    if (gameState.timeOfDay < 6 || gameState.timeOfDay > 20) {
        gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#0c1445'); gradient.addColorStop(0.5, '#1a237e'); gradient.addColorStop(1, '#283593');
    } else if (gameState.timeOfDay < 10) {
        gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#ffecd2'); gradient.addColorStop(0.5, '#fcb69f'); gradient.addColorStop(1, '#c8e6c9');
    } else if (gameState.timeOfDay < 16) {
        gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#87ceeb'); gradient.addColorStop(0.5, '#b4e4f7'); gradient.addColorStop(1, '#c8e6c9');
    } else {
        gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#ff9a8b'); gradient.addColorStop(0.5, '#ff6b6b'); gradient.addColorStop(1, '#c8e6c9');
    }
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Hills
    const hillColor = gameState.timeOfDay < 6 || gameState.timeOfDay > 20 ? '#1a237e' : gameState.timeOfDay < 10 ? '#81c784' : gameState.timeOfDay < 16 ? '#4caf50' : '#ff8a65';
    ctx.fillStyle = hillColor;
    ctx.beginPath(); ctx.moveTo(0, canvas.height * 0.3);
    for (let x = 0; x <= canvas.width; x += 20) {
        ctx.lineTo(x, canvas.height * 0.3 + Math.sin(x * 0.01) * 30 + Math.sin(x * 0.02) * 20);
    }
    ctx.lineTo(canvas.width, canvas.height); ctx.lineTo(0, canvas.height); ctx.closePath(); ctx.fill();
    
    // Sun/Moon
    ctx.font = `${60 * SCALE}px Arial`; ctx.textAlign = 'right';
    ctx.fillText(gameState.timeOfDay < 6 || gameState.timeOfDay > 20 ? '🌙' : '☀️', canvas.width - 50, 60);
}

function drawFarm() {
    const startX = 2 * CONFIG.TILE_SIZE * SCALE;
    const startY = 3 * CONFIG.TILE_SIZE * SCALE;
    
    // Grass background
    for (let y = 0; y < CONFIG.VIEWPORT_HEIGHT; y++) {
        for (let x = 0; x < CONFIG.VIEWPORT_WIDTH; x++) {
            const px = x * CONFIG.TILE_SIZE * SCALE;
            const py = y * CONFIG.TILE_SIZE * SCALE;
            ctx.fillStyle = [(x + y * 3) % 3 === 0 ? COLORS.grass1 : (x + y * 3) % 3 === 1 ? COLORS.grass2 : COLORS.grass3][0];
            ctx.fillRect(px, py, CONFIG.TILE_SIZE * SCALE, CONFIG.TILE_SIZE * SCALE);
            if ((x + y) % 2 === 0) { ctx.fillStyle = COLORS.grassDark; ctx.fillRect(px + 4 * SCALE, py + 8 * SCALE, SCALE, SCALE * 2); }
        }
    }
    
    // Farm plots
    for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 10; x++) {
            const px = startX + x * CONFIG.TILE_SIZE * SCALE;
            const py = startY + y * CONFIG.TILE_SIZE * SCALE;
            const tile = gameState.farm[y]?.[x];
            ctx.fillStyle = tile?.watered ? '#5c4a0f' : COLORS.soil1;
            ctx.fillRect(px, py, CONFIG.TILE_SIZE * SCALE, CONFIG.TILE_SIZE * SCALE);
            ctx.fillStyle = tile?.watered ? '#4a3a0a' : COLORS.soil2;
            for (let i = 0; i < 3; i++) ctx.fillRect(px + (i * 5 + 2) * SCALE, py + 4 * SCALE, 2 * SCALE, SCALE);
            if (tile?.crop) drawCrop(px, py, tile.crop);
        }
    }
    
    // Path
    ctx.fillStyle = COLORS.path1;
    ctx.fillRect(startX - CONFIG.TILE_SIZE * SCALE, startY, CONFIG.TILE_SIZE * SCALE * 12, CONFIG.TILE_SIZE * SCALE * 8);
    ctx.fillStyle = COLORS.path2;
    for (let i = 0; i < 12; i++) for (let j = 0; j < 8; j++) if ((i + j) % 2 === 0) ctx.fillRect(startX - CONFIG.TILE_SIZE * SCALE + i * CONFIG.TILE_SIZE * SCALE + 2 * SCALE, startY + j * CONFIG.TILE_SIZE * SCALE + 2 * SCALE, CONFIG.TILE_SIZE * SCALE - 4 * SCALE, CONFIG.TILE_SIZE * SCALE - 4 * SCALE);
    
    // Fence
    ctx.fillStyle = COLORS.wood1;
    ctx.fillRect(startX - CONFIG.TILE_SIZE * SCALE * 2, startY - CONFIG.TILE_SIZE * SCALE, CONFIG.TILE_SIZE * SCALE * 14, 3 * SCALE);
    ctx.fillRect(startX - CONFIG.TILE_SIZE * SCALE * 2, startY + CONFIG.TILE_SIZE * SCALE * 8, CONFIG.TILE_SIZE * SCALE * 14, 3 * SCALE);
    for (let i = 0; i <= 14; i++) ctx.fillRect(startX - CONFIG.TILE_SIZE * SCALE * 2 + i * CONFIG.TILE_SIZE * SCALE, startY - CONFIG.TILE_SIZE * SCALE, 4 * SCALE, CONFIG.TILE_SIZE * SCALE * 10);
    
    // Barn
    ctx.fillStyle = COLORS.roof; ctx.fillRect(startX + CONFIG.TILE_SIZE * SCALE * 11, startY - CONFIG.TILE_SIZE * SCALE * 2, CONFIG.TILE_SIZE * SCALE * 4, CONFIG.TILE_SIZE * SCALE * 2);
    ctx.fillStyle = COLORS.wallLight; ctx.fillRect(startX + CONFIG.TILE_SIZE * SCALE * 11, startY, CONFIG.TILE_SIZE * SCALE * 4, CONFIG.TILE_SIZE * SCALE * 3);
    ctx.fillStyle = COLORS.wood2; ctx.fillRect(startX + CONFIG.TILE_SIZE * SCALE * 12.5, startY + CONFIG.TILE_SIZE * SCALE * 0.5, CONFIG.TILE_SIZE * SCALE, CONFIG.TILE_SIZE * SCALE * 2.5);
    ctx.fillStyle = '#87ceeb'; ctx.fillRect(startX + CONFIG.TILE_SIZE * SCALE * 11.5, startY + CONFIG.TILE_SIZE * SCALE, CONFIG.TILE_SIZE * SCALE, CONFIG.TILE_SIZE * SCALE);
    ctx.font = `${CONFIG.TILE_SIZE * SCALE * 1.5}px Arial`; ctx.textAlign = 'center'; ctx.fillText('🏚️', startX + CONFIG.TILE_SIZE * SCALE * 13, startY - CONFIG.TILE_SIZE * SCALE * 0.5);
    
    // Well
    ctx.fillStyle = COLORS.wood2; ctx.fillRect(startX - CONFIG.TILE_SIZE * SCALE * 2, startY + CONFIG.TILE_SIZE * SCALE * 6, CONFIG.TILE_SIZE * SCALE * 1.5, CONFIG.TILE_SIZE * SCALE * 1.5);
    ctx.fillStyle = COLORS.wood1; ctx.fillRect(startX - CONFIG.TILE_SIZE * SCALE * 2.5, startY + CONFIG.TILE_SIZE * SCALE * 5.5, CONFIG.TILE_SIZE * SCALE * 2, CONFIG.TILE_SIZE * SCALE);
    ctx.fillStyle = COLORS.water1; ctx.fillRect(startX - CONFIG.TILE_SIZE * SCALE * 1.8, startY + CONFIG.TILE_SIZE * SCALE * 7, CONFIG.TILE_SIZE * SCALE * 0.8, CONFIG.TILE_SIZE * SCALE * 0.5);
    ctx.font = `${CONFIG.TILE_SIZE * SCALE * 0.8}px Arial`; ctx.fillText('🪣', startX - CONFIG.TILE_SIZE * SCALE * 1.2, startY + CONFIG.TILE_SIZE * SCALE * 6.2);
}

function drawCrop(x, y, crop) {
    const cropData = CROPS[crop.type];
    const gp = crop.stage / cropData.growTime;
    if (gp >= 1) {
        ctx.fillStyle = 'rgba(255, 215, 0, 0.3)'; ctx.fillRect(x, y, CONFIG.TILE_SIZE * SCALE, CONFIG.TILE_SIZE * SCALE);
        ctx.font = `${CONFIG.TILE_SIZE * SCALE * 0.9}px Arial`; ctx.textAlign = 'center'; ctx.fillText(cropData.emoji, x + CONFIG.TILE_SIZE * SCALE / 2, y + CONFIG.TILE_SIZE * SCALE / 2);
    } else if (gp > 0) {
        ctx.font = `${CONFIG.TILE_SIZE * SCALE * (0.5 + gp * 0.4)}px Arial`; ctx.textAlign = 'center'; ctx.fillText('🌱', x + CONFIG.TILE_SIZE * SCALE / 2, y + CONFIG.TILE_SIZE * SCALE / 2);
    } else {
        ctx.font = `${CONFIG.TILE_SIZE * SCALE * 0.5}px Arial`; ctx.textAlign = 'center'; ctx.fillText('🟤', x + CONFIG.TILE_SIZE * SCALE / 2, y + CONFIG.TILE_SIZE * SCALE / 2);
    }
}

function drawPlayer() {
    const x = player.x, y = player.y, size = CONFIG.TILE_SIZE * SCALE;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'; ctx.beginPath(); ctx.ellipse(x + size / 2, y + size - 2 * SCALE, size * 0.4, 6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#3498db'; ctx.fillRect(x + 4 * SCALE, y + 8 * SCALE, size - 8 * SCALE, size - 14 * SCALE);
    ctx.fillStyle = '#2c3e50'; ctx.fillRect(x + 5 * SCALE, y + size - 8 * SCALE, 3 * SCALE, 8 * SCALE); ctx.fillRect(x + size - 8 * SCALE, y + size - 8 * SCALE, 3 * SCALE, 8 * SCALE);
    ctx.fillStyle = '#f4c7a1'; ctx.fillRect(x + 4 * SCALE, y + 2 * SCALE, size - 8 * SCALE, 8 * SCALE);
    ctx.fillStyle = '#5d4037'; ctx.fillRect(x + 4 * SCALE, y, size - 8 * SCALE, 4 * SCALE); ctx.fillRect(x + 2 * SCALE, y + 2 * SCALE, 2 * SCALE, 4 * SCALE); ctx.fillRect(x + size - 4 * SCALE, y + 2 * SCALE, 2 * SCALE, 4 * SCALE);
    ctx.fillStyle = '#2c3e50'; const ey = y + 5 * SCALE;
    if (player.direction !== 'up') { if (player.direction === 'down') { ctx.fillRect(x + 5 * SCALE, ey, 2 * SCALE, 2 * SCALE); ctx.fillRect(x + size - 7 * SCALE, ey, 2 * SCALE, 2 * SCALE); } else if (player.direction === 'left') ctx.fillRect(x + 4 * SCALE, ey, 2 * SCALE, 2 * SCALE); else ctx.fillRect(x + size - 6 * SCALE, ey, 2 * SCALE, 2 * SCALE); }
    ctx.fillStyle = '#27ae60'; ctx.fillRect(x + 3 * SCALE, y - 2 * SCALE, size - 6 * SCALE, 3 * SCALE);
}

function drawUI() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'; ctx.fillRect(0, 0, canvas.width, 50);
    ctx.font = `${18 * SCALE}px 'Pixelify Sans', Arial`; ctx.textAlign = 'left';
    ctx.fillStyle = COLORS.uiGold; ctx.fillText(`💰 ${gameState.money}`, 20, 35);
    ctx.fillStyle = '#fff'; ctx.fillText(`📅 第${gameState.day}天`, 150, 35);
    const se = { spring: '🌸', summer: '☀️', autumn: '🍂', winter: '❄️' }; ctx.fillText(`${se[gameState.season]} ${SEASON_NAMES[gameState.season]}`, 280, 35);
    ctx.fillStyle = '#9b59b6'; ctx.fillText(`⭐ Lv.${gameState.level}`, 420, 35);
    ctx.fillStyle = '#333'; ctx.fillRect(550, 15, 150, 20);
    ctx.fillStyle = gameState.energy > 30 ? '#2ecc71' : '#e74c3c'; ctx.fillRect(552, 17, 146 * gameState.energy / gameState.maxEnergy, 16);
    ctx.fillStyle = '#fff'; ctx.font = `${12 * SCALE}px Arial`; ctx.fillText(`⚡ ${Math.floor(gameState.energy)}/${gameState.maxEnergy}`, 620, 32);
    ctx.fillStyle = gameState.timeOfDay > 20 || gameState.timeOfDay < 6 ? '#9b59b6' : '#f39c12'; ctx.font = `${16 * SCALE}px Arial`; ctx.textAlign = 'right'; ctx.fillText(`🕐 ${Math.floor(gameState.timeOfDay)}:00`, canvas.width - 20, 35);
}

function update() {
    let dx = 0, dy = 0;
    if (keys['w'] || keys['arrowup']) { dy = -CONFIG.PLAYER_SPEED; player.direction = 'up'; }
    if (keys['s'] || keys['arrowdown']) { dy = CONFIG.PLAYER_SPEED; player.direction = 'down'; }
    if (keys['a'] || keys['arrowleft']) { dx = -CONFIG.PLAYER_SPEED; player.direction = 'left'; }
    if (keys['d'] || keys['arrowright']) { dx = CONFIG.PLAYER_SPEED; player.direction = 'right'; }
    player.moving = dx !== 0 || dy !== 0;
    if (player.moving && gameState.energy > 0) {
        const nx = player.x + dx, ny = player.y + dy;
        const (nx >= CONFIG.TILE_SIZE * SCALE && nx < canvas.width - CONFIG.TILE_SIZE * SCALE * 2) && (player.x = nx);
        const (ny >= CONFIG.TILE_SIZE * SCALE * 2 && ny < canvas.height - CONFIG.TILE_SIZE * SCALE * 2) && (player.y = ny);
        Math.random() < 0.03 && (gameState.energy -= 0.5);
    }
    player.frame = player.moving ? (player.frame + 0.15) % 4 : 0;
    if (Math.random() < 0.02) { gameState.timeOfDay += 0.1; if (gameState.timeOfDay >= 24) { gameState.timeOfDay = 6; gameState.day++; gameState.energy = gameState.maxEnergy; if (gameState.day % 28 === 0) { const idx = SEASONS.indexOf(gameState.season); gameState.season = SEASONS[(idx + 1) % 4]; if (gameState.season === 'spring') gameState.year++; showNotification(`🌍 进入${SEASON_NAMES[gameState.season]}!`); } gameState.farm.forEach(r => r.forEach(t => { if (t.crop && t.watered) t.crop.stage++; })); gameState.farm.forEach(r => r.forEach(t => t.watered = false)); showNotification(`📅 第${gameState.day}天 - 体力已恢复!`); } }
}

function interact() {
    if (gameState.energy <= 0) { showNotification('💤 累了，去睡觉吧！'); return; }
    const startX = 2 * CONFIG.TILE_SIZE * SCALE, startY = 3 * CONFIG.TILE_SIZE * SCALE, ts = CONFIG.TILE_SIZE * SCALE;
    let tx = player.x + ts / 2, ty = player.y + ts / 2;
    player.direction === 'up' ? ty -= ts : player.direction === 'down' ? ty += ts : player.direction === 'left' ? tx -= ts : tx += ts;
    const fx = Math.floor((tx - startX) / ts), fy = Math.floor((ty - startY) / ts);
    if (fx >= 0 && fx < 10 && fy >= 0 && fy < 8) {
        const tile = gameState.farm[fy][fx];
        if (tile.crop) { if (tile.crop.stage >= CROPS[tile.crop.type].growTime) { const c = CROPS[tile.crop.type]; addItem(c, 1, 'crop'); gameState.money += c.sellPrice; showNotification(`🎉 收获 ${c.emoji} ${c.name}! +$${c.sellPrice}`); gameState.energy -= 5; tile.crop = null; tile.watered = false; } else if (!tile.watered && gameState.energy >= 3) { tile.watered = true; gameState.energy -= 3; showNotification('💧 浇水成功!'); } else showNotification('⏳ 还需要时间'); } else { const s = getSelectedSeed(); if (s && gameState.inventory[s]?.seeds > 0 && gameState.energy >= 5) { gameState.inventory[s].seeds--; tile.crop = { type: s, stage: 0 }; gameState.energy -= 5; showNotification(`🌱 种下 ${CROPS[s].emoji}`); } else if (!s) showNotification('🎒 先选种子'); else showNotification('❌ 没种子'); } }
    }
}

document.addEventListener('keydown', (e) => { if (e.key === ' ' || e.key === 'e') { e.preventDefault(); interact(); } });
canvas.addEventListener('click', interact);

let selectedSeed = null;
function addItem(id, amt, t = 'crop') { if (!gameState.inventory[id]) gameState.inventory[id] = { seeds: 0, crops: 0 }; gameState.inventory[id][t === 'seed' ? 'seeds' : 'crops'] += amt; updateUI(); }
function getSelectedSeed() { return selectedSeed; }
function selectSeed(id) { selectedSeed = id; showNotification(`🎯 选择: ${CROPS[id].emoji}`); }

function openInventory() {
    const p = document.getElementById('inventory-panel'), g = document.getElementById('inventory-grid'); g.innerHTML = '';
    Object.entries(gameState.inventory).forEach(([id, inv]) => { if (inv.seeds > 0) { const c = CROPS[id], it = document.createElement('div'); it.className = 'inventory-slot'; it.innerHTML = `<span class="item-icon">🌱</span><span class="item-name">${c.name}种子</span><span class="item-count">x${inv.seeds}</span>`; it.onclick = () => selectSeed(id); if (selectedSeed === id) it.style.borderColor = '#ffd700'; g.appendChild(it); } });
    Object.entries(gameState.inventory).forEach(([id, inv]) => { if (inv.crops > 0) { const c = CROPS[id], it = document.createElement('div'); it.className = 'inventory-slot'; it.innerHTML = `<span class="item-icon">${c.emoji}</span><span class="item-name">${c.name}</span><span class="item-count">x${inv.crops}</span>`; g.appendChild(it); } });
    p.classList.remove('hidden');
}

function openShop() {
    const p = document.getElementById('shop-panel'), g = document.getElementById('shop-grid'); g.innerHTML = '';
    Object.entries(CROPS).forEach(([id, c]) => { const cb = gameState.season === c.season, it = document.createElement('div'); it.className = 'shop-item'; it.innerHTML = `<span class="item-icon">🌱</span><span class="item-name">${c.name}</span><span class="item-price">💰${c.seedCost}</span><span class="sell-price">卖:💰${c.sellPrice}</span>`; cb ? it.onclick = () => buySeed(id) : (it.style.opacity = '0.5', it.style.cursor = 'not-allowed'); g.appendChild(it); });
    const sh = document.createElement('div'); sh.style = 'grid-column:1/-1;text-align:center;color:#fff;padding:10px;border-top:2px solid #3b5dc9;'; sh.innerHTML = '<h3>出售作物</h3>'; g.appendChild(sh);
    Object.entries(gameState.inventory).forEach(([id, inv]) => { if (inv.crops > 0) { const c = CROPS[id], it = document.createElement('div'); it.className = 'shop-item'; it.innerHTML = `<span class="item-icon">${c.emoji}</span><span class="item-name">${c.name}</span><span class="item-count">x${inv.crops}</span><span class="sell-price">💰${c.sellPrice}</span>`; it.onclick = () => { gameState.inventory[id].crops--; gameState.money += c.sellPrice; showNotification(`💰 卖出 +$${c.sellPrice}`); openShop(); }; g.appendChild(it); } });
    p.classList.remove('hidden');
}

function buySeed(id) { const c = CROPS[id]; if (gameState.money >= c.seedCost) { gameState.money -= c.seedCost; addItem(id, 1, 'seed'); showNotification(`🛒 买了 ${c.emoji} x1`); openShop(); } else showNotification('💸 钱不够!'); }

function saveGame() { localStorage.setItem('stardew-v3', JSON.stringify(gameState)); showNotification('💾 已保存'); }
function loadGame() { const d = localStorage.getItem('stardew-v3'); if (d) { gameState = { ...gameState, ...JSON.parse(d) }; showNotification('📂 已加载'); } }
function showNotification(msg) { const a = document.getElementById('notification-area'), n = document.createElement('div'); n.className = 'notification'; n.textContent = msg; a.appendChild(n); setTimeout(() => n.remove(), 2500); }
function updateUI() { document.getElementById('money-display').textContent = gameState.money; document.getElementById('day-display').textContent = `第${gameState.day}天`; document.getElementById('season-display').textContent = { spring: '🌸', summer: '☀️', autumn: '🍂', winter: '❄️' }[gameState.season] + SEASON_NAMES[gameState.season]; document.getElementById('level-display').textContent = `Lv.${gameState.level}`; }

function render() { ctx.clearRect(0, 0, canvas.width, canvas.height); drawBackground(); drawFarm(); drawPlayer(); drawUI(); }
function gameLoop() { update(); render(); requestAnimationFrame(gameLoop); }
function init() { resizeCanvas(); initFarm(); loadGame(); updateUI(); window.addEventListener('resize', resizeCanvas); document.getElementById('inventory-btn').onclick = openInventory; document.getElementById('shop-btn').onclick = openShop; document.getElementById('save-btn').onclick = saveGame; document.querySelectorAll('.close-btn').forEach(b => b.onclick = () => b.closest('.modal').classList.add('hidden')); document.querySelectorAll('.modal').forEach(m => m.onclick = (e) => { if (e.target === m) m.classList.add('hidden'); }); showNotification('🎮 欢迎! WASD移动, 空格交互'); gameLoop(); }
window.onload = init;
