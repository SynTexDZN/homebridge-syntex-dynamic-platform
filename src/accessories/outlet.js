const BaseService = require('../base');

module.exports = class OutletService extends BaseService
{
	constructor(homebridgeAccessory, deviceConfig, serviceConfig, manager)
	{
		super(homebridgeAccessory, deviceConfig, serviceConfig, manager.platform.api.hap.Service.Outlet, manager);
		
		this.value = super.getValue('value');

		this.service.getCharacteristic(this.Characteristic.On).on('get', this.getState.bind(this)).on('set', this.setState.bind(this));
	
		this.service.getCharacteristic(this.Characteristic.On).updateValue(this.value);

		this.changeHandler = (state) => {

			if(state.value != null)
			{
				super.setState(state.value,
					() => this.service.getCharacteristic(this.Characteristic.On).updateValue(state.value));
			}

			this.AutomationSystem.LogikEngine.runAutomation(this, state);
		};
	}
}