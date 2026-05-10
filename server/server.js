require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Client } = require('@notionhq/client');
const { NotionToMarkdown } = require('notion-to-md');
const { marked } = require('marked');

const app = express();
app.use(cors());

// 노션 API 클라이언트 초기화
const notion = new Client({ auth: process.env.NOTION_API_KEY });
const n2m = new NotionToMarkdown({ notionClient: notion });

// 게시글 목록 가져오기 API
app.get('/api/posts', async (req, res) => {
  try {
    const databaseId = process.env.NOTION_DATABASE_ID;
    
    if (!process.env.NOTION_API_KEY || !databaseId) {
       return res.status(400).json({ error: "노션 API 키 또는 데이터베이스 ID가 설정되지 않았습니다." });
    }

    const response = await notion.databases.query({
      database_id: databaseId,
      // 필요한 경우 필터를 걸 수 있습니다. 예: status 필드가 Published인 것만
      // filter: { property: "상태", select: { equals: "발행" } },
      sorts: [
        {
          timestamp: "created_time",
          direction: "descending"
        }
      ]
    });
    res.json(response);
  } catch (error) {
    console.error("Notion DB Query Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// 단일 게시글 노션 페이지의 본문을 HTML로 가져오기 API
app.get('/api/posts/:id', async (req, res) => {
  try {
    const pageId = req.params.id;
    
    // 1. 노션 블록들을 마크다운으로 변환
    const mdblocks = await n2m.pageToMarkdown(pageId);
    const mdString = n2m.toMarkdownString(mdblocks);
    
    // 2. 마크다운을 HTML 문서로 변환
    const html = marked.parse(mdString.parent || mdString);
    
    res.send(html);
  } catch (error) {
    console.error("Notion Page Render Error:", error);
    res.status(500).send("에러가 발생했습니다: " + error.message);
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Notion Proxy Server is running on http://localhost:${PORT}`);
});
