const fs = require('fs'), path = require('path');

module.exports = class ContextManager
{
    constructor(platform)
    {
        this.context = {};
        this.cache = {};

        this.query = [];

        this.stateClients = [];
        this.activityClients = [];

        this.files = platform.files;

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
                            if(this.cache[data[i].id] == null)
                            {
                                this.cache[data[i].id] = {};
                            }

                            if(this.cache[data[i].id][data[i].letters] == null)
                            {
                                this.cache[data[i].id][data[i].letters] = { cycle : [], history : [] };
                            }

                            this.cache[data[i].id][data[i].letters].history.push({ time : data[i].time * 60000, state : data[i].state });
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

                        if((Object.keys(state).length > 0 && this._hasHistoryChanged(this.cache[id][letters].history, state)) || this._hasHistoryChanged(this.cache[id][letters].history, this.context[id][letters]))
                        {
                            if(this._hasHistoryChanged(this.cache[id][letters].history, this.context[id][letters]))
                            {
                                state = { ...this.context[id][letters] };
                            }

                            this.cache[id][letters].history.push({ time : this.lastCycle, state });

                            for(const i in this.activityClients)
                            {
                                if(this.activityClients[i].id == id && this.activityClients[i].letters == letters)
                                {
                                    this.activityClients[i].socket.send(JSON.stringify([{ time : this.lastCycle, state }]));
                                }
                            }

                            if(this.path != null)
                            {
                                if(!this.removeExpired)
                                {
                                    fs.appendFileSync(this.path, JSON.stringify({ id, letters, time : this.lastCycle / 60000, state }) + '\n', 'utf8');
                                }
                                else
                                {
                                    this.query.push(JSON.stringify({ id, letters, time : this.lastCycle / 60000, state }) + '\n');
                                }
                            }
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
        if(this.context[id] == null)
        {
            this.context[id] = {};
        }

        if(this.context[id][letters] == null)
        {
            this.context[id][letters] = {};
        }

        if(this.cache[id] == null)
        {
            this.cache[id] = {};
        }

        if(this.cache[id][letters] == null)
        {
            this.cache[id][letters] = { cycle : [], history : [] };
        }

        for(const x in state)
        {
            this.context[id][letters][x] = state[x];
        }

        if(this._hasCycleChanged(this.cache[id][letters].cycle, state))
        {
            this.cache[id][letters].cycle.push({ ...state });
        }

        for(const i in this.stateClients)
        {
            if(this.stateClients[i].id == id)
            {
                this.stateClients[i].socket.send(JSON.stringify(this.context[id]));
            }
        }
    }

    addClient(ws, id)
    {
        var found = false;

        for(const i in this.stateClients)
        {
            if(this.stateClients[i].socket == ws)
            {
                this.stateClients[i].id = id;

                found = true;
            }
        }

        if(!found)
        {
            this.stateClients.push({ socket : ws, id });
        }

        return this.context[id];
    }

    getActivity(ws, id, letters)
    {
        var found = false;

        for(const i in this.activityClients)
        {
            if(this.activityClients[i].socket == ws)
            {
                this.activityClients[i].id = id;

                found = true;
            }
        }

        if(!found)
        {
            this.activityClients.push({ socket : ws, id, letters });
        }

        if(this.cache[id] != null && this.cache[id][letters] != null)
        {
            return this.cache[id][letters].history;
        }

        return null;
    }

    _getNextCycle()
    {
        var date = new Date(new Date().getTime() + 60000);

        date.setSeconds(0);
        date.setMilliseconds(0);

        return date.getTime();
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
}