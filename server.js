const express = require("express");
const session = require("express-session");
const passport = require("passport");
const DiscordStrategy = require("passport-discord").Strategy;
const path = require("path");

const app = express();

// 정적 파일(css)
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
    callbackURL: "https://okinawa-dash.vercel.app/callback",
    scope: ["identify", "email"]
}, (accessToken, refreshToken, profile, done) => {
    return done(null, profile);
}));

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

// 회원가입 페이지
app.get("/register", (req, res) => {
    res.send("<h1>회원가입 페이지 준비 중</h1>");
});

// (선택) 로컬 로그인 처리
app.post("/local-login", (req, res) => {
    // TODO: DB 연결해서 아이디/비번 확인
    res.send("로컬 로그인 기능은 아직 구현되지 않았습니다.");
});


app.listen(3000, () => {
    console.log("✅ 서버 실행 중: https://okinawa-dash.vercel.app");
});
