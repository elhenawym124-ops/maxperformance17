const { getRecords } = require('./recordsHandler');
const { createShipment, bulkCreateShipments, cancelShipment, unlinkShipment, updateShipment, updateShipmentLegacy } = require('./shipmentHandlers');
const { trackShipment, syncShipmentStatus } = require('./trackingHandlers');
const { calculateShippingCost, getShippingComparison } = require('./shippingHandlers');
const { printLabel, printWaybill } = require('./labelHandlers');
const { getGovernments, getAreas, getBranches, searchAreaByText, searchAreaByTextPublic, resolveOrderArea, bulkResolveOrderAreas } = require('./locationHandlers');
const {
  addTicket,
  getInquiriesTypes,
  getTickets,
  getTicket,
  getTicketLog,
  replyToTicket,
  getUnreadTicketsCount,
  getTicketStatuses,
  getTicketInstructions,
  getCanCreateTicket,
  getTotalOpenTickets,
  rateTicket,
  getTurboAccounts,
} = require('./ticketHandlers');

module.exports = {
  getRecords,
  createShipment,
  bulkCreateShipments,
  trackShipment,
  syncShipmentStatus,
  calculateShippingCost,
  getShippingComparison,
  cancelShipment,
  unlinkShipment,
  printLabel,
  printWaybill,
  getBranches,
  getGovernments,
  getAreas,
  searchAreaByText,
  searchAreaByTextPublic,
  resolveOrderArea,
  bulkResolveOrderAreas,
  updateShipment,
  addTicket,
  getInquiriesTypes,
  getTickets,
  getTicket,
  getTicketLog,
  replyToTicket,
  getUnreadTicketsCount,
  getTicketStatuses,
  getTicketInstructions,
  getCanCreateTicket,
  getTotalOpenTickets,
  rateTicket,
  getTurboAccounts,
};
