const fs = require('fs');
const path = require('path');

const directory = path.join(__dirname, 'src');

// Replace only Button -> button to match the renamed file 'button.jsx'
// Works with alias '@/components/...' and relative paths like '../../components/...'
const patterns = [
  { name: 'Button', regex: /from\s+(["'])([^"']*components\/ui\/)Button\1/g, replacement: 'from $1$2button$1' }
];

function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;

    patterns.forEach(({ regex, replacement, name }) => {
      const before = content;
      content = content.replace(regex, replacement);
      if (before !== content) {
        updated = true;
      }
    });

    if (updated) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated imports in ${filePath}`);
    }
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      walkDir(fullPath);
    } else if (file.endsWith('.jsx') || file.endsWith('.js') || file.endsWith('.tsx') || file.endsWith('.ts')) {
      processFile(fullPath);
    }
  });
}

console.log('Fixing imports...');
walkDir(directory);
console.log('Done!');
