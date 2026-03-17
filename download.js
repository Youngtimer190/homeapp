import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const repo = 'Youngtimer190/homeapp';
const apiUrl = `https://api.github.com/repos/${repo}/contents`;

async function downloadRepoContents(dir = '') {
  try {
    const { data } = await axios.get(apiUrl + (dir ? `/${dir}` : ''), {
      headers: { 'User-Agent': 'Node.js' }
    });
    
    for (const item of data) {
      if (item.type === 'dir') {
        // Create directory and download its contents
        const dirPath = path.join(__dirname, item.path);
        if (!fs.existsSync(dirPath)) {
          fs.mkdirSync(dirPath, { recursive: true });
        }
        await downloadRepoContents(item.path);
      } else if (item.type === 'file') {
        // Download file
        const filePath = path.join(__dirname, item.path);
        // Skip if already exists (optional)
        // if (fs.existsSync(filePath)) {
        //   console.log(`Skipping ${item.path} (already exists)`);
        //   continue;
        // }
        // Download file content
        let content;
        if (item.download_url) {
          // Use arraybuffer for binary files, but works for text too
          const response = await axios.get(item.download_url, { responseType: 'arraybuffer' });
          content = Buffer.from(response.data);
        } else {
          // For small files, content might be in item.content (base64)
          if (item.content && item.encoding === 'base64') {
            content = Buffer.from(item.content, 'base64');
          } else {
            console.log(`No download URL for ${item.path}`);
            continue;
          }
        }
        // Ensure directory exists
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(filePath, content);
        console.log(`Downloaded ${item.path}`);
      }
    }
  } catch (error) {
    console.error(`Error downloading ${dir}:`, error.message);
  }
}

// Run download
console.log('Downloading repository...');
downloadRepoContents().then(() => {
  console.log('Download completed.');
}).catch(err => {
  console.error('Download failed:', err);
  process.exit(1);
});