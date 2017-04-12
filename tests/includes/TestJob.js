import Job from 'queuely/build/dispatchables/Job';

class TestJob extends Job {
    constructor(data) {
      super();
      this._data = data;
    }
}

export default TestJob;

