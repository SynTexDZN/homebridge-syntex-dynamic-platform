let logger;

module.exports = class BaseService
{
	constructor(homebridgeAccessory, deviceConfig, serviceConfig, serviceType, manager)
	{
		this.id = deviceConfig['id'];
		this.name = serviceConfig['name'];

		this.letters = typeToLetter(serviceConfig.type) + serviceConfig.subtype;
		this.homebridgeAccessory = homebridgeAccessory;

		logger = manager.logger;

        var service = homebridgeAccessory.getServiceById(serviceType, serviceConfig.subtype);

        if(service)
		{
			logger.debug('Existierenden Service gefunden! ' + serviceConfig.name + ' ' + serviceConfig.type + ' ' + serviceConfig.subtype + ' ( ' +  this.id + ' )');

			service.setCharacteristic(manager.platform.api.hap.Characteristic.Name, serviceConfig.name);
		}
		else
		{
			logger.debug('Erstelle neuen Service! ' + serviceConfig.name + ' ' + serviceConfig.type + ' ' + serviceConfig.subtype + ' ( ' +  this.id + ' )');

            homebridgeAccessory.addService(serviceType, serviceConfig.name, serviceConfig.subtype)
        }
	}

	getValue(key)
	{
		var value = null;

		if(this.homebridgeAccessory != null
			&& this.homebridgeAccessory.context != null
			&& this.homebridgeAccessory.context.data != null
			&& this.homebridgeAccessory.context.data[this.letters] != null
			&& this.homebridgeAccessory.context.data[this.letters][key] != null)
		{
			value = this.homebridgeAccessory.context.data[this.letters][key];

			logger.log('read', this.id, this.letters, 'HomeKit Status für [' + this.name + '] ist [' + value + '] ( ' + this.id + ' )');
		}
		else
		{
			logger.log('warn', this.id, this.letters, '[' + this.name + '] wurde nicht im Cache gefunden! ( ' + this.id + ' )');
		}

		return value;
	}

	setValue(key, value)
	{
		if(this.homebridgeAccessory && this.homebridgeAccessory.context)
		{
			if(!this.homebridgeAccessory.context.data)
			{
				this.homebridgeAccessory.context.data = {};
			}

			if(!this.homebridgeAccessory.context.data[this.letters])
			{
				this.homebridgeAccessory.context.data[this.letters] = {};
			}

			this.homebridgeAccessory.context.data[this.letters][key] = value;

			logger.log('update', this.id, this.letters, 'HomeKit Status für [' + this.name + '] geändert zu [' + value + '] ( ' + this.id + ' )');
		}
		else
		{
			logger.log('error', this.id, this.letters, '[' + this.name + '] konnte nicht im Cache gespeichert werden! ( ' + this.id + ' )');
		}
	}
}

var types = ['contact', 'motion', 'temperature', 'humidity', 'rain', 'light', 'occupancy', 'smoke', 'airquality', 'rgb', 'switch', 'relais', 'statelessswitch', 'outlet'];
var letters = ['A', 'B', 'C', 'D', 'E', 'F', '0', '1', '2', '3', '4', '5', '6', '7'];

function letterToType(letter)
{
	return types[letters.indexOf(letter.toUpperCase())];
}

function typeToLetter(type)
{
	return letters[types.indexOf(type.toLowerCase())];
}