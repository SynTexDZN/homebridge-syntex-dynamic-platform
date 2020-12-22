const UniversalAccessory = require('./src/universal');
const AccessoryInformationService = require('./src/info');
const OutletService = require('./src/accessories/outlet');
const SwitchService = require('./src/accessories/switch');
const LightBulbService = require('./src/accessories/lightBulb');
const DimmedBulbService = require('./src/accessories/dimmedBulb');
const ColoredBulbService = require('./src/accessories/coloredBulb');
const ContactService = require('./src/accessories/contact');
const LightService = require('./src/accessories/light');
const MotionService = require('./src/accessories/motion');
const TemperatureService = require('./src/accessories/temperature');
const HumidityService = require('./src/accessories/humidity');
const LeakService = require('./src/accessories/leak');
const OccupancyService = require('./src/accessories/occupancy');
const StatelessSwitchService = require('./src/accessories/statelessswitch');
const SmokeService = require('./src/accessories/smoke');
const AirQualityService = require('./src/accessories/airquality');

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
		this.logger.debug('[' + accessory.name + '] wurde dem System hinzugefügt! ( ' + accessory.id + ' )');

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

		this.accessories.delete(accessory.UUID);
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
		const accessory = this.getAccessory(id);

		for(var i = 0; i < accessory.service.length; i++)
		{
			if(accessory.service[i].letters == letters)
			{
				accessory.service[i].changeHandler(value);
			}
		}
	}

	readAccessoryService(id, letters, verbose)
	{
		const accessory = this.getAccessory(id);

		var value = null;

		if(accessory != null)
		{
			var name = accessory.name;

			for(var i = 0; i < accessory.service.length; i++)
			{
				if(accessory.service[i].letters == letters)
				{
					name = accessory.service[i].name;
				}
			}

			if(accessory.homebridgeAccessory != null
				&& accessory.homebridgeAccessory.context != null
				&& accessory.homebridgeAccessory.context.data != null
				&& accessory.homebridgeAccessory.context.data[letters] != null
				&& accessory.homebridgeAccessory.context.data[letters]['state'] != null)
			{
				value = accessory.homebridgeAccessory.context.data[letters]['state'];
	
				if(verbose)
				{
					var stateText = JSON.stringify(value);
	
					if(Object.keys(accessory.homebridgeAccessory.context.data[letters]) > 1)
					{
						stateText = 'power: ' + JSON.stringify(value);
					}
	
					if(accessory.homebridgeAccessory.context.data[letters]['hue'] != null)
					{
						stateText += ', hue: ' + accessory.homebridgeAccessory.context.data[letters]['hue'];
					}
	
					if(accessory.homebridgeAccessory.context.data[letters]['saturation'] != null)
					{
						stateText += ', saturation: ' + accessory.homebridgeAccessory.context.data[letters]['saturation'];
					}
	
					if(accessory.homebridgeAccessory.context.data[letters]['brightness'] != null)
					{
						stateText += ', brightness: ' + accessory.homebridgeAccessory.context.data[letters]['brightness'];
					}
	
					this.logger.log('read', accessory.id, letters, 'HomeKit Status für [' + name + '] ist [' + stateText + '] ( ' + accessory.id + ' )');
				}
			}
			else
			{
				this.logger.log('warn', accessory.id, letters, '[state] von [' + name + '] wurde nicht im Cache gefunden! ( ' + accessory.id + ' )');
			}
		}
		else
		{
			this.logger.log('warn', id, letters, '[' + id + '] wurde nicht in der Config gefunden! ( ' + id + ' )');
		}

		return value;
	}
}

module.exports = { DynamicPlatform, UniversalAccessory, AccessoryInformationService, OutletService, SwitchService, LightBulbService, DimmedBulbService, ColoredBulbService, ContactService, LightService, MotionService, TemperatureService, HumidityService, LeakService, OccupancyService, StatelessSwitchService, SmokeService, AirQualityService };