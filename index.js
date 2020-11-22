const SynTexDynamicPlatform = require('./platform');

const pluginID = 'homebridge-syntex-dynamic-platform';
const pluginName = 'SynTexDynamicPlatform';

module.exports = (homebridge) => {

    homebridge.registerPlatform(pluginID, pluginName, SynTexDynamicPlatform, true);
}