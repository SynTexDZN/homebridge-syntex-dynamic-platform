//const SynTexDynamicPlatform = require('./platform');
const pluginID = "homebridge-syntex-dynamic-platform";
const pluginName = "SynTexDynamicPlatform";
var Accessory, Service, UUIDGen, Platform;

module.exports = (homebridge) => {

    Accessory = homebridge.platformAccessory;

    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    UUIDGen = homebridge.hap.uuid;

    homebridge.registerPlatform(pluginID, pluginName, SynTexDynamicPlatform, true);

    Platform = homebridge;
};

const SynTexSwitchAccessory = require('./accessories/switch');

class SynTexDynamicPlatform
{
    constructor(log, config, api)
    {
        this.api = api;

        this.api.on('didFinishLaunching', () => {

            this.addAccessory(Service.Lightbulb, 'New Dynamic Switch 2');
        });

        this.accessories = (callback) => {

            callback([]);
        };
    }

    addAccessory(accessoryService, accessoryName)
    {
        var accessory = new Accessory(accessoryName, UUIDGen.generate('XXX1'), accessoryService);

        accessory.addService(accessoryService, accessoryName);

        this.api.registerPlatformAccessories(pluginID, pluginName, [accessory]);
    }
}