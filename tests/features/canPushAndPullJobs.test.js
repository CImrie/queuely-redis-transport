import test from 'ava';
import queuely from 'queuely';
import Queuely from 'queuely/build/Queuely'
import redis from '../../src/redis';
import TestJob from '../includes/TestJob';
import Worker from 'queuely/build/Worker';
import uuid from 'node-uuid';

test('can process job using redis transport', async t => {
  queuely.use(redis(
    {
      db: 0
    }
  ));

  t.plan(1);

  queuely.on(TestJob, (job, resolve, reject) => {
    t.true(true);
  });

  await queuely.dispatch(new TestJob()).toBackground();

  let worker = new Worker(queuely);
  await worker.start();
});

test('can process jobs with data', async t => {
  let separateQueuely = new Queuely();
  separateQueuely.use(redis());

  t.plan(2);
  let testObj = {hello: 'world'};

  separateQueuely.on(TestJob, (job, resolve, reject) => {
    t.is(job._data.msg, 'my msg.');
    t.is(job._data.obj.hello, testObj.hello);
  });

  let queue = uuid.v4();

  await separateQueuely.dispatch(new TestJob(
    {
      msg: 'my msg.',
      obj: testObj
    }
  )).onQueue(queue).toBackground();

  let worker = new Worker(separateQueuely, {queue});
  await worker.start();
});