import packageInfo from '../../package.json';

export const environment = {
  appVersion: packageInfo.version,
  production: true,
  baseUrl: '/server/admin/api/',
  internalPathUrl: 'http://192.168.100.81:5050/',
  socketUrl: '/server/admin/websocket/',

};
