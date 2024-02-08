const BaseService = require('../../base');

module.exports = class FaucetService extends BaseService
{
	constructor(homebridgeAccessory, deviceConfig, serviceConfig, manager)
	{
		super(homebridgeAccessory, deviceConfig, serviceConfig, manager.platform.api.hap.Service.Faucet, manager);
		
		this.value = super.getValue('value');

		this.service.getCharacteristic(this.Characteristic.Active).on('get', this.getActive.bind(this)).on('set', this.setActive.bind(this));
		this.service.getCharacteristic(this.Characteristic.StatusFault).on('get', this.getStatusFault.bind(this));

        // TODO: Aktualisiert nicht!

		this.changeHandler = (state) => {

			if(state.value != null)
			{
				this.setState(state.value,
					() => this.service.getCharacteristic(this.Characteristic.On).updateValue(state.value));
			}

			this.AutomationSystem.LogikEngine.runAutomation(this, state);
		};
	}

	getActive(callback)
	{
		console.log('getActive HANDLER');

		callback(null, 1);
	}

	setActive(active, callback)
	{
		console.log('setActive HANDLER', active);

		callback();
	}

	getStatusFault(callback)
	{
		console.log('getStatusFault HANDLER');

		callback(null, 0);
	}
}