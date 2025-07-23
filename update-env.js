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

function updateEnvironmentFile(ip) {
  const envPath = path.join(__dirname, 'src/environments/environment.ts');
  let content = fs.readFileSync(envPath, 'utf8');

  const replacements = {
    baseUrl: `http://${ip}:5050/admin/api/`,
    socketUrl: `http://${ip}:5050/admin/websocket`,
    internalPathUrl: `http://${ip}:5050/`
  };

  let updated = false;

  for (const [key, newValue] of Object.entries(replacements)) {
    const regex = new RegExp(`${key}:\\s*['"\`](.*?)['"\`]`);
    if (regex.test(content)) {
      content = content.replace(regex, `${key}: '${newValue}'`);
      console.log(`✅ ${key} mis à jour : ${newValue}`);
      updated = true;
    } else {
      console.warn(`⚠️ ${key} non trouvé dans environment.ts`);
    }
  }

  if (updated) {
    fs.writeFileSync(envPath, content, 'utf8');
    console.log(`✅ environment.ts mis à jour avec l'IP locale : ${ip}`);
  } else {
    console.error('❌ Aucun champ mis à jour dans environment.ts');
  }
}

const ip = getLocalIp();
updateEnvironmentFile(ip);
