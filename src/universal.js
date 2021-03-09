let PlatformAccessory, Service, UUIDGen;

const AccessoryInformationService = require('./info');
const OutletService = require('./accessories/outlet');
const SwitchService = require('./accessories/switch');
const LightBulbService = require('./accessories/lightBulb');
const DimmedBulbService = require('./accessories/dimmedBulb');
const ColoredBulbService = require('./accessories/coloredBulb');
const ContactService = require('./accessories/contact');
const LightService = require('./accessories/light');
const MotionService = require('./accessories/motion');
const TemperatureService = require('./accessories/temperature');
const HumidityService = require('./accessories/humidity');
const LeakService = require('./accessories/leak');
const OccupancyService = require('./accessories/occupancy');
const StatelessSwitchService = require('./accessories/statelessswitch');
const SmokeService = require('./accessories/smoke');
const AirQualityService = require('./accessories/airquality');

module.exports = class UniversalAccessory
{
	constructor(homebridgeAccessory, deviceConfig, manager)
	{
		this.subtypes = {};
		this.platform = manager['platform'];
		this.logger = manager['logger'];

		// TODO: Device Config Reload ( When Config / Version Updated )

		this.service = [];
		this.id = deviceConfig['id'];
		this.name = deviceConfig['name'];
		this.services = deviceConfig['services'];

		this.manufacturer = deviceConfig['manufacturer'] || 'SynTex';
		this.model = deviceConfig['model'] || 'Virtual Accessory';
		this.version = deviceConfig['version'] || '99.99.99';

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
				this.addService(this.services[i]);
			}
		}
		else
		{
			this.addService(this.services);
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

		this.setService(config, this.subtypes[type].toString());

		this.subtypes[type]++;
	}

	addAccessory()
	{
		if(this.homebridgeAccessory)
		{
			this.homebridgeAccessory.displayName = this.name;

			this.logger.debug('%accessory_found%! [' + this.name + '] ( ' +  this.id + ' )');
		}
		else
		{
			this.logger.debug('%accessory_create%! [' + this.name + '] ( ' +  this.id + ' )');
			
			this.homebridgeAccessory = new PlatformAccessory(this.name, UUIDGen.generate(this.id), Service.AccessoryInformation);

			this.platform.registerPlatformAccessory(this.homebridgeAccessory);
		}
	}

	setAccessoryInformation()
	{
		var service = new AccessoryInformationService(this.homebridgeAccessory, this.deviceConfig, { manufacturer : this.getManufacturer(), model : this.getModel(), version : this.getVersion() }, this.manager);

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
		var serviceConfig = { name : name, type : type, subtype : subtype };

		if(type == 'switch')
		{
			service = new SwitchService(this.homebridgeAccessory, this.deviceConfig, serviceConfig, this.manager);
		}
		else if(type == 'outlet' || type == 'relais')
		{
			service = new OutletService(this.homebridgeAccessory, this.deviceConfig, serviceConfig, this.manager);
		}
		else if(type == 'led')
		{
			service = new LightBulbService(this.homebridgeAccessory, this.deviceConfig, serviceConfig, this.manager);
		}
		else if(type == 'dimmer')
		{
			service = new DimmedBulbService(this.homebridgeAccessory, this.deviceConfig, serviceConfig, this.manager);
		}
		else if(type == 'rgb')
		{
			service = new ColoredBulbService(this.homebridgeAccessory, this.deviceConfig, serviceConfig, this.manager);
		}
		else if(type == 'contact')
		{
			service = new ContactService(this.homebridgeAccessory, this.deviceConfig, serviceConfig, this.manager);
		}
		else if(type == 'light')
		{
			service = new LightService(this.homebridgeAccessory, this.deviceConfig, serviceConfig, this.manager);
		}
		else if(type == 'motion')
		{
			service = new MotionService(this.homebridgeAccessory, this.deviceConfig, serviceConfig, this.manager);
		}
		else if(type == 'temperature')
		{
			service = new TemperatureService(this.homebridgeAccessory, this.deviceConfig, serviceConfig, this.manager);
		}
		else if(type == 'humidity')
		{
			service = new HumidityService(this.homebridgeAccessory, this.deviceConfig, serviceConfig, this.manager);
		}
		else if(type == 'leak')
		{
			service = new LeakService(this.homebridgeAccessory, this.deviceConfig, serviceConfig, this.manager);
		}
		else if(type == 'occupancy')
		{
			service = new OccupancyService(this.homebridgeAccessory, this.deviceConfig, serviceConfig, this.manager);
		}
		else if(type == 'statelessswitch')
		{
			service = new StatelessSwitchService(this.homebridgeAccessory, this.deviceConfig, serviceConfig, this.manager);
		}
		else if(type == 'smoke')
		{
			service = new SmokeService(this.homebridgeAccessory, this.deviceConfig, serviceConfig, this.manager);
		}
		else if(type == 'airquality')
		{
			service = new AirQualityService(this.homebridgeAccessory, this.deviceConfig, serviceConfig, this.manager);
		}

		if(service != null)
		{
			this.service.push(service);
		}
	}

	removeService(type, subtype = 0)
	{

	}

	getID()
	{
		return this.id;
	}

	getManufacturer()
	{
		return this.manufacturer;
	}

	getModel()
	{
		return this.model;
	}

	getVersion()
	{
		return this.version;
	}
}