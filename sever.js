import express from "express";
import multer from "multer";
import sqlite3 from "sqlite3";
import { open } from "sqlite";

const app = express();
const upload = multer({ dest: "uploads/" }); // 上传到 uploads 文件夹

// 初始化数据库
let db;
(async () => {
  db = await open({
    filename: "data.db",
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS diary (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      content TEXT,
      photo TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
})();

// 静态文件（访问 uploads/ 下的图片）
app.use("/uploads", express.static("uploads"));

// 处理日记提交
app.post("/diary", upload.single("photo"), async (req, res) => {
  const { title, content } = req.body;
  const photoPath = req.file ? "/uploads/" + req.file.filename : null;

  await db.run("INSERT INTO diary (title, content, photo) VALUES (?, ?, ?)", [
    title,
    content,
    photoPath
  ]);

  res.send("日记已保存！<br><a href='/diary-list'>查看日记</a>");
});

// 查看日记
app.get("/diary-list", async (req, res) => {
  const rows = await db.all("SELECT * FROM diary ORDER BY created_at DESC");

  let html = "<h2>我的日记</h2>";
  rows.forEach(r => {
    html += `
      <div style="border:1px solid #ccc; margin:10px; padding:10px;">
        <h3>${r.title}</h3>
        <p>${r.content}</p>
        ${r.photo ? `<img src="${r.photo}" style="max-width:200px;">` : ""}
        <p><small>${r.created_at}</small></p>
      </div>
    `;
  });

  res.send(html);
});

// 默认是 const port = 3000;
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

