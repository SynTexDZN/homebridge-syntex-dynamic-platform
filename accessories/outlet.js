const BaseService = require('./base');

let Characteristic;

module.exports = class OutletService extends BaseService
{
	constructor(homebridgeAccessory, deviceConfig, serviceConfig, manager)
	{
        Characteristic = manager.platform.api.hap.Characteristic;
        
        super(homebridgeAccessory, deviceConfig, serviceConfig, Service.Outlet, manager);

		this.getService().getCharacteristic(Characteristic.On).on('get', this.getState.bind(this)).on('set', this.setState.bind(this));
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