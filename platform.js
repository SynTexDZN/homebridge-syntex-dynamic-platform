const OutletAccessory = require('./accessories/outlet');

const pluginID = 'homebridge-syntex-dynamic-platform';
const pluginName = 'SynTexDynamicPlatform';

let logger = require('./logger');

module.exports = class SynTexDynamicPlatform
{
    constructor(log, config, api)
    {
        this.log = log;
        this.config = config;

        this.logger = new logger(pluginName, '/var/SynTex/log', api.user.storagePath());

        if(!config || !config.options)
        {
            this.logger.debug('No config found, disabling plugin.')
            return;
        }

        this.accessories = new Map();

        if(api)
        {
            this.api = api;

            this.api.on('didFinishLaunching', () => {

                this.logger.debug("Initializing SynTexDynamicPlatform ...");

                var devices = [{id : '1234', name : 'Test Dynamic Device X', services : ['outlet', 'outlet']}];

                for(const device of devices)
                {
                    //this.removeAccessory(this.accessories.get(this.api.hap.uuid.generate(device.id)));
                }

                var devices = [{id : '1234', name : 'Cool Dynamic Device', services : ['outlet', 'outlet', 'outlet', 'outlet', 'outlet']}];

                for(const device of devices)
                {
                    this.addAccessory(device);
                }
            });
        }
    }

    refreshDeviceStates()
    {
    
    }

    addAccessory(device)
    {
        this.logger.log('info', 'bridge', 'Bridge', 'Adding: ' + device.name +' (' + device.id + ')');

        const uuid = this.api.hap.uuid.generate(device.id);
        const homebridgeAccessory = this.accessories.get(uuid);

        let deviceAccessory = new OutletAccessory(homebridgeAccessory, device, { platform : this, logger : this.logger });
        this.accessories.set(uuid, deviceAccessory.homebridgeAccessory);
    }

    registerPlatformAccessory(platformAccessory)
    {
        this.logger.debug('Register Platform Accessory (' + platformAccessory.displayName + ')');
        this.api.registerPlatformAccessories(pluginID, pluginName, [platformAccessory]);
    }
    
    configureAccessory(accessory)
    {
        this.logger.debug("Configuring cached accessory [" + accessory.displayName + ' ' + accessory.context.deviceId + ' ' + accessory.UUID + "]");

        this.accessories.set(accessory.UUID, accessory);
    }
    /*
    updateAccessoryReachability(accessory, state)
    {
        this.log("Update Reachability [%s]", accessory.displayName, state);
        accessory.updateReachability(state);
    }
    */
    removeAccessory(accessory)
    {
        this.logger.debug("Remove Accessory [" + accessory.name + "]");
        this.api.unregisterPlatformAccessories(pluginID, pluginName, [accessory]);

        this.accessories.delete(accessory.uuid);
    }
}