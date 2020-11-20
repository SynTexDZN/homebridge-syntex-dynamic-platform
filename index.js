var Service, Characteristic, Homebridge, UUIDGen, Accessory;

module.exports = function(homebridge)
{
    Homebridge = homebridge;
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    UUIDGen = homebridge.hap.uuid;
    Accessory = homebridge.platformAccessory;

    var unencrypted = [1, '1', 1.0, '1.0', 'Test', 'Test', 'Test1', 'Test2'];

    for(var i = 0; i < unencrypted.length; i++)
    {
        console.log(this.api.hap.uuid.generate(unencrypted[i]));
    }

    homebridge.registerPlatform('homebridge-syntex-dynamic-platform', 'SynTexDynamicPlatform', SynTexDynamicPlatform, true);
};

class SynTexTuyaPlatform
{
    constructor(log, config, api)
    {
        this.log = log;
        this.config = config;

        if(!config || !config.options)
        {
            this.log('No config found, disabling plugin.');
            return;
        }

        this.accessories = new Map();

        if(api)
        {
            // Save the API object as plugin needs to register new accessory via this object
            this.api = api;

            // Listen to event "didFinishLaunching", this means homebridge already finished loading cached accessories.
            // Platform Plugin should only register new accessory that doesn't exist in homebridge after this event.
            // Or start discover new accessories.
            this.api.on('didFinishLaunching', function () {
            this.log("Initializing TuyaWebPlatform...");

            this.addAccessory(device);

            }.bind(this));
        }
    }

    addAccessory(device)
    {
        const uuid = this.api.hap.uuid.generate(device.id);
        const homebridgeAccessory = this.accessories.get(uuid);
    
        var deviceAccessory = new OutletAccessory(this, homebridgeAccessory, device);
        this.accessories.set(uuid, deviceAccessory.homebridgeAccessory);
    }
}

SynTexTuyaPlatform.prototype = {
    
    accessories : function(callback)
    {
        tuyaWebAPI.getOrRefreshToken().then(function(token) {

            tuyaWebAPI.token = token;

            tuyaWebAPI.discoverDevices().then(function(devices) {
                
                var accessories = [];

                for(const device of devices)
                {
                    if(device.dev_type == 'switch')
                    {
                        var accessory = null;

                        for(var i = 0; i < this.defaults.length; i++)
                        {
                            if(this.defaults[i].id == device.id)
                            {
                                if(this.defaults[i].type == 'TV')
                                {
                                    accessory = new SynTexTVAccessory(device.id, device.name);
                                }
                                else if(this.defaults[i].type == 'Speaker')
                                {
                                    accessory = new SynTexSpeakerAccessory(device.id, device.name);
                                }
                            }
                        }

                        if(accessory == null)
                        {
                            accessory = new SynTexSwitchAccessory(Homebridge, device.id, device.name);
                        }

                        accessories.push(accessory);
                    }
                    else if(device.dev_type == 'light')
                    {
                        var accessory = new SynTexLightAccessory(device.id, device.name);

                        accessories.push(accessory);
                    }
                }

                this.refreshInterval = setInterval(function() {

                    DeviceManager.refreshAccessories(accessories);
    
                }, this.pollingInterval * 1000);

                DeviceManager.refreshAccessories(accessories);

                callback(accessories);

                WebServer.addPage('/devices', async (response, urlParams) => {
	
                    if(urlParams.id != null)
                    {
                        var accessory = null;
            
                        for(var i = 0; i < accessories.length; i++)
                        {
                            if(accessories[i].id == urlParams.id)
                            {
                                accessory = accessories[i];
                            }
                        }
            
                        if(accessory == null)
                        {
                            logger.log('error', urlParams.id, '', 'Es wurde kein passendes Gerät in der Config gefunden! ( ' + urlParams.id + ' )');
            
                            response.write('Error');
                        }
                        else if(urlParams.value != null)
                        {
                            var state = null;
	
                            if((state = validateUpdate(urlParams.id, accessory.letters, urlParams.value)) != null)
                            {
                                DeviceManager.setDevice(urlParams.id, state); // TODO : Concat RGB Light Services

                                accessory.changeHandler(state);
                            }
                            else
                            {
                                logger.log('error', urlParams.id, accessory.letters, '[' + urlParams.value + '] ist kein gültiger Wert! ( ' + urlParams.mac + ' )');
                            }
            
                            response.write(state != null ? 'Success' : 'Error');
                        }
                        else
                        {
                            var state = await DeviceManager.getDevice(urlParams.id);
            
                            response.write(state != null ? state.toString() : 'Error');
                        }
                    }
                    else
                    {
                        response.write('Error');
                    }
            
                    response.end();
                });

                WebServer.addPage('/accessories', (response) => {

                    var a = [];

                    for(var i = 0; i < accessories.length; i++)
                    {
                        a[i] = {
                            mac: accessories[i].id,
                            name: accessories[i].name,
                            services: accessories[i].services,
                            version: '99.99.99',
                            plugin: 'SynTexTuya'
                        };
                    }

                    response.write(JSON.stringify(a));
                    response.end();
                });

                WebServer.addPage('/serverside/version', (response) => {

                    response.write(require('./package.json').version);
                    response.end();
                });
        
                WebServer.addPage('/serverside/check-restart', (response) => {
        
                    response.write(restart.toString());
                    response.end();
                });
        
                WebServer.addPage('/serverside/update', async (response, urlParams) => {
        
                    var version = urlParams.version != null ? urlParams.version : 'latest';
        
                    const { exec } = require('child_process');
                    
                    exec('sudo npm install homebridge-syntex-tuya@' + version + ' -g', (error, stdout, stderr) => {
        
                        try
                        {
                            if(error || stderr.includes('ERR!'))
                            {
                                logger.log('warn', 'bridge', 'Bridge', 'Das Plugin SynTexTuya konnte nicht aktualisiert werden! ' + (error || stderr));
                            }
                            else
                            {
                                logger.log('success', 'bridge', 'Bridge', 'Das Plugin SynTexTuya wurde auf die Version [' + version + '] aktualisiert!');
        
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

            }.bind(this)).catch(function(e) {

                logger.err(e);
            });

        }.bind(this)).catch(function(e) {

            logger.err(e);
        });
    }
}
/*
function SynTexSwitchAccessory(id, name)
{
    this.id = id;
    this.name = name;
    this.services = 'switch';
    this.letters = '40';

    this.service = new Service.Outlet(this.name);
    
    //DeviceManager.getDevice(this).then(function(state) {

    //    this.value = validateUpdate(this.mac, this.type, state);

    //}.bind(this));
    
    this.changeHandler = (function(state)
    {
        logger.log('update', this.id, this.letters, 'HomeKit Status für [' + this.name + '] geändert zu [' + state + '] ( ' + this.id + ' )');

        this.service.getCharacteristic(Characteristic.On).updateValue(state);

    }).bind(this);
    
    this.service.getCharacteristic(Characteristic.On).on('get', this.getState.bind(this)).on('set', this.setState.bind(this));
}

SynTexSwitchAccessory.prototype.getState = function(callback)
{
    DeviceManager.getDevice(this.id).then(function(state) {

        if(state != null)
        {
            logger.log('read', this.id, this.letters, 'HomeKit Status für [' + this.name + '] ist [' + state + '] ( ' + this.id + ' )');
        }
        
        //if(!data.online)
        //{
        //    callback(new Error('Offline'));
        //}

        callback(null, state);

    }.bind(this)).catch(function(e) {

        logger.err(e);

        callback(e);
    });
};

SynTexSwitchAccessory.prototype.setState = function(state, callback)
{
    DeviceManager.setDevice(this.id, state).then(function() {

        logger.log('update', this.id, this.letters, 'HomeKit Status für [' + this.name + '] geändert zu [' + state + '] ( ' + this.id + ' )');
        
        callback();

    }.bind(this)).catch(function(e) {

        logger.err(e);

        callback(e);
    });
}

SynTexSwitchAccessory.prototype.getServices = function()
{
    return [this.service];
};
*/
function SynTexLightAccessory(id, name)
{
    this.id = id;
    this.name = name;
    this.services = 'led';
    this.letters = '40';

    this.service = new Service.Lightbulb(this.name);
    /*
    DeviceManager.getDevice(this).then(function(state) {

        this.value = validateUpdate(this.mac, this.type, state);

    }.bind(this));
    */
    this.changeHandler = (function(state)
    {
        logger.log('update', this.id, this.letters, 'HomeKit Status für [' + this.name + '] geändert zu [' + state + '] ( ' + this.id + ' )');

        this.service.getCharacteristic(Characteristic.On).updateValue(state);

    }).bind(this);
    
    //this.service.getCharacteristic(Characteristic.On).on('get', this.getState.bind(this)).on('set', this.setState.bind(this));
}

SynTexLightAccessory.prototype.getServices = function()
{
    return [this.service];
};

function SynTexTVAccessory(id, name)
{
    this.id = id;
    this.name = name;
    this.services = 'television';
    this.letters = '40';

    this.service = new Service.Television(this.name, 'tvService');
    /*
    DeviceManager.getDevice(this).then(function(state) {

        this.value = validateUpdate(this.mac, this.type, state);

    }.bind(this));
    */
    this.changeHandler = (function(state)
    {
        logger.log('update', this.id, this.letters, 'HomeKit Status für [' + this.name + '] geändert zu [' + state + '] ( ' + this.id + ' )');

        this.service.getCharacteristic(Characteristic.On).updateValue(state);

    }).bind(this);

    this.service.getCharacteristic(Characteristic.Active).on('get', this.getState.bind(this)).on('set', this.setState.bind(this));

    this.service.setCharacteristic(Characteristic.ConfiguredName, this.name);
}

SynTexTVAccessory.prototype.getState = function(callback)
{
    DeviceManager.getDevice(this.id).then(function(state) {

        if(state != null)
        {
            logger.log('read', this.id, this.letters, 'HomeKit Status für [' + this.name + '] ist [' + state + '] ( ' + this.id + ' )');
        }
        /*
        if(!data.online)
        {
            callback(new Error('Offline'));
        }
        */
        callback(null, state);

    }.bind(this)).catch(function(e) {

        logger.err(e);

        callback(e);
    });
};

SynTexTVAccessory.prototype.setState = function(state, callback)
{
    DeviceManager.setDevice(this.id, state).then(function() {

        logger.log('update', this.id, this.letters, 'HomeKit Status für [' + this.name + '] geändert zu [' + state + '] ( ' + this.id + ' )');
        
        callback();

    }.bind(this)).catch(function(e) {

        logger.err(e);

        callback(e);
    });
}

SynTexTVAccessory.prototype.getServices = function()
{
    return [this.service];
};

function SynTexSpeakerAccessory(id, name)
{
    this.id = id;
    this.name = name;
    this.services = 'speaker';
    this.letters = '40';

    this.service = new Service.Speaker(this.name, 'tvSpeakerService');
    /*
    DeviceManager.getDevice(this).then(function(state) {

        this.value = validateUpdate(this.mac, this.type, state);

    }.bind(this));
    */
    this.changeHandler = (function(state)
    {
        logger.log('update', this.id, this.letters, 'HomeKit Status für [' + this.name + '] geändert zu [' + state + '] ( ' + this.id + ' )');

        this.service.getCharacteristic(Characteristic.On).updateValue(state);

    }).bind(this);

    this.service.getCharacteristic(Characteristic.On).on('get', this.getState.bind(this)).on('set', this.setState.bind(this));
    this.service.setCharacteristic(Characteristic.ConfiguredName, this.name);
    this.service.setCharacteristic(Characteristic.Mute, false);
    this.service.setCharacteristic(Characteristic.Volume, 100);
}

SynTexSpeakerAccessory.prototype.getState = function(callback)
{
    DeviceManager.getDevice(this.id).then(function(state) {

        if(state != null)
        {
            logger.log('read', this.id, this.letters, 'HomeKit Status für [' + this.name + '] ist [' + state + '] ( ' + this.id + ' )');
        }
        /*
        if(!data.online)
        {
            callback(new Error('Offline'));
        }
        */
        callback(null, state);

    }.bind(this)).catch(function(e) {

        logger.err(e);

        callback(e);
    });
};

SynTexSpeakerAccessory.prototype.setState = function(state, callback)
{
    DeviceManager.setDevice(this.id, state).then(function() {

        logger.log('update', this.id, this.letters, 'HomeKit Status für [' + this.name + '] geändert zu [' + state + '] ( ' + this.id + ' )');
        
        callback();

    }.bind(this)).catch(function(e) {

        logger.err(e);

        callback(e);
    });
}

SynTexSpeakerAccessory.prototype.getServices = function()
{
    return [this.service];
};

function validateUpdate(mac, letters, state)
{
    var type = letterToType(letters[0]);

    if(type === 'motion' || type === 'rain' || type === 'smoke' || type === 'occupancy' || type === 'contact' || type == 'switch' || type == 'relais')
    {
        if(state != true && state != false && state != 'true' && state != 'false')
        {
            logger.log('warn', mac, letters, 'Konvertierungsfehler: [' + state + '] ist keine boolsche Variable! ( ' + mac + ' )');

            return null;
        }

        return (state == 'true' || state == true ? true : false);
    }
    else if(type === 'light' || type === 'temperature')
    {
        if(isNaN(state))
        {
            logger.log('warn', mac, letters, 'Konvertierungsfehler: [' + state + '] ist keine numerische Variable! ( ' + mac + ' )');
        }

        return !isNaN(state) ? parseFloat(state) : null;
    }
    else if(type === 'humidity' || type === 'airquality')
    {
        if(isNaN(state))
        {
            logger.log('warn', mac, letters, 'Konvertierungsfehler: [' + state + '] ist keine numerische Variable! ( ' + mac + ' )');
        }

        return !isNaN(state) ? parseInt(state) : null;
    }
    else
    {
        return state;
    }
}

var types = ['contact', 'motion', 'temperature', 'humidity', 'rain', 'light', 'occupancy', 'smoke', 'airquality', 'rgb', 'switch', 'relais', 'statelessswitch'];
var letters = ['A', 'B', 'C', 'D', 'E', 'F', '0', '1', '2', '3', '4', '5', '6'];

function letterToType(letter)
{
    return types[letters.indexOf(letter.toUpperCase())];
}

function typeToLetter(type)
{
    return letters[types.indexOf(type.toLowerCase())];
}