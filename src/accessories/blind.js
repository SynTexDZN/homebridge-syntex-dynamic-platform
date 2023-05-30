const BaseService = require('../base');

module.exports = class BlindService extends BaseService
{
	constructor(homebridgeAccessory, deviceConfig, serviceConfig, manager)
	{
		super(homebridgeAccessory, deviceConfig, serviceConfig, manager.platform.api.hap.Service.WindowCovering, manager);

		this.value = super.getValue('value', true);
		this.mode = super.getValue('mode');

		homebridgeAccessory.getServiceById(this.Service.WindowCovering, serviceConfig.subtype).getCharacteristic(this.Characteristic.TargetPosition).on('get', this.getTargetPosition.bind(this)).on('set', this.setTargetPosition.bind(this));
		homebridgeAccessory.getServiceById(this.Service.WindowCovering, serviceConfig.subtype).getCharacteristic(this.Characteristic.CurrentPosition).on('get', this.getCurrentPosition.bind(this));
		homebridgeAccessory.getServiceById(this.Service.WindowCovering, serviceConfig.subtype).getCharacteristic(this.Characteristic.PositionState).on('get', this.getPositionState.bind(this));
	
		homebridgeAccessory.getServiceById(this.Service.WindowCovering, serviceConfig.subtype).getCharacteristic(this.Characteristic.TargetPosition).updateValue(this.value);
		homebridgeAccessory.getServiceById(this.Service.WindowCovering, serviceConfig.subtype).getCharacteristic(this.Characteristic.CurrentPosition).updateValue(this.value);
		homebridgeAccessory.getServiceById(this.Service.WindowCovering, serviceConfig.subtype).getCharacteristic(this.Characteristic.PositionState).updateValue(this.mode);

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
						
						super.setValue('value', state[c.type]);
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

	setTargetPosition(level, callback, verbose)
	{
		super.setValue('value', level, verbose);		

		callback();
	}

	getCurrentPosition(callback, verbose)
	{
		callback(super.getValue('value', verbose));
	}

	getPositionState(callback, verbose)
	{
		callback(super.getValue('mode', verbose));
	}

	setPositionState(level, callback, verbose)
	{
		super.setValue('mode', level, verbose);		

		callback();
	}
}