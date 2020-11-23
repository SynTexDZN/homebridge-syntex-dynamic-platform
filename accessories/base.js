module.exports = class BaseService
{
	constructor(homebridgeAccessory, deviceConfig, serviceConfig, serviceType, manager)
	{
		this.id = deviceConfig.id;
		this.name = serviceConfig.name;
		this.letters = typeToLetter(serviceConfig.type) + serviceConfig.subtype;

		this.serviceType = serviceType;

		homebridgeAccessory.context = {}; // To Store Variables in Homebridge

        var service = homebridgeAccessory.getServiceById(serviceType, serviceConfig.subtype);

        if(service)
		{
			manager.logger.debug('Existierenden Service gefunden! ' + serviceConfig.name + ' ' + serviceConfig.type + ' ' + serviceConfig.subtype + ' ( ' +  this.id + ' )');

			service.setCharacteristic(manager.platform.api.hap.Characteristic.Name, serviceConfig.name);
		}
		else
		{
			manager.logger.debug('Erstelle neuen Service! ' + serviceConfig.name + ' ' + serviceConfig.type + ' ' + serviceConfig.subtype + ' ( ' +  this.id + ' )');

            homebridgeAccessory.addService(serviceType, serviceConfig.name, serviceConfig.subtype)
            //homebridgeAccessory.service.push();
        }
	}
	
	getService()
	{
		return homebridgeAccessory.getServiceById(this.serviceType, this.letters[1]);
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