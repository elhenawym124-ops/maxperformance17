const fs = require('fs');

const academyPages = [
  'AcademyCatalogPage',
  'AcademyCoursesPage',
  'AcademyStudentsPage',
  'AcademyCourseEditorPage',
  'AcademyLessonViewerPage'
];

function searchInDir(dir, names) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  for (const f of files) {
    const full = dir + '/' + f.name;
    if (f.isDirectory()) {
      if (!f.name.includes('node_modules') && !f.name.includes('.git') && !f.name.includes('dist')) {
        searchInDir(full, names);
      }
    } else if (f.name.endsWith('.tsx') || f.name.endsWith('.ts')) {
      const content = fs.readFileSync(full, 'utf8');
      names.forEach(name => {
        if (content.includes(name)) {
          console.log(`Found ${name} in ${full}`);
          const lines = content.split('\n');
          lines.forEach((l, idx) => {
            if (l.includes(name) || l.includes('path=')) {
              console.log(`   ${idx+1}: ${l.trim()}`);
            }
          });
        }
      });
    }
  }
}

searchInDir('apps/frontend/src', academyPages);
