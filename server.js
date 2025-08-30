// server.js
const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const bodyParser = require("body-parser");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// ===== Middleware =====
app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));

// ===== Database =====
const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // Render 自动提供
  ssl: { rejectUnauthorized: false }
});

// ===== API =====
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

app.post("/profile", async (req, res) => {
  const { nickname, gender, hobbies } = req.body;
  try {
    await pool.query(
      "INSERT INTO profiles (nickname, gender, hobbies) VALUES ($1, $2, $3)",
      [nickname, gender, hobbies]
    );
    res.json({ status: "ok" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "数据库错误" });
  }
});

// ===== WebSocket 聊天 =====
io.on("connection", (socket) => {
  console.log("一个用户连接了:", socket.id);

  socket.on("chatMessage", (msg) => {
    io.emit("chatMessage", { id: socket.id, msg });
  });

  socket.on("disconnect", () => {
    console.log("用户断开:", socket.id);
  });
});

// ===== 启动服务 =====
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
