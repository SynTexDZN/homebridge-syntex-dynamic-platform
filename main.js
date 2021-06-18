const axios = require('axios'), store = require('json-fs-store');

const ContextManager = require('./src/context');
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
var pluginVersion = '1.0.0';

let logger = require('syntex-logger'), WebServer = require('syntex-webserver');

let DynamicPlatform = class SynTexDynamicPlatform
{
	constructor(config, api, pID, pName, pVersion)
	{
		if(!config)
		{
			console.log('Keine Config gefunden, das Plugin wird deaktiviert!');

			return;
		}

		this.config = config;
		this.debug = config['debug'] || false;
		this.port = config['port'];
		this.language = config['language'] || 'en';
		this.automationDirectory = config['automationDirectory'];

		this.configJSON = store(api.user.storagePath());

		pluginID = pID;
		pluginName = pName;
		pluginVersion = pVersion

		this.accessories = new Map();

		if(api)
		{
			this.api = api;
		}

		this.logger = new logger(pluginName, config.logDirectory, this.debug, this.language);

		if(this.port != null)
		{
			this.WebServer = new WebServer(pluginName, this.logger, this.port, this.language, config.fileserver);

			this.WebServer.addPage('/devices', async (response, urlParams) => {

				if(urlParams.id != null)
				{
					var accessory = this.getAccessory(urlParams.id);
	
					if(accessory == null)
					{
						response.write('Error');

						this.logger.log('error', urlParams.id, '', '%config_read_error[1]%! ( ' + urlParams.id + ' )');
					}
					else
					{
						var service = null;
	
						if(accessory.service != null)
						{
							service = accessory.service[1];
							
							if(urlParams.event == null)
							{
								for(var j = 0; j < accessory.service.length; j++)
								{
									if(accessory.service[j].id != null && accessory.service[j].letters != null)
									{
										if((urlParams.type == null || accessory.service[j].letters[0] == this.typeToLetter(urlParams.type)) && (urlParams.counter == null || accessory.service[j].letters[1] == urlParams.counter))
										{
											service = accessory.service[j];
										}
									}
								}
							}
						}
						
						if(service == null && urlParams.remove == null)
						{
							response.write('Error');

							this.logger.log('error', urlParams.id, '', '%config_read_error[2]% ( ' + urlParams.id + ' )');
						}
						else if(urlParams.value != null)
						{
							var state = { value : urlParams.value };
	
							if(urlParams.hue != null)
							{
								state.hue = urlParams.hue;
							}
							
							if(urlParams.saturation != null)
							{
								state.saturation = urlParams.saturation;
							}
	
							if(urlParams.brightness != null)
							{
								state.brightness = urlParams.brightness;
							}
	
							if(urlParams.event != null)
							{
								state.event = urlParams.event;
							}
	
							if((state = this.validateUpdate(urlParams.id, service.letters, state)) != null)
							{
								service.changeHandler(state);
							}
							else
							{
								this.logger.log('error', urlParams.id, service.letters, '[' + service.name + '] %update_error%! ( ' + urlParams.id + ' )');
							}
	
							response.write(state != null ? 'Success' : 'Error');
						}
						else if(urlParams.remove != null)
						{
							if(urlParams.remove == 'CONFIRM')
							{
								await this.removeAccessory(accessory.homebridgeAccessory != null ? accessory.homebridgeAccessory : accessory, urlParams.id);
							}
	
							response.write(urlParams.remove == 'CONFIRM' ? 'Success' : 'Error');
						}
						else
						{
							var state = null;
							
							if(accessory.homebridgeAccessory != null
							&& accessory.homebridgeAccessory.context != null
							&& accessory.homebridgeAccessory.context.data != null)
							{
								if(urlParams.type == null)
								{
									state = accessory.homebridgeAccessory.context.data;
								}
								else if(service != null
								&& service.letters != null)
								{
									state = accessory.homebridgeAccessory.context.data[service.letters];
								}
							}
	
							response.write(state != null ? JSON.stringify(state) : 'Error');
						}
					}
				}
				else
				{
					response.write('Error');
				}
	
				response.end();
			});
			
			this.WebServer.addSocket('devices', (ws, params) => {

				var state = ContextManager.addClient(ws, params.id);

				if(state != null)
				{
					ws.send(JSON.stringify(state));
				}
			});
		}

		const { exec } = require('child_process');

		exec('cat /sys/class/net/wlan0/address', (error, stdout, stderr) => {

			if(stdout)
			{
				axios.get('http://syntex.sytes.net/smarthome/init-bridge.php?plugin=' + pluginName + '&mac=' + stdout + '&version=' + pluginVersion);	
			}
		});
	}

	registerPlatformAccessory(platformAccessory)
	{
		this.logger.debug('%accessory_register% [' + platformAccessory.displayName + ']');

		this.api.registerPlatformAccessories(pluginID, pluginName, [platformAccessory]);
	}

	getPlatformAccessory()
	{
		return this;
	}
	
	addAccessory(accessory)
	{
		this.logger.debug('[' + accessory.name + '] %accessory_add%! ( ' + accessory.id + ' )');

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
		this.logger.debug('%accessory_configure% [' + accessory.displayName + '] ( ' + accessory.UUID + ' )');
		
		this.accessories.set(accessory.UUID, accessory);
	}

	removeAccessory(accessory, id)
	{
		return new Promise(async (resolve) => {

			this.logger.log('info', 'bridge', 'Bridge', '%accessory_remove% [' + accessory.displayName + '] ( ' + accessory.UUID + ' )');

			this.configJSON.load('config', (err, obj) => {

				if(obj != null && err == null)
				{
					var changed = false;

					obj.id = 'config';

					for(const i in obj.platforms)
					{
						if(obj.platforms[i].platform == pluginName && obj.platforms[i].accessories != null)
						{
							for(const j in obj.platforms[i].accessories)
							{
								if(obj.platforms[i].accessories[j].id == id)
								{
									obj.platforms[i].accessories.splice(j, 1);

									changed = true;
								}
							}
						}
					}

					if(changed)
					{
						this.configJSON.add(obj, (err) => {

							resolve();
							
							if(err)
							{
								logger.log('error', 'bridge', 'Bridge', '[' + id + '] %accessory_remove_error%! ' + err);
							}
						});
					}
					else
					{
						resolve();
					}
				}
				else
				{
					resolve();
				}
			});
			
			this.api.unregisterPlatformAccessories(pluginID, pluginName, [accessory]);

			this.accessories.delete(accessory.UUID);
		});
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

		var values = null;

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
			&& accessory.homebridgeAccessory.context.data[letters] != null)
			{
				values = accessory.homebridgeAccessory.context.data[letters];
	
				if(verbose)
				{
					var stateText = JSON.stringify(values['state']);
	
					if(Object.keys(values) > 1)
					{
						stateText = 'power: ' + JSON.stringify(values['state']);
					}
	
					if(values['hue'] != null)
					{
						stateText += ', hue: ' + values['hue'];
					}
	
					if(values['saturation'] != null)
					{
						stateText += ', saturation: ' + values['saturation'];
					}
	
					if(values['brightness'] != null)
					{
						stateText += ', brightness: ' + values['brightness'];
					}
	
					this.logger.log('read', accessory.id, letters, '%read_state[0]% [' + name + '] %read_state[1]% [' + stateText + '] ( ' + accessory.id + ' )');
				}
			}
			else
			{
				this.logger.log('warn', accessory.id, letters, '[state] %of% [' + name + '] %cache_read_error%! ( ' + accessory.id + ' )');
			}
		}
		else
		{
			this.logger.log('warn', id, letters, '[' + id + '] %config_read_error[0]%! ( ' + id + ' )');
		}

		return values;
	}

	validateUpdate(id, letters, state)
	{
		var data = {
			A : { type : 'contact', format : 'boolean' },
			B : { type : 'motion', format : 'boolean' },
			C : { type : 'temperature', format : 'number' },
			D : { type : 'humidity', format : 'number' },
			E : { type : 'rain', format : 'boolean' },
			F : { type : 'light', format : 'number' },
			0 : { type : 'occupancy', format : 'boolean' },
			1 : { type : 'smoke', format : 'boolean' },
			2 : { type : 'airquality', format : 'number' },
			3 : { type : 'rgb', format : { value : 'boolean', brightness : 'number', saturation : 'number', hue : 'number' } },
			4 : { type : 'switch', format : 'boolean' },
			5 : { type : 'relais', format : 'boolean' },
			6 : { type : 'statelessswitch', format : 'number' },
			7 : { type : 'outlet', format : 'boolean' },
			8 : { type : 'led', format : 'boolean' },
			9 : { type : 'dimmer', format : { value : 'boolean', brightness : 'number' } }
		};

		for(const i in state)
		{
			try
			{
				state[i] = JSON.parse(state[i]);
			}
			catch(e)
			{
				this.logger.log('warn', id, letters, '%conversion_error_parse[0]%: [' + state[i] + '] %conversion_error_parse[1]%! ( ' + id + ' )');

				return null;
			}
			
			var format = data[letters[0].toUpperCase()].format;

			if(format instanceof Object)
			{
				format = format[i];
			}

			if(typeof state[i] != format)
			{
				this.logger.log('warn', id, letters, '%conversion_error_format[0]%: [' + state[i] + '] %conversion_error_format[1]% ' + (format == 'boolean' ? '%conversion_error_format[2]%' : format == 'number' ? '%conversion_error_format[3]%' : '%conversion_error_format[4]%') + ' %conversion_error_format[5]%! ( ' + id + ' )');

				return null;
			}
		}

		return state;
	}

	typeToLetter(type)
	{
		var types = ['contact', 'motion', 'temperature', 'humidity', 'rain', 'light', 'occupancy', 'smoke', 'airquality', 'rgb', 'switch', 'relais', 'statelessswitch', 'outlet', 'led', 'dimmer'];
		var letters = ['A', 'B', 'C', 'D', 'E', 'F', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

		return letters[types.indexOf(type.toLowerCase())];
	}
}

module.exports = { DynamicPlatform, ContextManager, UniversalAccessory, AccessoryInformationService, OutletService, SwitchService, LightBulbService, DimmedBulbService, ColoredBulbService, ContactService, LightService, MotionService, TemperatureService, HumidityService, LeakService, OccupancyService, StatelessSwitchService, SmokeService, AirQualityService };