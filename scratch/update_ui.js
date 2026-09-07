const fs = require('fs');

let content = fs.readFileSync('src/app/page.tsx', 'utf8');

// Colors & Layout
content = content.replace(/bg-\[\#212121\]/g, 'bg-transparent');
content = content.replace(/bg-\[\#1C1C1C\]/g, 'bg-[#0B192C]/70 backdrop-blur-xl');
content = content.replace(/bg-\[\#2B2B2B\]/g, 'bg-[#1E293B]/60 backdrop-blur-lg');
content = content.replace(/bg-\[\#1E1E1E\]/g, 'bg-[#0B192C]/40 backdrop-blur-sm');
content = content.replace(/border-\[\#3A3A3A\]/g, 'border-slate-700/50');
content = content.replace(/bg-\[\#3A3A3A\]/g, 'bg-gradient-to-r from-slate-700/80 to-slate-800/80 shadow-md border border-slate-600/50');

// Typography
content = content.replace(/text-slate-200/g, 'text-slate-100');
content = content.replace(/text-\[\#FF6C37\]/g, 'text-[#F26522]');

// Orange Buttons (Primary)
content = content.replace(/bg-\[\#FF6C37\] hover:bg-\[\#E55B2B\]/g, 'bg-gradient-to-r from-[#F26522] to-[#FF3B30] hover:scale-[1.02] shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 transition-all duration-300');
content = content.replace(/text-\[\#FF6C37\] hover:text-\[\#ff8f66\]/g, 'text-[#F26522] hover:text-[#FF8F66] transition-colors');

// Blue Buttons (Send)
content = content.replace(/bg-\[\#007fd4\] hover:bg-\[\#006bb3\]/g, 'bg-gradient-to-r from-blue-500 to-indigo-500 hover:scale-[1.02] shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-all duration-300');
content = content.replace(/text-\[\#007fd4\] hover:text-\[\#3399ff\]/g, 'text-blue-400 hover:text-blue-300 transition-colors');

// Rounded corners - general upgrades
content = content.replace(/rounded /g, 'rounded-lg ');
content = content.replace(/rounded"/g, 'rounded-lg"');
content = content.replace(/rounded-lg/g, 'rounded-xl'); // upgrade existing lg to xl
content = content.replace(/rounded-xl shadow-2xl/g, 'rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.5)] border border-slate-700/50');

// Hover states for lists
content = content.replace(/hover:bg-\[\#2B2B2B\]/g, 'hover:bg-slate-800/50 hover:shadow-sm transition-all');

fs.writeFileSync('src/app/page.tsx', content);
console.log('UI updated successfully!');
