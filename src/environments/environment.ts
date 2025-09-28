import packageInfo from '../../package.json';

export const environment = {
  appVersion: packageInfo.version,
  production: false,
  baseUrl: 'http://192.168.100.103:5050/admin/api/',
  internalPathUrl: 'http://192.168.100.103:5050/',
  socketUrl: 'http://192.168.100.103:5050/admin/websocket',
  pathWebsocket: '/socket.io'
};
