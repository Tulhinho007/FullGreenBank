const fs = require('fs');
const path = require('path');

const dirs = [
  path.join(__dirname, 'client/src/pages'),
  path.join(__dirname, 'client/src/components/ui')
];

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      const original = content;

      // Update backdrops
      content = content.replace(/bg-black\/40\s+backdrop-blur-sm/g, 'bg-slate-900/50 backdrop-blur-[6px]');
      content = content.replace(/bg-black\/60\s+backdrop-blur-sm/g, 'bg-slate-900/50 backdrop-blur-[6px]');
      content = content.replace(/bg-slate-900\/40\s+backdrop-blur-md/g, 'bg-slate-900/50 backdrop-blur-[6px]');
      content = content.replace(/bg-slate-900\/60\s+backdrop-blur-md/g, 'bg-slate-900/50 backdrop-blur-[6px]');
      content = content.replace(/bg-black\/40/g, 'bg-slate-900/50 backdrop-blur-[6px]');
      content = content.replace(/bg-black\/60/g, 'bg-slate-900/50 backdrop-blur-[6px]');
      
      // Fix duplicate blur if any
      content = content.replace(/backdrop-blur-\[6px\]\s+backdrop-blur-sm/g, 'backdrop-blur-[6px]');

      // Update modal containers
      // Example: bg-white border border-slate-100 w-full max-w-md rounded-[2.5rem] shadow-2xl
      content = content.replace(/bg-white border border-slate-100(.*?)rounded-\[2\.5rem\] shadow-2xl/g, 'nm-modal border-none$1rounded-[2.5rem]');
      content = content.replace(/bg-white border border-slate-100(.*?)rounded-2xl shadow-2xl/g, 'nm-modal border-none$1rounded-[2.5rem]');
      content = content.replace(/bg-surface-100 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl/g, 'nm-modal w-full max-w-lg overflow-hidden rounded-[2.5rem]');
      content = content.replace(/bg-white rounded-2xl shadow-xl/g, 'nm-modal rounded-[2.5rem]');
      content = content.replace(/bg-white p-6 rounded-2xl max-w-sm w-full shadow-xl/g, 'nm-modal p-6 rounded-[2.5rem] max-w-sm w-full');
      content = content.replace(/bg-white border border-slate-100(.*?)rounded-\[3rem\] shadow-2xl/g, 'nm-modal border-none$1rounded-[3rem]');
      content = content.replace(/bg-white rounded-2xl p-6/g, 'nm-modal rounded-[2.5rem] p-6');
      content = content.replace(/shadow-2xl/g, ''); // Clear remaining shadow-2xl

      if (content !== original) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated: ${fullPath}`);
      }
    }
  }
}

dirs.forEach(processDirectory);
console.log('Modals neumorphism update complete.');
