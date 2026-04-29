import process from 'node:process';

const args = process.argv.slice(2);

function readArgValue(flag) {
  const index = args.indexOf(flag);
  if (index === -1 || index === args.length - 1) {
    return '';
  }
  return args[index + 1];
}

function readArgValues(flag) {
  const values = [];
  for (let index = 0; index < args.length; index += 1) {
    if (args[index] === flag && index < args.length - 1) {
      values.push(args[index + 1]);
      index += 1;
    }
  }
  return values;
}

const method = (readArgValue('--method') || 'GET').toUpperCase();
const url = readArgValue('--url');
const body = readArgValue('--body');
const headerPairs = readArgValues('--header');

if (!url) {
  console.error(JSON.stringify({ error: 'Falta --url' }));
  process.exit(1);
}

const headers = {};

for (const pair of headerPairs) {
  const separatorIndex = pair.indexOf(':');
  if (separatorIndex === -1) {
    continue;
  }

  const key = pair.slice(0, separatorIndex).trim();
  const value = pair.slice(separatorIndex + 1).trim();

  if (key) {
    headers[key] = value;
  }
}

const requestInit = {
  method,
  headers,
};

if (body) {
  requestInit.body = body;
  if (!headers['Content-Type'] && !headers['content-type']) {
    requestInit.headers['Content-Type'] = 'application/json';
  }
}

try {
  const response = await fetch(url, requestInit);
  const rawText = await response.text();
  let parsedBody = null;

  if (rawText) {
    try {
      parsedBody = JSON.parse(rawText);
    } catch {
      parsedBody = rawText;
    }
  }

  console.log(
    JSON.stringify({
      status: response.status,
      ok: response.ok,
      body: parsedBody,
      rawText,
    }),
  );
} catch (error) {
  console.error(
    JSON.stringify({
      error: error instanceof Error ? error.message : 'http_request_failed',
    }),
  );
  process.exit(1);
}
