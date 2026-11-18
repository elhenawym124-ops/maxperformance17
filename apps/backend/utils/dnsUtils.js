const dns = require('dns').promises;

/**
 * 🔍 Verify if a domain's DNS points to the expected target (via CNAME or A Record).
 * 
 * @param {string} domain - The custom domain to check (e.g., store.com)
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
            'mokhtarelhenawy.online'
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
                }
            }
        } catch (cnameErr) {
            // Not a CNAME or ENODATA (common for root/apex domains like hawazin.shop)
        }

        // 2. Check A record (primary for apex domains like store.com configured via Hostinger/GoDaddy)
        try {
            const aRecords = await dns.resolve4(cleanDomain);
            if (aRecords && aRecords.length > 0) {
                const knownServerIps = ['153.92.223.119'];
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
                        record: aRecords[0]
                    };
                }
            }
        } catch (aErr) {
            // A record lookup failed
        }

        return {
            success: false,
            message: `سجل DNS غير مكتمل أو غير متطابق. تأكد من توجيه CNAME إلى ${expectedTarget} أو توجيه سجل A إلى عنوان IP السيرفر.`,
        };
    } catch (error) {
        console.error(`❌ [DNS-Verify] Error resolving ${domain}:`, error.message);

        if (error.code === 'ENODATA') {
            return {
                success: false,
                message: 'لم يتم العثور على سجلات DNS صحيحة لهذا الدومين.'
            };
        } else if (error.code === 'ENOTFOUND') {
            return {
                success: false,
                message: 'الدومين غير موجود أو غير مسجل.'
            };
        }

        return {
            success: false,
            message: `حدث خطأ أثناء فحص الدومين: ${error.message}`
        };
    }
};

module.exports = {
    verifyDomainDNS
};
