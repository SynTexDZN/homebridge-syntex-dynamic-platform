let Service, Characteristic;

module.exports = class AccessoryInformationService
{
    constructor(homebridgeAccessory, deviceConfig, manager)
    {
        Service = manager.platform.api.hap.Service;
        Characteristic = manager.platform.api.hap.Characteristic;

        var service = homebridgeAccessory.getService(Service.AccessoryInformation);

        if(service)
		{
			manager.logger.debug('Existierenden Informations-Service gefunden! ' + deviceConfig.name + ' ( ' +  deviceConfig.id + ' )');
		}
		else
		{
			manager.logger.debug('Erstelle neuen Informations-Service! ' + deviceConfig.name + ' ( ' +  deviceConfig.id + ' )');

            service = homebridgeAccessory.addService(Service.AccessoryInformation, deviceConfig.name)
        }

        service.setCharacteristic(Characteristic.SerialNumber, deviceConfig.id)
            .setCharacteristic(Characteristic.Manufacturer, deviceConfig.manufacturer)
            .setCharacteristic(Characteristic.Model, deviceConfig.model)
            .setCharacteristic(Characteristic.FirmwareRevision, deviceConfig.version);
    }
}