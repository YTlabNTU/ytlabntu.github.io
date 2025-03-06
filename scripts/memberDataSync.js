const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const csv = require('csvtojson');
const yaml = require('js-yaml');

// 請將此處換成你的 Google Sheets CSV URL
const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/1RGmQ2-gbt0p9A2Zvr7ywIek-y2NZDBW88Mklz6sk0zg/export?format=csv&gid=1209924479';

/**
 * 同步資料
 * @param {string} direction 同步方向：
 *      "download" 代表從 Google Sheets 下載 CSV 並更新 Markdown 檔案，
 *      "upload" 代表從本地 Markdown 解析資料後產生 CSV 匯出檔案。
 */
async function syncData(direction = 'download') {
  if (direction === 'download') {
    try {
      // 從 Google Sheets 取得 CSV 內容
      const response = await fetch(SHEET_CSV_URL);
      const csvText = await response.text();
      // 轉換成 JSON 格式，每一筆代表一位成員
      const jsonData = await csv().fromString(csvText);

      // 依照每筆資料產生 Markdown 檔案
      jsonData.forEach(item => {
        const markdownContent = generateMarkdown(item);
        // 利用 join_date 與 permalink 組合成檔案名稱，並移除空白
        // 'team/yutinghsu -> yutinghsu
        const fileName = (item.join_date + '-' + item.permalink.split('/')[1]).replace(/\s+/g, '_') + '.md';
        if (!fileName) {
          // 沒有檔名，跳過
          return;
        }
        const filePath = path.join(__dirname, '..', '_pages', 'team', '_posts', fileName);
        fs.writeFileSync(filePath, markdownContent);
        console.log(`已更新檔案：${filePath}`);
      });
    } catch (error) {
      console.error('同步資料失敗：', error);
    }
  } else if (direction === 'upload') {
    // 反向同步：從本地 Markdown 產生 CSV 匯出檔案
    try {
      const postsDir = path.join(__dirname, '..', '_pages', 'team', '_posts');
      const files = fs.readdirSync(postsDir).filter(file => file.endsWith('.md'));
      const records = [];

      files.forEach(file => {
        const filePath = path.join(postsDir, file);
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const { frontMatter, content } = parseMarkdownFile(fileContent);
        const record = flattenFrontMatter(frontMatter);
        // 將內文中 Bio 部分也納入紀錄
        record.bio = extractBio(content);
        // 可選擇從檔名中提取 join_date（假設檔名以日期開頭，例如 "2023-05-01"）
        const joinDateMatch = file.match(/^(\d{4}-\d{2}-\d{2})/);
        if (joinDateMatch) {
          record.join_date = joinDateMatch[1];
        }
        records.push(record);
      });
      
      const csvData = generateCSV(records);
      const exportFilePath = path.join(__dirname, 'members.csv');
      fs.writeFileSync(exportFilePath, csvData);
      console.log(`已產生匯出檔案：${exportFilePath}`);
    } catch (error) {
      console.error('匯出 CSV 檔案失敗：', error);
    }
  } else {
    console.error('無效的同步方向：請選擇 "download" 或 "upload"');
  }
}

function generateMarkdown(data) {
  let educationBlock = '';
  if (data.education) {
    const educations = data.education
      .split(';')
      .map(e => e.trim())
      .filter(e => e.length > 0);
    if (educations.length > 0) {
      educationBlock = 'education:\n';
      educations.forEach(e => {
        educationBlock += `  - "${e}"\n`;
      });
    }
  } else {
    educationBlock = 'education: ""\n';
  }
  // 產生 YAML 前置資料，請依需求調整欄位
  const frontMatter = `---
layout: member
category: ${data.category || 'team'}
title: ${data.title || '無標題'}
chtitle: ${data.chtitle || ''}
image: ${data.image || ''}
role: ${data.role || ''}
permalink: '${data.permalink || ''}'
social:
  email: ${data.social_email || ''}
  twitter: ${data.social_twitter || ''}
  linkedin: ${data.social_linkedin || ''}
  google-scholar: ${data.social_google_scholar || ''}
  github: ${data.social_github || ''}
  website: ${data.social_website || ''}
  orcid: ${data.social_orcid || ''}
  researchgate: ${data.social_researchgate || ''}
  facebook: ${data.social_facebook || ''}
  instagram: ${data.social_instagram || ''}
${educationBlock}
---`;

const content = `
${data.bio || ''}
`;
  return frontMatter + '\n' + content;
}

/**
 * 解析 Markdown 檔案中的 YAML 前置資料
 */
function parseMarkdownFile(fileContent) {
  // 假設 YAML 前置資料在第一對 --- 之間
  const parts = fileContent.split('---');
  if (parts.length < 3) {
    return { frontMatter: {}, content: fileContent };
  }
  const frontMatterText = parts[1];
  const remainingContent = parts.slice(2).join('---');
  let frontMatter;
  try {
    frontMatter = yaml.load(frontMatterText);
  } catch (e) {
    frontMatter = {};
  }
  return { frontMatter, content: remainingContent.trim() };
}

/**
 * 將 YAML 前置資料平坦化，例如將 social 物件展開成獨立欄位
 */
function flattenFrontMatter(frontMatter) {
  const record = { ...frontMatter };
  if (frontMatter.social && typeof frontMatter.social === 'object') {
    record.social_email = frontMatter.social.email || '';
    record.social_twitter = frontMatter.social.twitter || '';
    record.social_linkedin = frontMatter.social.linkedin || '';
    record.social_google_scholar = frontMatter.social['google-scholar'] || frontMatter.social.google_scholar || '';
    record.social_github = frontMatter.social.github || '';
    record.social_website = frontMatter.social.website || '';
    record.social_orcid = frontMatter.social.orcid || '';
    record.social_researchgate = frontMatter.social.researchgate || '';
    record.social_facebook = frontMatter.social.facebook || '';
    record.social_instagram = frontMatter.social.instagram || '';
    delete record.social;
  }
  if (Array.isArray(record.education)) {
    record.education = record.education.join('; ');
  }
  return record;
}

/**
 * 簡單處理 Bio 區塊內容，可依需求調整，例如去除標籤
 */
function extractBio(content) {
  // 刪除<h3>bio</h3>標籤
  content = content.replace(/<h3\b[^>]*>Bio<\/h3>/gi, '');
  return content;
}

/**
 * 輔助函式：處理 CSV 欄位值（處理雙引號、逗號、換行等）
 */
function escapeCSV(value) {
  if (value == null) return '';
  value = value.toString();
  if (value.includes('"') || value.includes(',') || value.includes('\n')) {
    value = value.replace(/"/g, '""');
    return `"${value}"`;
  }
  return value;
}

/**
 * 產生 CSV 檔案字串
 */
function generateCSV(records) {
  // 收集所有欄位名稱（標題）
  const keysSet = new Set();
  records.forEach(record => {
    Object.keys(record).forEach(key => keysSet.add(key));
  });
  const headers = Array.from(keysSet);
  const lines = [];
  lines.push(headers.join(','));
  records.forEach(record => {
    const row = headers.map(key => escapeCSV(record[key] || ''));
    lines.push(row.join(','));
  });
  return lines.join('\n');
}

// 可透過命令列參數指定同步方向，例如：
// node syncData.js download  或  node syncData.js upload
const direction = process.argv[2] || 'download';
syncData(direction);
