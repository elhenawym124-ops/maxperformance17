'use strict';

/**
 * @module v2/core/cursorPagination
 * @description Cursor-based pagination with compound (sortField + id) tie-breaker
 */

const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 100;

function encodeCursor(sortValue, id) {
  if (sortValue === undefined || id === undefined) return null;
  const payload = {
    v: sortValue instanceof Date ? sortValue.toISOString() : sortValue,
    id: String(id),
  };
  return Buffer.from(JSON.stringify(payload)).toString('base64url');
}

function decodeCursor(cursorString) {
  if (!cursorString || typeof cursorString !== 'string') return null;
  try {
    const raw = Buffer.from(cursorString, 'base64url').toString('utf8');
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.id === undefined) return null;
    return parsed;
  } catch (_) {
    return null;
  }
}

/**
 * Parses query params into pagination & sorting options
 */
function parsePaginationParams(query = {}) {
  const rawLimit = parseInt(query.limit, 10);
  const limit = Math.min(Math.max(isNaN(rawLimit) ? DEFAULT_LIMIT : rawLimit, 1), MAX_LIMIT);
  const cursor = decodeCursor(query.cursor);
  const direction = query.direction === 'prev' ? 'prev' : 'next';

  // Parse sorting: default -createdAt
  const sortParam = String(query.sort || '-createdAt').trim();
  const sortDescending = sortParam.startsWith('-');
  const sortField = sortDescending ? sortParam.slice(1) : sortParam;

  return {
    limit,
    cursor,
    direction,
    sortField: sortField || 'createdAt',
    sortOrder: sortDescending ? 'desc' : 'asc',
  };
}

/**
 * Injects cursor conditions into Prisma where clause with compound (sortField + id) tie-breaker
 */
function buildCursorPrismaWhere({ cursor, sortField, sortOrder, direction, existingWhere = {} }) {
  if (!cursor) return existingWhere;

  const isNext = direction === 'next';
  const isDesc = sortOrder === 'desc';
  // If next + desc -> less than (<)
  // If next + asc -> greater than (>)
  // If prev + desc -> greater than (>)
  // If prev + asc -> less than (<)
  const isGt = (isNext && !isDesc) || (!isNext && isDesc);

  let sortVal = cursor.v;
  if (sortField.toLowerCase().includes('date') || sortField.toLowerCase().includes('at')) {
    sortVal = new Date(sortVal);
  }

  const op = isGt ? 'gt' : 'lt';
  const cursorCondition = {
    OR: [
      { [sortField]: { [op]: sortVal } },
      {
        [sortField]: sortVal,
        id: { [op]: cursor.id },
      },
    ],
  };

  if (!existingWhere || Object.keys(existingWhere).length === 0) {
    return cursorCondition;
  }

  return {
    AND: [existingWhere, cursorCondition],
  };
}

/**
 * Formats the cursor pagination meta from queried rows
 */
function formatPaginationResult({ rows, limit, sortField }) {
  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;

  let nextCursor = null;
  let prevCursor = null;

  if (items.length > 0) {
    const firstItem = items[0];
    const lastItem = items[items.length - 1];

    if (hasMore) {
      nextCursor = encodeCursor(lastItem[sortField], lastItem.id);
    }
    prevCursor = encodeCursor(firstItem[sortField], firstItem.id);
  }

  return {
    items,
    pagination: {
      limit,
      count: items.length,
      hasNextPage: hasMore,
      nextCursor,
      prevCursor,
    },
  };
}

module.exports = {
  DEFAULT_LIMIT,
  MAX_LIMIT,
  encodeCursor,
  decodeCursor,
  parsePaginationParams,
  buildCursorPrismaWhere,
  formatPaginationResult,
};
