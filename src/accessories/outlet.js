const BaseService = require('../base');

module.exports = class OutletService extends BaseService
{
	constructor(homebridgeAccessory, deviceConfig, serviceConfig, manager)
	{
		super(homebridgeAccessory, deviceConfig, serviceConfig, manager.platform.api.hap.Service.Outlet, manager);
		
		homebridgeAccessory.getServiceById(this.Service.Outlet, serviceConfig.subtype).getCharacteristic(this.Characteristic.On).on('get', this.getState.bind(this)).on('set', this.setState.bind(this));
	
		this.changeHandler = (state) =>
		{
			homebridgeAccessory.getServiceById(this.Service.Outlet, serviceConfig.subtype).getCharacteristic(this.Characteristic.On).updateValue(state);

			super.setValue('value', state);
		};
	}
	
	getState(callback, verbose)
	{
		callback(super.getValue('value', verbose));
	}

	setState(level, callback, verbose)
	{
		super.setValue('value', level, verbose);		

		callback();
	}
}