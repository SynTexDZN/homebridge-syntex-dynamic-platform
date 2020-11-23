const BaseService = require('./base');

let Service;
let Characteristic;

module.exports = class OutletService extends BaseService
{
	constructor(homebridgeAccessory, deviceConfig, serviceConfig, manager)
	{
		Service = manager.platform.api.hap.Service;
        Characteristic = manager.platform.api.hap.Characteristic;
        
        super(homebridgeAccessory, deviceConfig, serviceConfig, Service.Outlet, manager);

        this.letters = '7' + serviceConfig.subtype;

		homebridgeAccessory.getServiceById(Service.Outlet, serviceConfig.subtype).getCharacteristic(Characteristic.On).on('get', this.getState.bind(this)).on('set', this.setState.bind(this));
	}

	getState(callback)
	{
		console.log('getState() OUTLET');

		callback(false);
	}

	setState(level, callback)
	{
		console.log('setState(' + level + ') OUTLET');

		callback();
	}
}