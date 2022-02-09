const axios = require('axios'), fs = require('fs'), path = require('path');

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

let logger = require('syntex-logger'), AutomationSystem = require('syntex-automation'), FileSystem = require('syntex-filesystem'), WebServer = require('syntex-webserver'), EventManager = require('./src/event-manager'), TypeManager = require('./src/type-manager');

let DynamicPlatform = class SynTexDynamicPlatform
{
	constructor(config, api, pluginID, pluginName, pluginVersion)
	{
		if(config == null || api == null)
		{
			console.log('Keine Config gefunden, das Plugin wird deaktiviert!');

			return;
		}

		this.accessories = new Map();

		this.options = {};

		this.api = api;
		this.config = config;

		this.pluginID = pluginID || 'homebridge-syntex-dynamic-platform';
		this.pluginName = pluginName || 'SynTexDynamicPlatform';
		this.pluginVersion = pluginVersion || '1.0.0';

		this.devices = config['accessories'] || [];

		if(config['options'] != null)
		{
			this.options = config['options'];
		}

		this.port = this.options['port'];
		this.debug = this.options['debug'] || false;
		this.language = this.options['language'] || 'en';

		this.logger = new logger(this);

		if(config['baseDirectory'] != null)
		{
			try
			{
				fs.accessSync(config['baseDirectory'], fs.constants.W_OK);

				this.baseDirectory = config['baseDirectory'];

				this.logger.setLogDirectory(path.join(this.baseDirectory, 'log'));
			}
			catch(e)
			{
				this.logger.log('error', 'bridge', 'Bridge', '%directory_permission_error% [' + config['baseDirectory'] + ']', '%visit_github_for_support%: https://github.com/SynTexDZN/' + this.pluginID + '#troubleshooting', e);
			}
		}
		
		this.files = new FileSystem(this, { initDirectories : ['automation', 'log'] });

		this.AutomationSystem = new AutomationSystem(this);
		this.TypeManager = new TypeManager(this.logger);
		this.EventManager = new EventManager(this.logger);

		if(this.port != null)
		{
			this.WebServer = new WebServer(this, { languageDirectory : __dirname + '/languages', filesystem : config.fileserver});

			this.addWebPages();
		}

		this.files.readFile(api.user.storagePath() + '/config.json').then((data) => {

			if(data != null)
			{
				this.configJSON = data;

				if(data.bridge != null)
				{
					this.bridgeName = data.bridge.name;
				}
			}

			if(this.baseDirectory != null)
			{
				this.generateID().then((bridgeInit) => {
					
					setTimeout(() => this.getBridgeID().then((bridgeID) => {

						if(bridgeID != null)
						{
							this.connectBridge(bridgeID, bridgeInit);
						}

					}), bridgeInit ? 3000 : 0);
				});
			}
		});
	}

	addWebPages()
	{
		if(this.WebServer != null)
		{
			this.WebServer.addPage('/devices', async (response, urlParams) => {

				if(urlParams.id != null)
				{
					var accessory = this.getAccessory(urlParams.id);
	
					if(accessory != null)
					{
						if(urlParams.remove != null)
						{
							response.write(urlParams.remove == 'CONFIRM' && await this.removeAccessory(accessory.homebridgeAccessory || accessory, urlParams.id) ? 'Success' : 'Error');
						}
						else
						{
							var service = this.getService({ id : urlParams.id, type : urlParams.type, counter : urlParams.counter });
		
							if(service != null)
							{
								if(urlParams.value != null)
								{
									let state = { value : urlParams.value };
			
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

									state = this.updateAccessoryService(service, state);
			
									response.write(state != null ? 'Success' : 'Error');
								}
								else
								{
									let state = null;
									
									if(accessory.homebridgeAccessory != null
									&& accessory.homebridgeAccessory.context != null
									&& accessory.homebridgeAccessory.context.data != null)
									{
										if(urlParams.type == null && urlParams.counter == null)
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
							else
							{
								response.write('Error');

								this.logger.log('error', urlParams.id, (urlParams.type != null ? (this.TypeManager.typeToLetter(urlParams.type) || urlParams.type) : 'X') + (urlParams.counter || '0'), '%config_read_error[3]% ( ' + (urlParams.type != null ? (this.TypeManager.typeToLetter(urlParams.type) || urlParams.type) : 'X') + (urlParams.counter || '0') + ' )');
							}
						}
					}
					else
					{
						response.write('Error');

						this.logger.log('error', urlParams.id, '', '%config_read_error[1]%! ( ' + urlParams.id + ' )');
					}
				}
				else
				{
					response.write('Error');
				}
	
				response.end();
			});

			this.WebServer.addPage('/reload-automation', async (response) => {

				response.end(await this.AutomationSystem.LogikEngine.loadAutomation() ? 'Success' : 'Error');
			});
			
			this.WebServer.addSocket('/devices', 'getState', (ws, params) => {

				var state = ContextManager.addClient(ws, params.id);

				ws.send(JSON.stringify(state || {}));
			});

			this.WebServer.addSocket('/devices', 'setState', (ws, params) => {

				if(params.id != null && params.letters != null && params.value != null)
				{
					var service = this.getService({ id : params.id, letters : params.letters });

					if(service != null)
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

						state = this.updateAccessoryService(service, state);

						ws.send(state != null ? '{"' + params.letters + '":' + JSON.stringify(state) + '}' : 'Error');
					}
				}
			});
		}
	}

	registerPlatformAccessory(platformAccessory)
	{
		this.logger.debug('%accessory_register% [' + platformAccessory.displayName + ']');

		this.api.registerPlatformAccessories(this.pluginID, this.pluginName, [platformAccessory]);
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
		return new Promise((resolve) => {

			this.logger.log('info', id, '', '%accessory_remove% [' + accessory.displayName + '] ( ' + accessory.UUID + ' )');

			if(this.configJSON != null && this.configJSON.platforms != null)
			{
				var changed = false;

				for(const i in this.configJSON.platforms)
				{
					if(this.configJSON.platforms[i].platform == this.pluginName && this.configJSON.platforms[i].accessories != null)
					{
						for(const j in this.configJSON.platforms[i].accessories)
						{
							if(this.configJSON.platforms[i].accessories[j].id == id)
							{
								this.configJSON.platforms[i].accessories.splice(j, 1);

								changed = true;
							}
						}
					}
				}

				if(changed)
				{
					this.files.writeFile(this.api.user.storagePath() + '/config.json', this.configJSON).then((response) => {

						if(!response.success)
						{
							logger.log('error', id, '', '[' + id + '] %accessory_remove_error%!');
						}

						resolve(response.success);
					});
				}
				else
				{
					resolve(true);
				}
			}
			else
			{
				resolve(false);
			}
			
			this.api.unregisterPlatformAccessories(this.pluginID, this.pluginName, [ accessory ]);

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
	getService(config)
	{
		if(config.id != null)
		{
			var accessory = this.getAccessory(config.id);

			if(accessory != null)
			{
				var serviceConter = 0;

				for(var i = 0; i < accessory.service.length; i++)
				{
					if(accessory.service[i].letters != null)
					{
						if(config.type != null || config.letters != null)
						{
							var letters = config.letters || this.TypeManager.typeToLetter(config.type) + (config.counter || 0);

							if(accessory.service[i].letters == letters)
							{
								return accessory.service[i];
							}
						}
						else if(config.counter != null)
						{
							if(serviceConter == config.counter)
							{
								return accessory.service[i];
							}
							else 
							{
								serviceConter++;
							}
						}
						else
						{
							return accessory.service[i];
						}
					}
				}
			}
		}

		return null;
	}

	updateAccessoryService(service, state)
	{
		if(service != null && service.changeHandler != null)
		{
			if((state = this.TypeManager.validateUpdate(service.id, service.letters, state)) != null)
			{
				service.changeHandler(state);

				return state;
			}
			else
			{
				this.logger.log('error', service.id, service.letters, '[' + service.name + '] %update_error%! ( ' + service.id + ' )');
			}
		}
		
		return null;
	}

	readAccessoryService(id, letters, verbose)
	{
		var accessory = this.getAccessory(id), values = null;

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

	generateID()
	{
		return new Promise((resolve) => {

			this.getBridgeID().then((bridgeID) => {

				if(bridgeID != null)
				{
					resolve(false);
				}
				else
				{
					this.setBridgeID(new Date().getTime().toString(16)).then((success) => resolve(success));
				}
			});
		});
	}

	connectBridge(bridgeID, initBridge)
	{
		var url = 'http://syntex.sytes.net:8800/init-bridge?id=' + bridgeID + '&plugin=' + this.pluginName + '&version=' + this.pluginVersion + '&name=' + this.bridgeName;

		if(initBridge)
		{
			url += '&init=true';
		}

		axios.get(url).then((data) => {

			if(data != null && data.data != null)
			{
				if(data.data != bridgeID)
				{
					setTimeout(() => this.setBridgeID(data.data), 10000);
				}
			}
			else
			{
				setTimeout(() => this.connectBridge(bridgeID, initBridge), 30000);
			}

		}).catch((e) => {

			this.logger.err(e);

			setTimeout(() => this.connectBridge(bridgeID, initBridge), 30000);
		});
	}

	getBridgeID()
	{
		return new Promise((resolve) => {
			
			this.files.readFile('config.json').then((data) => {
				
				if(data != null && data.bridgeID != null)
				{
					resolve(data.bridgeID);
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
			
			this.files.writeFile('config.json', { bridgeID }).then((response) => {
				
				if(!response.success)
				{
					this.logger.log('error', 'bridge', 'Bridge', '[bridgeID] %update_error%!');
				}

				resolve(response.success);
			});
		});
	}
}

module.exports = { DynamicPlatform, ContextManager, UniversalAccessory, AccessoryInformationService, OutletService, SwitchService, LightBulbService, DimmedBulbService, ColoredBulbService, ContactService, LightService, MotionService, TemperatureService, HumidityService, LeakService, OccupancyService, StatelessSwitchService, SmokeService, AirQualityService };