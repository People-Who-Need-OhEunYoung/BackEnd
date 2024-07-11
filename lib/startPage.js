const db = require('./db');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const secretKey = process.env.JWT_SECRET_KEY;

// 0. 로그인 => 완성
exports.login = function(req, res) {

    const id = req.body.id;
    const pw = req.body.pw;

    // SHA256 해시
    const hashPw = crypto.createHash('sha256').update(pw).digest('hex');

    let sql = `SELECT * FROM user WHERE bakjoon_id=? AND bakjoon_pw=?`;
    db.query(sql, [id, hashPw], function(error, result) {
        if(error) {
            return res.json({result : 'fail'});
        }
        // DB에 id, pw에 해당하는 계정이 있으면 success 리턴 
        if(result.length !== 0) {

            // 토큰 생성
            token = jwt.sign({
                type: 'JWT',
                id: id
            }, secretKey, {            // secret key : 1234
                expiresIn: '24h', // 만료시간 30분
                issuer: 'ysk'
            });

            // 마지막 접속일 업데이트
            sql = `UPDATE user SET last_login=CURDATE() WHERE bakjoon_id=?`
            db.query(sql, [id], function(error, result) {
                if(error) {
                    return res.json({result : 'fail', message : '쿼리 오류'});
                }
            });

            // 로그인, 토큰발급, 접속일 업데이트 성공 시 success 리턴
            res.json({ result : 'success', id: id, token: token});
        }
        else {
            res.json({result : 'fail', message : 'ID 또는 PW가 틀렸습니다.'});
        }    
    });
};

// 4. 회원가입 ( 사용자, 똥, 도감 테이블 추가 ) => 완성
exports.signUp = function(req, res) {

    const id = req.body.id;
    const pw = req.body.pw;
    const nickName = req.body.nickName;

    // id 중복검사
    let sql = `SELECT * FROM user WHERE bakjoon_id=?`;
    db.query(sql, [id], function(error, result) {
        if(error) {
            return res.json({result : 'fail', message : '쿼리 오류'});
            
        }
        if(result.length > 0) {
            return res.json({result : 'fail', message : '중복된 ID입니다.'});
        }

        // 회원가입 - 사용자 테이블에 추가
        const hashPw = crypto.createHash('sha256').update(pw).digest('hex');
        const pok_id = getRandomNumber(1, 649);
        sql = `INSERT INTO user (bakjoon_id, bakjoon_pw, nick_name, cur_poke_id, credit) VALUES (
        ?, ?, ?, ?, ?
        )`;
        db.query(sql, [id, hashPw, nickName, pok_id, 100], function(error, result) {
            if(error) {
                return res.json({result : 'fail', message : '쿼리 오류'});
            }
            
            // 회원가입 - 똥 테이블에 추가
            sql = `INSERT INTO poo (bakjoon_id, days) VALUES (?, ?)`;
            db.query(sql, [id, 0], function(error2, result2) {
                if(error) {
                    return res.json({result : 'fail', message : '쿼리 오류'});
                }
    
                // 회원가입 - 도감 테이블에 추가
                sql = `INSERT INTO book (bakjoon_id, poke_id, poke_Lv, poke_Exp) VALUES (?, ?, ?, ?)`;
                db.query(sql, [id, pok_id, 1, 0], function(error3, result3) {
                    if(error) {
                        return res.json({result : 'fail', message : '쿼리 오류'});
                    }
    
                    return res.json({result : 'success', message : '회원가입 성공'});
                });
            });
        });
    });
};


// 24. 토큰 검증
exports.tokenTest = function(req, res) {

    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    // jwt 토큰 검증
    jwt.verify(token, secretKey, (error, decoded) => {
        if(error) {
            return res.json({result : 'fail'})
        }
        console.log(`토큰 검증 완료, 사용자 id : ${decoded.id}`);
        res.json({result : 'success', id : decoded.id});
    });
};

// 26. 닉네임 중복검사 => 완성
exports.checkNickName = function(req, res) {

    const nickName = req.body.nickName;

    // 닉네임 중복검사
    let sql = `SELECT * FROM user WHERE nick_name=?`;
    db.query(sql, [nickName], function(error, result) {
        if(error) {
            return res.json({result : 'fail', message : '쿼리 오류'});
        }
        if(result.length > 0) {
            return res.json({result : 'fail', message : '중복된 닉네임입니다.'});
        }
        else {
            return res.json({result : 'success', message : '사용 가능한 닉네임입니다.'});
        }
    });
};