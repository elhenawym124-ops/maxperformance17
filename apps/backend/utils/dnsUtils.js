const dns = require('dns').promises;

/**
 * 🔍 Verify if a domain's DNS points to the expected target (via CNAME or A Record).
 * 
 * Supports:
 * 1. CNAME verification (e.g. shop.store.com -> maxp.online / mokhtarelhenawy.online)
 * 2. A record verification (e.g. store.com -> server IP 153.92.223.119 or Cloudflare proxy IPs)
 * 
 * @param {string} domain - The custom domain to check (e.g., store.com or shop.store.com)
 * @param {string} expectedTarget - The target it should point to (e.g., maxp.online)
 * @returns {Promise<{success: boolean, message: string, record?: string}>}
 */
const verifyDomainDNS = async (domain, expectedTarget = 'maxp.online') => {
    try {
        // Remove protocol and trailing slashes if present
        const cleanDomain = domain.replace(/^https?:\/\//i, '').split('/')[0].trim().toLowerCase();

        console.log(`🔍 [DNS-Verify] Checking DNS for ${cleanDomain}, expecting ${expectedTarget}`);

        const allowedTargets = [
            expectedTarget.toLowerCase().replace(/\.$/, ''),
            'maxp.online',
            'mokhtarelhenawy.online',
            'srv974554.hstgr.cloud'
        ];

        // 1. Check CNAME record (primary for subdomains like www.store.com or shop.store.com)
        try {
            const cnameRecords = await dns.resolveCname(cleanDomain);
            if (cnameRecords && cnameRecords.length > 0) {
                const isMatch = cnameRecords.some(record => {
                    const normalizedRecord = record.toLowerCase().replace(/\.$/, '');
                    return allowedTargets.includes(normalizedRecord);
                });

                if (isMatch) {
                    return {
                        success: true,
                        message: 'تم التحقق من الدومين بنجاح. سجل CNAME يشير إلى السيرفر الصحيح.',
                        record: cnameRecords[0]
                    };
                } else {
                    return {
                        success: false,
                        message: `سجل CNAME يشير حالياً إلى: ${cnameRecords[0]}. المطلوب أن يشير إلى: ${expectedTarget}`,
                        record: cnameRecords[0]
                    };
                }
            }
        } catch (cnameErr) {
            // Not a CNAME or ENODATA (common for root/apex domains like hawazin.shop)
            if (cnameErr.code !== 'ENODATA' && cnameErr.code !== 'ENOTFOUND') {
                console.log(`ℹ️ [DNS-Verify] CNAME resolution note for ${cleanDomain}:`, cnameErr.message);
            }
        }

        // 2. Check A record (primary for apex domains like store.com configured via Hostinger/GoDaddy)
        try {
            const aRecords = await dns.resolve4(cleanDomain);
            if (aRecords && aRecords.length > 0) {
                const knownServerIps = [
                    '153.92.223.119',
                    '104.21.52.106',
                    '172.67.198.46'
                ];
                if (process.env.SERVER_IP) {
                    knownServerIps.push(process.env.SERVER_IP.trim());
                }

                // Dynamically resolve target domain IPs (e.g. maxp.online IPs)
                for (const target of allowedTargets) {
                    try {
                        const targetIps = await dns.resolve4(target);
                        if (Array.isArray(targetIps)) {
                            knownServerIps.push(...targetIps);
                        }
                    } catch (_) {}
                }

                const uniqueAllowedIps = [...new Set(knownServerIps.filter(Boolean))];
                const isIpMatch = aRecords.some(ip => uniqueAllowedIps.includes(ip));

                if (isIpMatch) {
                    return {
                        success: true,
                        message: 'تم التحقق من الدومين بنجاح. سجل A يشير إلى السيرفر الصحيح.',
                        record: `A: ${aRecords[0]}`
                    };
                } else {
                    return {
                        success: false,
                        message: `سجل A يشير حالياً إلى: ${aRecords.join(', ')}. المطلوب أن يشير إلى 153.92.223.119 أو CNAME إلى ${expectedTarget}`,
                        record: `A: ${aRecords[0]}`
                    };
                }
            }
        } catch (aErr) {
            if (aErr.code === 'ENOTFOUND') {
                return {
                    success: false,
                    message: 'الدومين غير مسجل أو غير متاح في خوادم DNS حالياً.'
                };
            }
        }

        return {
            success: false,
            message: `سجل DNS غير مكتمل أو غير متطابق. تأكد من توجيه CNAME إلى ${expectedTarget} أو توجيه سجل A إلى عنوان IP السيرفر 153.92.223.119.`
        };
    } catch (error) {
        console.error(`❌ [DNS-Verify] Error resolving ${domain}:`, error.message);
        return {
            success: false,
            message: `حدث خطأ أثناء فحص الدومين: ${error.message}`
        };
    }
};

module.exports = {
    verifyDomainDNS
};
