const { getDataConnect, validateArgs } = require('firebase/data-connect');

const connectorConfig = {
  connector: 'default',
  service: 'cmpharma_admin',
  location: 'us-central1'
};
exports.connectorConfig = connectorConfig;

