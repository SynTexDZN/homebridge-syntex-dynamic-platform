const BaseService = require('../../base');

module.exports = class FanV2Service extends BaseService
{
	constructor(homebridgeAccessory, deviceConfig, serviceConfig, manager)
	{
		super(homebridgeAccessory, deviceConfig, serviceConfig, manager.platform.api.hap.Service.Fanv2, manager);
		
		this.value = super.getValue('value');
		this.direction = super.getValue('direction');
		this.speed = super.getValue('speed');

		this.service.getCharacteristic(this.Characteristic.Active).on('get', this.getActive.bind(this)).on('set', this.setActive.bind(this));
		this.service.getCharacteristic(this.Characteristic.RotationDirection).on('get', this.getRotationDirection.bind(this)).on('set', this.setRotationDirection.bind(this));
		this.service.getCharacteristic(this.Characteristic.RotationSpeed).on('get', this.getRotationSpeed.bind(this)).on('set', this.setRotationSpeed.bind(this));

		this.service.getCharacteristic(this.Characteristic.SwingMode).on('get', this.getSwingMode.bind(this)).on('set', this.setSwingMode.bind(this));
		this.service.getCharacteristic(this.Characteristic.LockPhysicalControls).on('get', this.getLockPhysicalControls.bind(this)).on('set', this.setLockPhysicalControls.bind(this));

		this.service.getCharacteristic(this.Characteristic.CurrentFanState).on('get', this.getCurrentFanState.bind(this));
		this.service.getCharacteristic(this.Characteristic.TargetFanState).on('get', this.getTargetFanState.bind(this)).on('set', this.setTargetFanState.bind(this));

		this.changeHandler = (state) => {

			if(state.value != null)
			{
				this.setState(state.value,
					() => this.service.getCharacteristic(this.Characteristic.On).updateValue(state.value));
			}

			this.AutomationSystem.LogikEngine.runAutomation(this, state);
		};
	}

	getActive(callback)
	{
		console.log('getActive HANDLER');

		callback(null, 0);
	}

	setActive(active, callback)
	{
		console.log('setActive HANDLER', active);

		callback();
	}

	getRotationDirection(callback)
	{
		console.log('getRotationDirection HANDLER');

		callback(null, 0);
	}

	setRotationDirection(direction, callback)
	{
		console.log('setRotationDirection HANDLER', direction);

		callback();
	}

	getRotationSpeed(callback)
	{
		console.log('getRotationSpeed HANDLER');

		callback(null, 0);
	}

	setRotationSpeed(rotation, callback)
	{
		console.log('setRotationSpeed HANDLER', rotation);

		callback();
	}

	getSwingMode(callback)
	{
		console.log('getSwingMode HANDLER');

		callback(null, 0);
	}

	setSwingMode(swing, callback)
	{
		console.log('setSwingMode HANDLER', swing);

		callback();
	}

	getLockPhysicalControls(callback)
	{
		console.log('getLockPhysicalControls HANDLER');

		callback(null, 0);
	}

	setLockPhysicalControls(lock, callback)
	{
		console.log('setLockPhysicalControls HANDLER', lock);

		callback();
	}

	getCurrentFanState(callback)
	{
		console.log('getCurrentFanState HANDLER');

		callback(null, 0);
	}

	getTargetFanState(callback)
	{
		console.log('getTargetFanState HANDLER');

		callback(null, 0);
	}

	setTargetFanState(mode, callback)
	{
		console.log('setTargetFanState HANDLER', mode);

		callback();
	}
}