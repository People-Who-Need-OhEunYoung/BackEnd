const createConnection = require('./db2');
const util = require('util');
const jwt = require('jsonwebtoken');
const secretKey = process.env.JWT_SECRET_KEY;

// jwt.verify를 Promise로 변환
const verifyToken = util.promisify(jwt.verify);

// min ~ max 사이 숫자 중 하나를 랜덤으로 고르는 함수
function getRandomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// 1. 헤더 데이터 ( 닉네임, 크레딧, 현재 포켓몬ID 뿌려주기 ) => 완성
exports.headerData = async function(req, res) {

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

        // 사용자 정보 조회
        const sql = `SELECT nick_name, cur_poke_id, credit FROM user WHERE bakjoon_id=?`;
        const [result] = await conn.execute(sql, [decoded.id]);

        if (result.length === 0) {
            return res.json({ result: 'fail', message: '사용자 정보를 찾을 수 없습니다.' });
        }

        const row = result[0];
        return res.json({ result: 'success', nickName: row.nick_name, credit: row.credit, curPokeId: row.cur_poke_id });
    }
    catch (error) {
        return res.json({ result: 'fail', message: '오류가 발생했습니다.' });
    }
    finally {
        if (conn) {
            await conn.end(); // 연결 종료
        }
    }
};

// 27. 메인페이지 헤더 데이터 ( 1번 헤더 데이터 + 포켓몬레벨 + 경험치 ) => 완성
exports.mainPageHeaderData = async function(req, res) {
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

        // 닉네임, 현재 포켓몬 id, 크레딧 조회
        const userSql = `SELECT nick_name, cur_poke_id, credit FROM user WHERE bakjoon_id=?`;
        const [userResult] = await conn.execute(userSql, [decoded.id]);

        if (userResult.length === 0) {
            return res.json({ result: 'fail', message: '사용자 정보를 찾을 수 없습니다.' });
        }

        const userRow = userResult[0];

        // 포켓몬 레벨, 경험치 조회
        const pokeSql = `SELECT poke_Lv, poke_Exp FROM book WHERE bakjoon_id=? AND poke_id=?`;
        const [pokeResult] = await conn.execute(pokeSql, [decoded.id, userRow.cur_poke_id]);

        if (pokeResult.length === 0) {
            return res.json({ result: 'fail', message: '포켓몬 정보를 찾을 수 없습니다.' });
        }

        const pokeRow = pokeResult[0];

        return res.json({
            result: 'success',
            nickName: userRow.nick_name,
            credit: userRow.credit,
            curPokeId: userRow.cur_poke_id,
            curPokeLv: pokeRow.poke_Lv,
            curPokeExp: pokeRow.poke_Exp
        });
    }
    catch (error) {
        return res.json({ result: 'fail', message: '오류가 발생했습니다.' });
    }
    finally {
        if (conn) {
            await conn.end(); // 연결 종료
        }
    }
};

// 2. 똥 치우기 버튼 => 완성
exports.clearPoo = async function(req, res) {

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

        // 똥 치우기 업데이트
        const sql = `UPDATE poo SET days=? WHERE bakjoon_id=?`;
        const [result] = await conn.execute(sql, [0, decoded.id]);

        // 업데이트가 정상적으로 이루어졌는지 확인
        if (result.affectedRows === 0) {
            return res.json({ result: 'fail', message: '업데이트 실패' });
        }

        // 정상적으로 똥이 치워졌다면 success 리턴
        return res.json({ result: 'success' });
    }
    catch (error) {
        return res.json({ result: 'fail', message: '오류가 발생했습니다.' });
    }
    finally {
        if (conn) {
            await conn.end(); // 연결 종료
        }
    }
};

// 25. 똥 개수 가져오기 => 완성
exports.getPoo = async function(req, res) {
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

        // 똥 정보 조회
        const sql = `SELECT days FROM poo WHERE bakjoon_id=?`;
        const [rows] = await conn.execute(sql, [decoded.id]);

        // 조회 결과 확인
        if (rows.length === 0) {
            return res.json({ result: 'fail', message: '데이터를 찾을 수 없습니다.' });
        }

        // 정상적으로 똥 정보를 조회했다면 success 리턴
        return res.json({ result: 'success', poo: rows[0].days });
    }
    catch (error) {
        return res.json({ result: 'fail', message: '오류가 발생했습니다.' });
    }
    finally {
        if (conn) {
            await conn.end(); // 연결 종료
        }
    }
};

// 6. 도감 출력 => 완성
exports.book = async function(req, res) {

    const id = req.body.id;

    let conn;
    try {
        // 데이터베이스 연결
        conn = await createConnection();

        // 도감 정보 조회
        const sql = `SELECT poke_id, poke_Lv, poke_Exp FROM book WHERE bakjoon_id=?`;
        const [rows] = await conn.execute(sql, [id]);

        // 조회 결과 확인
        if (rows.length === 0) {
            return res.json({ result: 'fail', message: '데이터를 찾을 수 없습니다.' });
        }

        // 정상적으로 도감 정보를 조회했다면 success 리턴
        return res.json({ result: 'success', book: rows });
    }
    catch (error) {
        return res.json({ result: 'fail', message: '오류가 발생했습니다.' });
    }
    finally {
        if (conn) {
            await conn.end(); // 연결 종료
        }
    }
};

// 9. 뽑기 => 완성
exports.gambling = async function(req, res) {

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

        // 사용자 크레딧 확인
        let sql = 'SELECT credit FROM user WHERE bakjoon_id=?';
        const [creditRows] = await conn.execute(sql, [decoded.id]);

        if (creditRows.length === 0 || creditRows[0].credit < 100) {
            return res.json({ result: 'fail', message: '크레딧 부족' });
        }

        // 크레딧 차감
        sql = `UPDATE user SET credit=credit-100 WHERE bakjoon_id=?`;
        await conn.execute(sql, [decoded.id]);

        // 포켓몬 뽑기
        // const pok_id = getRandomNumber(1, 649);
        const pok_id = req.body.pok_id;
        sql = `SELECT poke_id FROM book WHERE bakjoon_id=? AND poke_id=?`;
        const [pokeRows] = await conn.execute(sql, [decoded.id, pok_id]);

        if (pokeRows.length > 0) {
            return res.json({ result: 'success', poke_id: pok_id, message: '중복 포켓몬' });
        }

        // 도감에 포켓몬 추가
        sql = `INSERT INTO book (bakjoon_id, poke_id, poke_Lv, poke_Exp) VALUES (?, ?, ?, ?)`;
        await conn.execute(sql, [decoded.id, pok_id, 1, 0]);

        return res.json({ result: 'success', poke_id: pok_id, message: '뽑기 및 도감 등록 성공' });
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