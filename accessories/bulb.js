const BaseAccessory = require('./base')

let Accessory;
let Service;
let Characteristic;

module.exports = class SwitchAccessory extends BaseAccessory
{
	constructor(homebridgeAccessory, deviceConfig, manager)
	{
		Accessory = manager.platform.api.hap.Accessory;
		Service = manager.platform.api.hap.Service;
		Characteristic = manager.platform.api.hap.Characteristic;

		super(homebridgeAccessory, deviceConfig, manager);

		this.homebridgeAccessory.getService(Service.Lightbulb).getCharacteristic(Characteristic.On).on('get', this.getState.bind(this)).on('set', this.setState.bind(this));
	}

	getState(callback)
	{
		callback(false);
	}

	setState(level, callback)
	{
        console.log(2, 'SAY HI', level);

		callback();
	}
}