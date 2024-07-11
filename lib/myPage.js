const db = require('./db');
const jwt = require('jsonwebtoken');
const secretKey = process.env.JWT_SECRET_KEY;

// 5. 마이페이지 입장 시 데이터 뿌려주기 => 완성
exports.myPage = function(req, res) {

    // 토큰 검증 및 id얻기
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    jwt.verify(token, secretKey, (error, decoded) => {
        if(error) {
            return res.json({result : 'fail'})
        }
        console.log(`토큰 검증 완료, 사용자 id : ${decoded.id}`);
        
        // 닉네임, 크레딧, 포켓몬ID 조회
        let sql = `SELECT nick_name, credit, cur_poke_id FROM user WHERE bakjoon_id=?`;
        db.query(sql, [decoded.id], function(error, result) {
            if(error) {
                return res.json({result : 'fail', message : '쿼리 오류'})
            }
            const row = result[0];
            
            // 푼 문제 수 조회
            sql = `SELECT COUNT(*) FROM resolved WHERE bakjoon_id=?`;
            db.query(sql, [decoded.id], function(error2, result2) {
                if(error) {
                    return res.json({result : 'fail', message : '쿼리 오류'})
                }
                let count = result2[0].count;

                // 조회된 행이 없을 경우 0을 리턴
                if(count === undefined) {
                    count = 0;
                }
                // 결과 리턴
                return res.json({
                    result : 'success',
                    nickName : row.nick_name,
                    credit : row.credit,
                    curPokeId : row.cur_poke_id,
                    resolvedCount : count});
            });
        });
    });
};

// 7. 현재 포켓몬 변경 => 완성
exports.changeMonster = function(req, res) {

    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    // jwt 토큰 검증
    jwt.verify(token, secretKey, (error, decoded) => {
        if(error) {
            return res.json({result : 'fail'})
        }
        console.log(`토큰 검증 완료, 사용자 id : ${decoded.id}`);

        // 선택된 포켓몬을 소유하고 있는지 확인
        let pok_id = req.body.pok_id;
        let sql = `SELECT * FROM book WHERE bakjoon_id=? AND poke_id=?`;
        db.query(sql, [decoded.id, pok_id], function(error, result) {
            if(error) {
                return res.json({result : 'fail', message : '쿼리 오류'})
            }
            if(result.length === 0) {
                return res.json({result : 'fail', message : '소유하지 않은 포켓몬'});
            }

            // 포켓몬 변경
            sql = `UPDATE user SET cur_poke_id=? WHERE bakjoon_id=?`;
            db.query(sql, [pok_id, decoded.id], function(error2, result2) {
                if(error) {
                    return res.json({result : 'fail', message : '쿼리 오류'})
                }
                return res.json({result : 'success', message : '포켓몬 변경 완료'});
            });
        });
    });
};

// 8. 닉네임 수정 => 완성
exports.changeNickName = function(req, res) {

    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    // jwt 토큰 검증
    jwt.verify(token, secretKey, (error, decoded) => {
        if(error) {
            return res.json({result : 'fail'})
        }
        console.log(`토큰 검증 완료, 사용자 id : ${decoded.id}`);

        // 닉네임 수정
        const nickName = req.body.nickName;
        let sql = `UPDATE user SET nick_name=? WHERE bakjoon_id=?`;
        db.query(sql, [nickName, decoded.id], function(error, result) {
            if(error) {
                return res.json({result : 'fail', message : '쿼리 오류'})
            }

            return res.json({result : 'success', message : '닉네임 수정 완료'});
        });
    });
};