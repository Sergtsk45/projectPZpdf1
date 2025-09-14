// Простой тест генерации PDF
const http = require('http');

const postData = JSON.stringify({
  templateId: '5fac67b72f7c82c9f32ee615b26d7834ccbe1ff4c16ebf600f3912d24beeb7a2',
  values: {
    dailyConsumption: 100.5,
    pumpModel: 'Тест-насос',
    projectCode: 'ТЕСТ-001',
    requiredHead: 25.5,
    flowMeter: 'Тест-счетчик'
  }
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/generate',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = http.request(options, (res) => {
  console.log(`Статус: ${res.statusCode}`);
  
  if (res.statusCode === 200) {
    const fs = require('fs');
    const writeStream = fs.createWriteStream('test-simple.pdf');
    res.pipe(writeStream);
    writeStream.on('finish', () => {
      console.log('✅ PDF создан: test-simple.pdf');
    });
  } else {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    res.on('end', () => {
      console.log('❌ Ошибка:', data);
    });
  }
});

req.on('error', (e) => {
  console.error('❌ Ошибка запроса:', e.message);
});

req.write(postData);
req.end();
