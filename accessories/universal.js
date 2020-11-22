const OutletAccessory = require('./outlet');
const BulbAccessory = require('./bulb');

let PlatformAccessory;
let Accessory;
let Service;
let Characteristic;
let UUIDGen;

module.exports = class BaseAccessory
{
	constructor(homebridgeAccessory, deviceConfig, manager)
	{
		this.service = [];
		this.subtypes = {};
		this.id = deviceConfig.id;
		this.platform = manager.platform;

		this.logger = manager.logger;

		PlatformAccessory = manager.platform.api.platformAccessory;

		({ Accessory, Service, Characteristic, uuid: UUIDGen } = manager.platform.api.hap);

		this.homebridgeAccessory = homebridgeAccessory;
		this.deviceConfig = deviceConfig;

		this.addAccessory();

		for(var i = 0; i < this.deviceConfig.services.length; i++)
		{
			var accessoryService = Service.AccessoryInformation;

			if(deviceConfig.services[i] == 'rgb')
			{
				accessoryService = BulbAccessory;
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

	addService(type, t)
	{
		if(!this.subtypes[t])
		{
			this.subtypes[t] = 0;
		}

		console.log(JSON.stringify(this.subtypes));

		this.setService(type, this.subtypes[t]);

		this.subtypes[t]++;
	}

	setService(type, subtype)
	{
		var service = this.homebridgeAccessory.getServiceById(type, subtype);

		if(service)
		{
			this.logger.debug('Existierenden Service gefunden! ' + this.deviceConfig.name + ' ( ' +  this.deviceConfig.id + ' )');

			service.setCharacteristic(Characteristic.Name, this.deviceConfig.name);
		}
		else
		{
			this.logger.debug('Erstelle neuen Service! ' + this.deviceConfig.name + ' ( ' +  this.deviceConfig.id + ' )');

			this.service.push(this.homebridgeAccessory.addService(type, this.deviceConfig.name, subtype));
		}
	}

	removeService(type, subtype = 0)
	{

	}

	addAccessory()
	{
		if(this.homebridgeAccessory)
		{
			this.logger.debug('Existierendes Accessory gefunden! ' + this.deviceConfig.name + ' ( ' +  this.deviceConfig.id + ' )');

			this.homebridgeAccessory.displayName = this.deviceConfig.name;
		}
		else
		{
			this.logger.debug('Erstelle neues Accessory! ' + this.deviceConfig.name + ' ( ' +  this.deviceConfig.id + ' )');

			this.homebridgeAccessory = new PlatformAccessory(this.deviceConfig.name, UUIDGen.generate(this.deviceConfig.id), Service.Switch);

			this.platform.registerPlatformAccessory(this.homebridgeAccessory);
		}
	}
}