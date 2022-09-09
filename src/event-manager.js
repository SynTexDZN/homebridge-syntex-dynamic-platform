module.exports = class EventManager
{
	constructor(platform)
	{
        this.logger = platform.logger;
        
        this.pluginName = platform.pluginName;
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

					this.logger.debug('<<< ' + stream + ' [' + filter.pluginName + '] ' + JSON.stringify(message));
				}
			}
		});
	}

	setOutputStream(stream, options, message)
	{
        this.logger.debug('>>> ' + stream + ' [' + this.pluginName + '] ' + JSON.stringify(message));

		process.emit(stream, { ...options, pluginName : this.pluginName }, message);
	}
}