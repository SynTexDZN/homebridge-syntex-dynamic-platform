const BaseService = require('../../base');

module.exports = class AirPurifierService extends BaseService
{
	constructor(homebridgeAccessory, deviceConfig, serviceConfig, manager)
	{
		super(homebridgeAccessory, deviceConfig, serviceConfig, manager.platform.api.hap.Service.AirPurifier, manager);
		
		this.value = super.getValue('value');
		this.mode = super.getValue('value');
		this.state = super.getValue('value');

		this.service.getCharacteristic(this.Characteristic.Active).on('get', this.getActive.bind(this)).on('set', this.setActive.bind(this));
		this.service.getCharacteristic(this.Characteristic.TargetAirPurifierState).on('get', this.getTargetAirPurifierState.bind(this)).on('set', this.setTargetAirPurifierState.bind(this));
		this.service.getCharacteristic(this.Characteristic.CurrentAirPurifierState).on('get', this.getCurrentAirPurifierState.bind(this));

		this.service.getCharacteristic(this.Characteristic.RotationSpeed).on('get', this.getRotationSpeed.bind(this)).on('set', this.setRotationSpeed.bind(this));
		this.service.getCharacteristic(this.Characteristic.SwingMode).on('get', this.getSwingMode.bind(this)).on('set', this.setSwingMode.bind(this));
		this.service.getCharacteristic(this.Characteristic.LockPhysicalControls).on('get', this.getLockPhysicalControls.bind(this)).on('set', this.setLockPhysicalControls.bind(this));

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

	getCurrentAirPurifierState(callback)
	{
		console.log('getCurrentAirPurifierState HANDLER');

		callback(null, 0);
	}

	getTargetAirPurifierState(callback)
	{
		console.log('getTargetAirPurifierState HANDLER');

		callback(null, 0);
	}

	setTargetAirPurifierState(mode, callback)
	{
		console.log('setTargetAirPurifierState HANDLER', mode);

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
}