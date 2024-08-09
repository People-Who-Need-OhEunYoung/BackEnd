const mysql = require('mysql2/promise');

// 환경 변수에서 데이터베이스 설정 가져오기
const db = {
    host: process.env.DB_HOST,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
};

// 데이터베이스 연결 함수
async function createConnection() {
    const conn = await mysql.createConnection(db);
    return conn;
}

module.exports = createConnection;