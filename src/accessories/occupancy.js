const BaseService = require('../base');

module.exports = class OccupancyService extends BaseService
{
	constructor(homebridgeAccessory, deviceConfig, serviceConfig, manager)
	{
		super(homebridgeAccessory, deviceConfig, serviceConfig, manager.platform.api.hap.Service.OccupancySensor, manager);
		
		homebridgeAccessory.getServiceById(this.Service.OccupancySensor, serviceConfig.subtype).getCharacteristic(this.Characteristic.OccupancyDetected).on('get', this.getState.bind(this));
	
		this.changeHandler = (state) =>
		{
			homebridgeAccessory.getServiceById(this.Service.OccupancySensor, serviceConfig.subtype).getCharacteristic(this.Characteristic.OccupancyDetected).updateValue(state);

			super.setValue('value', state);
		};
	}

	getState(callback, verbose)
	{
		callback(super.getValue('value', verbose));
	}
}