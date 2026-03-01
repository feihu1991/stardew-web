# 🌾 Stardew Web

> 类星露谷物语的像素风农场经营网页游戏

![Preview](https://img.shields.io/badge/HTML5-Canvas-blue)
![License](https://img.shields.io/badge/License-MIT-green)

## 🎮 游戏介绍

这是一个基于浏览器的像素风农场模拟经营游戏，灵感来源于经典的星露谷物语。在游戏中，你可以：

- 🌱 种植各种作物（胡萝卜、番茄、玉米、土豆、草莓等）
- 💧 浇水、施肥、收获
- 🏪 买卖作物、购买种子
- 📅 体验四季变化
- ⭐ 升级获得经验

## 🕹️ 操作方式

| 操作 | 电脑 | 手机 |
|------|------|------|
| 移动 | WASD / 方向键 | 滑动屏幕 |
| 交互 | 空格键 / E | 点击 |

## 🎯 游戏玩法

1. **种植**：在商店购买种子，选择种子后移动到空地上按空格种植
2. **浇水**：种植后需要浇水作物才会生长
3. **收获**：作物成熟后再次交互收获
4. **出售**：在商店出售作物获得金钱
5. **升级**：种植和收获获得经验，升级解锁更多功能

## 🌸 季节系统

- **春季** 🌸：胡萝卜、土豆、草莓
- **夏季** ☀️：番茄、玉米、茄子
- **秋季** 🍂：玉米、土豆、南瓜
- **冬季** ❄️：无作物（休息季节）

## 💾 存档

游戏自动保存在浏览器本地存储中，点击「存档」按钮可以手动保存。

## 🚀 运行方式

直接在浏览器中打开 `index.html` 即可开始游戏！

```bash
# 或者使用简单的 HTTP 服务器
npx serve .
# 然后访问 http://localhost:3000
```

## 📁 项目结构

```
stardew-web/
├── index.html      # 游戏入口
├── css/
│   └── style.css   # 样式文件
├── js/
│   └── game.js     # 游戏逻辑
└── README.md       # 说明文档
```

## 🎨 技术栈

- HTML5 Canvas
- Vanilla JavaScript
- CSS3 (Pixel Art 风格)
- LocalStorage 存档

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📜 许可证

MIT License

---

Made with ❤️ by feihu1991
