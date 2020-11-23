const UniversalAccessory = require('./accessories/universal');

const pluginID = 'homebridge-syntex-dynamic-platform';
const pluginName = 'SynTexDynamicPlatform';

let logger = require('./logger');

module.exports = class SynTexDynamicPlatform
{
    constructor(log, config, api)
    {
        this.log = log;
        this.config = config;

        this.logger = new logger(pluginName, config.log_directory, api.user.storagePath());

        if(!config)
        {
            this.logger.debug('Keine Config gefunden, das Plugin wird deaktiviert!');
            
            return;
        }

        this.accessories = new Map();

        if(api)
        {
            this.api = api;

            this.api.on('didFinishLaunching', () => {

                this.logger.debug('Initialisiere ' + pluginName + ' ...');

                var devices = ['acc1', 'acc2'];

                for(const id of devices)
                {
                    if(this.accessories.get(this.api.hap.uuid.generate(id)) != null)
                    {
                        //this.removeAccessory(this.accessories.get(this.api.hap.uuid.generate(id)));
                    }
                }

                var devices = [{id : 'acc1', name : 'Accessory 1', services : [{ type : 'outlet', name : 'Outlet 1' }, { type : 'outlet', name : 'Outlet 2' }, { type : 'outlet', name : 'Outlet 3' }, { type : 'outlet', name : 'Outlet 4' }, { type : 'outlet', name : 'Outlet 5' }]},
                    {id : 'acc2', name : 'Accessory 2', services : ['rgb', 'switch']}];

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
        this.logger.log('info', 'bridge', 'Bridge', 'Hinzufügen: ' + device.name + ' ( ' + device.id + ' )');

        const uuid = this.api.hap.uuid.generate(device.id);
        const homebridgeAccessory = this.accessories.get(uuid);

        let deviceAccessory = new UniversalAccessory(homebridgeAccessory, device, { platform : this, logger : this.logger });
        this.accessories.set(uuid, deviceAccessory.homebridgeAccessory);
    }

    registerPlatformAccessory(platformAccessory)
    {
        this.logger.debug('Registriere Platform Accessory [' + platformAccessory.displayName + ']');
        this.api.registerPlatformAccessories(pluginID, pluginName, [platformAccessory]);
    }
    
    configureAccessory(accessory)
    {
        this.logger.debug('Konfiguriere Accessory aus dem Cache Speicher [' + accessory.displayName + '] ( ' + accessory.UUID + ' )');

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
        this.logger.debug('Entferne Accessory [' + accessory.name + '] ( ' + accessory.UUID + ' )');
        this.api.unregisterPlatformAccessories(pluginID, pluginName, [accessory]);

        this.accessories.delete(accessory.uuid);
    }
}