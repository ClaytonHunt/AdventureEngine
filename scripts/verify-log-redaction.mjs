const redact = (value) => {
  if (!value) return value;
  return '[REDACTED]';
};

const formatHeadersForLog = (headers) => {
  const sensitive = new Set(['authorization', 'cookie', 'set-cookie']);
  return Object.fromEntries(
    Object.entries(headers).map(([key, value]) => {
      if (sensitive.has(key.toLowerCase())) return [key, redact(String(value))];
      return [key, String(value)];
    })
  );
};

const sample = formatHeadersForLog({
  Authorization: 'Bearer top-secret-token',
  Cookie: 'session=abc123',
  'X-Correlation-Id': 'cid-001'
});

if (sample.Authorization !== '[REDACTED]') {
  console.error('[verify-log-redaction] FAIL: Authorization header not redacted');
  process.exit(1);
}
if (sample.Cookie !== '[REDACTED]') {
  console.error('[verify-log-redaction] FAIL: Cookie header not redacted');
  process.exit(1);
}
if (sample['X-Correlation-Id'] !== 'cid-001') {
  console.error('[verify-log-redaction] FAIL: non-sensitive headers should remain intact');
  process.exit(1);
}

console.log('[verify-log-redaction] PASS: sensitive headers are redacted');
