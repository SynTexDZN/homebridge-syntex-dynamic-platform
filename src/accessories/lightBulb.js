const BaseService = require('../base');

module.exports = class LightBulbService extends BaseService
{
	constructor(homebridgeAccessory, deviceConfig, serviceConfig, manager)
	{
		if(!serviceConfig.subtype.includes('-'))
		{
			serviceConfig.subtype = 'led-' + serviceConfig.subtype;
		}

		super(homebridgeAccessory, deviceConfig, serviceConfig, manager.platform.api.hap.Service.Lightbulb, manager);
		
		this.service.getCharacteristic(this.Characteristic.On).on('get', this.getState.bind(this)).on('set', this.setState.bind(this));
	
		this.changeHandler = (state) => {

			if(state.value != null)
			{
				this.setState(state.value,
					() => this.service.getCharacteristic(this.Characteristic.On).updateValue(state.value));
			}

			this.AutomationSystem.LogikEngine.runAutomation(this, state);
		};
	}
}