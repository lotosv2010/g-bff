const express = require('express');
const morgan = require('morgan');
const rpcMiddleware = require('../middleware/rpc');

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
}));

app.get('/', async (req, res) => {
  const { userId } = req.query;
  const { user, post } = res?.rpcConsumers || {};
  const [userInfo, postList] = await Promise.all([
    user.invoke('getUserInfo', [userId]),
    post.invoke('getPostList', [userId])
  ]);
  // 裁剪数据
  Reflect.deleteProperty(userInfo, 'password');
  // 数据脱敏
  Reflect.set(userInfo, 'phone', userInfo.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2'))
  res.json({
    userInfo,
    postList
  });
});

app.listen(3300, () => {
  console.log('Example app listening on port 3300!');
});