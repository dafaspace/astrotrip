#!/usr/bin/env node
/* Full-access keys for the web build: a week of everything, handed to a tester or
   to a professional who asks.

     node tools-access-key.mjs issue              a key for 7 days
     node tools-access-key.mjs issue 14 "Ольга"   14 days, and who it went to
     node tools-access-key.mjs init               once, ever: makes the key pair

   A key is 69 bytes, base64url: a version byte, the end date in seconds (4 bytes,
   big-endian), and an ECDSA P-256 signature of those five bytes. The private half
   lives in mobile/keys/access-key.pem, which git ignores; the app carries only the
   public half (ACCESS_PUBKEYS in index.html), so a key cannot be made up without
   this machine. No server and no account: the page checks the signature itself.

   What it cannot do, by construction: stop a key being forwarded during its week,
   or stop someone with developer tools from opening the paid part. A website with
   no server keeps honest people honest; that is the whole of its promise.

   Issued keys are appended to mobile/keys/issued-keys.log with the date, the name
   given and the end date, so a key can be traced to who received it. */
import { generateKeyPairSync, createPrivateKey, createPublicKey, sign } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync, appendFileSync, chmodSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const KEYDIR = join(ROOT, 'mobile', 'keys');
const PEM = join(KEYDIR, 'access-key.pem');
const LOG = join(KEYDIR, 'issued-keys.log');
const SITE = 'https://dafaspace.github.io/astrotrip/';
const b64url = b => Buffer.from(b).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

const [cmd = 'issue', ...args] = process.argv.slice(2);

if (cmd === 'init') {
  /* Never over an existing key: a new pair would invalidate every key already
     handed out and stop matching the public half the app was shipped with. */
  if (existsSync(PEM)) { console.error('access-key.pem already exists - not replaced.'); process.exit(1); }
  mkdirSync(KEYDIR, { recursive: true });
  const { privateKey, publicKey } = generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
  writeFileSync(PEM, privateKey.export({ type: 'pkcs8', format: 'pem' }));
  chmodSync(PEM, 0o600);
  console.log('private key written to mobile/keys/access-key.pem (back it up outside the repo)');
  console.log('public key for ACCESS_PUBKEYS in index.html:');
  console.log(publicKey.export({ type: 'spki', format: 'der' }).toString('base64'));
  process.exit(0);
}

if (cmd === 'public') {
  const pub = createPublicKey(createPrivateKey(readFileSync(PEM)));
  console.log(pub.export({ type: 'spki', format: 'der' }).toString('base64'));
  process.exit(0);
}

if (cmd !== 'issue') { console.error('usage: issue [days] [name] | init | public'); process.exit(1); }
if (!existsSync(PEM)) { console.error('no mobile/keys/access-key.pem - run init once'); process.exit(1); }

const days = Number(args[0] || 7);
if (!(days > 0 && days <= 90)) { console.error('days must be between 1 and 90'); process.exit(1); }
const who = args[1] || '';
const until = Math.floor(Date.now() / 1000) + Math.round(days * 86400);

const data = Buffer.alloc(5);
data[0] = 1;                         // version
data.writeUInt32BE(until, 1);
const sig = sign('sha256', data, { key: createPrivateKey(readFileSync(PEM)), dsaEncoding: 'ieee-p1363' });
const key = b64url(Buffer.concat([data, sig]));
const ends = new Date(until * 1000).toISOString().slice(0, 16).replace('T', ' ') + ' UTC';

appendFileSync(LOG, `${new Date().toISOString().slice(0, 10)}\t${who || '-'}\tuntil ${ends}\t${key}\n`);
console.log(`until ${ends}${who ? ' - for ' + who : ''}`);
console.log('link: ' + SITE + '#key=' + key);
console.log('key:  ' + key);
