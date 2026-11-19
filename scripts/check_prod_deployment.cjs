const https = require('https');

function fetchPath(p) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: '153.92.223.119',
      port: 443,
      path: p,
      method: 'GET',
      rejectUnauthorized: false,
      headers: {
        'Host': 'maxp.online',
        'User-Agent': 'Mozilla/5.0'
      }
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.end();
  });
}

(async () => {
  const html = await fetchPath('/procurement/purchase-orders/new');
  const allScripts = Array.from(html.matchAll(/\/assets\/[^"']+\.js/g)).map(m => m[0]);
  console.log(`Checking ${allScripts.length} scripts found in production HTML...`);
  
  let found = false;
  for (const s of allScripts) {
    const content = await fetchPath(s);
    if (content.includes('groupCatalogItems') || content.includes('متغيرات')) {
      console.log(`✅ Found hierarchical code in ${s}!`);
      found = true;
      break;
    }
  }

  if (!found) {
    console.log('⚠️ Hierarchical code NOT yet in initial bundles, checking dynamic route chunks...');
    // Look for route-procurement chunk in index bundle
    const indexContent = await fetchPath('/assets/index-B3aVrcPl.js');
    const routeMatches = indexContent.match(/route-[a-zA-Z0-9_-]+\.js/g) || [];
    console.log('Potential route chunks:', Array.from(new Set(routeMatches)).slice(0, 10));
    for (const r of Array.from(new Set(routeMatches))) {
      if (r.includes('procurement') || r.includes('PurchaseOrder')) {
        const c = await fetchPath(`/assets/${r}`);
        if (c.includes('groupCatalogItems') || c.includes('متغيرات')) {
          console.log(`✅ Found hierarchical code in dynamic chunk /assets/${r}!`);
          found = true;
          break;
        }
      }
    }
  }

  console.log('Deployment status check finished. Found:', found);
})();
