/**
 * Stardew Web - Game Engine
 * A pixel-art farming simulation game
 */

// ============================================
// CONFIGURATION
// ============================================
const CONFIG = {
    TILE_SIZE: 48,
    CHUNK_SIZE: 16,
    VIEWPORT_WIDTH: 15,
    VIEWPORT_HEIGHT: 11,
    PLAYER_SPEED: 4,
    ANIMATION_SPEED: 150,
    TICK_RATE: 1000, // 1 second per game tick
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
    sky: '#87ceeb',
    highlight: 'rgba(255, 255, 255, 0.3)',
};

// ============================================
// GAME DATA
// ============================================
const CROPS = {
    carrot: { name: '胡萝卜', emoji: '🥕', seedEmoji: '🌱', growTime: 3, sellPrice: 30, seedCost: 10, season: ['spring'] },
    tomato: { name: '番茄', emoji: '🍅', seedEmoji: '🌱', growTime: 4, sellPrice: 50, seedCost: 20, season: ['summer'] },
    corn: { name: '玉米', emoji: '🌽', seedEmoji: '🌱', growTime: 5, sellPrice: 80, seedCost: 30, season: ['summer', 'autumn'] },
    potato: { name: '土豆', emoji: '🥔', seedEmoji: '🌱', growTime: 3, sellPrice: 25, seedCost: 8, season: ['spring', 'autumn'] },
    strawberry: { name: '草莓', emoji: '🍓', seedEmoji: '🌱', growTime: 4, sellPrice: 100, seedCost: 40, season: ['spring'] },
    pumpkin: { name: '南瓜', emoji: '🎃', seedEmoji: '🌱', growTime: 6, sellPrice: 150, seedCost: 50, season: ['autumn'] },
    eggplant: { name: '茄子', emoji: '🍆', seedEmoji: '🌱', growTime: 5, sellPrice: 70, seedCost: 25, season: ['summer'] },
    flower: { name: '花朵', emoji: '🌻', seedEmoji: '🌱', growTime: 3, sellPrice: 40, seedCost: 15, season: ['spring', 'summer'] },
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
    inventory: {},
    farm: [],
    shopItems: [],
};

// Initialize farm grid
function initFarm() {
    gameState.farm = [];
    for (let y = 0; y < 8; y++) {
        gameState.farm[y] = [];
        for (let x = 0; x < 10; x++) {
            gameState.farm[y][x] = {
                type: 'soil',
                crop: null,
                watered: false,
                hydrated: false
            };
        }
    }
}

// ============================================
// CANVAS & RENDERING
// ============================================
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    const maxWidth = window.innerWidth - 32;
    const maxHeight = window.innerHeight - 150;
    
    const aspectRatio = CONFIG.VIEWPORT_WIDTH / CONFIG.VIEWPORT_HEIGHT;
    
    let width = maxWidth;
    let height = width / aspectRatio;
    
    if (height > maxHeight) {
        height = maxHeight;
        width = height * aspectRatio;
    }
    
    canvas.width = Math.floor(width);
    canvas.height = Math.floor(height);
    
    CONFIG.SCALE = Math.floor(width / CONFIG.VIEWPORT_WIDTH / CONFIG.TILE_SIZE);
}

let SCALE = 4;

// ============================================
// PLAYER
// ============================================
const player = {
    x: 5 * CONFIG.TILE_SIZE,
    y: 4 * CONFIG.TILE_SIZE,
    direction: 'down',
    moving: false,
    frame: 0,
};

// ============================================
// INPUT HANDLING
// ============================================
const keys = {};

document.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;
    if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(e.key.toLowerCase())) {
        e.preventDefault();
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
});

// Touch controls for mobile
let touchStartX, touchStartY;
canvas.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
});

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
});

canvas.addEventListener('touchend', (e) => {
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const dx = touchEndX - touchStartX;
    const dy = touchEndY - touchStartY;
    
    if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 30) keys['d'] = true;
        else if (dx < -30) keys['a'] = true;
    } else {
        if (dy > 30) keys['s'] = true;
        else if (dy < -30) keys['w'] = true;
    }
    
    setTimeout(() => {
        keys['w'] = false;
        keys['a'] = false;
        keys['s'] = false;
        keys['d'] = false;
    }, 200);
});

// ============================================
// GAME LOGIC
// ============================================
function update() {
    handleMovement();
    updateAnimation();
}

function handleMovement() {
    let dx = 0, dy = 0;
    
    if (keys['w'] || keys['arrowup']) { dy = -CONFIG.PLAYER_SPEED; player.direction = 'up'; }
    if (keys['s'] || keys['arrowdown']) { dy = CONFIG.PLAYER_SPEED; player.direction = 'down'; }
    if (keys['a'] || keys['arrowleft']) { dx = -CONFIG.PLAYER_SPEED; player.direction = 'left'; }
    if (keys['d'] || keys['arrowright']) { dx = CONFIG.PLAYER_SPEED; player.direction = 'right'; }
    
    player.moving = dx !== 0 || dy !== 0;
    
    if (player.moving) {
        const newX = player.x + dx;
        const newY = player.y + dy;
        
        // Boundary check
        if (newX >= 0 && newX < canvas.width - CONFIG.TILE_SIZE * SCALE) {
            player.x = newX;
        }
        if (newY >= 0 && newY < canvas.height - CONFIG.TILE_SIZE * SCALE) {
            player.y = newY;
        }
    }
}

function updateAnimation() {
    if (player.moving) {
        player.frame = (player.frame + 0.2) % 4;
    } else {
        player.frame = 0;
    }
}

// ============================================
// FARMING
// ============================================
function getFarmTile(px, py) {
    const tileX = Math.floor(px / CONFIG.TILE_SIZE / SCALE);
    const tileY = Math.floor(py / CONFIG.TILE_SIZE / SCALE);
    
    if (tileX >= 0 && tileX < 10 && tileY >= 0 && tileY < 8) {
        return { tile: gameState.farm[tileY][tileX], x: tileX, y: tileY };
    }
    return null;
}

function interact() {
    // Calculate the tile the player is facing
    let targetX = player.x;
    let targetY = player.y;
    
    switch (player.direction) {
        case 'up': targetY -= CONFIG.TILE_SIZE * SCALE; break;
        case 'down': targetY += CONFIG.TILE_SIZE * SCALE; break;
        case 'left': targetX -= CONFIG.TILE_SIZE * SCALE; break;
        case 'right': targetX += CONFIG.TILE_SIZE * SCALE; break;
    }
    
    const farmData = getFarmTile(targetX + CONFIG.TILE_SIZE * SCALE / 2, targetY + CONFIG.TILE_SIZE * SCALE / 2);
    
    if (farmData && farmData.tile) {
        const tile = farmData.tile;
        
        if (tile.crop) {
            // Harvest if ready
            if (tile.crop.stage >= CROPS[tile.crop.type].growTime) {
                const crop = CROPS[tile.crop.type];
                addItem(tile.crop.type, 1, 'crop');
                addExp(10);
                showNotification(`收获了 ${crop.emoji} ${crop.name}!`);
                tile.crop = null;
                tile.watered = false;
            } else {
                // Water the crop
                if (!tile.watered) {
                    tile.watered = true;
                    tile.hydrated = true;
                    showNotification('💧 浇水成功');
                } else {
                    showNotification('这个作物还需要时间生长', 'warning');
                }
            }
        } else if (tile.type === 'soil') {
            // Plant if has seeds
            const selectedSeed = getSelectedSeed();
            if (selectedSeed) {
                const crop = CROPS[selectedSeed];
                if (crop.season.includes(gameState.season)) {
                    if (gameState.inventory[selectedSeed] && gameState.inventory[selectedSeed].seeds > 0) {
                        gameState.inventory[selectedSeed].seeds--;
                        tile.crop = { type: selectedSeed, stage: 0, planted: gameState.day };
                        showNotification(`种下了 ${crop.emoji} ${crop.name}`);
                        add                    } else {
Exp(5);
                        showNotification('没有种子了，去商店买吧', 'warning');
                    }
                } else {
                    showNotification('这个季节不能种这个作物', 'warning');
                }
            } else {
                showNotification('请先在背包选择要种的种子', 'warning');
            }
        }
    }
}

// Space key to interact
document.addEventListener('keydown', (e) => {
    if (e.key === ' ' || e.key === 'e') {
        e.preventDefault();
        interact();
    }
});

// Click/tap to interact
canvas.addEventListener('click', interact);

// ============================================
// INVENTORY SYSTEM
// ============================================
let selectedSeed = null;

function addItem(itemId, amount, type = 'crop') {
    if (!gameState.inventory[itemId]) {
        gameState.inventory[itemId] = { seeds: 0, crops: 0 };
    }
    gameState.inventory[itemId][type === 'seed' ? 'seeds' : 'crops'] += amount;
    updateUI();
}

function getSelectedSeed() {
    return selectedSeed;
}

function selectSeed(itemId) {
    selectedSeed = itemId;
    showNotification(`已选择: ${CROPS[itemId]?.emoji || itemId}`);
}

// ============================================
// SHOP SYSTEM
// ============================================
function openShop() {
    const panel = document.getElementById('shop-panel');
    const grid = document.getElementById('shop-grid');
    
    grid.innerHTML = '';
    
    Object.entries(CROPS).forEach(([id, crop]) => {
        const canBuy = crop.season.includes(gameState.season);
        const item = document.createElement('div');
        item.className = 'shop-item';
        item.innerHTML = `
            <span class="item-icon">${crop.seedEmoji}</span>
            <span class="item-name">${crop.name}种子</span>
            <span class="item-price">💰${crop.seedCost}</span>
            ${canBuy ? `<span class="sell-price">卖出: 💰${crop.sellPrice}</span>` : '<span style="color:#ef7d57">不当季</span>'}
        `;
        
        if (canBuy) {
            item.onclick = () => buySeed(id);
        } else {
            item.style.opacity = '0.5';
            item.style.cursor = 'not-allowed';
        }
        
        grid.appendChild(item);
    });
    
    // Add sell section
    const sellHeader = document.createElement('div');
    sellHeader.style.gridColumn = '1 / -1';
    sellHeader.style.textAlign = 'center';
    sellHeader.style.color = '#f4f4f4';
    sellHeader.style.padding = '10px';
    sellHeader.style.borderTop = '2px solid #3b5dc9';
    sellHeader.style.marginTop = '10px';
    sellHeader.innerHTML = '<h3>出售作物</h3>';
    grid.appendChild(sellHeader);
    
    // Show sellable crops
    Object.entries(gameState.inventory).forEach(([id, inv]) => {
        if (inv.crops > 0) {
            const crop = CROPS[id];
            const item = document.createElement('div');
            item.className = 'shop-item';
            item.innerHTML = `
                <span class="item-icon">${crop.emoji}</span>
                <span class="item-name">${crop.name}</span>
                <span class="item-count">x${inv.crops}</span>
                <span class="sell-price">卖出: 💰${crop.sellPrice}</span>
            `;
            item.onclick = () => sellCrop(id);
            grid.appendChild(item);
        }
    });
    
    panel.classList.remove('hidden');
}

function buySeed(seedId) {
    const crop = CROPS[seedId];
    if (gameState.money >= crop.seedCost) {
        gameState.money -= crop.seedCost;
        addItem(seedId, 1, 'seed');
        showNotification(`购买了 ${crop.emoji} ${crop.name}种子 x1`);
        openShop(); // Refresh
    } else {
        showNotification('钱不够!', 'error');
    }
}

function sellCrop(cropId) {
    const crop = CROPS[cropId];
    if (gameState.inventory[cropId].crops > 0) {
        gameState.inventory[cropId].crops--;
        gameState.money += crop.sellPrice;
        showNotification(`卖出了 ${crop.emoji} ${crop.name}, 获得 💰${crop.sellPrice}`);
        openShop(); // Refresh
    }
}

// ============================================
// INVENTORY PANEL
// ============================================
function openInventory() {
    const panel = document.getElementById('inventory-panel');
    const grid = document.getElementById('inventory-grid');
    
    grid.innerHTML = '';
    
    // Seeds section
    Object.entries(gameState.inventory).forEach(([id, inv]) => {
        if (inv.seeds > 0) {
            const crop = CROPS[id];
            const item = document.createElement('div');
            item.className = 'inventory-slot';
            item.innerHTML = `
                <span class="item-icon">${crop.seedEmoji}</span>
                <span class="item-name">${crop.name}种子</span>
                <span class="item-count">x${inv.seeds}</span>
            `;
            item.onclick = () => selectSeed(id);
            if (selectedSeed === id) {
                item.style.borderColor = '#ffd700';
                item.style.boxShadow = '0 0 10px rgba(255, 215, 0, 0.5)';
            }
            grid.appendChild(item);
        }
    });
    
    // Crops section
    Object.entries(gameState.inventory).forEach(([id, inv]) => {
        if (inv.crops > 0) {
            const crop = CROPS[id];
            const item = document.createElement('div');
            item.className = 'inventory-slot';
            item.innerHTML = `
                <span class="item-icon">${crop.emoji}</span>
                <span class="item-name">${crop.name}</span>
                <span class="item-count">x${inv.crops}</span>
            `;
            grid.appendChild(item);
        }
    });
    
    if (grid.children.length === 0) {
        grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:#a0a0a0;padding:20px;">背包是空的</div>';
    }
    
    panel.classList.remove('hidden');
}

// ============================================
// UI UPDATES
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
        gameState.level++;
        gameState.exp -= expNeeded;
        showNotification(`🎉 升级了! 现在是 Lv.${gameState.level}`, 'success');
    }
}

// ============================================
// GAME TICK (Day/Night)
// ============================================
let tickCount = 0;

function gameTick() {
    tickCount++;
    
    // Grow crops every game tick (simplified - real game would be per day)
    gameState.farm.forEach(row => {
        row.forEach(tile => {
            if (tile.crop && tile.watered) {
                tile.crop.stage++;
            }
        });
    });
    
    // Day progression (every 60 seconds = 1 day)
    if (tickCount % 60 === 0) {
        gameState.day++;
        
        // Season change
        if (gameState.day % 28 === 0) {
            const seasonIndex = SEASONS.indexOf(gameState.season);
            gameState.season = SEASONS[(seasonIndex + 1) % 4];
            if (gameState.season === 'spring') gameState.year++;
            showNotification(`🌍 进入${SEASON_NAMES[gameState.season]}!`);
            
            // Reset watered status each season
            gameState.farm.forEach(row => {
                row.forEach(tile => {
                    tile.watered = false;
                });
            });
        }
        
        // Daily water reset
        gameState.farm.forEach(row => {
            row.forEach(tile => {
                tile.watered = false;
            });
        });
        
        updateUI();
    }
}

// ============================================
// SAVE/LOAD
// ============================================
function saveGame() {
    const saveData = JSON.stringify(gameState);
    localStorage.setItem('stardew-web-save', saveData);
    showNotification('💾 游戏已保存');
}

function loadGame() {
    const saveData = localStorage.getItem('stardew-web-save');
    if (saveData) {
        try {
            const loaded = JSON.parse(saveData);
            gameState = { ...gameState, ...loaded };
            showNotification('📂 游戏已加载');
        } catch (e) {
            console.error('Load failed:', e);
        }
    }
}

// ============================================
// RENDERING
// ============================================
function drawPixelRect(x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
}

function drawTile(tx, ty, type, crop = null) {
    const x = tx * CONFIG.TILE_SIZE * SCALE;
    const y = ty * CONFIG.TILE_SIZE * SCALE;
    const size = CONFIG.TILE_SIZE * SCALE;
    const halfSize = size / 2;
    
    // Draw base tile
    switch (type) {
        case 'grass':
            drawPixelRect(x, y, size, size, COLORS.grass);
            drawPixelRect(x, y, halfSize, halfSize, COLORS.grassDark);
            drawPixelRect(x + halfSize, y + halfSize, halfSize, halfSize, COLORS.grassDark);
            break;
        case 'soil':
            drawPixelRect(x, y, size, size, COLORS.soil);
            drawPixelRect(x + 4, y + 4, size - 8, size - 8, COLORS.soilDark);
            // Furrows
            ctx.fillStyle = COLORS.soilDark;
            for (let i = 0; i < 3; i++) {
                ctx.fillRect(x + 6 + i * 14, y + 8, 6, size - 16);
            }
            break;
    }
    
    // Draw water overlay
    if (crop?.stage >= CROPS[crop.type].growTime) {
        // Ready to harvest - golden glow
        ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
        ctx.fillRect(x, y, size, size);
    } else if (crop) {
        // Growing crop
        const cropData = CROPS[crop.type];
        const growthPercent = crop.stage / cropData.growTime;
        
        // Draw water indicator
        if (crop.stage > 0) {
            ctx.font = `${16 * SCALE}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText('💧', x + halfSize, y + halfSize - 8 * SCALE);
        }
        
        // Draw crop emoji based on growth
        ctx.font = `${(16 + growthPercent * 16) * SCALE}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const emoji = growthPercent >= 1 ? cropData.emoji : cropData.seedEmoji;
        ctx.fillText(emoji, x + halfSize, y + halfSize + 4 * SCALE);
    }
}

function drawPlayer() {
    const size = CONFIG.TILE_SIZE * SCALE;
    const halfSize = size / 2;
    
    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(player.x + halfSize, player.y + size - 4 * SCALE, halfSize * 0.6, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Body
    ctx.fillStyle = '#5c8a4d';
    ctx.fillRect(player.x + 8 * SCALE, player.y + 16 * SCALE, size - 16 * SCALE, size - 20 * SCALE);
    
    // Head
    ctx.fillStyle = '#f4c7a1';
    ctx.fillRect(player.x + 10 * SCALE, player.y + 4 * SCALE, size - 20 * SCALE, 14 * SCALE);
    
    // Eyes
    ctx.fillStyle = '#333';
    const eyeOffsetX = player.direction === 'left' ? -4 : player.direction === 'right' ? 4 : 0;
    const eyeOffsetY = player.direction === 'up' ? -2 : player.direction === 'down' ? 2 : 0;
    ctx.fillRect(player.x + 14 * SCALE + eyeOffsetX, player.y + 10 * SCALE + eyeOffsetY, 4 * SCALE, 4 * SCALE);
    ctx.fillRect(player.x + 26 * SCALE + eyeOffsetX, player.y + 10 * SCALE + eyeOffsetY, 4 * SCALE, 4 * SCALE);
    
    // Hat
    ctx.fillStyle = '#4a6741';
    ctx.fillRect(player.x + 6 * SCALE, player.y, size - 12 * SCALE, 8 * SCALE);
    ctx.fillRect(player.x + 10 * SCALE, player.y - 4 * SCALE, size - 20 * SCALE, 6 * SCALE);
    
    // Direction indicator (for interaction)
    ctx.fillStyle = COLORS.highlight;
    let indicatorX = player.x + halfSize;
    let indicatorY = player.y;
    switch (player.direction) {
        case 'up': indicatorY -= 10 * SCALE; break;
        case 'down': indicatorY += size + 2 * SCALE; break;
        case 'left': indicatorX -= 10 * SCALE; indicatorY += halfSize; break;
        case 'right': indicatorX += 10 * SCALE; indicatorY += halfSize; break;
    }
    ctx.beginPath();
    ctx.arc(indicatorX, indicatorY, 4 * SCALE, 0, Math.PI * 2);
    ctx.fill();
}

function drawBackground() {
    // Sky gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    
    switch (gameState.season) {
        case 'spring':
            gradient.addColorStop(0, '#87ceeb');
            gradient.addColorStop(1, '#98d9a8');
            break;
        case 'summer':
            gradient.addColorStop(0, '#74b9ff');
            gradient.addColorStop(1, '#ffeaa7');
            break;
        case 'autumn':
            gradient.addColorStop(0, '#fd9644');
            gradient.addColorStop(1, '#f7b731');
            break;
        case 'winter':
            gradient.addColorStop(0, '#a4b0be');
            gradient.addColorStop(1, '#dfe6e9');
            break;
    }
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function render() {
    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Background
    drawBackground();
    
    // Draw farm grid
    for (let y = 0; y < CONFIG.VIEWPORT_HEIGHT; y++) {
        for (let x = 0; x < CONFIG.VIEWPORT_WIDTH; x++) {
            // Determine tile type
            let type = 'grass';
            if (x >= 1 && x <= 10 && y >= 1 && y <= 8) {
                type = 'soil';
            }
            
            // Path around farm
            if ((x === 0 || x === 11) && y >= 0 && y <= 9) {
                type = 'path';
            }
            
            // Get crop data
            let crop = null;
            if (x >= 1 && x <= 10 && y >= 1 && y <= 8) {
                const farmX = x - 1;
                const farmY = y - 1;
                if (gameState.farm[farmY] && gameState.farm[farmY][farmX]) {
                    crop = gameState.farm[farmY][farmX].crop;
                }
            }
            
            drawTile(x, y, type, crop);
        }
    }
    
    // Draw fence
    const fenceY = 9 * CONFIG.TILE_SIZE * SCALE;
    for (let x = 0; x < CONFIG.VIEWPORT_WIDTH; x++) {
        ctx.font = `${24 * SCALE}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText('🪵', x * CONFIG.TILE_SIZE * SCALE + 24 * SCALE, fenceY + 30 * SCALE);
    }
    
    // Draw player
    drawPlayer();
    
    // Season decoration
    ctx.font = `${48 * SCALE}px Arial`;
    ctx.textAlign = 'right';
    ctx.fillText(SEASON_EMOJIS[gameState.season], canvas.width - 20, 50);
}

// ============================================
// MAIN LOOP
// ============================================
function gameLoop() {
    update();
    render();
    requestAnimationFrame(gameLoop);
}

// ============================================
// INITIALIZATION
// ============================================
function init() {
    resizeCanvas();
    initFarm();
    loadGame();
    updateUI();
    
    // Event listeners
    window.addEventListener('resize', resizeCanvas);
    
    document.getElementById('inventory-btn').onclick = openInventory;
    document.getElementById('shop-btn').onclick = openShop;
    document.getElementById('save-btn').onclick = saveGame;
    
    // Close buttons
    document.querySelectorAll('.close-btn').forEach(btn => {
        btn.onclick = () => {
            btn.closest('.modal').classList.add('hidden');
        };
    });
    
    // Close on backdrop click
    document.querySelectorAll('.modal').forEach(modal => {
        modal.onclick = (e) => {
            if (e.target === modal) {
                modal.classList.add('hidden');
            }
        };
    });
    
    // Game tick
    setInterval(gameTick, CONFIG.TICK_RATE);
    
    // Initial notification
    showNotification('🎮 欢迎来到星露谷网页版! 使用 WASD 移动，空格交互');
    
    // Start
    gameLoop();
}

// Start the game when page loads
window.onload = init;
