const BaseService = require('../base');

module.exports = class ThermostatService extends BaseService
{
	constructor(homebridgeAccessory, deviceConfig, serviceConfig, manager)
	{
		super(homebridgeAccessory, deviceConfig, serviceConfig, manager.platform.api.hap.Service.Thermostat, manager);
		
		this.value = super.getValue('value');
		this.target = super.getValue('target', false);
		this.state = super.getValue('state', false);
		this.mode = super.getValue('mode', false);

		this.service.getCharacteristic(this.Characteristic.CurrentTemperature).on('get', this.getState.bind(this));
		this.service.getCharacteristic(this.Characteristic.TargetTemperature).on('get', this.getTargetTemperature.bind(this)).on('set', this.setTargetTemperature.bind(this));
		this.service.getCharacteristic(this.Characteristic.CurrentHeatingCoolingState).on('get', this.getCurrentHeatingCoolingState.bind(this));
		this.service.getCharacteristic(this.Characteristic.TargetHeatingCoolingState).on('get', this.getTargetHeatingCoolingState.bind(this)).on('set', this.setTargetHeatingCoolingState.bind(this));
		
		this.service.getCharacteristic(this.Characteristic.CurrentTemperature).setProps({ minValue : -270, maxValue : 100 });
		this.service.getCharacteristic(this.Characteristic.TargetTemperature).setProps({ minValue : 4, maxValue : 36 });
		this.service.getCharacteristic(this.Characteristic.CurrentHeatingCoolingState).setProps({ validValues : [0, 1, 2] });
		this.service.getCharacteristic(this.Characteristic.TargetHeatingCoolingState).setProps({ validValues : [1, 2, 3] });

		this.service.getCharacteristic(this.Characteristic.CurrentTemperature).updateValue(this.value);
		this.service.getCharacteristic(this.Characteristic.TargetTemperature).updateValue(this.target);
		this.service.getCharacteristic(this.Characteristic.CurrentHeatingCoolingState).updateValue(this.state);
		this.service.getCharacteristic(this.Characteristic.TargetHeatingCoolingState).updateValue(this.mode);

		this.changeHandler = (state) => {

			if(state instanceof Object)
			{
				var v = [
					{ type : 'value', Characteristic : this.Characteristic.CurrentTemperature },
					{ type : 'target', Characteristic : this.Characteristic.TargetTemperature },
					{ type : 'state', Characteristic : this.Characteristic.CurrentHeatingCoolingState },
					{ type : 'mode', Characteristic : this.Characteristic.TargetHeatingCoolingState }
				];

				for(const c of v)
				{
					if(state[c.type] != null)
					{
						homebridgeAccessory.getServiceById(this.Service.Thermostat, serviceConfig.subtype).getCharacteristic(c.Characteristic).updateValue(state[c.type]);
						
						super.setValue(c.type, state[c.type]);
					}
				}
			}
			else
			{
				homebridgeAccessory.getServiceById(this.Service.Thermostat, serviceConfig.subtype).getCharacteristic(this.Characteristic.TargetTemperature).updateValue(state);
					
				super.setValue('value', state);
			}
		};
	}

	getTargetTemperature(callback, verbose)
	{
		this.target = this.getValue('target', verbose);
		
		if(callback != null)
		{
			callback(null, this.target);
		}
	}

	setTargetTemperature(target, callback, verbose)
	{
		this.target = target;

		this.setValue('target', target, verbose);		

		if(callback != null)
		{
			callback();
		}
	}

	getCurrentHeatingCoolingState(callback, verbose)
	{
		this.state = this.getValue('state', verbose);
		
		if(callback != null)
		{
			callback(null, this.state);
		}
	}

	setCurrentHeatingCoolingState(state, callback, verbose)
	{
		this.state = state;

		this.setValue('state', state, verbose);		

		if(callback != null)
		{
			callback();
		}
	}

	getTargetHeatingCoolingState(callback, verbose)
	{
		this.mode = this.getValue('mode', verbose);
		
		if(callback != null)
		{
			callback(null, this.mode);
		}
	}

	setTargetHeatingCoolingState(mode, callback, verbose)
	{
		this.mode = mode;

		this.setValue('mode', mode, verbose);		

		if(callback != null)
		{
			callback();
		}
	}
}