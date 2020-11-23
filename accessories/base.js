module.exports = class BaseService
{
	constructor(homebridgeAccessory, deviceConfig, serviceConfig, serviceType, manager)
	{
		this.id = deviceConfig.id;
		this.name = serviceConfig.name;

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
}