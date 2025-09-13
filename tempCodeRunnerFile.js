// index.js
import express from "express";
import multer from "multer";
import sqlite3 from "sqlite3";
import { open } from "sqlite";

const app = express();
const port = 3000;

// 处理表单提交
app.use(express.urlencoded({ extended: true }));

// 配置文件上传 (uploads 文件夹必须存在)
const upload = multer({ dest: "uploads/" });

// 静态文件：允许访问上传的图片
app.use("/uploads", express.static("uploads"));
 

// 公共音乐播放器 HTML
// 修复后的音乐播放器 HTML
const musicPlayerHTML = `
<div id="music-player" style="
  position: fixed;
  bottom: 20px; /* Move closer to the bottom */
  right: 20px; /* Move closer to the right */
  z-index: 9999;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 10px;
  padding: 10px; /* Reduce padding for smaller size */
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
  border: 1px solid #ddd;
">
  <audio id="bg-music" src="/uploads/summer.mp3" loop></audio>
  <button id="play-music" style="
    padding: 5px 10px; /* Reduce button size */
    border-radius: 6px;
    border: none;
    background: #d6ef97f2;
    color: white;
    font-size: 12px; /* Smaller font size */
    cursor: pointer;
    transition: background 0.3s;
  ">▶ music player</button>
  <span style="font-size: 25px; color: #666;">李玖哲 - summer</span>
</div>
<script>
  document.addEventListener('DOMContentLoaded', () => {
    const music = document.getElementById('bg-music');
    const btn = document.getElementById('play-music');
    
    // 设置音量
    music.volume = 0.7;
    
    btn.addEventListener('click', () => {
      if (music.paused) {
        music.play().catch(error => {
          console.error('播放失败:', error);
          alert('音乐播放失败，请检查音乐文件路径');
        });
        btn.innerText = '⏸ 暂停音乐';
        btn.style.background = '#dc3545';
      } else {
        music.pause();
        btn.innerText = '▶ 播放音乐';
        btn.style.background = '#007bff';
      }
    });
    
    // 添加错误处理
    music.addEventListener('error', (e) => {
      console.error('音频加载错误:', e);
      btn.disabled = true;
      btn.innerText = '❌ 加载失败';
      btn.style.background = '#6c757d';
    });
  });
</script>
`;

// ==================== 数据库 ====================
let db;
(async () => {
  db = await open({
    filename: "data.db",
    driver: sqlite3.Database
  });

  // 三张表：日记、美食、笔记
  await db.exec(`
    CREATE TABLE IF NOT EXISTS diary (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      content TEXT,
      photo TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS food (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      content TEXT,
      photo TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS note (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      content TEXT,
      photo TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS outfit (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      content TEXT,
      photo TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
})();

// ==================== 首页 ====================
app.get("/", (req, res) => {
  res.send(`
    <head>
      <meta charset="UTF-8">
      <title>🌙 Moon's Blog</title>
      <link rel="icon" type="image/png" href="/uploads/cfa2f28c.png">
      <style>
        body {
          margin: 0;
          font-family: Arial, sans-serif;
          background: #f4f4f9;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .hero {
          height: 40vh;
          width: 100%;
          background: url("/uploads/sun.png") no-repeat center center;
          background-size: cover;
          display: flex;
          justify-content: center;
          align-items: center;
          color: white;
          font-size: 2.5em;
          font-weight: bold;
        }

        .main {
          display: flex;
          width: 90%;
          margin-top: 20px;
        }

        /* 左侧竖直导航栏 */
        .sidebar {
          width: 220px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.2);
          padding: 20px;
        }

        .sidebar h3 {
          margin-top: 0;
          font-size: 1.2em;
          color: #333;
          border-bottom: 1px solid #ddd;
          padding-bottom: 10px;
        }

        .sidebar ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .sidebar ul li {
          margin: 15px 0;
        }

        .sidebar ul li a {
          text-decoration: none;
          font-size: 1.1em;
          color: #007bff;
          transition: color 0.3s;
        }

        .sidebar ul li a:hover {
          color: #0056b3;
        }

        /* 右侧个人信息 */
        .profile {
          flex: 1;
          margin-left: 20px;
          background: white;
          border-radius: 16px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.2);
          padding: 20px;
          text-align: center;
        }

        .profile img {
          width: 80px;
          margin-bottom: 10px;
          border-radius: 50%;
        }

        .profile h2 {
          margin: 10px 0 5px 0;
        }

        .profile a {
          display: inline-block;
          margin-top: 10px;
          padding: 8px 15px;
          border-radius: 8px;
          background: #007bff;
          color: white;
          text-decoration: none;
        }

        .profile a:hover {
          background: #000000ff;
        }
      </style>
    </head>

    <div class="hero">welcome to my blog </div>

    <div class="main">
      <!-- 左侧导航栏 -->
      <div class="sidebar">
        <h3>📂 分类导航</h3>
        <ul>
          <li><a href="/diary">📖 日记</a> | <a href="/diary-list">查看</a></li>
          <li><a href="/food">🍜 美食</a> | <a href="/food-list">查看</a></li>
          <li><a href="/note">💻 笔记</a> | <a href="/note-list">查看</a></li>
          <li><a href="/outfit">👗 穿搭</a> | <a href="/outfit-list">查看</a></li>
        </ul>
      </div>

      <!-- 右侧个人信息 -->
      <div class="profile">
        <img src="/uploads/touxiang.png" alt="头像">
        <h2>moon</h2>
        <p>你可以叫我葛什么</p>
        <p>文章 77 | 分类 1 | 标签 1 | 时间轴 76</p>
        <a href="/about">了解我</a>
      </div>
    </div>

    ${musicPlayerHTML}
  `);
});


// ==================== 日记 ====================
app.get("/diary", (req, res) => {
  res.send(`
    <h2>写日记</h2>
    <form action="/diary" method="post" enctype="multipart/form-data">
      <input type="text" name="title" placeholder="标题" required><br><br>
      <textarea name="content" placeholder="内容..." required></textarea><br><br>
      <input type="file" name="photo" accept="image/*"><br><br>
      <button type="submit">发布</button>
    </form>
    <p><a href="/">返回首页</a></p>
  `);
});

app.post("/diary", upload.single("photo"), async (req, res) => {
  const { title, content } = req.body;
  const photoPath = req.file ? "/uploads/" + req.file.filename : null;

  await db.run("INSERT INTO diary (title, content, photo) VALUES (?, ?, ?)", [
    title,
    content,
    photoPath
  ]);

  res.redirect("/diary-list");
});

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

  html += `<p><a href="/">返回首页</a></p>`;

  // 在页面底部加入音乐播放器
  html += musicPlayerHTML;

  res.send(html);
});

// ==================== 美食 ====================
app.get("/food", (req, res) => {
  res.send(`
    <h2>记录美食</h2>
    <form action="/food" method="post" enctype="multipart/form-data">
      <input type="text" name="title" placeholder="美食名称" required><br><br>
      <textarea name="content" placeholder="描述..." required></textarea><br><br>
      <input type="file" name="photo" accept="image/*"><br><br>
      <button type="submit">发布</button>
    </form>
    <p><a href="/">返回首页</a></p>
  `);
});

app.post("/food", upload.single("photo"), async (req, res) => {
  const { title, content } = req.body;
  const photoPath = req.file ? "/uploads/" + req.file.filename : null;

  await db.run("INSERT INTO food (title, content, photo) VALUES (?, ?, ?)", [
    title,
    content,
    photoPath
  ]);

  res.redirect("/food-list");
});

app.get("/food-list", async (req, res) => {
  const rows = await db.all("SELECT * FROM food ORDER BY created_at DESC");

  let html = "<h2>我的美食</h2>";
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
  html += `<p><a href="/">返回首页</a></p>`;
  // 在页面底部加入音乐播放器
  html += musicPlayerHTML;
  res.send(html);
});

// ==================== 笔记 ====================
app.get("/note", (req, res) => {
  res.send(`
    <h2>写笔记</h2>
    <form action="/note" method="post" enctype="multipart/form-data">
      <input type="text" name="title" placeholder="标题" required><br><br>
      <textarea name="content" placeholder="内容..." required></textarea><br><br>
      <input type="file" name="photo" accept="image/*"><br><br>
      <button type="submit">发布</button>
    </form>
    <p><a href="/">返回首页</a></p>
  `);
});

app.post("/note", upload.single("photo"), async (req, res) => {
  const { title, content } = req.body;
  const photoPath = req.file ? "/uploads/" + req.file.filename : null;

  await db.run("INSERT INTO note (title, content, photo) VALUES (?, ?, ?)", [
    title,
    content,
    photoPath
  ]);

  res.redirect("/note-list");
});

app.get("/note-list", async (req, res) => {
  const rows = await db.all("SELECT * FROM note ORDER BY created_at DESC");

  let html = "<h2>我的笔记</h2>";
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
  html += `<p><a href="/">返回首页</a></p>`;
  // 在页面底部加入音乐播放器
  html += musicPlayerHTML;
  res.send(html);
});
//--------------------------- 关于我 ---------------------------
app.get("/about", (req, res) => {
  res.send(`
    <style>
      body {
        font-family: Arial, sans-serif;
        padding: 20px;
        background: #f4f4f9;
      }
      .about {
        max-width: 600px;
        margin: auto;
        background: white;
        border-radius: 16px;
        padding: 20px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
      }
      h2 { margin-top: 0; }
    </style>

    <div class="about">
      <h2>关于我</h2>
      <p>👋 你好，我是 gyyixingkusa。</p>
      <p>📖 这里我会记录我的日记、美食和笔记。</p>
      <p>🎵 喜欢音乐、编程和生活分享。</p>
      <p><a href="/">⬅ 返回首页</a></p>
    </div>
  `);
});

// ==================== 日记、笔记、美食、穿搭的统一逻辑 ====================
const sections = ["diary", "food", "note", "outfit"];

sections.forEach(section => {
  app.get(`/${section}`, (req, res) => {
    res.send(`
      <style>
        body {
          font-family: Arial, sans-serif;
          background: url('/uploads/${section}-bg.jpg') no-repeat center center;
          background-size: cover;
          padding: 20px;
          color: #333;
        }

        h2 {
          font-size: 2.5em; /* Increased font size */
          text-align: center;
        }

        form {
          max-width: 600px;
          margin: auto;
          background: rgba(255, 255, 255, 0.9);
          padding: 20px;
          border-radius: 10px;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
        }

        input, textarea, button {
          font-size: 1.2em; /* Increased font size */
          margin-bottom: 10px;
        }
      </style>

      <h2>记录${section}</h2>
      <form action="/${section}" method="post" enctype="multipart/form-data">
        <input type="text" name="title" placeholder="标题" required><br><br>
        <textarea name="content" placeholder="内容..." required></textarea><br><br>
        <input type="file" name="photo" accept="image/*"><br><br>
        <button type="submit">发布</button>
      </form>
      <p><a href="/">返回首页</a></p>
    `);
  });

  app.post(`/${section}`, upload.single("photo"), async (req, res) => {
    const { title, content } = req.body;
    const photoPath = req.file ? "/uploads/" + req.file.filename : null;

    await db.run(
      `INSERT INTO ${section} (title, content, photo) VALUES (?, ?, ?)`,
      [title, content, photoPath]
    );

    res.redirect(`/${section}-list`);
  });

  app.get(`/${section}-list`, async (req, res) => {
    const rows = await db.all(
      `SELECT * FROM ${section} ORDER BY created_at DESC`
    );

    let html = `<h2>我的${section}</h2>`;
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
    html += `<p><a href="/">返回首页</a></p>`;
    res.send(html);
  });
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
