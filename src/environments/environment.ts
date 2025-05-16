import packageInfo from '../../package.json';

export const environment = {
  appVersion: packageInfo.version,
  production: false,
  baseUrl: 'http://192.168.1.130:5050/admin/api/',

};
