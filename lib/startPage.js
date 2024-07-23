const createConnection = require('./db2');
const util = require('util');

const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const secretKey = process.env.JWT_SECRET_KEY;

// jwt.verify를 Promise로 변환
const verifyToken = util.promisify(jwt.verify);

// 0. 로그인 => 완성
exports.login = async function(req, res) {

    const id = req.body.id;
    const pw = req.body.pw;

    // SHA256 해시
    const hashPw = crypto.createHash('sha256').update(pw).digest('hex');
    let conn;

    try {
        // 데이터베이스 연결
        conn = await createConnection();

        // 사용자 조회
        let sql = `SELECT * FROM user WHERE bakjoon_id=? AND bakjoon_pw=?`;
        const [result] = await conn.execute(sql, [id, hashPw]);

        // DB에 id, pw에 해당하는 계정이 있으면 success 리턴
        if (result.length !== 0) {
            // 토큰 생성
            const token = jwt.sign({
                type: 'JWT',
                id: id
            }, secretKey, {
                expiresIn: '315360000s', // 만료시간 10년
                issuer: 'ysk'
            });

            // 마지막 접속일 업데이트
            sql = `UPDATE user SET last_login=CURDATE() WHERE bakjoon_id=?`;
            await conn.execute(sql, [id]);

            // 로그인, 토큰발급, 접속일 업데이트 성공 시 success 리턴
            res.json({ result: 'success', id: id, token: token });
        }
        else {
            res.json({ result: 'fail', message: 'ID 또는 PW가 틀렸습니다.' });
        }
    }
    catch (error) {
        res.json({ result: 'fail', message: '쿼리 오류' });
    }
    finally {
        if (conn) {
            await conn.end(); // 연결 종료
        }
    }
};

// 4. 회원가입 ( 사용자, 똥, 도감 테이블 추가 ) => 완성
exports.signUp = async function(req, res) {
    
    const id = req.body.id;
    const pw = req.body.pw;
    const nickName = req.body.nickName;

    let conn;
    try {
        // 데이터베이스 연결
        conn = await createConnection();

        // id 중복검사
        let sql = `SELECT * FROM user WHERE bakjoon_id=?`;
        const [result] = await conn.execute(sql, [id]);

        if (result.length > 0) {
            return res.json({ result: 'fail', message: '중복된 ID입니다.' });
        }

        // 회원가입 - 사용자 테이블에 추가
        const hashPw = crypto.createHash('sha256').update(pw).digest('hex');
        sql = `INSERT INTO user (bakjoon_id, bakjoon_pw, nick_name, user_exp) VALUES (?, ?, ?, ?)`;
        await conn.execute(sql, [id, hashPw, nickName, 0]);

        // 회원가입 - 똥 테이블에 추가
        sql = `INSERT INTO poo (bakjoon_id, days) VALUES (?, ?)`;
        const [pooResult] = await conn.execute(sql, [id, 0]);
        if (pooResult.affectedRows === 1) {
            console.log('poo 테이블에 성공적으로 추가되었습니다.');
        }

        // 유형별 경험치 추가, 0으로 세팅
        sql = `INSERT INTO exp_by_type (bakjoon_id, math_exp, impl_exp, dp_exp, data_exp, graph_exp)
        VALUES (?, ?, ?, ?, ?, ?)`;
        await conn.execute(sql, [id, 0, 0, 0, 0, 0]);

        // 스타팅 포켓몬 5마리 세팅
        sql = `SELECT * FROM poketmon WHERE idx IN (1, 172, 7, 4, 280);`
        const [starting_poketmon] = await conn.execute(sql);
        if (starting_poketmon.length === 5) {
            console.log('스타팅 포켓몬 5마리가 성공적으로 선택되었습니다.');
        }
 
        // 회원가입 - book Table에 5마리 스타팅 포켓몬 저장. poke_id = idx
        sql = `INSERT INTO book (bakjoon_id, poke_id, poke_title, poke_eval, poke_legend_yn, poke_type, poke_name, poke_img, poke_profile_img) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        for (const poketmon of starting_poketmon) {
            const poke_id = poketmon.idx;
            const poke_title = poketmon.poke_title;
            const poke_eval = poketmon.poke_eval;
            const poke_legend_yn = poketmon.poke_legend_yn;
            const poke_type = poketmon.poke_type;
            const poke_name = poketmon.poke_name;
            const poke_img = poketmon.poke_img;
            const poke_profile_img = poketmon.poke_profile_img;
            
            await conn.execute(sql, [id, poke_id, poke_title, poke_eval, poke_legend_yn, poke_type, poke_name, poke_img, poke_profile_img]);
        }
    
        return res.json({ result: 'success', message: '회원가입 성공' });
    }
    catch (error) {
        return res.json({ result: 'fail', message: '쿼리 오류', error : error });
    }
    finally {
        if (conn) {
            await conn.end(); // 연결 종료
        }
    }
};


// 24. 토큰 검증 => 완성
exports.tokenTest = async function(req, res) {

    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.json({ result: 'fail', message: '토큰이 제공되지 않았습니다.' });
    }

    try {
        // jwt 토큰 검증
        const decoded = await verifyToken(token, secretKey);
        console.log(`토큰 검증 완료, 사용자 id : ${decoded.id}`);
        res.json({ result: 'success', id: decoded.id });
    }
    catch (error) {
        return res.json({ result: 'fail', message: '토큰 검증 실패' });
    }
};

// 26. 닉네임 중복검사 => 완성
exports.checkNickName = async function(req, res) {

    const nickName = req.body.nickName;
    let conn;

    try {
        // 데이터베이스 연결
        conn = await createConnection();

        // 닉네임 중복검사
        const sql = `SELECT * FROM user WHERE nick_name=?`;
        const [result] = await conn.execute(sql, [nickName]);

        if (result.length > 0) {
            return res.json({ result: 'fail', message: '중복된 닉네임입니다.' });
        } else {
            return res.json({ result: 'success', message: '사용 가능한 닉네임입니다.' });
        }
    }
    catch (error) {
        return res.json({ result: 'fail', message: '쿼리 오류' });
    }
    finally {
        if (conn) {
            await conn.end(); // 연결 종료
        }
    }
};