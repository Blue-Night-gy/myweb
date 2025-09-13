// index.js
import express from "express";
import multer from "multer";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import { marked } from 'marked';

const app = express();
const port = 3000;

// 处理表单提交
app.use(express.urlencoded({ extended: true }));

// 配置文件上传 (uploads 文件夹必须存在)
const upload = multer({ dest: "uploads/" });

// 静态文件：允许访问上传的图片
app.use("/uploads", express.static("uploads"));

// 配置静态文件路径，允许访问 music 目录中的音乐文件
app.use("/music", express.static("music"));

// 公共音乐播放器 HTML
// 修复后的音乐播放器 HTML
const musicPlayerHTML = `
<div id="music-player" style="
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 9999;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 10px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
  border: 1px solid #ddd;
">
  <select id="song-selector" style="
    margin-bottom: 10px;
    padding: 5px;
    border-radius: 6px;
    border: 1px solid #ccc;
    font-size: 14px;
  ">
    <option value="/music/summer.mp3">夏天</option>
    <option value="/music/butterfly.mp3">蝴蝶</option>
    <option value="/music/do_not_cry.mp3">不哭</option>
    <option value="/music/Love_Song.mp3">love song</option>
    <option value="/music/what.mp3">怎么了</option>
  </select>
  <audio id="bg-music" controls style="width: 100%;">
    <source src="/music/song1.mp3" type="audio/mpeg">
    你的浏览器不支持 audio 标签。
  </audio>
  <button id="play-music" style="
    padding: 5px 10px;
    border-radius: 6px;
    border: none;
    background: #007bff;
    color: white;
    font-size: 14px;
    cursor: pointer;
    transition: background 0.3s;
  ">▶ 播放音乐</button>
</div>
<script>
  document.addEventListener('DOMContentLoaded', () => {
    const music = document.getElementById('bg-music');
    const btn = document.getElementById('play-music');
    const selector = document.getElementById('song-selector');

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

    selector.addEventListener('change', () => {
      music.src = selector.value;
      music.play().catch(error => {
        console.error('播放失败:', error);
        alert('音乐播放失败，请检查音乐文件路径');
      });
      btn.innerText = '⏸ 暂停音乐';
      btn.style.background = '#dc3545';
    });

    // 添加错误处理
    music.addEventListener('error', (e) => {
      console.error('音频加载错误:', e);
      btn.disabled = true;
      btn.innerText = '❌ 加载失败';
      btn.style.background = '#6c757d';
    });

    const quotes = [
      "生活就像一盒巧克力，你永远不知道下一颗是什么味道。",
      "成功是百分之一的灵感加百分之九十九的汗水。",
      "不要等待机会，而要创造机会。",
      "人生最大的遗憾不是失败，而是从未尝试。",
      "梦想是注定孤独的旅行，路上少不了质疑和嘲笑。"
    ];
    const quoteElement = document.getElementById('quote');
    const newQuoteButton = document.getElementById('new-quote');

    // 页面加载时随机显示语录
    const randomIndexOnLoad = Math.floor(Math.random() * quotes.length);
    quoteElement.textContent = quotes[randomIndexOnLoad];

    newQuoteButton.addEventListener('click', () => {
      const randomIndex = Math.floor(Math.random() * quotes.length);
      quoteElement.textContent = quotes[randomIndex];
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
          border-radius: 12px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.2);
          padding: 15px;
          text-align: center;
          width: 300px; /* 缩小卡片宽度 */
        }

        .profile img {
          width: 60px; /* 缩小头像大小 */
          margin-bottom: 10px;
          border-radius: 50%;
        }

        .profile h2 {
          margin: 10px 0 5px 0;
          font-size: 1.2em; /* 缩小标题字体 */
        }

        .profile p {
          font-size: 0.9em; /* 缩小描述字体 */
        }

        .profile a {
          display: inline-block;
          margin-top: 10px;
          padding: 6px 12px; /* 缩小按钮大小 */
          border-radius: 6px;
          background: #ffffffff;
          color: white;
          text-decoration: none;
        }

        .profile a:hover {
          background: #f6faffff;
        }

        /* 社交媒体链接 */
       .social-links a {
  margin: 0 8px;
  font-size: 24px;
  color: #928fdcff;
  transition: color 0.3s;
}
.social-links a:hover {
  color: #eef6feff;
}

      </style>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.6.0/css/all.min.css">

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
 <div id="quote-block" style="
            margin-top: 15px;
            padding: 12px;
            border-radius: 8px;
            background: #fbf9f9ff;
           
            font-style: italic;
            color: #1f0505ff;
          ">
            <p id="quote">这里会显示一条语录</p>
          </div>
       <!-- 社交媒体链接 -->
<div class="social-links">
  <a href="https://github.com" target="_blank"><i class="fab fa-github"></i></a>
  <a href="https://weixin.qq.com" target="_blank"><i class="fab fa-weixin"></i></a>
  <a href="mailto:your-email@example.com"><i class="fas fa-envelope"></i></a>
  <a href="https://www.zhihu.com" target="_blank"><i class="fab fa-zhihu"></i></a>
  <a href="https://www.xiaohongshu.com" target="_blank"><i class="fas fa-book"></i></a>
</div>

<!-- 日历功能 -->
        <div class="calendar" style="margin-top: 20px;">
          <iframe src="https://calendar.google.com/calendar/embed?src=zh-cn.china%23holiday%40group.v.calendar.google.com&ctz=Asia%2FShanghai" style="border: 0" width="300" height="300" frameborder="0" scrolling="no"></iframe>
        </div>

      </div>
    </div>

  ${musicPlayerHTML}
      </main>

      <script>
        // 自动切换语录功能
        document.addEventListener('DOMContentLoaded', () => {
          const quotes = [
            "我并不是立意要错过，可是我一直都这样做，错过花满枝桠的昨日，还要错过今朝 ",
            "于高山之巅，方见大河奔涌；于群峰之上，更觉长风浩荡。",
            "我一个人没有觉得孤独，说的浪漫些，我完全自由",
            "我抬头发现本以为只照着我的月亮也照着别人，于是心生嫉妒，低头发誓再也不看月亮。",
            "  我希望正在读这句话的人永远幸福 "
            “忧愁是心上下的一场雨，不必急于放晴，允许自己慢慢穿过这片潮湿。”

              “心有时候也会感冒，它会打喷嚏、流眼泪——这只是提醒你，它需要休息和治愈。”

             “不必为自己的敏感道歉。正是那些细微的裂痕，让光有了照进内心的缝隙。”
            “我们总在人群中藏起心事，却忘了每个人手里都握着一段看不见的伤疤。”

“夜晚的沉默不是空洞的，它铺满了无数人未说出口的故事——你并不孤单。”

“眼泪是人类共同的语言，无需翻译也能被理解。” 


          ];
          const quoteElement = document.getElementById('quote');

          function updateQuote() {
            const randomIndex = Math.floor(Math.random() * quotes.length);
            quoteElement.textContent = quotes[randomIndex];
          }

          // 初始显示
          updateQuote();

          // 每 5 秒切换一次
          setInterval(updateQuote, 5000);
        });
      </script>
      <script src="script.js"></script>
    </body>
    </html>
  `);
});

// ==================== 统一逻辑：diary ====================
// Shared form renderer to keep all four forms identical (title, content, multi-image upload UI)
function renderForm(type) {
  const titleMap = {
    diary: '记录日记',
    food: '记录美食',
    note: '记录笔记',
    outfit: '记录穿搭'
  };

  return `
    <style>
      body {
        font-family: Arial, sans-serif;
        background: url('/uploads/ocean.png') no-repeat center center;
        background-size: cover;
        padding: 20px;
        color: #333;
      }

      h2 {
        font-size: 2.5em;
        text-align: center;
        color: white;
        text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.7);
      }

      form {
        max-width: 600px;
        margin: auto;
        background: rgba(255, 255, 255, 0.95);
        padding: 20px;
        border-radius: 10px;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
      }

      input, textarea, button {
        font-size: 1.2em;
        margin-bottom: 10px;
        width: 100%;
      }
      
      .markdown-tip {
        background: #f8f9fa;
        padding: 10px;
        border-radius: 6px;
        margin: 10px 0;
        font-size: 0.9em;
        color: #666;
      }

      button {
        background: #007bff;
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 6px;
        cursor: pointer;
        transition: background 0.3s;
      }

      button:hover {
        background: #0056b3;
      }

      /* multi image preview area (visual only) */
      .images-preview {
        display: flex;
        gap: 10px;
        margin-top: 10px;
        flex-wrap: wrap;
      }

      .images-preview img {
        width: 100px;
        height: 100px;
        object-fit: cover;
        border-radius: 6px;
        box-shadow: 0 2px 6px rgba(0,0,0,0.15);
      }
    </style>

    <h2>${titleMap[type] || '记录'}</h2>
    <form action="/${type}" method="post" enctype="multipart/form-data">
      <input type="text" name="title" placeholder="标题" required><br>
      <div class="markdown-tip">
        支持 Markdown 格式:
        <ul>
          <li>**粗体** 或 __粗体__</li>
          <li>*斜体* 或 _斜体_</li>
          <li># 一级标题</li>
          <li>## 二级标题</li>
          <li>- 无序列表</li>
          <li>1. 有序列表</li>
          <li>[链接文字](URL)</li>
          <li>![图片描述](图片URL)</li>
        </ul>
      </div>
      <textarea name="content" placeholder="支持 Markdown 格式..." required style="min-height: 200px;"></textarea><br>
      <!-- show multi image input UI; server still handles single file to preserve existing behavior -->
      <input type="file" name="photo" accept="image/*" multiple id="photo-input"><br>
      <div class="images-preview" id="images-preview"></div>
      <button type="submit">发布</button>
    </form>
    <p style="text-align: center; margin-top: 20px;"><a href="/">返回首页</a></p>

    <script>
      // preview selected images (client-side only)
      document.addEventListener('DOMContentLoaded', () => {
        const input = document.getElementById('photo-input');
        const preview = document.getElementById('images-preview');
        if (!input) return;
        input.addEventListener('change', () => {
          preview.innerHTML = '';
          Array.from(input.files).slice(0,6).forEach(file => {
            const url = URL.createObjectURL(file);
            const img = document.createElement('img');
            img.src = url;
            preview.appendChild(img);
          });
        });
      });
    </script>
  `;
}

app.get('/diary', (req, res) => {
  res.send(renderForm('diary'));
});

// 添加单篇日记查看页面
app.get('/diary/:id', async (req, res) => {
  const diary = await db.get('SELECT * FROM diary WHERE id = ?', req.params.id);
  if (!diary) {
    return res.status(404).send('日记不存在');
  }
  
  res.send(`
    <style>
      body {
        font-family: Arial, sans-serif;
        background: url('/uploads/sky.png') no-repeat center center fixed;
        background-size: cover;
        margin: 0;
        padding: 40px 20px;
        min-height: 100vh;
      }
      .article {
        max-width: 800px;
        margin: 0 auto;
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(10px);
        border-radius: 20px;
        box-shadow: 0 4px 25px rgba(0, 0, 0, 0.15);
        padding: 30px;
        border: 1px solid rgba(255, 255, 255, 0.2);
      }
      .article img {
        max-width: 100%;
        border-radius: 12px;
        margin: 20px 0;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      }
      .article-content {
        line-height: 1.8;
        color: #333;
      }
      .back-link {
        display: inline-block;
        margin-bottom: 20px;
        color: #007bff;
        text-decoration: none;
      }
      .back-link:hover {
        text-decoration: underline;
      }
      .article-meta {
        color: #666;
        font-size: 0.9em;
        margin-bottom: 20px;
      }
    </style>
    <div class="article">
      <a href="/diary-list" class="back-link">← 返回日记列表</a>
      <h1>${diary.title}</h1>
      <div class="article-meta">
        发布于: ${new Date(diary.created_at).toLocaleString()}
      </div>
      ${diary.photo ? `<img src="/${diary.photo}" alt="${diary.title}">` : ''}
      <div class="article-content">
        ${marked(diary.content)}
      </div>
    </div>
    ${musicPlayerHTML}
  `);
});

app.get('/diary-list', async (req, res) => {
  const diaries = await db.all('SELECT * FROM diary ORDER BY created_at DESC');
  res.send(`
    <style>
      body {
        font-family: Arial, sans-serif;
        background: url('/uploads/sky.png') no-repeat center center fixed;
        background-size: cover;
        margin: 0;
        padding: 0;
      }

      .banner {
        width: 100%;
        padding: 60px 0;
        background: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(5px);
        display: flex;
        justify-content: center;
        align-items: center;
        color: white;
        font-size: 2.5em;
        font-weight: bold;
        text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.7);
        margin-bottom: 30px;
      }

      .timeline {
        position: relative;
        padding: 20px;
      }

      .timeline::before {
        content: '';
        position: absolute;
        left: 60px;
        top: 0;
        bottom: 0;
        width: 4px;
        background: #f8c8dc;
      }

      .card-container {
        display: flex;
        flex-direction: column;
        gap: 20px;
        padding: 20px;
        margin-left: 100px;
      }

      .card {
        background: white;
        border-radius: 10px;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
        padding: 20px;
        width: 100%;
        max-width: 800px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        text-align: left;
        position: relative;
      }

      .card::before {
        content: '';
        position: absolute;
        top: 10px;
        left: 50px;
        width: 20px;
        height: 20px;
        background: #f8c8dc;
        border-radius: 50%;
      }

      .card-time {
        position: absolute;
        top: 10px;
        left: 80px;
        font-size: 0.9em;
        color: #555;
      }

      .card img {
        width: 150px;
        height: 150px;
        border-radius: 10px;
        object-fit: cover;
      }

      .card-content {
        flex: 1;
        margin-right: 20px;
      }

      .card-content h3 {
        margin: 10px 0;
        font-size: 1.5em;
      }

      .card-content p {
        font-size: 1em;
        color: #555;
      }

      .card-content a {
        display: inline-block;
        margin-top: 10px;
        padding: 10px 20px;
        border-radius: 6px;
        background: #007bff;
        color: white;
        text-decoration: none;
      }

      .card-content a:hover {
        background: #0056b3;
      }
    </style>

    <div class="banner">日记列表</div>

    <div class="timeline">
      <div class="card-container">
        ${diaries.map(diary => `
          <div class="card">
            <span class="card-time">${new Date(diary.created_at).toLocaleString()}</span>
            <div class="card-content">
              <h3>${diary.title}</h3>
              <div style="max-height: 100px; overflow: hidden;">
                ${marked(diary.content.substring(0, 200))}...
              </div>
              <div class="card-buttons">
                <a href="/diary/${diary.id}">查看详情</a>
                <form method="post" action="/diary/${diary.id}/delete" onsubmit="return confirm('确定要删除这篇日记吗？');" style="display:inline;">
                  <button type="submit">删除</button>
                </form>
              </div>
            </div>
            ${diary.photo ? `<img src="${diary.photo}" alt="Diary Photo">` : ''}
          </div>
        `).join('')}
      </div>
    </div>
    <p style="text-align: center; margin: 20px;">
      <a href="/" style="display: inline-block; padding: 10px 25px; background: rgba(255, 255, 255, 0.9); color: #333; text-decoration: none; border-radius: 25px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); transition: all 0.3s ease;">
        返回首页
      </a>
    </p>
    ${musicPlayerHTML}
  `);
});

// ==================== 统一逻辑：food ====================
app.get('/food', (req, res) => {
  res.send(renderForm('food'));
});

app.get('/food-list', async (req, res) => {
  const foods = await db.all('SELECT * FROM food ORDER BY created_at DESC');
  res.send(`
    <style>
      body {
        font-family: Arial, sans-serif;
        background: url('/uploads/food.png') no-repeat center center fixed;
        background-size: cover;
        margin: 0;
        padding: 0;
      }

      .banner {
        width: 100%;
        padding: 60px 0;
        background: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(5px);
        display: flex;
        justify-content: center;
        align-items: center;
        color: white;
        font-size: 2.5em;
        font-weight: bold;
        text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.7);
        margin-bottom: 30px;
      }

      .timeline {
        position: relative;
        padding: 20px;
      }

      .timeline::before {
        content: '';
        position: absolute;
        left: 60px;
        top: 0;
        bottom: 0;
        width: 4px;
        background: #f8c8dc;
      }

      .card-container {
        display: flex;
        flex-direction: column;
        gap: 20px;
        padding: 20px;
        margin-left: 100px;
      }

      .card {
        background: white;
        border-radius: 10px;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
        padding: 20px;
        width: 100%;
        max-width: 800px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        text-align: left;
        position: relative;
      }

      .card::before {
        content: '';
        position: absolute;
        top: 10px;
        left: 50px;
        width: 20px;
        height: 20px;
        background: #f8c8dc;
        border-radius: 50%;
      }

      .card-time {
        position: absolute;
        top: 10px;
        left: 80px;
        font-size: 0.9em;
        color: #555;
      }

      .card img {
        width: 150px;
        height: 150px;
        border-radius: 10px;
        object-fit: cover;
      }

      .card-content {
        flex: 1;
        margin-right: 20px;
      }

      .card-content h3 {
        margin: 10px 0;
        font-size: 1.5em;
      }

      .card-content p {
        font-size: 1em;
        color: #555;
      }

      .card-content a {
        display: inline-block;
        margin-top: 10px;
        padding: 10px 20px;
        border-radius: 6px;
        background: #007bff;
        color: white;
        text-decoration: none;
      }

      .card-content a:hover {
        background: #0056b3;
      }
    </style>

    <div class="banner">美食列表</div>

    <div class="timeline">
      <div class="card-container">
        ${foods.map(food => `
          <div class="card">
            <span class="card-time">${new Date(food.created_at).toLocaleString()}</span>
            <div class="card-content">
              <h3>${food.title}</h3>
              <div style="max-height: 100px; overflow: hidden;">
                ${marked(food.content.substring(0, 200))}...
              </div>
              <div class="card-buttons">
                <a href="/food/${food.id}">查看详情</a>
                <form method="post" action="/food/${food.id}/delete" onsubmit="return confirm('确定要删除这条美食记录吗？');" style="display:inline;">
                  <button type="submit">删除</button>
                </form>
              </div>
            </div>
            ${food.photo ? `<img src="${food.photo}" alt="Food Photo">` : ''}
          </div>
        `).join('')}
      </div>
    </div>
    <p style="text-align: center; margin: 20px;">
      <a href="/" style="display: inline-block; padding: 10px 25px; background: rgba(255, 255, 255, 0.9); color: #333; text-decoration: none; border-radius: 25px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); transition: all 0.3s ease;">
        返回首页
      </a>
    </p>
    ${musicPlayerHTML}
  `);
});

// ==================== 统一逻辑：note ====================
app.get('/note', (req, res) => {
  res.send(renderForm('note'));
});

app.get('/note-list', async (req, res) => {
  const notes = await db.all('SELECT * FROM note ORDER BY created_at DESC');
  res.send(`
    <style>
      body {
        font-family: Arial, sans-serif;
        background: url('/uploads/rain.png') no-repeat center center fixed;
        background-size: cover;
        margin: 0;
        padding: 0;
      }

      .banner {
        width: 100%;
        padding: 60px 0;
        background: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(5px);
        display: flex;
        justify-content: center;
        align-items: center;
        color: white;
        font-size: 2.5em;
        font-weight: bold;
        text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.7);
        margin-bottom: 30px;
      }

      .timeline {
        position: relative;
        padding: 20px;
      }

      .timeline::before {
        content: '';
        position: absolute;
        left: 60px;
        top: 0;
        bottom: 0;
        width: 4px;
        background: #f8c8dc;
      }

      .card-container {
        display: flex;
        flex-direction: column;
        gap: 20px;
        padding: 20px;
        margin-left: 100px;
      }

      .card {
        background: white;
        border-radius: 10px;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
        padding: 20px;
        width: 100%;
        max-width: 800px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        text-align: left;
        position: relative;
      }

      .card::before {
        content: '';
        position: absolute;
        top: 10px;
        left: 50px;
        width: 20px;
        height: 20px;
        background: #f8c8dc;
        border-radius: 50%;
      }

      .card-time {
        position: absolute;
        top: 10px;
        left: 80px;
        font-size: 0.9em;
        color: #555;
      }

      .card img {
        width: 150px;
        height: 150px;
        border-radius: 10px;
        object-fit: cover;
      }

      .card-content {
        flex: 1;
        margin-right: 20px;
      }

      .card-content h3 {
        margin: 10px 0;
        font-size: 1.5em;
      }

      .card-content p {
        font-size: 1em;
        color: #555;
      }

      .card-content a {
        display: inline-block;
        margin-top: 10px;
        padding: 10px 20px;
        border-radius: 6px;
        background: #007bff;
        color: white;
        text-decoration: none;
      }

      .card-content a:hover {
        background: #0056b3;
      }
    </style>

    <div class="banner">笔记列表</div>

    <div class="timeline">
      <div class="card-container">
        ${notes.map(note => `
          <div class="card">
            <span class="card-time">${new Date(note.created_at).toLocaleString()}</span>
            <div class="card-content">
              <h3>${note.title}</h3>
              <div style="max-height: 100px; overflow: hidden;">
                ${marked(note.content.substring(0, 200))}...
              </div>
              <div class="card-buttons">
                <a href="/note/${note.id}">查看详情</a>
                <form method="post" action="/note/${note.id}/delete" onsubmit="return confirm('确定要删除这条笔记吗？');" style="display:inline;">
                  <button type="submit">删除</button>
                </form>
              </div>
            </div>
            ${note.photo ? `<img src="${note.photo}" alt="Note Photo">` : ''}
          </div>
        `).join('')}
      </div>
    </div>
    <p style="text-align: center; margin: 20px;">
      <a href="/" style="display: inline-block; padding: 10px 25px; background: rgba(255, 255, 255, 0.9); color: #333; text-decoration: none; border-radius: 25px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); transition: all 0.3s ease;">
        返回首页
      </a>
    </p>
    ${musicPlayerHTML}
  `);
});

// ==================== 统一逻辑：outfit ====================
app.get('/outfit', (req, res) => {
  res.send(renderForm('outfit'));
});

app.get('/outfit-list', async (req, res) => {
  const outfits = await db.all('SELECT * FROM outfit ORDER BY created_at DESC');
  res.send(`
    <style>
      body {
        font-family: Arial, sans-serif;
        background: url('/uploads/eee.png') no-repeat center center fixed;
        background-size: cover;
        margin: 0;
        padding: 0;
      }

      .banner {
        width: 100%;
        padding: 60px 0;
        background: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(5px);
        display: flex;
        justify-content: center;
        align-items: center;
        color: white;
        font-size: 2.5em;
        font-weight: bold;
        text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.7);
        margin-bottom: 30px;
      }

      .timeline {
        position: relative;
        padding: 20px;
      }

      .timeline::before {
        content: '';
        position: absolute;
        left: 60px;
        top: 0;
        bottom: 0;
        width: 4px;
        background: #f8c8dc;
      }

      .card-container {
        display: flex;
        flex-direction: column;
        gap: 20px;
        padding: 20px;
        margin-left: 100px;
      }

      .card {
        background: white;
        border-radius: 10px;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
        padding: 20px;
        width: 100%;
        max-width: 800px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        text-align: left;
        position: relative;
      }

      .card::before {
        content: '';
        position: absolute;
        top: 10px;
        left: 50px;
        width: 20px;
        height: 20px;
        background: #f8c8dc;
        border-radius: 50%;
      }

      .card-time {
        position: absolute;
        top: 10px;
        left: 80px;
        font-size: 0.9em;
        color: #555;
      }

      .card img {
        width: 150px;
        height: 150px;
        border-radius: 10px;
        object-fit: cover;
      }

      .card-content {
        flex: 1;
        margin-right: 20px;
      }

      .card-content h3 {
        margin: 10px 0;
        font-size: 1.5em;
      }

      .card-content p {
        font-size: 1em;
        color: #555;
      }

      .card-content a {
        display: inline-block;
        margin-top: 10px;
        padding: 10px 20px;
        border-radius: 6px;
        background: #007bff;
        color: white;
        text-decoration: none;
      }

      .card-content a:hover {
        background: #0056b3;
      }
    </style>

    <div class="banner">穿搭列表</div>

    <div class="timeline">
      <div class="card-container">
        ${outfits.map(outfit => `
          <div class="card">
            <span class="card-time">${new Date(outfit.created_at).toLocaleString()}</span>
            <div class="card-content">
              <h3>${outfit.title}</h3>
              <div style="max-height: 100px; overflow: hidden;">
                ${marked(outfit.content.substring(0, 200))}...
              </div>
              <div class="card-buttons">
                <a href="/outfit/${outfit.id}">查看详情</a>
                <form method="post" action="/outfit/${outfit.id}/delete" onsubmit="return confirm('确定要删除这条穿搭吗？');" style="display:inline;">
                  <button type="submit">删除</button>
                </form>
              </div>
            </div>
            ${outfit.photo ? `<img src="${outfit.photo}" alt="Outfit Photo">` : ''}
          </div>
        `).join('')}
      </div>
    </div>
    <p style="text-align: center; margin: 20px;">
      <a href="/" style="display: inline-block; padding: 10px 25px; background: rgba(255, 255, 255, 0.9); color: #333; text-decoration: none; border-radius: 25px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); transition: all 0.3s ease;">
        返回首页
      </a>
    </p>
    ${musicPlayerHTML}
  `);
});

// Add GET route for individual diary entries
app.get('/diary/:id', async (req, res) => {
  const { id } = req.params;
  const diary = await db.get('SELECT * FROM diary WHERE id = ?', [id]);

  if (!diary) {
    return res.status(404).send('Diary entry not found');
  }

  res.send(`
    <style>
      body { font-family: Arial, sans-serif; background: #f4f4f9; padding: 20px; }

      .entry {
        max-width: 900px;
        margin: 20px auto;
        background: white;
        border-radius: 10px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.12);
        padding: 20px;
        display: flex;
        gap: 20px;
        align-items: flex-start;
      }

      .entry .content { flex: 1; }

      .entry h2 { margin: 0 0 10px 0; font-size: 1.6em; }
      .entry p { color: #444; line-height: 1.6; }

      .entry .meta { color: #777; font-size: 0.9em; margin-top: 12px; }

      .entry .thumb {
        width: 150px;
        flex: 0 0 150px;
      }

      .entry .thumb img {
        width: 150px;
        height: 150px;
        object-fit: cover;
        border-radius: 8px;
        display: block;
      }

      .back-btn {
        display: inline-block;
        margin-top: 12px;
        padding: 8px 14px;
        background: #007bff;
        color: #fff;
        border-radius: 6px;
        text-decoration: none;
      }

      @media (max-width: 640px) {
        .entry { flex-direction: column; }
        .entry .thumb { width: 100%; flex: none; }
        .entry .thumb img { width: 100%; height: auto; }
      }
    </style>

    <div class="entry">
      <div class="content">
        <h2>${diary.title}</h2>
        <p>${diary.content}</p>
        <div class="meta">${new Date(diary.created_at).toLocaleDateString()}</div>
        <a class="back-btn" href="/diary-list">返回日记列表</a>
      </div>
      ${diary.photo ? '<div class="thumb"><img src="' + diary.photo + '" alt="Diary Photo"></div>' : ''}
    </div>
  `);
});

// Add similar GET routes for note, food, and outfit entries
app.get('/note/:id', async (req, res) => {
  const { id } = req.params;
  const note = await db.get('SELECT * FROM note WHERE id = ?', [id]);

  if (!note) {
    return res.status(404).send('Note entry not found');
  }

  res.send(`
    <style>
      body {
        font-family: Arial, sans-serif;
        background: url('/uploads/rain.png') no-repeat center center fixed;
        background-size: cover;
        margin: 0;
        padding: 40px 20px;
        min-height: 100vh;
      }
      .article {
        max-width: 800px;
        margin: 0 auto;
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(10px);
        border-radius: 20px;
        box-shadow: 0 4px 25px rgba(0, 0, 0, 0.15);
        padding: 30px;
        border: 1px solid rgba(255, 255, 255, 0.2);
      }
    </style>

    <div class="article">
      <a href="/note-list" style="display: inline-block; margin-bottom: 20px; color: #007bff; text-decoration: none;">← 返回笔记列表</a>
      <h1 style="margin: 0 0 10px 0; font-size: 2em; color: #2c3e50;">${note.title}</h1>
      <div style="color: #666; font-size: 0.9em; margin-bottom: 20px;">
        发布于: ${new Date(note.created_at).toLocaleString()}
      </div>
      ${note.photo ? `<img src="/${note.photo}" alt="${note.title}" style="max-width: 100%; border-radius: 12px; margin: 20px 0; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">` : ''}
      <div style="line-height: 1.8; color: #333;">
        ${marked(note.content)}
      </div>
    </div>
    ${musicPlayerHTML}
  `);
});

app.get('/food/:id', async (req, res) => {
  const { id } = req.params;
  const food = await db.get('SELECT * FROM food WHERE id = ?', [id]);

  if (!food) {
    return res.status(404).send('美食记录不存在');
  }

  res.send(`
    <style>
      body {
        font-family: Arial, sans-serif;
        background: url('/uploads/food.png') no-repeat center center fixed;
        background-size: cover;
        margin: 0;
        padding: 40px 20px;
        min-height: 100vh;
      }
      .article {
        max-width: 800px;
        margin: 0 auto;
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(10px);
        border-radius: 20px;
        box-shadow: 0 4px 25px rgba(0, 0, 0, 0.15);
        padding: 30px;
        border: 1px solid rgba(255, 255, 255, 0.2);
      }
      .entry p { color:#444; line-height:1.6; }
      .entry .meta { color:#777; font-size:0.9em; margin-top:12px; }
      .entry .thumb { width:150px; flex:0 0 150px; }
      .entry .thumb img { width:150px; height:150px; object-fit:cover; border-radius:8px; display:block; }
      .back-btn { display:inline-block; margin-top:12px; padding:8px 14px; background:#007bff; color:#fff; border-radius:6px; text-decoration:none; }
      @media (max-width:640px){ .entry{flex-direction:column;} .entry .thumb{width:100%;flex:none;} .entry .thumb img{width:100%;height:auto;} }
    </style>

    <div class="article">
      <a href="/food-list" style="display: inline-block; margin-bottom: 20px; color: #007bff; text-decoration: none;">← 返回美食列表</a>
      <h1 style="margin: 0 0 10px 0; font-size: 2em; color: #2c3e50;">${food.title}</h1>
      <div style="color: #666; font-size: 0.9em; margin-bottom: 20px;">
        发布于: ${new Date(food.created_at).toLocaleString()}
      </div>
      ${food.photo ? `<img src="/${food.photo}" alt="${food.title}" style="max-width: 100%; border-radius: 12px; margin: 20px 0; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">` : ''}
      <div style="line-height: 1.8; color: #333;">
        ${marked(food.content)}
      </div>
    </div>
    ${musicPlayerHTML}
  `);
});

app.get('/outfit/:id', async (req, res) => {
  const { id } = req.params;
  const outfit = await db.get('SELECT * FROM outfit WHERE id = ?', [id]);

  if (!outfit) {
    return res.status(404).send('Outfit entry not found');
  }

  res.send(`
    <style>
      body {
        font-family: Arial, sans-serif;
        background: url('/uploads/lubi.png') no-repeat center center fixed;
        background-size: cover;
        margin: 0;
        padding: 40px 20px;
        min-height: 100vh;
      }
      .article {
        max-width: 800px;
        margin: 0 auto;
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(10px);
        border-radius: 20px;
        box-shadow: 0 4px 25px rgba(0, 0, 0, 0.15);
        padding: 30px;
        border: 1px solid rgba(255, 255, 255, 0.2);
      }
    </style>

    <div class="article">
      <a href="/outfit-list" style="display: inline-block; margin-bottom: 20px; color: #007bff; text-decoration: none;">← 返回穿搭列表</a>
      <h1 style="margin: 0 0 10px 0; font-size: 2em; color: #2c3e50;">${outfit.title}</h1>
      <div style="color: #666; font-size: 0.9em; margin-bottom: 20px;">
        发布于: ${new Date(outfit.created_at).toLocaleString()}
      </div>
      ${outfit.photo ? `<img src="/${outfit.photo}" alt="${outfit.title}" style="max-width: 100%; border-radius: 12px; margin: 20px 0; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">` : ''}
      <div style="line-height: 1.8; color: #333;">
        ${marked(outfit.content)}
      </div>
    </div>
    ${musicPlayerHTML}
    </div>
  `);
});

  // ==================== POST handlers统一：diary/food/note/outfit ====================
  app.post('/diary', upload.single('photo'), async (req, res) => {
    const { title, content } = req.body;
    const photoPath = req.file ? '/uploads/' + req.file.filename : null;
    await db.run('INSERT INTO diary (title, content, photo) VALUES (?, ?, ?)', [title, content, photoPath]);
    res.redirect('/diary-list');
  });

  // delete diary
  app.post('/diary/:id/delete', async (req, res) => {
    const { id } = req.params;
    await db.run('DELETE FROM diary WHERE id = ?', [id]);
    res.redirect('/diary-list');
  });

  app.post('/food', upload.single('photo'), async (req, res) => {
    const { title, content } = req.body;
    const photoPath = req.file ? '/uploads/' + req.file.filename : null;
    await db.run('INSERT INTO food (title, content, photo) VALUES (?, ?, ?)', [title, content, photoPath]);
    res.redirect('/food-list');
  });

  // delete food
  app.post('/food/:id/delete', async (req, res) => {
    const { id } = req.params;
    await db.run('DELETE FROM food WHERE id = ?', [id]);
    res.redirect('/food-list');
  });

  app.post('/note', upload.single('photo'), async (req, res) => {
    const { title, content } = req.body;
    const photoPath = req.file ? '/uploads/' + req.file.filename : null;
    await db.run('INSERT INTO note (title, content, photo) VALUES (?, ?, ?)', [title, content, photoPath]);
    res.redirect('/note-list');
  });

  // delete note
  app.post('/note/:id/delete', async (req, res) => {
    const { id } = req.params;
    await db.run('DELETE FROM note WHERE id = ?', [id]);
    res.redirect('/note-list');
  });

  app.post('/outfit', upload.single('photo'), async (req, res) => {
    const { title, content } = req.body;
    const photoPath = req.file ? '/uploads/' + req.file.filename : null;
    await db.run('INSERT INTO outfit (title, content, photo) VALUES (?, ?, ?)', [title, content, photoPath]);
    res.redirect('/outfit-list');
  });

  // delete outfit
  app.post('/outfit/:id/delete', async (req, res) => {
    const { id } = req.params;
    await db.run('DELETE FROM outfit WHERE id = ?', [id]);
    res.redirect('/outfit-list');
  });

app.listen(port, () => {
  console.log(`服务器已启动，访问地址：http://localhost:${port}`);
});
