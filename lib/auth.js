const jwt = require('jsonwebtoken');
const util = require('util');
const secretKey = process.env.JWT_SECRET_KEY;

const verifyToken = util.promisify(jwt.verify);

const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ result: 'fail', message: '토큰이 제공되지 않았습니다.' });
    }

    try {
        const decoded = await verifyToken(token, secretKey);
        req.user = decoded;
        console.log(`토큰 검증 완료, 사용자 id : ${decoded.id}`);
        next();
    } catch (error) {
        return res.status(403).json({ result: 'fail', message: '유효하지 않은 토큰입니다.' });
    }
};

module.exports = authenticateToken;