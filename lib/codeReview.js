const db = require('./db');
const jwt = require('jsonwebtoken');
const secretKey = process.env.JWT_SECRET_KEY;

// 11. 코드리뷰 로비 입장 시 방목록 뿌려주기
exports.reviewList = function(req, res) {

    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    // jwt 토큰 검증
    jwt.verify(token, secretKey, (error, decoded) => {
        if(error) {
            return res.json({result : 'fail'});
        }
        console.log(`토큰 검증 완료, 사용자 id : ${decoded.id}`);

        // 방번호, 방제목 조회
        let sql = `SELECT review_id, room_title FROM review`;
        db.query(sql, function(error, result) {
            if(error) {
                return res.json({result : 'fail', message : '쿼리 오류'});
            }

            let reviewIds = result.map(row => row.review_id); // review_id 배열
            let queries = reviewIds.map(review_id => {
                return new Promise((resolve, reject) => {
                    let countSql = `SELECT COUNT(*) AS count FROM reviewer WHERE review_id=?`;
                    db.query(countSql, [review_id], (err, countResult) => {
                        if (err) {
                            return reject(err);
                        }
                        resolve({ review_id: review_id, count: countResult[0].count });
                    });
                });
            });

            Promise.all(queries)
            .then(countResults => {
                // 각 review_id에 대한 master 정보 조회
                let masterQueries = reviewIds.map(review_id => {
                    return new Promise((resolve, reject) => {
                        let masterSql = `SELECT bakjoon_id FROM reviewer WHERE review_id=? AND is_master=1`;
                        db.query(masterSql, [review_id], (err, masterResult) => {
                            if (err) {
                                return reject(err);
                            }
                            let masterId = masterResult.length > 0 ? masterResult[0].bakjoon_id : null;
                            resolve({ review_id: review_id, master: masterId });
                        });
                    });
                });

                Promise.all(masterQueries)
                .then(masterResults => {
                    // countResults와 masterResults를 합침
                    let finalResults = countResults.map(countResult => {
                        let masterResult = masterResults.find(m => m.review_id === countResult.review_id);
                        return {
                            review_id: countResult.review_id,
                            count: countResult.count,
                            master: masterResult ? masterResult.master : null
                        };
                    });
                    res.json({ result: 'success', reviews: finalResults });
                })
                .catch(err => {
                    res.json({ result: 'fail', message: '마스터 정보 쿼리 오류', error: err });
                });

            })
            .catch(err => {
                res.json({ result: 'fail', message: '인원 수 세기 쿼리 오류', error: err });
            });
        });
    });
};

// 13. 방 만들기 => 완성
exports.createReview = function(req, res) {

    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    // jwt 토큰 검증
    jwt.verify(token, secretKey, (error, decoded) => {
        if(error) {
            return res.json({result : 'fail'});
        }
        console.log(`토큰 검증 완료, 사용자 id : ${decoded.id}`);


        // 리뷰방 테이블에 추가
        const roomTitle = req.body.reviewTitle;
        const bojNumber = req.body.problemNo;
        const bojTier = req.body.problemTier;
        const bojTitle = req.body.problemTitle;
        const maxPerson = req.body.maxPerson;

        let sql = `INSERT INTO review (room_title, problem_no, problem_tier, problem_title, max_person) VALUES (?, ?, ?, ?, ?)`;
        db.query(sql, [roomTitle, bojNumber, bojTier, bojTitle, maxPerson], function(error, result) {
            if(error) {
                return res.json({result : 'fail', message : '쿼리 오류'});
            }

            
            // 리뷰어 테이블에 추가
            sql = `INSERT INTO reviewer (review_id, bakjoon_id, is_master) VALUES (?, ?, ?)`;
            db.query(sql, [result.insertId, decoded.id, 1], function(error2, result2) {
                if(error) {
                    return res.json({result : 'fail', message : '쿼리 오류'});
                }
                return res.json({result : 'success', message : '방 생성 완료'});
            });
        });
    });
};