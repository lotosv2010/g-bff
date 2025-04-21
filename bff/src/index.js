const express = require('express');
const morgan = require('morgan');
const rpcMiddleware = require('../middleware/rpc');
const catchMiddleware = require('../middleware/catch');
const mqMiddleware = require('../middleware/mq');
require('./logger'); // 引入日志中间件

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// 配置 rpc 中间件
app.use(rpcMiddleware({
  //配置 rpc 中间件的参数，表示要调用的 rpc 接口名称
  interfaceNames: [
    'com.g.bff.user',
    'com.g.bff.post'
  ]
}))

// 配置 catch 中间件
app.use(catchMiddleware());

// 配置 mq 中间件
app.use(mqMiddleware({
  url: 'amqp://localhost'
}));

app.get('/', async (req, res) => {
  const { userId } = req.query;

  // 发送日志到 RabbitMQ
  res.channels.logger.sendToQueue('logger', Buffer.from(JSON.stringify({
    method: req.method,
    path: req.path,
    userId
  })));

  const { user, post } = res?.rpcConsumers || {};

  // 缓存数据
  const cacheKey = `${req.method}-${req.path}-${userId}`;
  let cacheData = await res.cache.get(cacheKey);
  if (cacheData) {
    return res.json(cacheData);
  }

  // 调用 rpc 接口
  const [userInfo, postList] = await Promise.all([
    user.invoke('getUserInfo', [userId]),
    post.invoke('getPostList', [userId])
  ]);

  // 数据处理
  if(userInfo) {
    // 裁剪数据
    Reflect.deleteProperty(userInfo, 'password');
    // 数据脱敏
    Reflect.set(userInfo, 'phone', userInfo.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2'));
    // 数据适配
    // userInfo.avatar = "http://www.zhufengpeixun.cn/" + userInfo.avatar;
  }

  // 缓存数据
  cacheData = {
    userInfo,
    postList
  };
  await res.cache.set(cacheKey, cacheData);

  // 返回数据
  res.json(cacheData);
});

app.listen(3300, () => {
  console.log('Example app listening on port 3300!');
});