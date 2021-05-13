const hmpoConfig = require('hmpo-config');

const config = new hmpoConfig();
config.addFile('./config/default.yaml');
module.exports = config.toJSON();
