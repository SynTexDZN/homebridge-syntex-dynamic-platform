module.exports = class EventManager
{
	constructor(platform)
	{
		this.pluginName = platform.pluginName;
        this.logger = platform.logger;
        
		process.setMaxListeners(512);
    }

    setInputStream(stream, options, callback)
	{
		process.on(stream, (filter, message) => {
			
			if(options.external == true && this.pluginName != filter.pluginName
			|| options.external != true && this.pluginName == filter.pluginName)
			{
				if((filter.sender == null || filter.sender != options.source)
				&& (filter.receiver == null || filter.receiver == options.destination))
				{
					callback(message);

					this.logger.debug('<<< [' + filter.pluginName + '] ' + stream + (filter.receiver != null ? ' [' + filter.receiver + '] ' : ' ') + JSON.stringify(message));
				}
			}
		});
	}

	setOutputStream(stream, options, message)
	{
        this.logger.debug('>>> [' + this.pluginName + '] ' + stream + (options.receiver != null ? ' [' + options.receiver + '] ' : ' ') + JSON.stringify(message));

		process.emit(stream, { ...options, pluginName : this.pluginName }, message);
	}
}