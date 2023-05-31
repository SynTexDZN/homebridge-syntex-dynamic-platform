const BaseService = require('../base');

module.exports = class ThermostatService extends BaseService
{
	constructor(homebridgeAccessory, deviceConfig, serviceConfig, manager)
	{
		super(homebridgeAccessory, deviceConfig, serviceConfig, manager.platform.api.hap.Service.Thermostat, manager);
		
		this.value = super.getValue('value', true);
		this.target = super.getValue('target');
		this.mode = super.getValue('mode');

		homebridgeAccessory.getServiceById(this.Service.Thermostat, serviceConfig.subtype).getCharacteristic(this.Characteristic.CurrentTemperature).on('get', this.getState.bind(this));
		homebridgeAccessory.getServiceById(this.Service.Thermostat, serviceConfig.subtype).getCharacteristic(this.Characteristic.TargetTemperature).on('get', this.getTargetTemperature.bind(this)).on('set', this.setTargetTemperature.bind(this));
		homebridgeAccessory.getServiceById(this.Service.Thermostat, serviceConfig.subtype).getCharacteristic(this.Characteristic.TargetHeatingCoolingState).on('get', this.getTargetHeatingCoolingState.bind(this)).on('set', this.setTargetHeatingCoolingState.bind(this));
		
		homebridgeAccessory.getServiceById(this.Service.Thermostat, serviceConfig.subtype).getCharacteristic(this.Characteristic.CurrentTemperature).setProps({ minValue : -270, maxValue : 100 });
		homebridgeAccessory.getServiceById(this.Service.Thermostat, serviceConfig.subtype).getCharacteristic(this.Characteristic.TargetTemperature).setProps({ minValue : 4, maxValue : 36 });
		homebridgeAccessory.getServiceById(this.Service.Thermostat, serviceConfig.subtype).getCharacteristic(this.Characteristic.TargetHeatingCoolingState).setProps({ validValues : [0, 1, 2, 3] });

		homebridgeAccessory.getServiceById(this.Service.Thermostat, serviceConfig.subtype).getCharacteristic(this.Characteristic.CurrentTemperature).updateValue(this.value);
		homebridgeAccessory.getServiceById(this.Service.Thermostat, serviceConfig.subtype).getCharacteristic(this.Characteristic.TargetTemperature).updateValue(this.target);
		homebridgeAccessory.getServiceById(this.Service.Thermostat, serviceConfig.subtype).getCharacteristic(this.Characteristic.TargetHeatingCoolingState).updateValue(this.mode);

		this.changeHandler = (state) => {

			if(state instanceof Object)
			{
				var v = [
					{ type : 'value', Characteristic : this.Characteristic.CurrentTemperature },
					{ type : 'target', Characteristic : this.Characteristic.TargetTemperature },
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
		callback(super.getValue('target', verbose));
	}

	setTargetTemperature(level, callback, verbose)
	{
		super.setValue('target', level, verbose);		

		callback();
	}

	getTargetHeatingCoolingState(callback, verbose)
	{
		callback(super.getValue('mode', verbose));
	}

	setTargetHeatingCoolingState(level, callback, verbose)
	{
		super.setValue('mode', level, verbose);		

		callback();
	}
}