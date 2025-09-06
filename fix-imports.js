const fs = require('fs');
const path = require('path');

const directory = path.join(__dirname, 'src');

// Map of incorrect imports to correct ones
const importMap = {
  "from \"@/components/ui/button\"": "from \"@/components/ui/Button\"",
  "from \"@/components/ui/input\"": "from \"@/components/ui/Input\"",
  "from \"@/components/ui/label\"": "from \"@/components/ui/Label\"",
  "from \"@/components/ui/select\"": "from \"@/components/ui/Select\""
};

function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;

    Object.entries(importMap).forEach(([incorrect, correct]) => {
      if (content.includes(incorrect)) {
        content = content.replace(new RegExp(incorrect, 'g'), correct);
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
