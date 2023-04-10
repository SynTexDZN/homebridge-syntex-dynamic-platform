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
const BlindService = require('./src/accessories/blind');

const ConnectionCharacteristic = require('./src/characteristics/connection');

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

		this.api = api;
		this.config = config;

		this.pluginID = pluginID || 'homebridge-syntex-dynamic-platform';
		this.pluginName = pluginName || 'SynTexDynamicPlatform';
		this.pluginVersion = pluginVersion || '1.0.0';

		this.devices = config['accessories'] || [];

		this.options = config['options'] || {};

		this.port = this.options['port'];

		this.logger = new logger(this, { language : this.options['language'] || 'en', levels : this.config['log'] });

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
		
		this.files = new FileSystem(this, { initDirectories : ['activity', 'automation', 'log'] });

		this.TypeManager = new TypeManager(this.logger);
		this.EventManager = new EventManager(this);
		this.ContextManager = new ContextManager(this);

		if(this.port != null)
		{
			this.WebServer = new WebServer(this, { languageDirectory : __dirname + '/languages', filesystem : config.fileserver});

			this.addWebPages();
		}

		this.AutomationSystem = new AutomationSystem(this);

		this.readConfig().then((data) => {

			if(data != null && data.bridge != null)
			{
				this.bridgeName = data.bridge.name;
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

		if(this.api.hap.Characteristic.Connection == null)
		{
			Object.defineProperty(this.api.hap.Characteristic, 'Connection', { value : ConnectionCharacteristic(this.api) });
		}
	}

	addWebPages()
	{
		if(this.WebServer != null)
		{
			this.WebServer.addPage('/devices', async (request, response, urlParams) => {

				if(urlParams.id != null)
				{
					var accessory = this.getAccessory(urlParams.id);
	
					if(accessory != null)
					{
						var service = this.getService({ id : urlParams.id, type : urlParams.type, counter : urlParams.counter });

						if(urlParams.remove != null)
						{
							if(urlParams.type != null)
							{
								response.end(urlParams.remove == 'CONFIRM' && await accessory.removeService(accessory, service) ? 'Success' : 'Error');
							}
							else
							{
								response.end(urlParams.remove == 'CONFIRM' && await this.removeAccessory(accessory.homebridgeAccessory || accessory, urlParams.id) ? 'Success' : 'Error');
							}
						}
						else
						{
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
			
									response.end(state != null ? 'Success' : 'Error');
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
			
									response.end(state != null ? JSON.stringify(state) : 'Error');
								}
							}
							else
							{
								response.end('Error');

								this.logger.log('error', urlParams.id, (urlParams.type != null ? (this.TypeManager.typeToLetter(urlParams.type) || urlParams.type) : 'X') + (urlParams.counter || '0'), '%accessory_not_found[3]% ( ' + (urlParams.type != null ? (this.TypeManager.typeToLetter(urlParams.type) || urlParams.type) : 'X') + (urlParams.counter || '0') + ' )');
							}
						}
					}
					else
					{
						response.end('Error');

						this.logger.log('error', urlParams.id, '', '%accessory_not_found[1]%! ( ' + urlParams.id + ' )');
					}
				}
				else
				{
					response.end('Error');
				}
			});

			this.WebServer.addSocket('/devices', 'getActivity', (ws, params) => {

				var activity = this.ContextManager.addClient(ws, params.id, params.letters);

				ws.send(JSON.stringify(activity));
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

			this.readConfig().then((data) => {

				if(data != null)
				{
					var changed = false;

					for(const platform of data.platforms)
					{
						if(this.pluginName == platform.platform && platform.accessories != null)
						{
							for(const i in platform.accessories)
							{
								if(platform.accessories[i].id == id)
								{
									platform.accessories.splice(i, 1);

									changed = true;
								}
							}
						}
					}

					if(changed)
					{
						this.writeConfig(data).then((success) => {

							if(!success)
							{
								logger.log('error', id, '', '[' + id + '] %accessory_remove_error%!');
							}

							resolve(success);
						});
					}
					else
					{
						resolve(true);
					}

					this.api.unregisterPlatformAccessories(this.pluginID, this.pluginName, [ accessory ]);

					this.accessories.delete(accessory.UUID);
				}
				else
				{
					resolve(false);
				}
			});
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

			if(accessory != null && accessory.service != null)
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
		var service = this.getService({ id, letters }), state = null;

		if(service != null)
		{
			state = service.getValues(verbose);
		}
		else
		{
			this.logger.log('warn', id, letters, '[' + id + '] %accessory_not_found[0]%! ( ' + id + ' )');
		}

		return state;
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
		var url = 'http://syntex-cloud.com:8888/init-bridge?id=' + bridgeID + '&plugin=' + this.pluginName + '&version=' + this.pluginVersion + '&name=' + this.bridgeName;

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

		}).catch(() => {

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

			}).catch(() => resolve(null));
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

	readConfig()
	{
		return new Promise((resolve) => {

			this.files.readFile(this.api.user.storagePath() + '/config.json').then((data) => {

				if(data != null && data.platforms != null)
				{
					resolve(data);
				}
				else
				{
					resolve(null);
				}
				
			}).catch(() => resolve(null));
		});
	}

	writeConfig(data)
	{
		return new Promise((resolve) => {

			this.files.writeFile(this.api.user.storagePath() + '/config.json', data).then((response) => {

				resolve(response.success);
			});
		});
	}
}

module.exports = { DynamicPlatform, UniversalAccessory, AccessoryInformationService, OutletService, SwitchService, LightBulbService, DimmedBulbService, ColoredBulbService, ContactService, LightService, MotionService, TemperatureService, HumidityService, LeakService, OccupancyService, StatelessSwitchService, SmokeService, AirQualityService, BlindService };