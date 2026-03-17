import axios from 'axios';

const repo = 'Youngtimer190/homeapp';
const apiUrl = `https://api.github.com/repos/${repo}/contents`;

async function listRepoContents(dir = '', indent = '') {
  try {
    const { data } = await axios.get(apiUrl + (dir ? `/${dir}` : ''), {
      headers: { 'User-Agent': 'Node.js' }
    });
    
    for (const item of data) {
      console.log(indent + item.path + ' (' + item.type + ')');
      if (item.type === 'dir') {
        await listRepoContents(item.path, indent + '  ');
      }
    }
  } catch (error) {
    console.error(`Error listing ${dir}:`, error.message);
  }
}

console.log('Repository structure:');
listRepoContents().then(() => {
  console.log('Done.');
});