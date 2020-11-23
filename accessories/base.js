module.exports = class BaseService
{
	constructor(homebridgeAccessory, deviceConfig, serviceType, type, subtype, manager)
	{
        var service = homebridgeAccessory.getServiceById(serviceType, subtype);

        if(service)
		{
			manager.logger.debug('Existierenden Service gefunden! ' + deviceConfig.name + ' ' + type + ' ' + subtype + ' ( ' +  deviceConfig.id + ' )');

			service.setCharacteristic(manager.platform.api.hap.Characteristic.Name, deviceConfig.name);
		}
		else
		{
			manager.logger.debug('Erstelle neuen Service! ' + deviceConfig.name + ' ' + type + ' ' + subtype + ' ( ' +  deviceConfig.id + ' )');

            homebridgeAccessory.addService(serviceType, deviceConfig.name, subtype)
            //homebridgeAccessory.service.push();
        }
    }
}