const createConnection = require('./db2');
const util = require('util');
const jwt = require('jsonwebtoken');
const secretKey = process.env.JWT_SECRET_KEY;

// jwt.verify를 Promise로 변환
const verifyToken = util.promisify(jwt.verify);

// 5. 마이페이지 입장 시 데이터 뿌려주기 => 완성
exports.myPage = async function(req, res) {

    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.json({ result: 'fail', message: '토큰이 제공되지 않았습니다.' });
    }

    let conn;
    try {
        // 토큰 검증
        const decoded = await verifyToken(token, secretKey);
        console.log(`토큰 검증 완료, 사용자 id : ${decoded.id}`);

        // 데이터베이스 연결
        conn = await createConnection();

        // 사용자 닉네임, 크레딧, 현재 포켓몬 ID 조회
        let sql = `SELECT nick_name, credit, cur_poke_id FROM user WHERE bakjoon_id=?`;
        const [userRows] = await conn.execute(sql, [decoded.id]);

        if (userRows.length === 0) {
            return res.json({ result: 'fail', message: '사용자를 찾을 수 없습니다.' });
        }

        const user = userRows[0];

        // 푼 문제 수 조회
        sql = `SELECT COUNT(*) as count FROM resolved WHERE bakjoon_id=?`;
        const [resolvedRows] = await conn.execute(sql, [decoded.id]);

        const resolvedCount = resolvedRows[0].count || 0;

        // 결과 리턴
        return res.json({
            result: 'success',
            nickName: user.nick_name,
            credit: user.credit,
            curPokeId: user.cur_poke_id,
            resolvedCount: resolvedCount
        });
    }
    catch (error) {
        console.error(error);
        return res.json({ result: 'fail', message: '오류가 발생했습니다.' });
    }
    finally {
        if (conn) {
            await conn.end(); // 연결 종료
        }
    }
};


// 7. 현재 포켓몬 변경 => 완성
exports.changeMonster = async function(req, res) {

    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.json({ result: 'fail', message: '토큰이 제공되지 않았습니다.' });
    }

    let conn;
    try {
        // 토큰 검증
        const decoded = await verifyToken(token, secretKey);
        console.log(`토큰 검증 완료, 사용자 id : ${decoded.id}`);

        // 선택된 포켓몬 ID
        const pok_id = req.body.pok_id;

        // 데이터베이스 연결
        conn = await createConnection();

        // 선택된 포켓몬을 소유하고 있는지 확인
        let sql = `SELECT * FROM book WHERE bakjoon_id=? AND poke_id=?`;
        const [bookRows] = await conn.execute(sql, [decoded.id, pok_id]);

        if (bookRows.length === 0) {
            return res.json({ result: 'fail', message: '소유하지 않은 포켓몬' });
        }

        // 포켓몬 변경
        sql = `UPDATE user SET cur_poke_id=? WHERE bakjoon_id=?`;
        await conn.execute(sql, [pok_id, decoded.id]);

        // 성공 응답 반환
        return res.json({ result: 'success', message: '포켓몬 변경 완료' });
    }
    catch (error) {
        console.error(error);
        return res.json({ result: 'fail', message: '오류가 발생했습니다.' });
    }
    finally {
        if (conn) {
            await conn.end(); // 연결 종료
        }
    }
};


// 8. 닉네임 수정 => 완성
exports.changeNickName = async function(req, res) {

    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.json({ result: 'fail', message: '토큰이 제공되지 않았습니다.' });
    }

    let conn;
    try {
        // 토큰 검증
        const decoded = await verifyToken(token, secretKey);
        console.log(`토큰 검증 완료, 사용자 id : ${decoded.id}`);

        // 닉네임 수정
        const nickName = req.body.nickName;

        // 데이터베이스 연결
        conn = await createConnection();

        let sql = `UPDATE user SET nick_name=? WHERE bakjoon_id=?`;
        await conn.execute(sql, [nickName, decoded.id]);

        // 성공 응답 반환
        return res.json({ result: 'success', message: '닉네임 수정 완료' });
    }
    catch (error) {
        console.error(error);
        return res.json({ result: 'fail', message: '오류가 발생했습니다.' });
    }
    finally {
        if (conn) {
            await conn.end(); // 연결 종료
        }
    }
};