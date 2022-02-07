let Service, Characteristic;

module.exports = class AccessoryInformationService
{
	constructor(homebridgeAccessory, deviceConfig, serviceConfig, manager)
	{
		Service = manager.platform.api.hap.Service;
		Characteristic = manager.platform.api.hap.Characteristic;

		var service = homebridgeAccessory.getService(Service.AccessoryInformation);

		if(service)
		{
			service.setCharacteristic(Characteristic.Name, deviceConfig.name);

			manager.platform.logger.debug('%info_service_found%! [' + deviceConfig.name + '] ( ' +  deviceConfig.id + ' )');
		}
		else
		{
			manager.platform.logger.debug('%info_service_create%! [' + deviceConfig.name + '] ( ' +  deviceConfig.id + ' )');
			
			service = homebridgeAccessory.addService(Service.AccessoryInformation, deviceConfig.name);
		}

		service.setCharacteristic(Characteristic.Manufacturer, serviceConfig.manufacturer)
			.setCharacteristic(Characteristic.SerialNumber, deviceConfig.id)
			.setCharacteristic(Characteristic.Model, serviceConfig.model)
			.setCharacteristic(Characteristic.FirmwareRevision, serviceConfig.version);
	}
}