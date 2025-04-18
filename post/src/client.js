const { client: { RpcClient } } = require('sofa-rpc-node');

// 设置日志记录器
const logger = console;

// !调用 RPC 服务（直连模式）
async function invoke() {
  // 创建 RPC 客户端, 不需要传入 registry 实例了
  const client = new RpcClient({ logger });
  // 创建 RPC 服务消费者
  const consumer = client.createConsumer({
    // 指定服务接口名称
    interfaceName: 'com.g.bff.post',
    serverHost: '127.0.0.1:12300',
  });
  // 等待服务就绪
  await consumer.ready();
  // 调用服务方法
  const result = await consumer.invoke('getPostInfo', [1], { responseTimeout: 3000 });
  // 输出结果
  console.log(result);
  const list = await consumer.invoke('getPostList', [], { responseTimeout: 3000 });
  console.log(list);
  const count = await consumer.invoke('getPostCount', [], { responseTimeout: 3000 });
  console.log(count);
}

invoke().catch(console.error);