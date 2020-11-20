const SynTexSwitchAccessory = require('./accessories/switch');
var Accessory, Service, UUIDGenerator, Platform;

module.exports = class SynTexDynamicPlatform
{
    constructor(log, config, api)
    {
        this.a = [];

        Service = api.hap.Service;
        UUIDGenerator = api.hap.uuid;
        Accessory = api.platformAccessory;
        Platform = api;
        
        this.accessories = (callback) => {

            callback([]);

            setTimeout(() => {

                this.addAccessory(Service.Lightbulb, 'New Dynamic Switch 2');
            }, 10000);
        };
    }

    addAccessory(accessoryService, accessoryName)
    {
        var accessory = new Accessory(accessoryName, UUIDGenerator.generate('XXX1'), accessoryService);

        accessory.addService(accessoryService, accessoryName);

        Platform.registerPlatformAccessories('homebridge-syntex-dynamic-platform', 'SynTex', [accessory]);
    }
}