const fs = require('fs');
const content = fs.readFileSync('scratch_operix.html', 'utf8');

const homeSection = content.match(/<section[^>]*id="home"[^>]*>([\s\S]*?)<\/section>/i);
if (homeSection) {
  console.log('Home section length:', homeSection[1].length);
  // find all divs with class or id
  const divs = homeSection[1].match(/<(div|a|button|span|img|h1|h2)[^>]*>/gi) || [];
  console.log('Home elements count:', divs.length);
  divs.slice(0, 30).forEach(d => console.log(' ', d.slice(0, 100)));
}
