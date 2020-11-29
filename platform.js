const { pid } = require('process');
const UniversalAccessory = require('./accessories/universal');
const AccessoryInformationService = require('./accessories/info');
const OutletService = require('./accessories/outlet');
const SwitchService = require('./accessories/switch');
const LightBulbService = require('./accessories/lightBulb');
const DimmedBulbService = require('./accessories/dimmedBulb');
const ColoredBulbService = require('./accessories/coloredBulb');
const ContactService = require('./accessories/contact');

var pluginID = 'homebridge-syntex-dynamic-platform';
var pluginName = 'SynTexDynamicPlatform';

let logger = require('./logger'), WebServer = require('./webserver');;

let DynamicPlatform = class SynTexDynamicPlatform
{
    constructor(config, api, pID, pName)
    {
        this.config = config;
        this.port = config.port;

        pluginID = pID;
        pluginName = pName;

        console.log(this.port);

        this.logger = new logger(pluginName, config.log_directory, api.user.storagePath());

        if(this.port != null)
        {
            WebServer = new WebServer(pluginName, this.logger, this.port, false);
            /*
            WebServer.addPage('/serverside/version', (response) => {

                response.write(require('./package.json').version);
                response.end();
            });
    
            WebServer.addPage('/serverside/check-restart', (response) => {
    
                response.write(restart.toString());
                response.end();
            });
    
            WebServer.addPage('/serverside/update', (response, urlParams) => {
    
                var version = urlParams.version != null ? urlParams.version : 'latest';
    
                const { exec } = require('child_process');
                
                exec('sudo npm install ' + pluginID + '@' + version + ' -g', (error, stdout, stderr) => {
    
                    try
                    {
                        if(error || stderr.includes('ERR!'))
                        {
                            logger.log('warn', 'bridge', 'Bridge', 'Das Plugin ' + pluginName + ' konnte nicht aktualisiert werden! ' + (error || stderr));
                        }
                        else
                        {
                            logger.log('success', 'bridge', 'Bridge', 'Das Plugin ' + pluginName + ' wurde auf die Version [' + version + '] aktualisiert!');
    
                            restart = true;
    
                            logger.log('warn', 'bridge', 'Bridge', 'Die Homebridge wird neu gestartet ..');
    
                            exec('sudo systemctl restart homebridge');
                        }
    
                        response.write(error || stderr.includes('ERR!') ? 'Error' : 'Success');
                        response.end();
                    }
                    catch(e)
                    {
                        logger.err(e);
                    }
                });
            });
            */
        }

        if(!config)
        {
            this.logger.debug('Keine Config gefunden, das Plugin wird deaktiviert!');

            return;
        }

        this.accessories = new Map();
        
        if(api)
        {
            this.api = api;
            /*
            this.api.on('didFinishLaunching', () => {

                // Demo Stuff

                this.logger.debug('Initialisiere ' + pluginName + ' ...');

                var devices = ['acc1', 'acc2', 'acc3', 'acc4', 'acc5'];

                for(const id of devices)
                {
                    if(this.accessories.get(this.api.hap.uuid.generate(id)) != null)
                    {
                        //this.removeAccessory(this.accessories.get(this.api.hap.uuid.generate(id)));
                    }
                }

                var devices = [{id : 'acc1', name : 'Accessory 1', services : [{ type : 'outlet', name : 'Outlet 1' }, { type : 'outlet', name : 'Outlet 2' }, { type : 'outlet', name : 'Outlet 3' }, { type : 'outlet', name : 'Outlet 4' }, { type : 'outlet', name : 'Outlet 5' }]},
                    {id : 'acc2', name : 'Accessory 2', services : ['led', 'dimmer', 'rgb', 'switch']},
                    {id : 'acc3', name : 'Accessory 3', services : ['dimmer']},
                    {id : 'acc4', name : 'Accessory 4', services : 'led'},
                    {id : 'acc5', name : 'Accessory 5', services : 'contact'}];

                for(const device of devices)
                {
                    this.addAccessory(device);
                }

                for(const accessory of this.accessories)
                {
                    for(const x in accessory[1].service)
                    {
                        if(accessory[1].service[x].letters)
                        {
                            console.log(accessory[1].id, accessory[1].service[x].letters);

                            console.log(this.readAccessoryService(accessory[1].id, accessory[1].service[x].letters));
                        }
                    }
                }

                setTimeout(() => {

                    this.updateAccessoryService('acc5', 'A0', false);
                    
                }, 10000);

                setTimeout(() => {

                    this.updateAccessoryService('acc5', 'A0', true);
                    
                }, 20000);

                setTimeout(() => {

                    this.updateAccessoryService('acc3', '90', { power : true, brightness : 75 });
                    
                }, 30000);
            });
            */
        }
    }

    registerPlatformAccessory(platformAccessory)
    {
        this.logger.debug('Registriere Platform Accessory [' + platformAccessory.displayName + ']');
        this.api.registerPlatformAccessories(pluginID, pluginName, [platformAccessory]);
    }

    getPlatformAccessory()
    {
        return this;
    }
    
    addAccessory(accessory)
    {
        this.logger.log('info', 'bridge', 'Bridge', 'Hinzufügen: ' + accessory.name + ' ( ' + accessory.id + ' )');

        const uuid = this.api.hap.uuid.generate(accessory.id);
        const homebridgeAccessory = this.accessories.get(uuid);

        //let deviceAccessory = new UniversalAccessory(homebridgeAccessory, accessory, { platform : this, logger : this.logger });
        
        this.accessories.set(uuid, accessory);
    }

    getAccessory(id)
    {
        const uuid = this.api.hap.uuid.generate(id);
        const homebridgeAccessory = this.accessories.get(uuid);

        return homebridgeAccessory;
    }

    configureAccessory(accessory)
    {
        this.logger.debug('Konfiguriere Accessory aus dem Cache Speicher [' + accessory.displayName + '] ( ' + accessory.UUID + ' )');

        this.accessories.set(accessory.UUID, accessory);
    }

    removeAccessory(accessory)
    {
        this.logger.debug('Entferne Accessory [' + accessory.displayName + '] ( ' + accessory.UUID + ' )');

        this.api.unregisterPlatformAccessories(pluginID, pluginName, [accessory]);

        this.accessories.delete(accessory.uuid);
    }
    /*
    updateAccessoryReachability(accessory, state)
    {
        this.log("Update Reachability [%s]", accessory.displayName, state);
        accessory.updateReachability(state);
    }
    */

    updateAccessoryService(id, letters, value)
    {
        const uuid = this.api.hap.uuid.generate(id);
        const homebridgeAccessory = this.accessories.get(uuid);

        for(var i = 0; i < homebridgeAccessory.service.length; i++)
        {
            if(homebridgeAccessory.service[i].letters == letters)
            {
                homebridgeAccessory.service[i].changeHandler(value);
            }
        }
    }

    readAccessoryService(id, letters)
    {
        const uuid = this.api.hap.uuid.generate(id);
        const homebridgeAccessory = this.accessories.get(uuid);

        var state = null;

        for(var i = 0; i < homebridgeAccessory.service.length; i++)
        {
            if(homebridgeAccessory.service[i].letters == letters)
            {
                state = homebridgeAccessory.service[i].getValues();
            }
        }

        return state;
    }
}

module.exports = { DynamicPlatform, UniversalAccessory, AccessoryInformationService, OutletService, SwitchService, LightBulbService, DimmedBulbService, ColoredBulbService, ContactService };