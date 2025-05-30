const { server: { RpcServer }, registry: { ZookeeperRegistry } }  = require('sofa-rpc-node');
const mysql = require('mysql2/promise')

// 设置日志记录器
const logger = console;
let connection = null;


// 1.创建 Zookeeper 注册中心实例
const registry = new ZookeeperRegistry({
  logger,
  address: '127.0.0.1:2181',
  timeout: 1000 * 60 * 60 * 24,
});

// 2.创建 RPC 服务端实例
const server = new RpcServer({
  logger,
  registry,
  port: 12200,
});

// 3.添加服务接口
server.addService({
    interfaceName: 'com.g.bff.user',
  }, 
  {
    async getUserInfo(userId) {
      const [rows] = await connection.execute(`SELECT id,username,avatar,password,phone FROM user WHERE id=${userId} limit 1`);
      return rows[0];
    }
  });

// 4.启动 RPC 服务端，并发布服务
async function start() {
  connection = await mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: 'root123456',
    database: 'bff',
  });
  await server.start();
  await server.publish();
  console.log('用户微服务发布成功');
}

start();