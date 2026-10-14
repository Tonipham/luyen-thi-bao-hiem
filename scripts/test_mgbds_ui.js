const http = require('http');

http.get('http://localhost:8000', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Title included:', data.includes('Luyện Thi Chứng Chỉ Môi Giới Bất Động Sản'));
    console.log('Header text:', data.includes('Luyện Thi Trắc Nghiệm MGBĐS'));
    console.log('Max 400:', data.includes('max="400"'));
    console.log('No Insurance in hero:', !data.includes('Bảo hiểm Nhân thọ'));
    console.log('Footer updated:', data.includes('400 câu hỏi'));
  });
});
