const fs = require('fs'), path = require('path');

module.exports = class ContextManager
{
    constructor(platform)
    {
        this.context = {};
        this.cache = {};

        this.socketClients = [];

        this.query = [];

        this.files = platform.files;
        this.logger = platform.logger;

        if(platform.baseDirectory != null)
        {
            this.path = path.join(platform.baseDirectory, 'activity', platform.pluginName + '.txt');

            this.files.readFile(this.path).then((data) => {

                if(data != null)
                {
                    try
                    {
                        data = data.toString();
                        data = data.slice(0, -1);
                        data = data.replace(/(?:\r\n|\r|\n)/g, ',');
                        data = JSON.parse('[' + data + ']');

                        for(const i in data)
                        {
                            this._prepareStructure(data[i].id, data[i].letters);

                            if(data[i].state != null)
                            {
                                this.cache[data[i].id][data[i].letters].history.push({ time : data[i].time * 60000, state : data[i].state });
                            }
                            else if(data[i].automation != null)
                            {
                                this.cache[data[i].id][data[i].letters].automation.push({ time : data[i].time * 60000, automation : data[i].automation });
                            }
                        }
                    }
                    catch(e)
                    {
                        this.logger.err(e);
                    }
                }
            });
        }

        this.nextCycle = this._getNextCycle();
        this.lastCycle = this._getNextCycle() - 60000;

        this.cycleInterval = setInterval(() => {

            if(new Date().getTime() >= this.nextCycle)
            {
                for(const id in this.cache)
                {
                    for(const letters in this.cache[id])
                    {
                        var state = {}, sum = {};

                        for(const i in this.cache[id][letters].cycle)
                        {
                            for(const x in this.cache[id][letters].cycle[i])
                            {
                                if(sum[x] == null)
                                {
                                    sum[x] = 0;
                                }

                                sum[x] += this.cache[id][letters].cycle[i][x];
                            }
                        }

                        for(const x in sum)
                        {
                            if(typeof this.cache[id][letters].cycle[this.cache[id][letters].cycle.length - 1][x] == 'boolean')
                            {
                                state[x] = sum[x] > 0;
                            }
                            else if(typeof this.cache[id][letters].cycle[this.cache[id][letters].cycle.length - 1][x] == 'number')
                            {
                                state[x] = sum[x] / this.cache[id][letters].cycle.length;
                            }
                        }

                        if((Object.keys(state).length > 0 && this._hasHistoryChanged(this.cache[id][letters].history, state)) || (Object.keys(this.context[id][letters].state).length > 0 && this._hasHistoryChanged(this.cache[id][letters].history, this.context[id][letters].state)))
                        {
                            if(this._hasHistoryChanged(this.cache[id][letters].history, this.context[id][letters].state))
                            {
                                state = { ...this.context[id][letters].state };
                            }

                            this.cache[id][letters].history.push({ time : this.lastCycle, state });

                            this._sendSocketMessage(id, letters, { time : this.lastCycle, history : state });

                            this._saveHistory(id, letters, this.lastCycle / 60000, { state });
                        }

                        this.cache[id][letters].cycle = [];
                    }
                }

                this.nextCycle = this._getNextCycle();
                this.lastCycle = this._getNextCycle() - 60000;
            }

        }, 1000);

        this._removeExpired();
		
        this.expiredInterval = setInterval(() => this._removeExpired(), 3600 * 1000);
    }

    updateContext(id, letters, state)
    {
        state = { ...state };

        this._prepareStructure(id, letters);

        if(this._hasStateChanged(this.context[id][letters], state))
        {
            this.context[id][letters] = { time : new Date().getTime(), state };

            this._sendSocketMessage(id, letters, { time : new Date().getTime(), state });
        }

        if(this._hasCycleChanged(this.cache[id][letters].cycle, state))
        {
            this.cache[id][letters].cycle.push(state);
        }
    }

    updateAutomation(id, letters, automation)
    {
        automation = { ...automation };

        this._prepareStructure(id, letters);

        this.cache[id][letters].automation.push({ time : new Date().getTime(), automation });

        this._sendSocketMessage(id, letters, { time : new Date().getTime(), automation });

        this._saveHistory(id, letters, new Date().getTime(), { automation });
    }

    addClient(socket, id, letters)
    {
        var response = { state : {}, history : [], automation : [] }, found = false;

        for(const i in this.socketClients)
        {
            if(this.socketClients[i].socket == socket)
            {
                this.socketClients[i].id = id;
                this.socketClients[i].letters = letters;

                found = true;
            }
        }

        if(!found)
        {
            this.socketClients.push({ socket, id, letters });
        }

        if(this.context[id] != null && this.context[id][letters] != null && this.context[id][letters].time != null)
        {
            response.state = this.context[id][letters];
        }

        if(this.cache[id] != null && this.cache[id][letters] != null)
        {
            response.history = this.cache[id][letters].history;
            response.automation = this.cache[id][letters].automation;
        }

        return response;
    }

    _getNextCycle()
    {
        var date = new Date(new Date().getTime() + 60000);

        date.setSeconds(0);
        date.setMilliseconds(0);

        return date.getTime();
    }

    _hasStateChanged(object, state)
    {
        if(object.state == null)
        {
            return true;
        }

        for(const x in state)
        {
            if(object.state[x] != state[x])
            {
                return true;
            }
        }

        return false;
    }

    _hasCycleChanged(array, state)
    {
        if(array.length == 0)
        {
            return true;
        }

        for(const x in state)
        {
            if(array[array.length - 1][x] != state[x])
            {
                return true;
            }
        }

        return false;
    }

    _hasHistoryChanged(array, state)
    {
        if(array.length == 0)
        {
            return true;
        }

        for(const x in state)
        {
            if(array[array.length - 1].state[x] != state[x])
            {
                return true;
            }
        }

        return false;
    }

    _removeExpired()
	{
		if(this.path != null)
		{
			this.removeExpired = true;

			this.files.readFile(this.path).then((data) => {

				if(data != null)
				{
					var newData = '';
		
					data = data.toString();
                    data = data.slice(0, -1);
                    data = data.replace(/(?:\r\n|\r|\n)/g, ',');
                    data = JSON.parse('[' + data + ']');
		
					for(const i in data)
					{
                        var time = new Date(data[i].time * 60000).getTime();
    
                        if(new Date().getTime() - time < 86400000)
                        {
                            newData += JSON.stringify(data[i]) + '\n';
                        }
					}

					if(newData != '')
					{
						this.files.writeFile(this.path, newData).then((response) => {

							if(!response.success)
							{
								this.logger.log('error', 'bridge', 'Bridge', this.path + ' %update_error%');
							}

							this._clearQuery();
						});
					}
					else
					{
						this._clearQuery();
					}
				}
				else
				{
					this._clearQuery();
				}
			});
		}
	}

    _clearQuery()
	{
		this.removeExpired = false;

		for(const i in this.query)
		{
            fs.appendFileSync(this.path, this.query[i], 'utf8');
		}

		this.query = [];
	}

    _prepareStructure(id, letters)
    {
        if(this.context[id] == null)
        {
            this.context[id] = {};
        }

        if(this.context[id][letters] == null)
        {
            this.context[id][letters] = { state : {} };
        }

        if(this.cache[id] == null)
        {
            this.cache[id] = {};
        }

        if(this.cache[id][letters] == null)
        {
            this.cache[id][letters] = { automation : [], cycle : [], history : [] };
        }
    }

    _saveHistory(id, letters, time, message)
    {
        var obj = { id, letters, time };

        for(const x in message)
        {
            obj[x] = message[x];
        }

        if(this.path != null)
        {
            if(!this.removeExpired)
            {
                fs.appendFileSync(this.path, JSON.stringify(obj) + '\n', 'utf8');
            }
            else
            {
                this.query.push(JSON.stringify(obj) + '\n');
            }
        }
    }

    _sendSocketMessage(id, letters, message)
    {
        for(const i in this.socketClients)
        {
            if(this.socketClients[i].id == id && this.socketClients[i].letters == letters)
            {
                this.socketClients[i].socket.send(JSON.stringify(message));
            }
        }
    }
}