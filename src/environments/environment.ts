import packageInfo from '../../package.json';

export const environment = {
  appVersion: packageInfo.version,
  production: false,
  baseUrl: 'http://192.168.100.81:5050/admin/api/',

};
