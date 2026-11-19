const { PrismaClient } = require('/var/www/backend2/node_modules/@prisma/client');
const p = new PrismaClient();

async function main() {
  const prod = await p.product.findFirst({
    where: { id: 'cmu7svind035gjunl242rt3q8' }
  });
  console.log('Product Name:', prod?.name);
  console.log('Product Metadata:', JSON.stringify(prod?.metadata, null, 2));
}

main().then(() => p.$disconnect()).catch(e => {
  console.error(e);
  p.$disconnect();
});
