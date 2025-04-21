const amqplib = require('amqplib');
const fs = require('fs-extra');
const path = require('path');

(async () => {
  // 创建 RabbitMQ 连接和通道
  const conn = await amqplib.connect('amqp://localhost');
  // 创建日志队列
  const loggerChannel = await conn.createChannel();
  // 创建队列
  await loggerChannel.assertQueue('logger');
  // 监听队列
  loggerChannel.consume('logger', async (event) => {
    const message = JSON.parse(event.content.toString());
    await fs.appendFile(path.join(__dirname, '..', 'log','logger.txt'), JSON.stringify(message) + '\n');
  });
})();