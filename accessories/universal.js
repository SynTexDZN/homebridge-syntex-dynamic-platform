const OutletService = require('./outlet');
const SwitchService = require('./switch');
const LightBulbService = require('./lightbulb');

let PlatformAccessory;
let Service;
let Characteristic;
let UUIDGen;

module.exports = class UniversalAccessory
{
	constructor(homebridgeAccessory, deviceConfig, manager)
	{
		this.subtypes = {};
		this.platform = manager['platform'];
		this.logger = manager['logger'];

		this.service = [];
        this.id = deviceConfig['id'];
        this.name = deviceConfig['name'];
        this.services = deviceConfig['services'];

		this.version = deviceConfig['version'] || '1.0.0';
        this.model = deviceConfig['model'] || 'Virtual Accessory';
		this.manufacturer = deviceConfig['manufacturer'] || 'SynTex';
		
		this.manager = manager;

		PlatformAccessory = manager.platform.api.platformAccessory;

		({ Service, Characteristic, uuid: UUIDGen } = manager.platform.api.hap);

		this.homebridgeAccessory = homebridgeAccessory;
		this.deviceConfig = deviceConfig;

		this.addAccessory();

		for(var i = 0; i < this.services.length; i++)
		{
			var accessoryService = Service.AccessoryInformation;

			if(deviceConfig.services[i] == 'rgb')
			{
				accessoryService = Service.Lightbulb;
			}
			else if(deviceConfig.services[i] == 'switch')
			{
				accessoryService = Service.Switch;
			}
			else if(deviceConfig.services[i] == 'outlet')
			{
				accessoryService = Service.Outlet;
			}
			else if(deviceConfig.services[i] == 'fan')
			{
				accessoryService = Service.Fanv2;
			}

			this.addService(accessoryService, deviceConfig.services[i]);
		}
	}

	addService(serviceType, config)
	{
		var type = config;

		if(type instanceof Object && config.type != null)
		{
			type = config.type;
		}

		if(!this.subtypes[type])
		{
			this.subtypes[type] = 0;
		}

		this.setService(serviceType, config, this.subtypes[type]);

		this.subtypes[type]++;
	}

	setService(serviceType, config, subtype)
	{
		//var name = this.name;
		var type = config;

		if(config instanceof Object)
		{
			/*
			if(config.name != null)
			{
				name = config.name;
			}
			*/
			if(config.type != null)
			{
				type = config.type;
			}
		}

		if(type == 'switch')
		{
			var service = new SwitchService(this.homebridgeAccessory, this.deviceConfig, subtype, this.manager);
		}
		else if(type == 'outlet')
		{
			var service = new OutletService(this.homebridgeAccessory, this.deviceConfig, subtype, this.manager);
		}
		else if(type == 'rgb')
		{
			var service = new LightBulbService(this.homebridgeAccessory, this.deviceConfig, subtype, this.manager);
		}

		this.service.push(service);
	}

	removeService(type, subtype = 0)
	{

	}

	addAccessory()
	{
		if(this.homebridgeAccessory)
		{
			this.logger.debug('Existierendes Accessory gefunden! ' + this.name + ' ( ' +  this.id + ' )');

			this.homebridgeAccessory.displayName = this.name;
		}
		else
		{
			this.logger.debug('Erstelle neues Accessory! ' + this.name + ' ( ' +  this.id + ' )');

			this.homebridgeAccessory = new PlatformAccessory(this.name, UUIDGen.generate(this.id), Service.Switch);

			this.platform.registerPlatformAccessory(this.homebridgeAccessory);
		}
	}
}

var types = ['contact', 'motion', 'temperature', 'humidity', 'rain', 'light', 'occupancy', 'smoke', 'airquality', 'rgb', 'switch', 'relais', 'statelessswitch', 'outlet'];
var letters = ['A', 'B', 'C', 'D', 'E', 'F', '0', '1', '2', '3', '4', '5', '6', '7'];

function letterToType(letter)
{
	return types[letters.indexOf(letter.toUpperCase())];
}

function typeToLetter(type)
{
	return letters[types.indexOf(type.toLowerCase())];
}