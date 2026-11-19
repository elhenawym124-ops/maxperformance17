const fs = require('fs');
const path = require('path');

function replaceInFile(relPath, fn) {
  const fullPath = path.resolve(relPath);
  if (!fs.existsSync(fullPath)) return;
  let text = fs.readFileSync(fullPath, 'utf8');
  const isCRLF = text.includes('\r\n');
  if (isCRLF) text = text.replace(/\r\n/g, '\n');
  const newText = fn(text);
  if (newText !== text) {
    fs.writeFileSync(fullPath, isCRLF ? newText.replace(/\n/g, '\r\n') : newText, 'utf8');
    console.log(`Updated: ${relPath}`);
  }
}

// 1. InterviewsGrid.tsx
replaceInFile('apps/frontend/src/pages/hr/recruitment/sections/interviews/InterviewsGrid.tsx', content => {
  return content
    .replace(/bg-gradient-to-br from-violet-500\/5 to-fuchsia-500\/5 rounded-\[2rem\][^\"]*/g, 'hidden')
    .replace(/rounded-\[2rem\] p-6 shadow-sm hover:shadow-xl hover:border-violet-200 dark:hover:border-violet-900\/50/g, 'rounded-2xl border border-border/70 bg-card p-5 shadow-xs')
    .replace(/text-violet-600 dark:text-violet-400/g, 'text-primary')
    .replace(/bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-xl shadow-lg hover:shadow-violet-500\/30 hover:-translate-y-1 transition-all duration-300 font-bold/g, 'bg-primary text-primary-foreground rounded-xl shadow-xs font-medium')
    .replace(/w-16 h-16 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin/g, 'animate-spin rounded-full h-10 w-10 border-b-2 border-primary')
    .replace(/<div className=\"w-8 h-8 bg-violet-100 rounded-full animate-pulse\" \/>/g, '');
});

// 2. InterviewScheduleModal.tsx
replaceInFile('apps/frontend/src/pages/hr/recruitment/sections/interviews/InterviewScheduleModal.tsx', content => {
  return content
    .replace(/focus:border-violet-500/g, 'focus:border-primary')
    .replace(/border-violet-500 bg-violet-50 dark:bg-violet-900\/20 text-violet-700/g, 'border-primary bg-primary/10 text-primary')
    .replace(/bg-violet-100 text-violet-700 rounded-lg hover:bg-violet-200/g, 'bg-primary/10 text-primary border border-primary/20 rounded-lg hover:bg-primary/20')
    .replace(/bg-gradient-to-r from-violet-50 to-fuchsia-50 dark:from-violet-900\/30 dark:to-fuchsia-900\/30 text-violet-700 dark:text-violet-300 rounded-full border border-violet-100 dark:border-violet-800/g, 'bg-primary/10 text-primary rounded-full border border-primary/20')
    .replace(/text-violet-500/g, 'text-primary');
});

// 3. OverviewSection.tsx in assets
replaceInFile('apps/frontend/src/pages/hr/assets/sections/OverviewSection.tsx', content => {
  let c = content;
  // Banner replacement
  c = c.replace(/className=\"bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 rounded-\[2.5rem\] p-10 shadow-2xl overflow-hidden relative text-white group\"/g,
    'className="rounded-2xl border border-border/70 bg-card p-6 shadow-xs relative overflow-hidden text-card-foreground"');
  c = c.replace(/className=\"text-4xl font-black mb-6 tracking-tight\"/g,
    'className="text-xl sm:text-2xl font-bold tracking-tight text-foreground mb-2"');
  c = c.replace(/className=\"text-xl text-indigo-100\/90 mb-8 font-medium leading-relaxed\"/g,
    'className="text-xs sm:text-sm text-muted-foreground mb-4 leading-relaxed"');
  c = c.replace(/className=\"flex items-center gap-2 text-sm font-black bg-white\/20 backdrop-blur-xl px-6 py-3 rounded-2xl border border-white\/30 shadow-lg\"/g,
    'className="flex items-center gap-2 text-xs font-semibold bg-primary/10 text-primary px-3 py-1.5 rounded-lg border border-primary/20"');
  c = c.replace(/text-indigo-200/g, 'text-primary');
  c = c.replace(/<div className=\"absolute top-0 right-0 w-96 h-96 bg-white\/10 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-white\/20 transition-colors duration-700\"><\/div>/g, '');
  c = c.replace(/ComputerDesktopIcon className=\"absolute -left-10 -bottom-10 h-80 w-80 text-white\/5 -rotate-12 group-hover:rotate-0 transition-transform duration-1000 ease-in-out\"/g,
    'ComputerDesktopIcon className="hidden"');
  // Stat cards
  c = c.replace(/bg-white dark:bg-gray-800 rounded-\[2rem\] p-7 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-2xl/g,
    'rounded-2xl border border-border/70 bg-card shadow-xs p-5');
  c = c.replace(/text-4xl font-black text-gray-900 dark:text-white tabular-nums/g,
    'text-2xl sm:text-3xl font-bold font-mono tabular-nums text-foreground');
  return c;
});

// 4. DocumentUploadModal.tsx in assets
replaceInFile('apps/frontend/src/pages/hr/assets/sections/documents/DocumentUploadModal.tsx', content => {
  return content
    .replace(/min-h-screen px-4/g, 'min-h-full flex items-center justify-center p-4')
    .replace(/bg-indigo-600 hover:bg-indigo-700/g, 'bg-primary hover:bg-primary/90 text-primary-foreground')
    .replace(/bg-indigo-600/g, 'bg-primary text-primary-foreground');
});

// 5. CustodyHistory.tsx in assets
replaceInFile('apps/frontend/src/pages/hr/assets/CustodyHistory.tsx', content => {
  return content
    .replace(/<div className=\"absolute -left-10 -bottom-10 w-40 h-40 bg-indigo-500\/5 rounded-full blur-3xl opacity[^\"]*\" \/>/g, '')
    .replace(/bg-indigo-600 hover:bg-indigo-700/g, 'bg-primary hover:bg-primary/90 text-primary-foreground')
    .replace(/bg-indigo-600/g, 'bg-primary text-primary-foreground');
});

// 6. AssetCategories.tsx in assets
replaceInFile('apps/frontend/src/pages/hr/assets/AssetCategories.tsx', content => {
  return content
    .replace(/<div className=\"absolute top-0 right-0 w-32 h-32 bg-indigo-500\/5 rounded-full -mr-16 -mt-16 blur-2xl[^\"]*\" \/>/g, '')
    .replace(/p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-600\/20/g, 'p-2.5 bg-primary/10 border border-primary/20 text-primary rounded-xl')
    .replace(/bg-indigo-600 hover:bg-indigo-700/g, 'bg-primary hover:bg-primary/90 text-primary-foreground')
    .replace(/bg-indigo-600/g, 'bg-primary text-primary-foreground');
});

// 7. AssetForm.tsx, AssetSuppliers.tsx, MyAssetRequests.tsx, AssetsDashboard.tsx
['AssetForm.tsx', 'AssetSuppliers.tsx', 'MyAssetRequests.tsx', 'AssetsDashboard.tsx'].forEach(f => {
  replaceInFile(`apps/frontend/src/pages/hr/assets/${f}`, content => {
    return content
      .replace(/bg-indigo-600 hover:bg-indigo-700/g, 'bg-primary hover:bg-primary/90 text-primary-foreground')
      .replace(/bg-indigo-600/g, 'bg-primary text-primary-foreground');
  });
});

console.log('Finished fixing remaining HR slop.');
