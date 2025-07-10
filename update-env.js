const fs = require('fs');
const os = require('os');
const path = require('path');

const env = process.env.NODE_ENV || 'development';

if (env !== 'development') {
  console.log(`⏩ Skipped update-env.js because NODE_ENV=${env}`);
  process.exit(0);
}

function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal && iface.address.startsWith('192.168')) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1';
}

function updateEnvironment(ip) {
  const envPath = path.join(__dirname, 'src/environments/environment.ts');
  let content = fs.readFileSync(envPath, 'utf8');

  const regex = /baseUrl:\s*['"`](.*?)['"`]/;
  const newBaseUrl = `baseUrl: 'http://${ip}:5050/admin/api/'`;

  if (regex.test(content)) {
    content = content.replace(regex, newBaseUrl);
    fs.writeFileSync(envPath, content, 'utf8');
    console.log(`✅ environment.ts mis à jour avec l'IP locale : ${ip}`);
  } else {
    console.error('❌ baseUrl non trouvé dans environment.ts');
  }
}

function updatePathEnvironment(ip) {
  const envPath = path.join(__dirname, 'src/environments/environment.ts');
  let content = fs.readFileSync(envPath, 'utf8');

  const regex = /internalPathUrl:\s*['"`](.*?)['"`]/;
  const newBaseUrl = `internalPathUrl: 'http://${ip}:5050/'`;

  if (regex.test(content)) {
    content = content.replace(regex, newBaseUrl);
    fs.writeFileSync(envPath, content, 'utf8');
    console.log(`✅ environment.ts mis à jour avec l'IP locale : ${ip}`);
  } else {
    console.error('❌ baseUrl non trouvé dans environment.ts');
  }
}

const ip = getLocalIp();
updateEnvironment(ip);
updatePathEnvironment(ip);
