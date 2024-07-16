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
        let sql = `SELECT review_id, room_title, problem_no, problem_title, problem_tier, max_person FROM review`;
        const [reviews] = await conn.execute(sql);

        const reviewIds = reviews.map(row => row.review_id);

        const countQueries = reviewIds.map(async review_id => {
            let countSql = `SELECT COUNT(*) AS count FROM reviewer WHERE review_id=?`;
            const [countResult] = await conn.execute(countSql, [review_id]);
            return { review_id: review_id, count: countResult[0].count };
        });

        const countResults = await Promise.all(countQueries);

        const masterQueries = reviewIds.map(async review_id => {
            let masterSql = `SELECT bakjoon_id FROM reviewer WHERE review_id=? AND is_master=1`;
            const [masterResult] = await conn.execute(masterSql, [review_id]);
            let masterId = masterResult.length > 0 ? masterResult[0].bakjoon_id : null;
            return { review_id: review_id, master: masterId };
        });

        const masterResults = await Promise.all(masterQueries);

        // countResults와 masterResults를 reviews와 합침
        const finalResults = reviews.map(review => {
            const countResult = countResults.find(c => c.review_id === review.review_id);
            const masterResult = masterResults.find(m => m.review_id === review.review_id);
            return {
                roomId: review.review_id,
                roomTitle: review.room_title,
                problemId: review.problem_no,
                problemTitle: review.problem_title,
                level: review.problem_tier,
                limit_num: review.max_person,
                cur_num: countResult ? countResult.count : 0,
                master: masterResult ? masterResult.master : null
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

        // 리뷰방 테이블에 추가
        const { reviewTitle, problemNo, problemTier, problemTitle, maxPerson } = req.body;
        let sql = `INSERT INTO review (room_title, problem_no, problem_tier, problem_title, max_person) VALUES (?, ?, ?, ?, ?)`;
        const [result] = await conn.execute(sql, [reviewTitle, problemNo, problemTier, problemTitle, maxPerson]);

        // 리뷰어 테이블에 추가
        sql = `INSERT INTO reviewer (review_id, bakjoon_id, is_master) VALUES (?, ?, ?)`;
        await conn.execute(sql, [result.insertId, decoded.id, 1]);

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