# Turbo AI Area Resolver & Governorate Map Guard (2026-11-25)

## Problem
Orders sent from storefront / WhatsApp auto-confirmation (`SYSTEM_WHATSAPP`) to Turbo Express with missing, English-only, or generic `city == governorate` values (e.g. `Giza`) arrived on Turbo as **"غير مكتملة" (`status_code: 18 / 99`)** without `expected_branch`, instead of **"قيد الانتظار"**.
Additionally, `governorateMapper.js` matched `compoundDistricts` via raw substring `.includes()` on street text, hijacking non-Cairo/Giza governorates (such as `الدقهلية`) into `أطراف القاهرة والجيزة`.

## Solution
1. **Single-Purpose AI Area Resolver (`apps/backend/services/turbo/turboAiAreaResolver.js`)**:
   - Checks Turbo's cached `governments` & `areas` map first (`0` AI calls on direct match).
   - When `area` is missing, generic, or unmatched, resolves an active AI key strictly from `public.ai_keys` (`resolveAiKey`), asks the AI to guess the closest area from Turbo's official area map, automatically determines/corrects the owning `governorate`, and programmatically verifies `(governorate, area)` exists in Turbo's map before persisting to the order.
   - Wired into `orderService.js` (auto-dispatch holds unresolved orders as `AREA_UNRESOLVED` instead of creating incomplete shipments on Turbo) and `controller/turbo/shipmentHandlers.js` (manual & bulk create).
2. **Standalone Enable/Disable Service Toggle**:
   - Independent ON/OFF switch exposed in both `/settings/turbo` (`TurboAiAreaCard.tsx` via `/api/v1/store-settings/turbo`) and `/shipping-companies` (`ShippingCompanyModal.tsx` via `/api/v1/shipping-companies`), persisted in `Company.settings.turboAiAreaResolverEnabled` and `ShippingCompany.settings.aiAreaResolverEnabled`.
3. **Governorate Mapper & Location Cache Fixes**:
   - Word-boundary matching and non-Cairo/Giza explicit governorate guard in `apps/backend/utils/turbo/governorateMapper.js`.
   - Shared `LocationService` cache passed into `ShipmentService` (`apps/backend/services/turboService.js` & `shipmentService.js`).

## Verification
- Backend syntax & relative require checks (`node scripts/check_syntax.js`, `node scripts/check_requires.js`).
- Targeted Jest tests (`turboAiAreaResolver.test.js`, `orderService.turboAutoCreate.test.js`, `turboController.createShipment.test.js`, `turboController.bulkCreateShipments.test.js`).
- Frontend Vitest (`TurboSettings.test.tsx`) & Vite production build.
