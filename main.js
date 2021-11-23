const axios = require('axios'), store = require('json-fs-store'), fs = require('fs'), path = require('path');

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

let logger = require('syntex-logger'), WebServer = require('syntex-webserver'), FileSystem = require('syntex-filesystem'), TypeManager = require('./type-manager');

let DynamicPlatform = class SynTexDynamicPlatform
{
	constructor(config, api, pID, pName, pVersion)
	{
		pluginID = pID;
		pluginName = pName;
		pluginVersion = pVersion

		if(!config)
		{
			console.log('Keine Config gefunden, das Plugin wird deaktiviert!');

			return;
		}

		this.baseDirectory = config['baseDirectory'] || api.user.storagePath() + '/SynTex';

		this.debug = config['debug'] || false;
		this.language = config['language'] || 'en';

		this.logger = new logger(pluginName, path.join(this.baseDirectory, 'log'), this.debug, this.language);

		this.files = new FileSystem(this.baseDirectory, this.logger, ['automation', 'log']);

		this.config = config;
		this.accessories = new Map();
		this.configJSON = store(api.user.storagePath());

		if(api)
		{
			this.api = api;
		}

		this.TypeManager = new TypeManager(this.logger);

		this.port = config['port'];

		if(this.port != null)
		{
			this.WebServer = new WebServer(pluginName, this.logger, this.port, __dirname + '/languages', this.language, config.fileserver);

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
										if((urlParams.type == null || accessory.service[j].letters[0] == this.TypeManager.typeToLetter(urlParams.type)) && (urlParams.counter == null || accessory.service[j].letters[1] == urlParams.counter))
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
	
							if((state = this.TypeManager.validateUpdate(urlParams.id, service.letters, state)) != null)
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
								else if(service != null && service.letters != null)
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
			
			this.WebServer.addSocket('/devices', 'getState', (ws, params) => {

				var state = ContextManager.addClient(ws, params.id);

				ws.send(JSON.stringify(state || {}));
			});

			this.WebServer.addSocket('/devices', 'setState', (ws, params) => {

				if(params.id != null && params.letters != null && params.name != null && params.value != null)
				{
					var state = { value : params.value };
	
					if(params.hue != null)
					{
						state.hue = params.hue;
					}
					
					if(params.saturation != null)
					{
						state.saturation = params.saturation;
					}

					if(params.brightness != null)
					{
						state.brightness = params.brightness;
					}

					if(params.event != null)
					{
						state.event = params.event;
					}

					if((state = this.TypeManager.validateUpdate(params.id, params.letters, state)) != null)
					{
						this.updateAccessoryService(params.id, params.letters, state)
					}
					else
					{
						this.logger.log('error', params.id, params.letters, '[' + params.name + '] %update_error%! ( ' + params.id + ' )');
					}

					ws.send(state != null ? '{"' + params.letters + '":' + JSON.stringify(state) + '}' : 'Error');
				}
			});
		}

		this.configJSON.load('config', (err, json) => {    

			if(json && !err)
			{
				this.bridgeName = json.bridge.name;
			}

			fs.exists(this.baseDirectory, (exist) => {

                if(exist)
                {
					try
					{

						fs.accessSync(this.baseDirectory, fs.constants.W_OK);
						
						this.getBridgeID().then((bridgeID) => {
				
							if(bridgeID != null)
							{
								this.bridgeID = bridgeID;
							}
								
							this.connectBridge();
						});
					}
					catch(e)
					{
						this.logger.err(e);
					}
				}
				else
				{
					this.logger.log('error', 'bridge', 'Bridge', 'Plugin Config %update_error%');
				}
			});
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
								logger.log('error', 'bridge', 'Bridge', '[' + id + '] %accessory_remove_error%!', err);
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
	updateAccessoryService(id, letters, state)
	{
		const accessory = this.getAccessory(id);

		if(accessory != null)
		{
			for(var i = 0; i < accessory.service.length; i++)
			{
				if(accessory.service[i].letters == letters)
				{
					accessory.service[i].changeHandler(state);

					return true;
				}
			}
		}

		return false;
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
					var stateText = JSON.stringify(values['value']);
	
					if(Object.keys(values) > 1)
					{
						stateText = 'power: ' + JSON.stringify(values['value']);
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

	connectBridge()
	{
		axios.get('http://syntex.sytes.net:8800/init-bridge?id=' + this.bridgeID + '&plugin=' + pluginName + '&version=' + pluginVersion + '&name=' + this.bridgeName).then((data) => {
		
			if(data != null && data.data != null)
			{
				if(data.data != this.bridgeID)
				{
					this.bridgeID = data.data;

					setTimeout(() => this.setBridgeID(this.bridgeID), 10000);
				}
			}
			else
			{
				setTimeout(() => this.connectBridge(), 30000);
			}

		}).catch((e) => {

			this.logger.err(e);

			setTimeout(() => this.connectBridge(), 30000);
		});
	}

	getBridgeID()
	{
		return new Promise((resolve) => {
			
			this.files.readFile('config.json').then((data) => {
				
				if(data != null)
				{
					resolve(data.bridgeID || null);
				}
				else
				{
					resolve(null);
				}
			});
		});
	}

	setBridgeID(bridgeID)
	{
		return new Promise((resolve) => {
			
			this.files.writeFile('config.json', { bridgeID }).then((success) => {
				
				if(!success)
				{
					this.logger.log('error', 'bridge', 'Bridge', 'Config.json %update_error%!', err);
				}

				resolve(success);
			});
		});
	}
}

module.exports = { DynamicPlatform, ContextManager, UniversalAccessory, AccessoryInformationService, OutletService, SwitchService, LightBulbService, DimmedBulbService, ColoredBulbService, ContactService, LightService, MotionService, TemperatureService, HumidityService, LeakService, OccupancyService, StatelessSwitchService, SmokeService, AirQualityService };