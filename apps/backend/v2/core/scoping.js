'use strict';

/**
 * @module v2/core/scoping
 * @description Object & row-level scoping engine (ALL, BRANCH, TEAM, OWN)
 */

const SCOPES = {
  ALL: 'ALL',
  BRANCH: 'BRANCH',
  TEAM: 'TEAM',
  OWN: 'OWN',
};

/**
 * Determines effective scope for the current caller
 */
function resolveEffectiveScope(authContext, requestedScope = null) {
  if (!authContext) return SCOPES.OWN;

  // API keys and company admins default to ALL
  if (authContext.actorType === 'API_KEY' || ['SUPER_ADMIN', 'OWNER', 'COMPANY_ADMIN'].includes(authContext.role)) {
    return requestedScope && Object.values(SCOPES).includes(requestedScope) ? requestedScope : SCOPES.ALL;
  }

  // Team leaders can access TEAM or OWN
  if (['TEAM_LEADER', 'MANAGER'].includes(authContext.role)) {
    return requestedScope === SCOPES.OWN ? SCOPES.OWN : SCOPES.TEAM;
  }

  // Standard moderators/agents are strictly constrained to OWN
  return SCOPES.OWN;
}

/**
 * Builds Prisma where-clause fragment corresponding to effective scope
 */
function buildScopeFilter(authContext, effectiveScope) {
  if (!authContext || effectiveScope === SCOPES.ALL) {
    return {};
  }

  if (effectiveScope === SCOPES.BRANCH && authContext.branchId) {
    return {
      OR: [
        { turboBranchId: authContext.branchId },
        { storeId: authContext.branchId },
      ],
    };
  }

  if (effectiveScope === SCOPES.TEAM && Array.isArray(authContext.teamMemberIds) && authContext.teamMemberIds.length > 0) {
    return {
      OR: [
        { assignedTo: { in: authContext.teamMemberIds } },
        { createdBy: { in: authContext.teamMemberIds } },
        { assignedTo: authContext.userId },
        { createdBy: authContext.userId },
      ],
    };
  }

  // Default / OWN scope: user can only see orders assigned to or created by them
  const userId = authContext.userId || authContext.actorId;
  return {
    OR: [
      { assignedTo: userId },
      { createdBy: userId },
      { userRelId: userId },
    ],
  };
}

/**
 * Middleware that computes and attaches scopeFilter to request
 */
function applyScoping(defaultScope = null) {
  return (req, res, next) => {
    const authContext = req.authContext;
    const requestedScope = req.headers['x-requested-scope'] || defaultScope;
    const effectiveScope = resolveEffectiveScope(authContext, requestedScope);

    req.authContext.effectiveScope = effectiveScope;
    req.authContext.scopeFilter = buildScopeFilter(authContext, effectiveScope);

    return next();
  };
}

module.exports = {
  SCOPES,
  resolveEffectiveScope,
  buildScopeFilter,
  applyScoping,
};
