const BaseService = require('../base');

module.exports = class OutletService extends BaseService
{
	constructor(homebridgeAccessory, deviceConfig, serviceConfig, manager)
	{
		super(homebridgeAccessory, deviceConfig, serviceConfig, manager.platform.api.hap.Service.Outlet, manager);
		
		this.value = super.getValue('value', true);

		homebridgeAccessory.getServiceById(this.Service.Outlet, serviceConfig.subtype).getCharacteristic(this.Characteristic.On).on('get', this.getState.bind(this)).on('set', this.setState.bind(this));
	
		homebridgeAccessory.getServiceById(this.Service.Outlet, serviceConfig.subtype).getCharacteristic(this.Characteristic.On).updateValue(this.value);

		this.changeHandler = (state) => {

			homebridgeAccessory.getServiceById(this.Service.Outlet, serviceConfig.subtype).getCharacteristic(this.Characteristic.On).updateValue(state);

			super.setValue('value', state);
		};
	}
}