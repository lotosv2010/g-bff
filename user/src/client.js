const { client: { RpcClient }, registry: { ZookeeperRegistry } } = require('sofa-rpc-node');

// 设置日志记录器
const logger = console;

// 创建 Zookeeper 注册中心
const registry = new ZookeeperRegistry({
  logger,
  address: '127.0.0.1:2181',
});

// !调用 RPC 服务（从注册中心获取服务列表）
async function invoke() {
  // 创建 RPC 客户端
  const client = new RpcClient({ logger, registry });
  // 创建 RPC 服务消费者
  const consumer = client.createConsumer({
    // 指定服务接口名称
    interfaceName: 'com.g.bff.user',
  });
  // 等待服务就绪
  await consumer.ready();
  // 调用服务方法
  const result = await consumer.invoke('getUserInfo', [1], { responseTimeout: 3000 });
  // 输出结果
  console.log(result);
}

invoke().catch(console.error);