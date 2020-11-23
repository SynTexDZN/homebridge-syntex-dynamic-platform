const BaseService = require('./base');

let Service;
let Characteristic;

module.exports = class SwitchService extends BaseService
{
	constructor(homebridgeAccessory, deviceConfig, serviceConfig, manager)
	{
		Service = manager.platform.api.hap.Service;
        Characteristic = manager.platform.api.hap.Characteristic;
        
        super(homebridgeAccessory, deviceConfig, serviceConfig, Service.Switch, manager);

        this.letters = '4' + serviceConfig.subtype;

		homebridgeAccessory.getServiceById(Service.Switch, serviceConfig.subtype).getCharacteristic(Characteristic.On).on('get', this.getState.bind(this)).on('set', this.setState.bind(this));
	}

	getState(callback)
	{
        console.log('getState() SWITCH');

		callback(false);
	}

	setState(level, callback)
	{
		console.log('setState(' + level + ') SWITCH');

		callback();
	}
}