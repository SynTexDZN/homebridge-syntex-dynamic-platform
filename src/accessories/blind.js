const BaseService = require('../base');

module.exports = class BlindService extends BaseService
{
	constructor(homebridgeAccessory, deviceConfig, serviceConfig, manager)
	{
		super(homebridgeAccessory, deviceConfig, serviceConfig, manager.platform.api.hap.Service.WindowCovering, manager);

		homebridgeAccessory.getServiceById(this.Service.WindowCovering, serviceConfig.subtype).getCharacteristic(this.Characteristic.TargetPosition).on('get', this.getTargetPosition.bind(this)).on('set', this.setTargetPosition.bind(this));
		homebridgeAccessory.getServiceById(this.Service.WindowCovering, serviceConfig.subtype).getCharacteristic(this.Characteristic.CurrentPosition).on('get', this.getCurrentPosition.bind(this));
		homebridgeAccessory.getServiceById(this.Service.WindowCovering, serviceConfig.subtype).getCharacteristic(this.Characteristic.PositionState).on('get', this.getPositionState.bind(this));
	
		homebridgeAccessory.getServiceById(this.Service.WindowCovering, serviceConfig.subtype).getCharacteristic(this.Characteristic.TargetPosition).updateValue(super.getValue('value', true) || 0);
		homebridgeAccessory.getServiceById(this.Service.WindowCovering, serviceConfig.subtype).getCharacteristic(this.Characteristic.CurrentPosition).updateValue(super.getValue('value') || 0);
		homebridgeAccessory.getServiceById(this.Service.WindowCovering, serviceConfig.subtype).getCharacteristic(this.Characteristic.PositionState).updateValue(super.getValue('position') || this.Characteristic.PositionState.STOPPED);

		this.changeHandler = (state) => {

			if(state instanceof Object)
			{
				var v = [
					{ type : 'value', Characteristic : this.Characteristic.TargetPosition },
					{ type : 'value', Characteristic : this.Characteristic.CurrentPosition }
				];

				for(const i in v)
				{
					if(state[v[i].type] != null)
					{
						homebridgeAccessory.getServiceById(this.Service.WindowCovering, serviceConfig.subtype).getCharacteristic(v[i].Characteristic).updateValue(state[v[i].type]);
						
						super.setValue('value', state[v[i].type]);
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
		callback(super.getValue('value', verbose) || 0);
	}

	setTargetPosition(level, callback, verbose)
	{
		super.setValue('value', level, verbose);		

		callback();
	}

	getCurrentPosition(callback, verbose)
	{
		callback(super.getValue('value', verbose) || 0);
	}

	getPositionState(callback, verbose)
	{
		callback(super.getValue('position', verbose) || this.Characteristic.PositionState.STOPPED);
	}

	setPositionState(level, callback, verbose)
	{
		super.setValue('position', level, verbose);		

		callback();
	}
}