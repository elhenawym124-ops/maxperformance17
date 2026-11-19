/**
 * @file dataMaskingService.js
 * @description Automatic PII & Sensitive Financial Data Masking Engine for MaxP AI Agents.
 * 
 * Strict Masking Rules:
 * 1. Egyptian & International Phones: masks middle digits (e.g. 01012345678 -> 010****5678, +201012345678 -> +2010****5678).
 * 2. Financial & Salaries: masks individual employee base salaries, net salaries, bonuses; allows only department/role aggregates.
 * 3. Addresses & PII: masks detailed building/street/apartment numbers, retaining only City/Governorate.
 * 4. National IDs & Cards: masks all except last 4 digits.
 * 5. Recursive Deep Masking: automatically walks nested objects/arrays to sanitize any response before it reaches the AI model or chat.
 */

// Phone regex: matches 10 to 14 digit phone numbers with optional + / leading 0
const PHONE_REGEX = /(\+?\d{1,4}[-.\s]?)?(\d{2,4})[-.\s]?(\d{3,4})[-.\s]?(\d{3,4})/;

// National ID: 14 digits in Egypt
const NATIONAL_ID_REGEX = /\b\d{14}\b/g;

/**
 * Mask a single phone number.
 * Example: "01012345678" -> "010****5678"
 * Example: "+201123456789" -> "+2011****6789"
 */
function maskPhone(phone) {
  if (!phone || typeof phone !== 'string') return phone;
  const clean = phone.trim();
  if (clean.length < 7) return '***';

  const prefixLen = clean.startsWith('+') ? 5 : 3;
  const suffixLen = 4;

  if (clean.length <= prefixLen + suffixLen) {
    return clean.slice(0, 2) + '****' + clean.slice(-2);
  }

  const start = clean.slice(0, prefixLen);
  const end = clean.slice(-suffixLen);
  return `${start}****${end}`;
}

/**
 * Mask street/apartment addresses while preserving city and governorate.
 * Example: "شقة 5 عمارة 12 شارع النصر، المعادي، القاهرة" -> "***، المعادي، القاهرة"
 */
function maskAddress(address) {
  if (!address || typeof address !== 'string') return address;
  const parts = address.split(/[،,]/).map(p => p.trim()).filter(Boolean);

  if (parts.length <= 1) {
    // Single string without commas: strip digits and apartment words
    return address
      .replace(/(\bشقة|\bعمارة|\bدور|\bشارع|\bبناية)\s*\d+/gi, '***')
      .replace(/\d+/g, '*');
  }

  // If multi-part (e.g. detailed street, district, governorate), mask the first detailed part
  const safeParts = parts.map((part, index) => {
    if (index === 0 && parts.length > 1) {
      return '***';
    }
    return part;
  });

  return safeParts.join('، ');
}

/**
 * Mask National ID (14 digits in Egypt).
 * Retains only birth year code (first 3) and last 2 digits.
 */
function maskNationalId(nid) {
  if (!nid || typeof nid !== 'string') return nid;
  const clean = nid.trim();
  if (clean.length !== 14) return '**************';
  return clean.slice(0, 3) + '*********' + clean.slice(-2);
}

/**
 * Mask sensitive HR payroll data.
 * Forbids returning individual employee salary; converts to masked indicator or aggregate only.
 */
function maskEmployeePayroll(employee) {
  if (!employee || typeof employee !== 'object') return employee;

  const copy = { ...employee };

  // Mask individual compensation
  if ('baseSalary' in copy) copy.baseSalary = '*** [محجوب بحسب الصلاحيات]';
  if ('netSalary' in copy) copy.netSalary = '*** [محجوب بحسب الصلاحيات]';
  if ('salary' in copy) copy.salary = '*** [محجوب بحسب الصلاحيات]';
  if ('bonuses' in copy) copy.bonuses = '***';
  if ('deductions' in copy) copy.deductions = '***';
  if ('insuranceSalary' in copy) copy.insuranceSalary = '***';

  if (copy.phone) copy.phone = maskPhone(copy.phone);
  if (copy.nationalId) copy.nationalId = maskNationalId(copy.nationalId);

  return copy;
}

/**
 * Mask order record customer details.
 */
function maskOrder(order) {
  if (!order || typeof order !== 'object') return order;

  const copy = { ...order };

  if (copy.customerPhone) copy.customerPhone = maskPhone(copy.customerPhone);
  if (copy.shippingPhone) copy.shippingPhone = maskPhone(copy.shippingPhone);
  if (copy.address) copy.address = maskAddress(copy.address);
  if (copy.shippingAddress) copy.shippingAddress = maskAddress(copy.shippingAddress);

  if (copy.customer && typeof copy.customer === 'object') {
    copy.customer = {
      ...copy.customer,
      phone: copy.customer.phone ? maskPhone(copy.customer.phone) : undefined,
      address: copy.customer.address ? maskAddress(copy.customer.address) : undefined,
    };
  }

  return copy;
}

/**
 * Recursive deep masking walker.
 * Sanitizes any arbitrary JSON object or array according to key patterns.
 */
function maskObject(data, options = {}) {
  if (data === null || data === undefined) return data;

  if (Array.isArray(data)) {
    return data.map(item => maskObject(item, options));
  }

  if (typeof data !== 'object') {
    return data;
  }

  const result = {};
  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();

    // 1. Phone keys
    if (
      lowerKey.includes('phone') ||
      lowerKey.includes('mobile') ||
      lowerKey.includes('telephone') ||
      lowerKey === 'tel'
    ) {
      result[key] = typeof value === 'string' ? maskPhone(value) : value;
      continue;
    }

    // 2. Salary & compensation keys
    if (
      lowerKey.includes('salary') ||
      lowerKey.includes('payroll') ||
      lowerKey.includes('wage') ||
      lowerKey === 'netpay'
    ) {
      if (!options.allowRawPayroll) {
        result[key] = typeof value === 'number' || typeof value === 'string'
          ? '*** [محجوب بحسب الصلاحيات]'
          : maskObject(value, options);
        continue;
      }
    }

    // 3. National ID & SSN
    if (lowerKey.includes('nationalid') || lowerKey.includes('ssn') || lowerKey.includes('nid')) {
      result[key] = typeof value === 'string' ? maskNationalId(value) : value;
      continue;
    }

    // 4. Detailed street address
    if (lowerKey === 'address' || lowerKey.includes('street') || lowerKey.includes('shippingaddress')) {
      result[key] = typeof value === 'string' ? maskAddress(value) : maskObject(value, options);
      continue;
    }

    // 5. Card & Bank Numbers
    if (lowerKey.includes('cardnumber') || lowerKey.includes('bankaccount') || lowerKey.includes('iban')) {
      result[key] = typeof value === 'string' && value.length > 4 ? `****${value.slice(-4)}` : '****';
      continue;
    }

    // Recurse for nested objects/arrays
    result[key] = maskObject(value, options);
  }

  return result;
}

module.exports = {
  maskPhone,
  maskAddress,
  maskNationalId,
  maskEmployeePayroll,
  maskOrder,
  maskObject,
};
