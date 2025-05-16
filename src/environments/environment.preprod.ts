import packageInfo from '../../package.json';

export const environment = {
  appVersion: packageInfo.version,
  production: true,
  baseUrl: 'http://cmpharma.cybersds.fr/server/admin/api/', // Preprod API
};
