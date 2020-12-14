const BaseService = require('../base');

let Service, Characteristic;

module.exports = class StatelessSwitchService extends BaseService
{
	constructor(homebridgeAccessory, deviceConfig, serviceConfig, manager)
	{
        Characteristic = manager.platform.api.hap.Characteristic;
        Service = manager.platform.api.hap.Service;
        
        super(homebridgeAccessory, deviceConfig, serviceConfig, Service.StatelessProgrammableSwitch, manager);

        this.options.buttons = serviceConfig.buttons;

        for(var i = 0; i < this.options.buttons; i++)
        {
            var button = new Service.StatelessProgrammableSwitch(this.id + i, '' + i);
            var props = {
                minValue : Characteristic.ProgrammableSwitchEvent.SINGLE_PRESS,
                maxValue : Characteristic.ProgrammableSwitchEvent.DOUBLE_PRESS
            };

            button.getCharacteristic(Characteristic.ProgrammableSwitchEvent).setProps(props);
            button.getCharacteristic(Characteristic.ServiceLabelIndex).setValue(i + 1);

            this.homebridgeAccessory.service.push(button);
        }
        /*
        homebridgeAccessory.getServiceById(Service.Switch, serviceConfig.subtype).getCharacteristic(Characteristic.On).on('get', this.getState.bind(this)).on('set', this.setState.bind(this));
    
        this.changeHandler = (state) =>
        {
            homebridgeAccessory.getServiceById(Service.Switch, serviceConfig.subtype).getCharacteristic(Characteristic.On).updateValue(state);

            super.setValue('state', state);
        };
        */

        this.changeHandler = (state) =>
        {
            for(var i = 1; i < this.service.length - 1; i++)
            {
                if(i - 1 == state)
                {
                    logger.log('update', this.mac, this.letters, '[' + buttonName + ']: Event [' + (i + 1) + '] wurde ausgeführt! ( ' + this.mac + ' )');

                    homebridgeAccessory.getServiceById(Service.StatelessProgrammableSwitch, state).getCharacteristic(Characteristic.ProgrammableSwitchEvent).updateValue(value);
                }
            }
        };
	}
    /*
	getState(callback, verbose)
	{
		callback(super.getValue('state', verbose));
	}

	setState(level, callback, verbose)
	{
		super.setValue('state', level, verbose);		

		callback();
    }
    */
}