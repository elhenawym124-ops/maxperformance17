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
    req.setTimeout(8000, () => {
      req.destroy(new Error('timeout'));
    });
    req.end();
  });
}

(async () => {
  try {
    const html = await fetchPath('/procurement/purchase-orders/new');
    const allScripts = Array.from(html.matchAll(/\/assets\/[^"']+\.js/g)).map(m => m[0]);
    console.log(`Checking ${allScripts.length} scripts in HTML...`);
    
    // Check index chunk to find all chunks
    let allChunks = [...allScripts];
    for (const s of allScripts) {
      if (s.includes('index-')) {
        const idx = await fetchPath(s);
        const matches = idx.match(/\/assets\/[a-zA-Z0-9_\-\.]+\.js/g) || idx.match(/[a-zA-Z0-9_\-\.]+\.js/g) || [];
        for (const m of matches) {
          const chunk = m.startsWith('/assets/') ? m : `/assets/${m}`;
          if (!allChunks.includes(chunk)) allChunks.push(chunk);
        }
      }
    }
    
    console.log(`Total chunks to check: ${allChunks.length}`);
    for (const chunk of allChunks) {
      if (chunk.includes('PurchaseOrder') || chunk.includes('procurement') || chunk.includes('chunk')) {
        const code = await fetchPath(chunk);
        if (code.includes('printable-commercial-sheet')) {
          console.log(`🎉 SUCCESS: Found printable-commercial-sheet deployed in ${chunk}!`);
          process.exit(0);
        }
      }
    }
    console.log('Not yet deployed in procurement chunks...');
  } catch (err) {
    console.error('Error:', err.message);
  }
})();
