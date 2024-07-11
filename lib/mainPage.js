const db = require('./db');
const jwt = require('jsonwebtoken');
const secretKey = process.env.JWT_SECRET_KEY;

/// 1. 헤더 데이터 ( 닉네임, 크레딧, 현재 포켓몬ID 뿌려주기 ) => 완성
exports.headerData = function(req, res) {

    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    jwt.verify(token, secretKey, (error, decoded) => {
        if(error) {
            return res.json({result : 'fail'})
        }
        console.log(`토큰 검증 완료, 사용자 id : ${decoded.id}`);

        let sql = `SELECT nick_name, cur_poke_id, credit FROM user WHERE bakjoon_id=?`;
        db.query(sql, [decoded.id], function(error, result) {
            if(error) {
                return res.json({result : 'fail'});
            }

            const row = result[0];
            return res.json({result : 'success', nickName : row.nick_name, credit : row.credit, curPokeId : row.cur_poke_id});
        });
    });
};

// 27. 메인페이지 헤더 데이터 ( 1번 헤더 데이터 + 포켓몬레벨 + 경험치 ) => 완성
exports.mainPageHeaderData = function(req, res) {

    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    // jwt 토큰 검증
    jwt.verify(token, secretKey, (error, decoded) => {
        if(error) {
            return res.json({result : 'fail'})
        }
        console.log(`토큰 검증 완료, 사용자 id : ${decoded.id}`);

        // 닉네임, 현재포켓몬id, 크레딧 조회
        let sql = `SELECT nick_name, cur_poke_id, credit FROM user WHERE bakjoon_id=?`;
        db.query(sql, [decoded.id], function(error, result) {
            if(error) {
                return res.json({result : 'fail', message : '쿼리 오류'});
            }
            const row = result[0];

            // 포켓몬 레벨, 경험치 조회
            sql = `SELECT poke_Lv, poke_Exp FROM book WHERE bakjoon_id=? AND poke_id=?`;
            db.query(sql, [decoded.id, row.cur_poke_id], function(error2, result2) {
                if(error) {
                    return res.json({result : 'fail', message : '쿼리 오류'});
                }
                const row2 = result2[0];

                return res.json({
                    result : 'success',
                    nickName : row.nick_name,
                    credit : row.credit,
                    curPokeId : row.cur_poke_id,
                    curPokeLv : row2.poke_Lv,
                    curPokeExp : row2.poke_Exp
                });
            });
        });
    });
};

// 2. 똥 치우기 버튼 => 완성
exports.clearPoo = function(req, res) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    // jwt 토큰 검증
    jwt.verify(token, secretKey, (error, decoded) => {
        if(error) {
            return res.json({result : 'fail'})
        }
        console.log(`토큰 검증 완료, 사용자 id : ${decoded.id}`);

        let sql = `UPDATE poo SET days=? WHERE bakjoon_id=?`;
        db.query(sql, [0, decoded.id], function(error, result) {
            if(error) {
                return res.json({result : 'fail'});
            }

            // 정상적으로 똥이 치워졌다면 success 리턴
            return res.json({result : 'success'});
        });
    });
};

// 25. 똥 개수 가져오기 => 완성
exports.getPoo = function(req, res) {

    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    // jwt 토큰 검증
    jwt.verify(token, secretKey, (error, decoded) => {
        if(error) {
            return res.json({result : 'fail'})
        }
        console.log(`토큰 검증 완료, 사용자 id : ${decoded.id}`);

        let sql = `SELECT days FROM poo WHERE bakjoon_id=?`;
        db.query(sql, [decoded.id], function(error, result) {
            if(error) {
                return res.json({result : 'fail'});
            }
            
            return res.json({result : 'success', poo : result[0].days})
        });
    });
};

// 6. 도감 출력 => 완성
exports.book = function(req, res) {

    const id = req.body.id;
    
    let sql = `SELECT poke_id, poke_Lv, poke_Exp FROM book WHERE bakjoon_id=?`;
    db.query(sql, [id], function(error, result) {
        if(error) {
            return res.json({result : 'fail', message : '쿼리 오류'})
        }
        
        return res.json({result : 'success', book : result});
    });
};

// 9. 뽑기 => 완성
exports.gambling = function(req, res) {

    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    // jwt 토큰 검증
    jwt.verify(token, secretKey, (error, decoded) => {
        if(error) {
            return res.json({result : 'fail'})
        }
        console.log(`토큰 검증 완료, 사용자 id : ${decoded.id}`);

        // 크레딧 부족하면 fail
        let sql = 'SELECT credit FROM user WHERE bakjoon_id=?';
        db.query(sql, [decoded.id], function(error, result) {
            if(error) {
                return res.json({result : 'fail', message : '쿼리 오류'});
            }
            if(result[0].credit < 100) {
                return res.json({result : 'fail', message : '크레딧 부족'});
            }

            // 뽑기 - 100원 차감
            sql = `UPDATE user SET credit=credit-100 WHERE bakjoon_id=?`;
            db.query(sql, [decoded.id], function(error2, result2) {
                if(error) {
                    return res.json({result : 'fail', message : '쿼리 오류'});
                }
    
                // 뽑기 - 중복 포켓몬
                const pok_id = getRandomNumber(1, 649);
                sql = `SELECT poke_id FROM book WHERE bakjoon_id=? AND poke_id=?`;
                db.query(sql, [decoded.id, pok_id], function(error3, result3) {
                    if(error) {
                        return res.json({result : 'fail', message : '쿼리 오류'});
                    }
                    if(result2.length > 0) {
                        return res.json({result : 'success', poke_id : pok_id, message : '중복 포켓몬'});
                    }
    
                    // 뽑기 - 도감에 추가
                    sql = `INSERT INTO book (bakjoon_id, poke_id, poke_Lv, poke_Exp) VALUES (?, ?, ?, ?)`;
                    db.query(sql, [decoded.id, pok_id, 1, 0], function(error4, result4) {
                        if(error) {
                            return res.json({result : 'fail', message : '쿼리 오류'});
                        }
                        
                        return res.json({result : 'success', poke_id : pok_id, message : '뽑기 및 도감 등록 성공'});
                    });
                });
            });
        });  
    });
};