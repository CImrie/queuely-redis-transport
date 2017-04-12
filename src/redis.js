import RedisClient from 'ioredis';

class RedisTransport {
  constructor(options = {}) {
    this._defaultQueueName = 'default';

    let defaults = {
      host: '127.0.0.1',
      port: 6379,
      family: 4,
      password: null,
      db: 0,
    };

    this._options = {...defaults, ...options};
    this._client = new RedisClient(this._options);
  }

  configure(queuely) {
    this._handlers = queuely.handlers;
  }

  async push(dispatchable, options = {}) {
    await this._client.lpush(this.get(options.queue), JSON.stringify({data: dispatchable, type: dispatchable.constructor.name}));

    return this;
  }

  get(queue) {
    return "queues:" + (queue || this._defaultQueueName);
  }

  async pop(options = {}) {
    let rawWrapper = await this._client.lpop(this.get(options.queue));

    if(!rawWrapper) {
      return null;
    }

    let wrapper = JSON.parse(rawWrapper);
    let mappedObjectData = {};
    for(let key of Object.keys(wrapper.data)) {
      mappedObjectData[key] = {
        writable: true,
        configurable: true,
        value: wrapper.data[key]
      }
    }

    return Object.create(this._handlers.classMap[wrapper.type], mappedObjectData);
  }

  fail(job, err) {
    this.push(job, {queue: 'failed'});
  }
}

let redis = (options) => {
  return new RedisTransport(options);
};

export default redis;