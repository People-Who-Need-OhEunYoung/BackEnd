const createConnection = require('./db2');
const util = require('util');
const jwt = require('jsonwebtoken');
const secretKey = process.env.JWT_SECRET_KEY;

// jwt.verify를 Promise로 변환
const verifyToken = util.promisify(jwt.verify);

// 11. 코드리뷰 로비 입장 시 방목록 뿌려주기
exports.reviewList = async function(req, res) {
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

        // 필요한 필드 조회
        let sql = `SELECT room_id, room_title, problem_no, problem_title, problem_tier, max_people, room_owner FROM review`;

        // 검색 조건 추가
        const search = req.query.search || ''; // search 파라미터 받기, 없으면 빈 문자열
        let sqlParams = [];

        if (search) {
            sql += ` WHERE problem_title LIKE ? OR problem_no LIKE ? OR room_title LIKE ? OR room_owner LIKE ?`;
            sqlParams = [`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`];
        }

        console.log(`실행된 SQL: ${sql} with ${JSON.stringify(sqlParams)}`);

        const [reviews] = await conn.execute(sql, sqlParams);

        const reviewIds = reviews.map(row => row.room_id);

        const countQueries = reviewIds.map(async room_id => {
            let countSql = `SELECT COUNT(*) AS count FROM reviewer WHERE room_id=?`;
            const [countResult] = await conn.execute(countSql, [room_id]);
            return { room_id: room_id, count: countResult[0].count };
        });

        const countResults = await Promise.all(countQueries);

        const masterQueries = reviewIds.map(async room_id => {
            let masterSql = `SELECT bakjoon_id FROM reviewer WHERE room_id=?`;
            const [masterResult] = await conn.execute(masterSql, [room_id]);
            let masterBakjoonId = masterResult.length > 0 ? masterResult[0].bakjoon_id : null;
            return { room_id: room_id, master: masterBakjoonId };
        });

        const masterResults = await Promise.all(masterQueries);

        // countResults와 masterResults를 reviews와 합침
        const finalResults = reviews.map(review => {
            const countResult = countResults.find(c => c.room_id === review.room_id);
            const masterResult = masterResults.find(m => m.room_id === review.room_id);
            return {
                roomId: review.room_id,
                roomTitle: review.room_title,
                problemId: review.problem_no,
                problemTitle: review.problem_title,
                level: review.problem_tier,
                limit_num: review.max_people,
                cur_num: countResult ? countResult.count : 0,
                master: masterResult ? masterResult.master : null,
                roomOwner: review.room_owner
            };
        });

        // 성공 응답 반환
        return res.json({ result: 'success', reviews: finalResults });
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


// 13. 방 만들기 => 완성
exports.createReview = async function(req, res) {

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

        // 방 생성 사용자 닉네임 가져오기
        sql = `SELECT nick_name FROM user WHERE bakjoon_id=?`;`
        `
        const [result2] = await conn.execute(sql, [decoded.id]);
        const nick_name = result2[0].nick_name;

        // 리뷰어 테이블에 추가
        sql = `INSERT INTO reviewer (review_id, bakjoon_id, is_master, nickName) VALUES (?, ?, ?, ?)`;
        await conn.execute(sql, [result.insertId, decoded.id, 1, nick_name]);

        // 방제목, 문제번호, 문제티어, 문제이름, 최대인원
        // 리뷰방 테이블에 추가
        const { reviewTitle, problemNo, problemTier, problemTitle, maxPerson } = req.body;
        let sql = `INSERT INTO review (room_title, problem_no, problem_tier, problem_title, max_person) VALUES (?, ?, ?, ?, ?)`;
        const [result] = await conn.execute(sql, [reviewTitle, problemNo, problemTier, problemTitle, maxPerson]);

        // 성공 응답 반환
        return res.json({ result: 'success', message: '방 생성 완료' });
    }
    catch (error) {
        console.error(error);
        return res.json({ result: 'fail', message: '오류가 발생했습니다.', error : error });
    }
    finally {
        if (conn) {
            await conn.end(); // 연결 종료
        }
    }
};

// 35. 해결 버튼 => 완성
exports.complete = async function(req, res) {

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

        //방장 재량으로 언제든 1회만 누를 수 있다.
	    //누르면 경험치, 크레딧이 방장을 제외한 모두에게 제공된다.

        const review_id = req.body.review_id;
        const problem_tier = req.body.problem_tier;

        // 버튼을 누른 사람이 해당 방의 방장인지 확인
        let sql = `SELECT * FROM reviewer WHERE bakjoon_id=? AND review_id=? AND is_master=?`;
        const [result] = await conn.execute(sql, [decoded.id, review_id, 1]);
        if(result.length === 0) {
            return res.json({ result : 'fail', message : '방장이 아닙니다!!' });
        }

        await conn.beginTransaction();
        try {
            // 방 참여자 찾기
            sql = `SELECT bakjoon_id FROM reviewer WHERE review_id=? AND is_master=?`;
            const [reviewer] = await conn.execute(sql, [review_id, 0]);
    
            if(reviewer.length === 0) {
                return res.json({ result : 'fail', message : '참여자가 없습니다.'});
            }
    
            // 각 참여자에 대한 cur_poke_id 찾기
            let reviewer_poke_id = [];
            for(let i = 0; i < reviewer.length; i++) {
                sql = `SELECT cur_poke_id FROM user WHERE bakjoon_id=?`;
                let [result] = await conn.execute(sql, [reviewer[i].bakjoon_id]);
                let poke_id = result[0].cur_poke_id;
                reviewer_poke_id.push(poke_id);
            }
    
            // 제공할 경험치 조회
            sql = `SELECT get_exp, get_credit FROM get_exp_credit WHERE problem_tier=?`;
            const [get] = await conn.execute(sql, [problem_tier]);
            const get_exp = get[0].get_exp;
            const get_credit = get[0].get_credit;
    
            // 참여자 포켓몬 경험치 올리기
            for(let i = 0; i < reviewer_poke_id.length; i++) {
                sql = `UPDATE book SET poke_Exp=poke_Exp+? WHERE bakjoon_id=? AND poke_id=?`;
                await conn.execute(sql, [get_exp, reviewer[i].bakjoon_id, reviewer_poke_id[i]]);
            }
    
            // 참여자 경험치 올리기
            for(let i =0; i < reviewer.length; i++) {
                sql = `UPDATE user SET user_exp=user_exp+? WHERE bakjoon_id=?`;
                await conn.execute(sql, [get_exp, reviewer[i].bakjoon_id]);
            }

            await conn.commit();

            return res.json({ result : 'success', message : '참여자에게 경험치 제공 완료', user : reviewer, get_exp : get_exp});
        }
        catch(transactionError) {
            await conn.rollback();
            console.error(`트랜잭션 오류 : ${transactionError}`);
            return res.json({ result : 'fail', data : `${transactionError.message}`});
        }
    }
    catch(error) {
        return res.json({ result: 'fail', message: '오류가 발생했습니다.', error : error });
    }
    finally {
        await conn.end(); // DB 연결 종료
    }
}

// 36. 강퇴 버튼
exports.kick = async function(req, res) {

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

        const review_id = req.body.review_id;
        const kick_id = req.body.kick_id;

        // 강퇴요청자가 해당 방의 방장인지 확인
        let sql = `SELECT * FROM reviewer WHERE bakjoon_id=? AND review_id=? AND is_master=?`;
        const [result] = await conn.execute(sql, [decoded.id, review_id, 1]);
        if(result.length === 0) {
            return res.json({ result : 'fail', message : '방장이 아닙니다. 강퇴기능을 사용할 수 없습니다.'});
        }

        // 방장 자신은 강퇴할 수 없음
        if(decoded.id === kick_id) {
            return res.json({ result : 'fail', message : "자기 자신은 강퇴할 수 없습니다."});
        }

        // 강퇴하기
        sql = `DELETE FROM reviewer WHERE bakjoon_id=? AND is_master=?`;
        await conn.execute(sql, [kick_id, 0]);

        return res.json({ result : 'success', message : '사용자를 강퇴했습니다.'});

    }
    catch(error) {
        return res.json({ result : 'fail', message : '오류 발생', error : error});
    }
    finally {
        if(conn) {
            await conn.end(); // DB 연결 종료
        }
    }
}