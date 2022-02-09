const EventEmitter = require('events');

module.exports = class EventManager extends EventEmitter
{
	constructor(logger)
	{
		super();

		super.setMaxListeners(512);
    
        this.logger = logger;
    }

    setInputStream(stream, sender, receiver, callback)
	{
		super.on(stream, (source, destination, state) => {
			
			if((source == null || source != sender) && destination == receiver)
			{
				callback(state);

				this.logger.debug('<<< ' + stream + ' [' + receiver + '] ' + JSON.stringify(state));
			}
		});
	}

	setOutputStream(stream, sender, destination, state)
	{
		super.emit(stream, sender, destination, state);

		this.logger.debug('>>> ' + stream + ' [' + destination + '] ' + JSON.stringify(state));
	}
}