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
						data = data.slice(0, -1);
						data = data.replace(/(?:\r\n|\r|\n)/g, ',');
						data = JSON.parse('[' + data + ']');

						for(const entry of data)
						{
							this._prepareStructure(entry.id, entry.letters);

							if(entry.state != null)
							{
								if(this.context[entry.id][entry.letters].time == null
								|| this.context[entry.id][entry.letters].time < entry.time * 60000)
								{
									this.context[entry.id][entry.letters] = { time : entry.time * 60000, state : entry.state };
								}

								this.cache[entry.id][entry.letters].history.push({ time : entry.time * 60000, state : entry.state });
							}
							else if(entry.automation != null)
							{
								this.cache[entry.id][entry.letters].automation.push({ time : entry.time * 60000, automation : entry.automation });
							}
						}
					}
					catch(e)
					{
						this.logger.err(e);
					}
				}

			}).catch(() => {});
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

						for(const cycle of this.cache[id][letters].cycle)
						{
							for(const i in cycle)
							{
								if(sum[i] == null)
								{
									sum[i] = 0;
								}

								sum[i] += cycle[i];
							}
						}

						for(const i in sum)
						{
							if(typeof this.cache[id][letters].cycle[this.cache[id][letters].cycle.length - 1][i] == 'boolean')
							{
								state[i] = sum[i] > 0;
							}
							else if(typeof this.cache[id][letters].cycle[this.cache[id][letters].cycle.length - 1][i] == 'number')
							{
								state[i] = sum[i] / this.cache[id][letters].cycle.length;
							}
						}

						if((Object.keys(state).length > 0 && this._hasHistoryChanged(this.cache[id][letters].history, state))
						|| (Object.keys(this.context[id][letters].state).length > 0 && this._hasHistoryChanged(this.cache[id][letters].history, this.context[id][letters].state)))
						{
							if(this._hasHistoryChanged(this.cache[id][letters].history, this.context[id][letters].state))
							{
								state = { ...this.context[id][letters].state };
							}

							this.cache[id][letters].history.push({ time : this.lastCycle, state });

							this._sendSocketMessage(id, letters, { time : this.lastCycle, history : state });

							this._saveHistory(id, letters, this.lastCycle, { state });
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

	updateContext(id, letters, state, readOnly)
	{
		state = { ...state };

		this._prepareStructure(id, letters);

		if(this._hasStateChanged(this.context[id][letters], state))
		{
			if(!readOnly)
			{
				this.context[id][letters].time = new Date().getTime();
			}
			
			for(const x in state)
			{
				this.context[id][letters].state[x] = state[x];
			}
			
			this._sendSocketMessage(id, letters, this.context[id][letters]);
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

		for(const client of this.socketClients)
		{
			if(client.socket == socket)
			{
				client.id = id;
				client.letters = letters;

				found = true;
			}
		}

		if(!found)
		{
			this.socketClients.push({ socket, id, letters });
		}

		if(this.context[id] != null && this.context[id][letters] != null)
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
					try
					{
						var newData = '';
			
						data = data.slice(0, -1);
						data = data.replace(/(?:\r\n|\r|\n)/g, ',');
						data = JSON.parse('[' + data + ']');
			
						for(const entry of data)
						{
							var time = new Date(entry.time * 60000).getTime();
		
							if(new Date().getTime() - time < 86400000)
							{
								newData += JSON.stringify(entry) + '\n';
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
					catch(e)
					{
						this.logger.err(e);

						this._clearQuery();
					}
				}
				else
				{
					this._clearQuery();
				}

			}).catch(() => this._clearQuery());
		}
	}

	_clearQuery()
	{
		this.removeExpired = false;

		for(const query of this.query)
		{
			fs.appendFileSync(this.path, query, 'utf8');
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
		var obj = { id, letters, time : Math.floor(time / 60000) };

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
		for(const client of this.socketClients)
		{
			if(client.id == id && client.letters == letters)
			{
				client.socket.send(JSON.stringify(message));
			}
		}
	}
}