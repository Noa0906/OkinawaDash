const express = require("express");
const session = require("express-session");
const passport = require("passport");
const DiscordStrategy = require("passport-discord").Strategy;
const path = require("path");
const fs = require("fs");

const app = express();

app.use(express.json()); // ✅ JSON API 요청 처리
app.use(express.static("public"));

app.use(session({
    secret: "super-secret-key",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

passport.use(new DiscordStrategy({
    clientID: "1410973375408504875",
    clientSecret: "JiBQWusqAlR48nLy8rmzza6E0w88p9zv",
    callbackURL: "https://okinawadash.onrender.com/callback",
    scope: ["identify", "guilds"] // ✅ guilds 권한 추가 (서버 확인용)
}, (accessToken, refreshToken, profile, done) => {
    return done(null, profile);
}));

// JSON 파일 경로
const configFile = path.join(__dirname, "data", "ticket_config.json");

// 설정 파일 읽기
function loadConfig() {
    if (fs.existsSync(configFile)) {
        return JSON.parse(fs.readFileSync(configFile, "utf8"));
    }
    return { servers: {} };
}

// 설정 파일 저장
function saveConfig(config) {
    fs.writeFileSync(configFile, JSON.stringify(config, null, 2));
}

// ===== 기본 라우트 =====
app.get("/", (req, res) => {
    if (req.isAuthenticated()) {
        return res.redirect("/success");
    }
    res.sendFile(path.join(__dirname, "views", "index.html"));
});

app.get("/login", passport.authenticate("discord"));

app.get("/callback", passport.authenticate("discord", {
    failureRedirect: "/"
}), (req, res) => {
    res.redirect("/success");
});

app.get("/success", (req, res) => {
    if (!req.isAuthenticated()) return res.redirect("/");
    res.sendFile(path.join(__dirname, "views", "success.html"));
});

app.get("/logout", (req, res) => {
    req.logout(() => {
        res.redirect("/");
    });
});

// ===== 설정 API =====

// 버튼 저장
app.post("/api/ticket-config/button", (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "인증 필요" });

    const { guildId, button } = req.body;
    if (!guildId || !button) return res.status(400).json({ error: "guildId와 button은 필수입니다." });

    const config = loadConfig();
    if (!config.servers[guildId]) {
        config.servers[guildId] = { buttons: [], categories: {}, sellerRoles: [], embed: {}, notice: {}, title: {} };
    }

    const idx = config.servers[guildId].buttons.findIndex(b => b.id === button.id);
    if (idx >= 0) {
        config.servers[guildId].buttons[idx] = button;
    } else {
        config.servers[guildId].buttons.push(button);
    }

    saveConfig(config);
    res.json({ success: true, config: config.servers[guildId] });
});

// 임베드 저장
app.post("/api/ticket-config/embed", (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "인증 필요" });

    const { guildId, embed } = req.body;
    if (!guildId || !embed) return res.status(400).json({ error: "guildId와 embed는 필수입니다." });

    const config = loadConfig();
    if (!config.servers[guildId]) config.servers[guildId] = { buttons: [], categories: {}, sellerRoles: [], embed: {}, notice: {}, title: {} };

    config.servers[guildId].embed = embed;
    saveConfig(config);

    res.json({ success: true, config: config.servers[guildId] });
});

// 공지 저장
app.post("/api/ticket-config/notice", (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "인증 필요" });

    const { guildId, notice } = req.body;
    if (!guildId || !notice) return res.status(400).json({ error: "guildId와 notice는 필수입니다." });

    const config = loadConfig();
    if (!config.servers[guildId]) config.servers[guildId] = { buttons: [], categories: {}, sellerRoles: [], embed: {}, notice: {}, title: {} };

    config.servers[guildId].notice = notice;
    saveConfig(config);

    res.json({ success: true, config: config.servers[guildId] });
});

// 제목 저장
app.post("/api/ticket-config/title", (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "인증 필요" });

    const { guildId, title } = req.body;
    if (!guildId || !title) return res.status(400).json({ error: "guildId와 title은 필수입니다." });

    const config = loadConfig();
    if (!config.servers[guildId]) config.servers[guildId] = { buttons: [], categories: {}, sellerRoles: [], embed: {}, notice: {}, title: {} };

    config.servers[guildId].title = title;
    saveConfig(config);

    res.json({ success: true, config: config.servers[guildId] });
});

// ===== 서버 실행 =====
app.listen(3000, () => {
    console.log("✅ 서버 실행 중: https://okinawadash.onrender.com");
});
