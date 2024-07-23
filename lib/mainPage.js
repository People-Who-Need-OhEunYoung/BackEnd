const createConnection = require('./db2');
const util = require('util');
const jwt = require('jsonwebtoken');
const secretKey = process.env.JWT_SECRET_KEY;

// jwt.verify를 Promise로 변환
const verifyToken = util.promisify(jwt.verify);

// 입력받은 배열에서 하나의 숫자를 선택하는 함수
function getRandomNumber(numbers) {
    const randomIndex = Math.floor(Math.random() * numbers.length);
    return numbers[randomIndex];
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

        // user 테이블 컬럼 전부, 유형별 경험치 전부 찾기
        sql = `SELECT * FROM user a 
        LEFT OUTER JOIN exp_by_type b ON a.bakjoon_id=b.bakjoon_id
        LEFT OUTER JOIN book c ON a.cur_poke_id=c.poke_id
        WHERE a.bakjoon_id=?`;
        const [result] = await conn.execute(sql, [decoded.id]);
        
        // 유저 레벨 계산
        const userLevel = Math.floor(
            (result[0].math_exp +
            result[0].impl_exp +
            result[0].dp_exp +
            result[0].data_exp +
            result[0].graph_exp) / 100);

        result[0].user_level = userLevel;
        delete result[0].bakjoon_pw;

        // 가진 포켓몬 정보 전부 찾기
        sql = `SELECT * FROM book WHERE bakjoon_id=?`;
        const [result2] = await conn.execute(sql, [decoded.id]);

        return res.json({ result : "success", message : "데이터 조회 성공", user : result, user_poketmon : result2});

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
        const userSql = `SELECT nick_name, cur_poke_id, user_exp FROM user WHERE bakjoon_id=?`;
        const [userResult] = await conn.execute(userSql, [decoded.id]);

        if (userResult.length === 0) {
            return res.json({ result: 'fail', message: '사용자 정보를 찾을 수 없습니다.' });
        }

        const userRow = userResult[0];
        
        // 레벨, 경험치 계산
        user_level = Math.floor(userRow.user_exp / 100) + 1;
        user_cur_exp = userRow.user_exp % 100;
        user_need_exp = 100 - user_cur_exp;

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
            curPokeId: userRow.cur_poke_id,
            curPokeLv: pokeRow.poke_Lv,
            curPokeExp: pokeRow.poke_Exp,
            userLevel : user_level,
            userCurExp : user_cur_exp,
            userNeedExp : user_need_exp
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

        // poketmon 테이블에 존재하는 모든 포켓몬 찾기
        let sql2 = `SELECT * FROM poketmon`;
        const [result] = await conn.execute(sql2, [decoded.id]);

        // 사용자가 가진 포켓몬 모두 찾기
        const sql = `SELECT * FROM book WHERE bakjoon_id=?`;
        const [rows] = await conn.execute(sql, [decoded.id]);

        // 조회 결과 확인
        if (rows.length === 0) {
            return res.json({ result: 'fail', message: '데이터를 찾을 수 없습니다.' });
        }

        // 정상적으로 도감 정보를 조회했다면 success 리턴
        return res.json({ result: 'success', book : rows, allPoketmon : result });
    }
    catch (error) {
        return res.json({ result: 'fail', message: '오류가 발생했습니다.', error : error });
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

// 9. 전설 포켓몬 뽑기
exports.legendGambling = async function(req, res) {

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

        const coin = req.body.coin;
        let legendId = '';

        // 사용자 코인 확인해서 적절한 뽑기 진행
        if(coin === 'math_coin') {

            // 전포를 다 가지고 있지 않다면 뽑기 진행
            let sql2 = `SELECT * FROM book WHERE bakjoon_id=? AND poke_type=? AND poke_legend_yn=?`;
            const [legend] = await conn.execute(sql2, [decoded.id, '수학', 1]);
            if(legend.length < 3) {

                // 코인 있으면 1개 소모하고 진행
                sql2 = `SELECT math_coin FROM user WHERE bakjoon_id=?`;
                const [ccoin] = await conn.execute(sql2, [decoded.id]);
                // 코인 없으면 뽑기 안됨
                if(ccoin[0].math_coin < 1) {
                    return res.json({result : 'fail', message : '코인이 부족합니다!!'});
                }

                // 뽑기
                legendId = getRandomNumber([644, 243, 145]);

                // 이미 가진 전포라면 다시 뽑기 진행
                sql2 = `SELECT * FROM book WHERE bakjoon_id=? AND poke_id=?`;
                let [already] = await conn.execute(sql2, [decoded.id, legendId]);
                while(already.length > 0) {
                    legendId = getRandomNumber([644, 243, 145]);
                    sql2 = `SELECT * FROM book WHERE bakjoon_id=? AND poke_id=?`;
                    [already] = await conn.execute(sql2, [decoded.id, legendId]);
                }
            }
            else {
                return res.json({ result : 'fail', message : '이미 해당 유형 전설의 포켓몬을 모두 가지고 있습니다.'});
            }
        }
        else if(coin === 'data_coin') {
            
            // 전포를 다 가지고 있지 않다면 뽑기 진행
            let sql2 = `SELECT * FROM book WHERE bakjoon_id=? AND poke_type=? AND poke_legend_yn=?`;
            const [legend] = await conn.execute(sql2, [decoded.id, '자료구조', 1]);
            if(legend.length < 3) {

                // 코인 있으면 1개 소모하고 진행
                sql2 = `SELECT data_coin FROM user WHERE bakjoon_id=?`;
                const [ccoin] = await conn.execute(sql2, [decoded.id]);
                // 코인 없으면 뽑기 안됨
                if(ccoin[0].data_coin < 1) {
                    return res.json({result : 'fail', message : '코인이 부족합니다!!'});
                }

                // 뽑기
                legendId = getRandomNumber([251, 492, 640]);

                // 이미 가진 전포라면 다시 뽑기 진행
                sql2 = `SELECT * FROM book WHERE bakjoon_id=? AND poke_id=?`;
                let [already] = await conn.execute(sql2, [decoded.id, legendId]);
                while(already.length > 0) {
                    legendId = getRandomNumber([251, 492, 640]);
                    sql2 = `SELECT * FROM book WHERE bakjoon_id=? AND poke_id=?`;
                    [already] = await conn.execute(sql2, [decoded.id, legendId]);
                }
            }
            else {
                return res.json({ result : 'fail', message : `이미 해당 유형 전설의 포켓몬을 모두 가지고 있습니다. `})
            }
        }
        else if(coin === 'impl_coin') {

            // 전포를 다 가지고 있지 않다면 뽑기 진행
            let sql2 = `SELECT * FROM book WHERE bakjoon_id=? AND poke_type=? AND poke_legend_yn=?`;
            const [legend] = await conn.execute(sql2, [decoded.id, '구현', 1]);
            if(legend.length < 3) {

                // 코인 있으면 1개 소모하고 진행
                sql2 = `SELECT impl_coin FROM user WHERE bakjoon_id=?`;
                const [ccoin] = await conn.execute(sql2, [decoded.id]);
                // 코인 없으면 뽑기 안됨
                if(ccoin[0].impl_coin < 1) {
                    return res.json({result : 'fail', message : '코인이 부족합니다!!'});
                }

                // 뽑기
                legendId = getRandomNumber([250, 244, 146]);

                // 이미 가진 전포라면 다시 뽑기 진행
                sql2 = `SELECT * FROM book WHERE bakjoon_id=? AND poke_id=?`;
                let [already] = await conn.execute(sql2, [decoded.id, legendId]);
                while(already.length > 0) {
                    legendId = getRandomNumber([250, 244, 146]);
                    sql2 = `SELECT * FROM book WHERE bakjoon_id=? AND poke_id=?`;
                    [already] = await conn.execute(sql2, [decoded.id, legendId]);
                }
            }
            else {
                return res.json({ result : 'fail', message : `이미 해당 유형 전설의 포켓몬을 모두 가지고 있습니다. `})
            }
        }
        else if(coin === 'graph_coin') {
            
            // 전포를 다 가지고 있지 않다면 뽑기 진행
            let sql2 = `SELECT * FROM book WHERE bakjoon_id=? AND poke_type=? AND poke_legend_yn=?`;
            const [legend] = await conn.execute(sql2, [decoded.id, '그래프', 1]);
            if(legend.length < 3) {

                // 코인 있으면 1개 소모하고 진행
                sql2 = `SELECT graph_coin FROM user WHERE bakjoon_id=?`;
                const [ccoin] = await conn.execute(sql2, [decoded.id]);
                // 코인 없으면 뽑기 안됨
                if(ccoin[0].graph_coin < 1) {
                    return res.json({result : 'fail', message : '코인이 부족합니다!!'});
                }

                // 뽑기
                legendId = getRandomNumber([245, 382, 490]);

                // 이미 가진 전포라면 다시 뽑기 진행
                sql2 = `SELECT * FROM book WHERE bakjoon_id=? AND poke_id=?`;
                let [already] = await conn.execute(sql2, [decoded.id, legendId]);
                while(already.length > 0) {
                    legendId = getRandomNumber([245, 382, 490]);
                    sql2 = `SELECT * FROM book WHERE bakjoon_id=? AND poke_id=?`;
                    [already] = await conn.execute(sql2, [decoded.id, legendId]);
                }
            }
            else {
                return res.json({ result : 'fail', message : `이미 해당 유형 전설의 포켓몬을 모두 가지고 있습니다. `})
            }
        }
        else if(coin === 'dp_coin') {

            // 전포를 다 가지고 있지 않다면 뽑기 진행
            let sql2 = `SELECT * FROM book WHERE bakjoon_id=? AND poke_type=? AND poke_legend_yn=?`;
            const [legend] = await conn.execute(sql2, [decoded.id, 'DP', 1]);
            if(legend.length < 2) {

                // 코인 있으면 1개 소모하고 진행
                sql2 = `SELECT dp_coin FROM user WHERE bakjoon_id=?`;
                const [ccoin] = await conn.execute(sql2, [decoded.id]);
                // 코인 없으면 뽑기 안됨
                if(ccoin[0].dp_coin < 1) {
                    return res.json({result : 'fail', message : '코인이 부족합니다!!'});
                }

                // 뽑기
                // legendId = getRandomNumber([151, 150, 488]); // 뮤, 뮤츠만 나오게 임시로 설정
                legendId = getRandomNumber([151, 150]);

                // 이미 가진 전포라면 다시 뽑기 진행
                sql2 = `SELECT * FROM book WHERE bakjoon_id=? AND poke_id=?`;
                let [already] = await conn.execute(sql2, [decoded.id, legendId]);
                while(already.length > 0) {
                    // legendId = getRandomNumber([151, 150, 488]);
                    legendId = getRandomNumber([151, 150]);
                    sql2 = `SELECT * FROM book WHERE bakjoon_id=? AND poke_id=?`;
                    [already] = await conn.execute(sql2, [decoded.id, legendId]);
                }
            }
            else {
                return res.json({ result : 'fail', message : `이미 해당 유형 전설의 포켓몬을 모두 가지고 있습니다. `})
            }
        }
        
        // 뽑은 전설의 포켓몬 정보 가져오기
        let sql = `SELECT * FROM poketmon WHERE idx=?`;
        const [result] = await conn.execute(sql, [legendId]);
        const leg = result[0];

        // 사용자 도감에 추가
        sql = `INSERT INTO book (bakjoon_id, poke_id, poke_title, poke_eval, poke_legend_yn, poke_type, poke_name, poke_img, poke_profile_img) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        await conn.execute(sql, [decoded.id, leg.idx, leg.poke_title, leg.poke_eval, leg.poke_legend_yn, leg.poke_type, leg.poke_name, leg.poke_img, leg.poke_profile_img]);

        // 전포 얻은 후 코인 1개 소모
        sql = `UPDATE user SET ${coin}=${coin}-? WHERE bakjoon_id=?`;
        await conn.execute(sql, [1, decoded.id]);

        // 전포 뽑기 성공 메시지
        return res.json({ result : 'success', message: '전설의 포켓몬 뽑기에 성공했습니다!!!', legendPoketmon : `${leg.poke_type} : ${leg.poke_name}`, poke_id : leg.idx});
    }
    catch(error) {
        console.error(error);
        return res.json({ result: 'fail', message: '오류가 발생했습니다.' });
    }
    finally {
        if (conn) {
            await conn.end(); // 연결 종료
        }
    }
}