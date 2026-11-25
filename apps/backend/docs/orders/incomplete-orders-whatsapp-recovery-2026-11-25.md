# Incomplete Orders & WhatsApp Recovery Overhaul (2026-11-25)

## Summary
- Added `apps/backend/utils/cartRecoveryHelper.js` to unify recovery URL generation, phone suffix normalization, and conversion/dismissal/recent-order exclusion checks.
- Fixed `abandonedCartRecoveryCron.js` to exclude converted/dismissed carts and recent orders, deduplicate by phone per sweep, use `cart.cartId`, and respect tenant reminder intervals.
- Fixed `incompleteCartMessagingService.js` and `WhatsAppNotificationService.js` to enforce a 15-minute grace period on first-appearance notifications, cancel queued cart messages if converted/dismissed before dispatch, and include `{cartUrl}` + `{cartTotal}` variables.
- Added `CART_ABANDONED_72H` and `{cartUrl}` placeholders to `defaultTemplates.js`.
- Added `GET /api/v1/public/orders/checkout-draft/:cartId` and storefront checkout `?recoverCart=` rehydration (`storefrontApi.ts`, `useCartStore.ts`, `useCheckoutFormController.tsx`).
- Hardened `incompleteCartAutoConvertService.js` with `isValidCustomerPhone` validation and a 30-minute inactivity grace period.
- Enriched `/orders-new/incomplete` and `/orders-new/incomplete/:cartId` with WhatsApp/contact logs and added `POST /orders-new/incomplete/:cartId/send-whatsapp`.
- Updated `/orders/incomplete` UI, details timeline (`IncompleteCommunicationTimeline.tsx`), `formatWhatsAppPhone` (`wa.me` country-code fix), and unified settings in `IncompleteOrdersSettings.tsx`.
