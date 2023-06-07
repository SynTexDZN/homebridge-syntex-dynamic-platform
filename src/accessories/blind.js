const BaseService = require('../base');

module.exports = class BlindService extends BaseService
{
	constructor(homebridgeAccessory, deviceConfig, serviceConfig, manager)
	{
		super(homebridgeAccessory, deviceConfig, serviceConfig, manager.platform.api.hap.Service.WindowCovering, manager);

		this.value = super.getValue('value');
		this.state = super.getValue('state', false);

		this.service.getCharacteristic(this.Characteristic.CurrentPosition).on('get', this.getState.bind(this));
		this.service.getCharacteristic(this.Characteristic.TargetPosition).on('get', this.getTargetPosition.bind(this)).on('set', this.setTargetPosition.bind(this));
		this.service.getCharacteristic(this.Characteristic.PositionState).on('get', this.getPositionState.bind(this));
	
		this.service.getCharacteristic(this.Characteristic.CurrentPosition).updateValue(this.value);
		this.service.getCharacteristic(this.Characteristic.TargetPosition).updateValue(this.value);
		this.service.getCharacteristic(this.Characteristic.PositionState).updateValue(this.state);

		this.changeHandler = (state) => {

			if(state instanceof Object)
			{
				var v = [
					{ type : 'value', Characteristic : this.Characteristic.TargetPosition },
					{ type : 'value', Characteristic : this.Characteristic.CurrentPosition }
				];

				for(const c of v)
				{
					if(state[c.type] != null)
					{
						homebridgeAccessory.getServiceById(this.Service.WindowCovering, serviceConfig.subtype).getCharacteristic(c.Characteristic).updateValue(state[c.type]);
						
						super.setValue(c.type, state[c.type]);
					}
				}
			}
			else
			{
				homebridgeAccessory.getServiceById(this.Service.WindowCovering, serviceConfig.subtype).getCharacteristic(this.Characteristic.TargetPosition).updateValue(state);
				homebridgeAccessory.getServiceById(this.Service.WindowCovering, serviceConfig.subtype).getCharacteristic(this.Characteristic.CurrentPosition).updateValue(state);
					
				super.setValue('value', state);
			}
		};
	}

	getTargetPosition(callback, verbose)
	{
		callback(super.getValue('value', verbose));
	}

	setTargetPosition(value, callback, verbose)
	{
		this.value = value;

		this.setValue('value', value, verbose);		

		if(callback != null)
		{
			callback();
		}
	}

	getPositionState(callback, verbose)
	{
		this.state = this.getValue('state', verbose);
		
		if(callback != null)
		{
			callback(null, this.state);
		}
	}

	setPositionState(state, callback, verbose)
	{
		this.state = state;

		this.setValue('state', state, verbose);		

		if(callback != null)
		{
			callback();
		}
	}
}