import packageInfo from '../../package.json';

export const environment = {
  appVersion: packageInfo.version,
  production: true,
  baseUrl: '/server/admin/api/',
  internalPathUrl: '/server/',
  socketUrl: '/server/admin/websocket',
};
