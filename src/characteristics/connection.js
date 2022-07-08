const { Formats, Perms } = require('homebridge');

module.exports = (homebridge) => {

    const Characteristic = homebridge.hap.Characteristic;

    return class ConnectionCharacteristic extends Characteristic
    {
        static UUID = '00000062-0000-1000-8000-0026BB765291';
        static OPTIONS = {
            format : Formats.BOOL,
            perms : [
                Perms.PAIRED_READ,
                Perms.PAIRED_WRITE,
                Perms.NOTIFY
            ]
        };

        constructor()
        {
            super('Connection', ConnectionCharacteristic.UUID, ConnectionCharacteristic.OPTIONS);
        }
    };
};