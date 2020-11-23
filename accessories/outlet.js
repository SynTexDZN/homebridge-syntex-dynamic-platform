const BaseService = require('./base');

let Service;
let Characteristic;

module.exports = class OutletService extends BaseService
{
	constructor(homebridgeAccessory, deviceConfig, subtype, manager)
	{
		Service = manager.platform.api.hap.Service;
        Characteristic = manager.platform.api.hap.Characteristic;
        
        super(homebridgeAccessory, deviceConfig, Service.Outlet, 'outlet', subtype, manager);

        this.letters = '7' + subtype;

		homebridgeAccessory.getServiceById(Service.Outlet, subtype).getCharacteristic(Characteristic.On).on('get', this.getState.bind(this)).on('set', this.setState.bind(this));
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