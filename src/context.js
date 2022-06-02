class ContextManager
{
    constructor()
    {
        this.clients = [];
        this.context = {};
    }

    updateContext(id, letters, value)
    {
        if(this.context[id] == null)
        {
            this.context[id] = {};
        }

        if(this.context[id][letters] == null)
        {
            this.context[id][letters] = {};
        }

        for(const i in value)
        {
            this.context[id][letters][i] = value[i];
        }

        for(const i in this.clients)
        {
            if(this.clients[i].id == id)
            {
                this.clients[i].socket.send(JSON.stringify(this.context[id]));
            }
        }
    }

    addClient(ws, id)
    {
        var found = false;

        for(const i in this.clients)
        {
            if(this.clients[i].socket == ws)
            {
                found = true;
            }
        }

        if(!found)
        {
            this.clients.push({ socket : ws, id });
        }

        return this.context[id];
    }
}

module.exports = new ContextManager();