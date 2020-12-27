const request = require('request');

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
var restart = true;

let logger = require('syntex-logger'), WebServer = require('syntex-webserver');;

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

		pluginID = pID;
		pluginName = pName;
		pluginVersion = pVersion

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

				this.WebServer.addPage('/serverside/version', (response) => {
	
					response.write(pluginVersion);
					response.end();
				});

				this.WebServer.addPage('/serverside/update', (response, urlParams) => {
	
					var version = urlParams.version != null ? urlParams.version : 'latest';
			
					const { exec } = require('child_process');
					
					exec('sudo npm install ' + pluginID + '@' + version + ' -g', (error, stdout, stderr) => {
			
						response.write(error || (stderr && stderr.includes('ERR!')) ? 'Error' : 'Success');
						response.end();
		
						if(error || (stderr && stderr.includes('ERR!')))
						{
							this.logger.log('warn', 'bridge', 'Bridge', 'Das Plugin ' + pluginName + ' konnte nicht aktualisiert werden! ' + (error || stderr));
						}
						else
						{
							this.logger.log('success', 'bridge', 'Bridge', 'Das Plugin ' + pluginName + ' wurde auf die Version [' + version + '] aktualisiert!');
		
							restart = true;
		
							this.logger.log('warn', 'bridge', 'Bridge', 'Die Homebridge wird neu gestartet ..');
		
							exec('sudo systemctl restart homebridge');
						}
					});
				});

				this.WebServer.addPage('/accessories', (response) => {
	
					var accessories = [];
		
					for(const accessory of this.accessories)
					{
						accessories.push({
							id: accessory[1].id,
							name: accessory[1].name,
							services: accessory[1].services,
							version: accessory[1].version || '99.99.99',
							plugin: pluginName
						});
					}
			
					response.write(JSON.stringify(accessories));
					response.end();
				});

				this.WebServer.addPage('/devices', (response, urlParams) => {
	
					if(urlParams.id != null)
					{
						var accessory = this.getAccessory(urlParams.id);
		
						if(accessory == null)
						{
							this.logger.log('error', urlParams.id, '', 'Es wurde kein passendes Gerät in der Config gefunden! ( ' + urlParams.id + ' )');
		
							response.write('Error');
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
								this.logger.log('error', urlParams.id, '', 'Es wurde kein passendes ' + (urlParams.event ? 'Event' : 'Gerät') + ' in der Config gefunden! ( ' + urlParams.id + ' )');
		
								response.write('Error');
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
									this.logger.log('error', urlParams.id, service.letters, '[' + service.name + '] konnte nicht aktualisiert werden! ( ' + urlParams.id + ' )');
								}
		
								response.write(state != null ? 'Success' : 'Error');
							}
							else if(urlParams.remove != null)
							{
								if(urlParams.remove == 'CONFIRM')
								{
									this.removeAccessory(accessory.homebridgeAccessory != null ? accessory.homebridgeAccessory : accessory);
								}
		
								response.write(urlParams.remove == 'CONFIRM' ? 'Success' : 'Error');
							}
							else
							{
								var state = null;
								
								if(accessory.homebridgeAccessory != null
									&& accessory.homebridgeAccessory.context != null
									&& accessory.homebridgeAccessory.context.data != null
									&& service != null
									&& service.letters != null)
								{
									state = accessory.homebridgeAccessory.context.data[service.letters];
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

				this.WebServer.addPage('/serverside/check-restart', (response) => {

					response.write(restart.toString());
					response.end();
				});
			}
		}

		const { exec } = require('child_process');

		exec('cat /sys/class/net/wlan0/address', (error, stdout, stderr) => {

			if(stdout)
			{
				var theRequest = {
					method : 'GET',
					url : 'http://syntex.sytes.net/smarthome/init-bridge.php?plugin=' + pluginName + '&mac=' + stdout + '&version=' + pluginVersion,
					timeout : 10000
				};

				request(theRequest, () => {});
			}
		});
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
				this.logger.log('warn', id, letters, 'Konvertierungsfehler: [' + state[i] + '] konnte nicht gelesen werden! ( ' + id + ' )');

				return null;
			}
			
			var format = data[letters[0].toUpperCase()].format;

			if(format instanceof Object)
			{
				format = format[i];
			}

			if(typeof state[i] != format)
			{
				this.logger.log('warn', id, letters, 'Konvertierungsfehler: [' + state[i] + '] ist keine ' + (format == 'boolean' ? 'boolsche' : format == 'number' ? 'numerische' : 'korrekte') + ' Variable! ( ' + id + ' )');

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

	finishInit()
	{
		restart = false;
	}
}

module.exports = { DynamicPlatform, UniversalAccessory, AccessoryInformationService, OutletService, SwitchService, LightBulbService, DimmedBulbService, ColoredBulbService, ContactService, LightService, MotionService, TemperatureService, HumidityService, LeakService, OccupancyService, StatelessSwitchService, SmokeService, AirQualityService };