/**
 * Guard test — apps/backend/server.js must never require a relative module
 * that does not exist on disk.
 *
 * A dead relative require only fails at process boot (MODULE_NOT_FOUND), which
 * means it passes every syntax check and then takes the whole API down on
 * deploy. This test closes that gap by parsing server.js and resolving every
 * `require("./...")` against the real filesystem, with the exact module
 * resolution rules Node uses (.js/.json/.node/.mjs/.cjs, then directory
 * index.*). It also enforces exact case, because production/CI run on Linux
 * where `require('./routes/Foo')` does not match `routes/foo.js`.
 *
 * Filesystem reads only — no network calls, no database.
 */
const fs = require('node:fs');
const path = require('node:path');

const backendRoot = path.resolve(__dirname, '..', '..');
const serverPath = path.join(backendRoot, 'server.js');

const MODULE_EXTENSIONS = ['.js', '.json', '.node', '.mjs', '.cjs'];

// Same sanity floor the CI gate implies: server.js wires up hundreds of
// routers. If this number collapses, the parser broke and the test would
// otherwise pass vacuously.
const MIN_EXPECTED_RELATIVE_REQUIRES = 300;

/**
 * Blanks out comments while preserving every character offset and newline, so
 * line numbers reported below stay accurate for the original file.
 */
function stripCommentsKeepingOffsets(source) {
  return source.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, (match) =>
    match.replace(/[^\r\n]/g, ' ')
  );
}

function lineNumberAt(source, index) {
  let line = 1;
  for (let i = 0; i < index; i += 1) {
    if (source[i] === '\n') line += 1;
  }
  return line;
}

function extractRelativeRequires(source) {
  const cleaned = stripCommentsKeepingOffsets(source);
  const requireRegex = /\brequire\s*\(\s*(['"`])(\.[^'"`\r\n]+)\1\s*\)/g;
  const found = [];
  let match;

  while ((match = requireRegex.exec(cleaned)) !== null) {
    found.push({
      specifier: match[2].trim(),
      line: lineNumberAt(source, match.index),
    });
  }

  return found;
}

function isFile(target) {
  try {
    return fs.statSync(target).isFile();
  } catch {
    return false;
  }
}

function isDirectory(target) {
  try {
    return fs.statSync(target).isDirectory();
  } catch {
    return false;
  }
}

/**
 * Node resolves on case-insensitive filesystems even when the import casing is
 * wrong, but Linux (CI + production) does not. Verify the basename really
 * exists with the exact casing on disk.
 */
function hasExactCase(target) {
  try {
    const entries = fs.readdirSync(path.dirname(target));
    return entries.includes(path.basename(target));
  } catch {
    return false;
  }
}

function existsWithExactCase(target) {
  return fs.existsSync(target) && hasExactCase(target);
}

/**
 * Mirrors Node's relative resolution: exact file, file + extension, or a
 * directory containing index.<ext>. Returns the resolved absolute path or null.
 */
function resolveRelativeModule(fromFile, specifier) {
  const base = path.resolve(path.dirname(fromFile), specifier);

  if (isFile(base) && hasExactCase(base)) {
    return base;
  }

  for (const extension of MODULE_EXTENSIONS) {
    const candidate = `${base}${extension}`;
    if (isFile(candidate) && hasExactCase(candidate)) {
      return candidate;
    }
  }

  if (isDirectory(base)) {
    for (const extension of MODULE_EXTENSIONS) {
      const candidate = path.join(base, `index${extension}`);
      if (isFile(candidate) && hasExactCase(candidate)) {
        return candidate;
      }
    }
  }

  return null;
}

describe('apps/backend/server.js relative requires', () => {
  it('requires only modules that exist on disk', () => {
    expect(fs.existsSync(serverPath)).toBe(true);

    const source = fs.readFileSync(serverPath, 'utf8');
    const relativeRequires = extractRelativeRequires(source);

    expect(relativeRequires.length).toBeGreaterThanOrEqual(
      MIN_EXPECTED_RELATIVE_REQUIRES
    );

    const broken = relativeRequires
      .filter(({ specifier }) => !resolveRelativeModule(serverPath, specifier))
      .map(({ specifier, line }) => {
        const attempted = path
          .relative(backendRoot, path.resolve(path.dirname(serverPath), specifier))
          .replace(/\\/g, '/');
        return `server.js:${line} require('${specifier}') -> missing ${attempted}`;
      });

    if (broken.length > 0) {
      throw new Error(
        `BROKEN RELATIVE REQUIRES IN server.js (${broken.length}):\n${broken.join('\n')}`
      );
    }

    expect(broken).toEqual([]);
  });
});
