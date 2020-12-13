const UniversalAccessory = require('./accessories/universal');
const AccessoryInformationService = require('./accessories/info');
const OutletService = require('./accessories/outlet');
const SwitchService = require('./accessories/switch');
const LightBulbService = require('./accessories/lightBulb');
const DimmedBulbService = require('./accessories/dimmedBulb');
const ColoredBulbService = require('./accessories/coloredBulb');
const ContactService = require('./accessories/contact');
const LightService = require('./accessories/light');
const MotionService = require('./accessories/motion');

var pluginID = 'homebridge-syntex-dynamic-platform';
var pluginName = 'SynTexDynamicPlatform';

let logger = require('./logger'), WebServer = require('./webserver');;

let DynamicPlatform = class SynTexDynamicPlatform
{
	constructor(config, api, pID, pName)
	{
		if(!config)
		{
			this.logger.debug('Keine Config gefunden, das Plugin wird deaktiviert!');

			return;
		}

		this.config = config;
		this.debug = config['debug'] || false;
		this.port = config['port'];

		pluginID = pID;
		pluginName = pName;

		this.accessories = new Map();

		if(api)
		{
			this.api = api;
		}

		if(config.log_directory != null)
		{
			this.logger = new logger(pluginName, config.log_directory, this.debug);

			if(this.port != null)
			{
				this.WebServer = new WebServer(pluginName, this.logger, this.port, config.fileserver);
			}
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
		this.logger.log('info', 'bridge', 'Bridge', 'Entferne Accessory [' + accessory.displayName + '] ( ' + accessory.UUID + ' )');

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

module.exports = { DynamicPlatform, UniversalAccessory, AccessoryInformationService, OutletService, SwitchService, LightBulbService, DimmedBulbService, ColoredBulbService, ContactService, LightService, MotionService };