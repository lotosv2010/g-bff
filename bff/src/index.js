const express = require('express');
const morgan = require('morgan');
const rpcMiddleware = require('../middleware/rpc');
const catchMiddleware = require('../middleware/catch');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(rpcMiddleware({
  //配置 rpc 中间件的参数，表示要调用的 rpc 接口名称
  interfaceNames: [
    'com.g.bff.user',
    'com.g.bff.post'
  ]
}))
app.use(catchMiddleware());

app.get('/', async (req, res) => {
  const { userId } = req.query;
  const { user, post } = res?.rpcConsumers || {};

  const cacheKey = `${req.method}-${req.path}-${userId}`;
  let cacheData = await res.cache.get(cacheKey);
  console.log('cacheData', cacheData);
  if (cacheData) {
    return res.json(cacheData);
  }

  const [userInfo, postList] = await Promise.all([
    user.invoke('getUserInfo', [userId]),
    post.invoke('getPostList', [userId])
  ]);
  // 裁剪数据
  Reflect.deleteProperty(userInfo, 'password');
  // 数据脱敏
  Reflect.set(userInfo, 'phone', userInfo.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2'));
  // 数据适配
  // userInfo.avatar = "http://www.zhufengpeixun.cn/" + userInfo.avatar;
  cacheData = {
    userInfo,
    postList
  };
  await res.cache.set(cacheKey, cacheData);
  res.json({
    userInfo,
    postList
  });
});

app.listen(3300, () => {
  console.log('Example app listening on port 3300!');
});