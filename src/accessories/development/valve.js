const BaseService = require('../../base');

module.exports = class ValveService extends BaseService
{
	constructor(homebridgeAccessory, deviceConfig, serviceConfig, manager)
	{
		super(homebridgeAccessory, deviceConfig, serviceConfig, manager.platform.api.hap.Service.Valve, manager);
		
		this.value = super.getValue('value');

		this.service.getCharacteristic(this.Characteristic.Active).on('get', this.getActive.bind(this)).on('set', this.setActive.bind(this));
		this.service.getCharacteristic(this.Characteristic.InUse).on('get', this.getInUse.bind(this));
		this.service.getCharacteristic(this.Characteristic.ValveType).on('get', this.getValveType.bind(this));

		this.service.getCharacteristic(this.Characteristic.IsConfigured).on('get', this.getIsConfigured.bind(this));
		this.service.getCharacteristic(this.Characteristic.ServiceLabelIndex).on('get', this.getServiceLabelIndex.bind(this));

		this.service.getCharacteristic(this.Characteristic.RemainingDuration).on('get', this.getRemainingDuration.bind(this));
		this.service.getCharacteristic(this.Characteristic.SetDuration).on('get', this.getSetDuration.bind(this)).on('set', this.setSetDuration.bind(this));

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

		callback(null, 0);
	}

	setActive(active, callback)
	{
		console.log('setActive HANDLER', active);

		callback();
	}

	getInUse(callback)
	{
		console.log('getInUse HANDLER');

		callback(null, 0);
	}

	getValveType(callback)
	{
		console.log('getValveType HANDLER');

		// Valve Type 0-3 = Different Icons
		// 0 = Faucet
		// 1 = Sprinkler
		// 2 = Shower
		// 3 = Faucet

		callback(null, 0);
	}

	getIsConfigured(callback)
	{
		console.log('getIsConfigured HANDLER');

		callback(null, 0);
	}

	getServiceLabelIndex(callback)
	{
		console.log('getServiceLabelIndex HANDLER');

        // Fügt einen Standartnamen mit Nummerierung hinzu

		callback(null, 128);
	}

	getRemainingDuration(callback)
	{
		console.log('getRemainingDuration HANDLER');

		callback(null, 0);
	}

	getSetDuration(callback)
	{
		console.log('getSetDuration HANDLER');

		callback(null, 0);
	}

	setSetDuration(active, callback)
	{
		console.log('setSetDuration HANDLER', active);

		callback();
	}
}