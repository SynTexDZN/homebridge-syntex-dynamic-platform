const BaseService = require('./base');

let Service, Characteristic;

module.exports = class SwitchService extends BaseService
{
	constructor(homebridgeAccessory, deviceConfig, serviceConfig, manager)
	{
		Characteristic = manager.platform.api.hap.Characteristic;
		Service = manager.platform.api.hap.Service;
        
		super(homebridgeAccessory, deviceConfig, serviceConfig, Service.Switch, manager);
		
		homebridgeAccessory.getServiceById(Service.Switch, serviceConfig.subtype).getCharacteristic(Characteristic.On).on('get', this.getState.bind(this)).on('set', this.setState.bind(this));
	
		this.changeHandler = (state) =>
        {
            homebridgeAccessory.getServiceById(Service.Switch, serviceConfig.subtype).getCharacteristic(Characteristic.On).updateValue(state);

            super.setValue('state', state);
        };
	}

	getState(callback)
	{
        callback(null, super.getValue('state') || false);
	}

	setState(level, callback)
	{
		super.setValue('state', level);		

		callback();
	}
}