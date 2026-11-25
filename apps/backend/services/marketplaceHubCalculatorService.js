function getQrCodeLib() {
  try {
    return require('qrcode');
  } catch {
    return null;
  }
}

const COUNTRY_CONFIG = {
  EGY: { code: 'EGY', nameAr: 'مصر', nameEn: 'Egypt', currency: 'EGP', vatRate: 0.14, amazonDomain: 'amazon.eg', noonSlug: 'egypt-en', jumiaDomain: 'jumia.com.eg' },
  KSA: { code: 'KSA', nameAr: 'السعودية', nameEn: 'Saudi Arabia', currency: 'SAR', vatRate: 0.15, amazonDomain: 'amazon.sa', noonSlug: 'saudi-en', jumiaDomain: null },
  UAE: { code: 'UAE', nameAr: 'الإمارات', nameEn: 'UAE', currency: 'AED', vatRate: 0.05, amazonDomain: 'amazon.ae', noonSlug: 'uae-en', jumiaDomain: null },
};

const AMAZON_CATEGORIES = [
  { id: 'home', nameEn: 'Home', nameAr: 'المنزل', rate: 0.13 },
  { id: 'kitchen', nameEn: 'Kitchen', nameAr: 'المطبخ', rate: 0.13 },
  { id: 'electronics_accessories', nameEn: 'Electronics Accessories', nameAr: 'إكسسوارات الإلكترونيات', rate: 0.12 },
  { id: 'consumer_electronics', nameEn: 'Consumer Electronics', nameAr: 'إلكترونيات استهلاكية', rate: 0.08 },
  { id: 'mobile_phones', nameEn: 'Mobile Phones', nameAr: 'هواتف محمولة', rate: 0.05 },
  { id: 'mobiles_tablets', nameEn: 'Mobiles & Tablets', nameAr: 'الموبايلات والتابلت', rate: 0.06 },
  { id: 'computers', nameEn: 'Personal computers', nameAr: 'أجهزة الكمبيوتر', rate: 0.07 },
  { id: 'pc_store', nameEn: 'PC store', nameAr: 'متجر الكمبيوتر', rate: 0.08 },
  { id: 'apparel', nameEn: 'Apparel', nameAr: 'الملابس', rate: 0.15 },
  { id: 'shoes', nameEn: 'Shoes', nameAr: 'الأحذية', rate: 0.15 },
  { id: 'beauty', nameEn: 'Beauty', nameAr: 'التجميل والعناية', rate: 0.14 },
  { id: 'perfumes', nameEn: 'Perfumes', nameAr: 'العطور', rate: 0.14 },
  { id: 'health_personal_care', nameEn: 'Health & Personal Care', nameAr: 'الصحة والعناية الشخصية', rate: 0.12 },
  { id: 'personal_care_appliances', nameEn: 'Personal care Appliances', nameAr: 'أجهزة العناية الشخصية', rate: 0.10 },
  { id: 'baby', nameEn: 'Baby', nameAr: 'مستلزمات الأطفال', rate: 0.12 },
  { id: 'toys', nameEn: 'Toys', nameAr: 'الألعاب', rate: 0.13 },
  { id: 'automotive', nameEn: 'Automotive', nameAr: 'السيارات', rate: 0.12 },
  { id: 'sports', nameEn: 'Sports', nameAr: 'الرياضة', rate: 0.13 },
  { id: 'outdoor', nameEn: 'Outdoor', nameAr: 'المستلزمات الخارجية', rate: 0.13 },
  { id: 'tools', nameEn: 'Tools & Home Improvement', nameAr: 'الأدوات وتحسين المنزل', rate: 0.12 },
  { id: 'office', nameEn: 'Office products', nameAr: 'المنتجات المكتبية', rate: 0.12 },
  { id: 'pet', nameEn: 'Pet Products', nameAr: 'مستلزمات الحيوانات الأليفة', rate: 0.13 },
  { id: 'grocery', nameEn: 'Grocery', nameAr: 'البقالة', rate: 0.09 },
  { id: 'furniture', nameEn: 'Furniture', nameAr: 'الأثاث', rate: 0.13 },
  { id: 'luggage', nameEn: 'Luggage', nameAr: 'الحقائب والأمتعة', rate: 0.14 },
  { id: 'jewelry', nameEn: 'Jewelry', nameAr: 'المجوهرات', rate: 0.18 },
  { id: 'watches', nameEn: 'Watches', nameAr: 'الساعات', rate: 0.15 },
  { id: 'books', nameEn: 'Books', nameAr: 'الكتب', rate: 0.12 },
  { id: 'camera', nameEn: 'Camera', nameAr: 'الكاميرات', rate: 0.08 },
  { id: 'headphones', nameEn: 'Headphones & Portable audio', nameAr: 'السماعات والصوتيات', rate: 0.10 },
  { id: 'small_appliances', nameEn: 'Small Appliances', nameAr: 'الأجهزة المنزلية الصغيرة', rate: 0.10 },
  { id: 'major_appliances', nameEn: 'Major appliances', nameAr: 'الأجهزة الكهربائية الكبيرة', rate: 0.08 },
  { id: 'televisions', nameEn: 'Televisions', nameAr: 'التلفزيونات', rate: 0.07 },
  { id: 'video_game_consoles', nameEn: 'Video Game Consoles', nameAr: 'أجهزة الألعاب', rate: 0.07 },
  { id: 'video_games', nameEn: 'Video Games', nameAr: 'ألعاب الفيديو', rate: 0.12 },
  { id: 'wireless', nameEn: 'Wireless', nameAr: 'اللاسلكي والإكسسوارات', rate: 0.10 },
  { id: 'all_other', nameEn: 'All Other Categories', nameAr: 'فئات أخرى', rate: 0.13 },
];

const NOON_FAMILIES = [
  { id: 'home_kitchen', nameEn: 'Home & Kitchen', nameAr: 'المنزل والمطبخ', rate: 0.15, types: ['Cookware', 'Decor', 'Storage', 'Bedding'] },
  { id: 'electronics', nameEn: 'Electronics', nameAr: 'الإلكترونيات', rate: 0.09, types: ['Accessories', 'Audio', 'Wearables', 'Cables & Chargers'] },
  { id: 'fashion', nameEn: 'Fashion', nameAr: 'الأزياء', rate: 0.18, types: ['Men Apparel', 'Women Apparel', 'Footwear', 'Bags'] },
  { id: 'health_beauty', nameEn: 'Health & Beauty', nameAr: 'الصحة والجمال', rate: 0.16, types: ['Skincare', 'Haircare', 'Fragrances', 'Makeup'] },
  { id: 'home_appliances', nameEn: 'Home Appliances', nameAr: 'الأجهزة المنزلية', rate: 0.10, types: ['Kitchen Appliances', 'Vacuums', 'Air Care'] },
  { id: 'sports', nameEn: 'Sports & Outdoor', nameAr: 'الرياضة', rate: 0.14, types: ['Fitness Equipment', 'Sportswear', 'Camping'] },
  { id: 'toys', nameEn: 'Toys, Kids & Baby', nameAr: 'الأطفال والألعاب', rate: 0.15, types: ['Baby Care', 'Educational Toys', 'Strollers'] },
  { id: 'automobiles', nameEn: 'Automobiles', nameAr: 'مستلزمات السيارات', rate: 0.13, types: ['Car Accessories', 'Car Care', 'Tools'] },
  { id: 'groceries', nameEn: 'Groceries', nameAr: 'البقالة', rate: 0.10, types: ['Beverages', 'Pantry', 'Snacks'] },
  { id: 'other', nameEn: 'Other Categories', nameAr: 'فئات أخرى', rate: 0.14, types: ['General Merchandise'] },
];

const JUMIA_FAMILIES = [
  { id: 'home_supplies', nameEn: 'Home Supplies', nameAr: 'مستلزمات المنزل', rate: 0.13, types: ['Kitchen & Dining', 'Home Decor', 'Cleaning'] },
  { id: 'fashion', nameEn: 'Fashion', nameAr: 'الأزياء', rate: 0.17, types: ['Clothing', 'Shoes', 'Bags'] },
  { id: 'health_beauty', nameEn: 'Health and Beauty', nameAr: 'الصحة والجمال', rate: 0.15, types: ['Perfumes', 'Skincare', 'Personal Care'] },
  { id: 'mobiles_tablets', nameEn: 'Mobiles and Tablets', nameAr: 'الموبايلات والتابلت', rate: 0.06, types: ['Smartphones', 'Tablets', 'Phone Accessories'] },
  { id: 'computers', nameEn: 'Computers', nameAr: 'الكمبيوتر', rate: 0.08, types: ['Laptops', 'Peripherals', 'Storage'] },
  { id: 'sporting', nameEn: 'Sporting', nameAr: 'الرياضة', rate: 0.13, types: ['Gym & Fitness', 'Outdoor'] },
  { id: 'kids_toys', nameEn: 'Kids supplies and toys', nameAr: 'مستلزمات الأطفال والألعاب', rate: 0.14, types: ['Toys', 'Baby Gear'] },
  { id: 'cars_tools', nameEn: 'Cars and Tools', nameAr: 'السيارات والعدد', rate: 0.12, types: ['Auto Accessories', 'Hand Tools'] },
  { id: 'watches', nameEn: 'Watches', nameAr: 'الساعات', rate: 0.16, types: ['Men Watches', 'Women Watches', 'Smart Watches'] },
  { id: 'grocery', nameEn: 'Grocery', nameAr: 'البقالة', rate: 0.09, types: ['Food Cupboard', 'Beverages'] },
];

const TRENDYOL_CATEGORIES = [
  { id: 'clothing', nameEn: 'Clothing', nameAr: 'الملابس', rate: 0.18, subs: ['T-Shirts & Tops', 'Dresses', 'Trousers & Jeans', 'Outerwear'] },
  { id: 'electronics', nameEn: 'Electronics', nameAr: 'الإلكترونيات', rate: 0.10, subs: ['Mobile Accessories', 'Audio & Headphones', 'Smart Home', 'Chargers'] },
  { id: 'cosmetics', nameEn: 'Cosmetics & Personal Care', nameAr: 'مستحضرات التجميل', rate: 0.16, subs: ['Skincare', 'Haircare', 'Perfume', 'Makeup'] },
  { id: 'home_furniture', nameEn: 'Home & Furniture', nameAr: 'المنزل والأثاث', rate: 0.15, subs: ['Decor', 'Kitchen', 'Textiles', 'Lighting'] },
  { id: 'shoes', nameEn: 'Shoes', nameAr: 'الأحذية', rate: 0.18, subs: ['Sneakers', 'Casual', 'Sports Shoes'] },
  { id: 'accessories', nameEn: 'Accessories', nameAr: 'الإكسسوارات', rate: 0.17, subs: ['Bags', 'Watches', 'Sunglasses', 'Jewelry'] },
  { id: 'mom_baby', nameEn: 'Mom & Baby & Child', nameAr: 'الأم والطفل', rate: 0.15, subs: ['Baby Clothing', 'Feeding', 'Toys'] },
  { id: 'sports', nameEn: 'Sports & Outdoor', nameAr: 'الرياضة', rate: 0.15, subs: ['Activewear', 'Equipment', 'Outdoor'] },
];

const OPPORTUNITY_CATEGORIES = [
  { id: 'automotive', nameEn: 'Automotive', nameAr: 'السيارات', amazonPath: '/gp/bestsellers/automotive' },
  { id: 'baby', nameEn: 'Baby Products', nameAr: 'منتجات الأطفال', amazonPath: '/gp/bestsellers/baby-products' },
  { id: 'beauty', nameEn: 'Beauty', nameAr: 'التجميل والعناية', amazonPath: '/gp/bestsellers/beauty' },
  { id: 'books', nameEn: 'Books', nameAr: 'الكتب', amazonPath: '/gp/bestsellers/books' },
  { id: 'electronics', nameEn: 'Electronics', nameAr: 'الإلكترونيات', amazonPath: '/gp/bestsellers/electronics' },
  { id: 'fashion', nameEn: 'Fashion', nameAr: 'الأزياء', amazonPath: '/gp/bestsellers/fashion' },
  { id: 'grocery', nameEn: 'Grocery', nameAr: 'البقالة', amazonPath: '/gp/bestsellers/grocery' },
  { id: 'health', nameEn: 'Health & Personal Care', nameAr: 'الصحة والعناية الشخصية', amazonPath: '/gp/bestsellers/hpc' },
  { id: 'home', nameEn: 'Home & Kitchen', nameAr: 'المنزل والمطبخ', amazonPath: '/gp/bestsellers/home' },
  { id: 'industrial', nameEn: 'Industrial & Scientific', nameAr: 'المستلزمات الصناعية', amazonPath: '/gp/bestsellers/industrial' },
  { id: 'office', nameEn: 'Office Products', nameAr: 'المنتجات المكتبية', amazonPath: '/gp/bestsellers/office-products' },
  { id: 'patio', nameEn: 'Patio, Lawn & Garden', nameAr: 'الحديقة والمنزل الخارجي', amazonPath: '/gp/bestsellers/lawn-garden' },
  { id: 'pet', nameEn: 'Pet Supplies', nameAr: 'مستلزمات الحيوانات الأليفة', amazonPath: '/gp/bestsellers/pet-supplies' },
  { id: 'sports', nameEn: 'Sports & Outdoors', nameAr: 'الرياضة والرحلات', amazonPath: '/gp/bestsellers/sports' },
  { id: 'tools', nameEn: 'Tools & Home Improvement', nameAr: 'العدد والأدوات', amazonPath: '/gp/bestsellers/tools' },
  { id: 'toys', nameEn: 'Toys & Games', nameAr: 'الألعاب', amazonPath: '/gp/bestsellers/toys' },
  { id: 'video_games', nameEn: 'Video Games', nameAr: 'ألعاب الفيديو', amazonPath: '/gp/bestsellers/videogames' },
  { id: 'watches', nameEn: 'Watches', nameAr: 'الساعات', amazonPath: '/gp/bestsellers/watches' },
];

const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

function computeAmazonShipping(country, shipmentType, weightGrams, lengthCm, widthCm, heightCm) {
  const volumetricGrams = lengthCm > 0 && widthCm > 0 && heightCm > 0
    ? (lengthCm * widthCm * heightCm) / 5
    : 0;
  const billableGrams = Math.max(weightGrams, volumetricGrams);
  const isOversize = billableGrams > 12000 || Math.max(lengthCm, widthCm, heightCm) > 60;

  if (country === 'EGY') {
    const base = shipmentType === 'FBA' ? 45 : shipmentType === 'SELLER_FLEX' ? 42 : 47;
    const extraKg = Math.max(0, Math.ceil((billableGrams - 500) / 1000));
    return {
      shippingFee: round2(base + extraKg * (isOversize ? 12 : 8)),
      tierType: isOversize ? 'oversize' : 'standard',
      billableWeightKg: round2(billableGrams / 1000),
    };
  }
  if (country === 'KSA') {
    const base = shipmentType === 'FBA' ? 14 : 16;
    const extraKg = Math.max(0, Math.ceil((billableGrams - 500) / 1000));
    return {
      shippingFee: round2(base + extraKg * 3),
      tierType: isOversize ? 'oversize' : 'standard',
      billableWeightKg: round2(billableGrams / 1000),
    };
  }
  const base = shipmentType === 'FBA' ? 12 : 14;
  const extraKg = Math.max(0, Math.ceil((billableGrams - 500) / 1000));
  return {
    shippingFee: round2(base + extraKg * 2.5),
    tierType: isOversize ? 'oversize' : 'standard',
    billableWeightKg: round2(billableGrams / 1000),
  };
}

function solveGrossSellingPrice({ targetBasePrice, shippingFee, commissionRate, vatRate }) {
  // Solve P such that:
  // Commission = P * commissionRate
  // VAT on product margin / price + VAT on platform fees = P * (vatRate / (1 + vatRate))
  // Net payout before product cost & profit = P - Commission - Shipping - OutputVATAdjustment
  // Using an iterative/closed-form fee model matching regional gross-inclusive marketplace pricing:
  const feeVatFactor = 1 + vatRate;
  const netFactor = 1 - commissionRate * feeVatFactor - (vatRate / (1 + vatRate)) * 0.85;
  const safeDenominator = Math.max(0.25, netFactor);
  const grossPrice = (targetBasePrice + shippingFee * feeVatFactor) / safeDenominator;
  return round2(grossPrice);
}

function calculateMarketplaceProfit(input) {
  const platform = String(input.platform || 'amazon').toLowerCase();
  const country = String(input.country || 'EGY').toUpperCase();
  const countryMeta = COUNTRY_CONFIG[country] || COUNTRY_CONFIG.EGY;

  const productCost = Math.max(0, Number(input.productCost || 0));
  const profitMarginPct = Math.max(0, Number(input.profitMarginPct || 0));
  const targetProfit = round2(productCost * (profitMarginPct / 100));
  const basePrice = round2(productCost + targetProfit);

  let commissionRate = 0.13;
  let shippingFee = 0;
  let tierType = 'standard';
  let billableWeightKg = 0;

  if (platform === 'amazon') {
    const cat = AMAZON_CATEGORIES.find((c) => c.id === input.category) || AMAZON_CATEGORIES[0];
    commissionRate = cat.rate;
    const ship = computeAmazonShipping(
      country,
      String(input.shipmentType || 'EASY_SHIP').toUpperCase(),
      Math.max(1, Number(input.weightGrams || 500)),
      Math.max(0, Number(input.lengthCm || 0)),
      Math.max(0, Number(input.widthCm || 0)),
      Math.max(0, Number(input.heightCm || 0))
    );
    shippingFee = ship.shippingFee;
    tierType = ship.tierType;
    billableWeightKg = ship.billableWeightKg;
  } else if (platform === 'noon') {
    const fam = NOON_FAMILIES.find((f) => f.id === input.productFamily) || NOON_FAMILIES[0];
    commissionRate = fam.rate;
    const weightKg = Math.max(0.1, Number(input.weightKg || 0.5));
    const isFbn = String(input.fulfillmentType || 'FBN').toUpperCase() === 'FBN';
    const isOversize = String(input.packageType || 'STANDARD').toUpperCase() === 'OVERSIZE';
    tierType = isOversize ? 'oversize' : 'standard';
    billableWeightKg = round2(weightKg);
    if (country === 'EGY') {
      shippingFee = round2((isFbn ? 40 : 48) + Math.max(0, Math.ceil(weightKg - 1)) * (isOversize ? 12 : 8));
    } else {
      shippingFee = round2((isFbn ? 12 : 16) + Math.max(0, Math.ceil(weightKg - 1)) * (isOversize ? 4 : 2.5));
    }
  } else if (platform === 'jumia') {
    const fam = JUMIA_FAMILIES.find((f) => f.id === input.productFamily) || JUMIA_FAMILIES[0];
    commissionRate = fam.rate;
    const size = String(input.productSize || 'SMALL').toUpperCase();
    const isExpress = String(input.warehouseType || 'YOUR_WAREHOUSE').toUpperCase() === 'JUMIA_EXPRESS';
    tierType = size.toLowerCase();
    const sizeFees = { SMALL: 38, MEDIUM: 52, LARGE: 78 };
    shippingFee = round2((sizeFees[size] || 42) + (isExpress ? 12 : 0));
  } else if (platform === 'trendyol') {
    const cat = TRENDYOL_CATEGORIES.find((c) => c.id === input.mainCategory) || TRENDYOL_CATEGORIES[0];
    commissionRate = input.isNewSeller ? Math.max(0.05, cat.rate - 0.03) : cat.rate;
    const weightKg = Math.max(0.1, Number(input.weightKg || 0.5));
    const l = Math.max(0, Number(input.lengthCm || 0));
    const w = Math.max(0, Number(input.widthCm || 0));
    const h = Math.max(0, Number(input.heightCm || 0));
    const volKg = l > 0 && w > 0 && h > 0 ? (l * w * h) / 5000 : 0;
    billableWeightKg = round2(Math.max(weightKg, volKg));
    tierType = billableWeightKg > 5 ? 'heavy' : 'standard';
    shippingFee = round2(15 + Math.max(0, Math.ceil(billableWeightKg - 1)) * 3.5);
  }

  const finalSellingPrice = solveGrossSellingPrice({
    targetBasePrice: basePrice,
    shippingFee,
    commissionRate,
    vatRate: countryMeta.vatRate,
  });

  const finalPriceExVat = round2(finalSellingPrice / (1 + countryMeta.vatRate));
  const commissionFee = round2(finalSellingPrice * commissionRate);
  const vatOnProduct = round2(finalSellingPrice - finalPriceExVat);
  const vatOnFees = round2((shippingFee + commissionFee) * countryMeta.vatRate);
  const totalFees = round2(shippingFee + commissionFee + vatOnProduct);
  const roiPct = productCost > 0 ? round2((targetProfit / productCost) * 100) : 0;

  return {
    platform,
    country: countryMeta.code,
    currency: countryMeta.currency,
    tierType,
    billableWeightKg,
    productCost,
    profitMarginPct,
    roiPct,
    basePrice,
    netProfit: targetProfit,
    finalSellingPrice,
    finalPriceExVat,
    commissionRatePct: round2(commissionRate * 100),
    feesBreakdown: {
      shippingFee,
      commissionFee,
      vatAmount: vatOnProduct,
      totalFees,
    },
    vatBreakdown: {
      vatRatePct: round2(countryMeta.vatRate * 100),
      vatOnProduct,
      vatOnShippingAndReferral: vatOnFees,
    },
  };
}

function getMetadata() {
  return {
    countries: Object.values(COUNTRY_CONFIG),
    amazonCategories: AMAZON_CATEGORIES,
    noonFamilies: NOON_FAMILIES,
    jumiaFamilies: JUMIA_FAMILIES,
    trendyolCategories: TRENDYOL_CATEGORIES,
    trendyolProviders: ['Aramex', 'Flow Express', 'J&T', 'Logistiq', 'Shipa', 'Starlinks'],
  };
}

function getOpportunitiesCatalog(country = 'EGY', search = '') {
  const c = COUNTRY_CONFIG[String(country || 'EGY').toUpperCase()] || COUNTRY_CONFIG.EGY;
  const q = String(search || '').trim().toLowerCase();

  return OPPORTUNITY_CATEGORIES
    .filter((cat) => !q || cat.nameEn.toLowerCase().includes(q) || cat.nameAr.includes(q))
    .map((cat) => ({
      ...cat,
      country: c.code,
      currency: c.currency,
      amazonUrl: `https://www.${c.amazonDomain}${cat.amazonPath}`,
      noonUrl: `https://www.noon.com/${c.noonSlug}/`,
      jumiaUrl: c.jumiaDomain ? `https://www.${c.jumiaDomain}/` : null,
    }));
}

async function generateQrCode({
  content,
  size = 320,
  margin = 4,
  fgColor = '#000000',
  bgColor = '#ffffff',
  errorCorrectionLevel = 'M',
  format = 'png',
}) {
  const cleanContent = String(content || '').trim();
  if (!cleanContent) {
    throw new Error('QR content is required');
  }

  const normalizedWidth = Math.min(1024, Math.max(120, Number(size) || 320));
  const normalizedMargin = Math.min(20, Math.max(0, Number(margin) ?? 4));
  const validLevel = ['L', 'M', 'Q', 'H'].includes(errorCorrectionLevel) ? errorCorrectionLevel : 'M';
  const normalizedFormat = ['png', 'jpeg', 'svg'].includes(String(format).toLowerCase())
    ? String(format).toLowerCase()
    : 'png';

  const qrOptions = {
    width: normalizedWidth,
    margin: normalizedMargin,
    errorCorrectionLevel: validLevel,
    color: {
      dark: fgColor,
      light: bgColor,
    },
  };

  const QRCode = getQrCodeLib();
  if (!QRCode) {
    throw new Error('QR generator dependency is not installed');
  }

  if (normalizedFormat === 'svg') {
    const svgString = await QRCode.toString(cleanContent, { ...qrOptions, type: 'svg' });
    return {
      format: 'svg',
      mimeType: 'image/svg+xml',
      width: normalizedWidth,
      height: normalizedWidth,
      svg: svgString,
      dataUrl: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`,
    };
  }

  const mimeType = normalizedFormat === 'jpeg' ? 'image/jpeg' : 'image/png';
  const dataUrl = await QRCode.toDataURL(cleanContent, { ...qrOptions, type: mimeType });
  return {
    format: normalizedFormat,
    mimeType,
    width: normalizedWidth,
    height: normalizedWidth,
    dataUrl,
  };
}

module.exports = {
  getMetadata,
  calculateMarketplaceProfit,
  getOpportunitiesCatalog,
  generateQrCode,
};
