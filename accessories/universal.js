const AccessoryInformationService = require('./info');
const OutletService = require('./outlet');
const SwitchService = require('./switch');
const LightBulbService = require('./lightBulb');
const DimmedBulbService = require('./dimmedBulb');
const ColoredBulbService = require('./coloredBulb');

let PlatformAccessory;
let Service;
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

		this.manufacturer = deviceConfig['manufacturer'] || 'SynTex';
        this.model = deviceConfig['model'] || 'Virtual Accessory';
		this.version = deviceConfig['version'] || '1.0.0';

		this.manager = manager;

		PlatformAccessory = manager.platform.api.platformAccessory;

		({ Service, uuid: UUIDGen } = manager.platform.api.hap);

		this.homebridgeAccessory = homebridgeAccessory;
		this.deviceConfig = deviceConfig;

		this.addAccessory();

		this.setAccessoryInformation();

		if(Array.isArray(this.services))
		{
			for(var i = 0; i < this.services.length; i++)
			{
				this.addService(deviceConfig.services[i]);
			}
		}
		else
		{
			this.addService(deviceConfig.service);
		}
	}

	addService(config)
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

		this.setService(config, this.subtypes[type]);

		this.subtypes[type]++;
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

	setAccessoryInformation()
	{
		var service = new AccessoryInformationService(this.homebridgeAccessory, this.deviceConfig, { manufacturer : this.manufacturer, model : this.model, version : this.version }, this.manager);

		this.service.push(service);
	}

	setService(config, subtype)
	{
		var name = this.name;
		var type = config;

		if(config instanceof Object)
		{
			if(config.name != null)
			{
				name = config.name;
			}
			
			if(config.type != null)
			{
				type = config.type;
			}
		}

		var service = null;

		if(type == 'switch')
		{
			service = new SwitchService(this.homebridgeAccessory, this.deviceConfig, { name : name, type : type, subtype : subtype }, this.manager);
		}
		else if(type == 'outlet')
		{
			service = new OutletService(this.homebridgeAccessory, this.deviceConfig, { name : name, type : type, subtype : subtype }, this.manager);
		}
		else if(type == 'led')
		{
			service = new LightBulbService(this.homebridgeAccessory, this.deviceConfig, { name : name, type : type, subtype : subtype }, this.manager);
		}
		else if(type == 'dimmer')
		{
			service = new DimmedBulbService(this.homebridgeAccessory, this.deviceConfig, { name : name, type : type, subtype : subtype }, this.manager);
		}
		else if(type == 'rgb')
		{
			service = new ColoredBulbService(this.homebridgeAccessory, this.deviceConfig, { name : name, type : type, subtype : subtype }, this.manager);
		}

		if(service != null)
		{
			this.service.push(service);
		}
	}

	removeService(type, subtype = 0)
	{

	}
}