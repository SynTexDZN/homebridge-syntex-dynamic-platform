let Service, Characteristic;

const BaseService = require('../base');

module.exports = class OccupancyService extends BaseService
{
	constructor(homebridgeAccessory, deviceConfig, serviceConfig, manager)
	{
		Characteristic = manager.platform.api.hap.Characteristic;
		Service = manager.platform.api.hap.Service;
		
		super(homebridgeAccessory, deviceConfig, serviceConfig, Service.OccupancySensor, manager);
		
		homebridgeAccessory.getServiceById(Service.OccupancySensor, serviceConfig.subtype).getCharacteristic(Characteristic.OccupancyDetected).on('get', this.getState.bind(this));
	
		this.changeHandler = (state) =>
		{
			homebridgeAccessory.getServiceById(Service.OccupancySensor, serviceConfig.subtype).getCharacteristic(Characteristic.OccupancyDetected).updateValue(state);

			super.setValue('state', state);
		};
	}

	getState(callback, verbose)
	{
		callback(super.getValue('state', verbose));
	}
}