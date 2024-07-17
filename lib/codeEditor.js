const createConnection = require('./db2');
const util = require('util');
const jwt = require('jsonwebtoken');
const secretKey = process.env.JWT_SECRET_KEY;
const { exec } = require('child_process');  // app.js가 있는 경로를 기준으로 실행된다

// jwt.verify와 exec를 Promise로 변환
const verifyToken = util.promisify(jwt.verify);
const execPromise = util.promisify(exec);

// 30. 채점 가능한 문제 보기 
exports.viewProblem = async function(req, res) {

    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.json({ result: 'fail', message: '토큰이 제공되지 않았습니다.' });
    }

    try {
        // 토큰 검증
        const decoded = await verifyToken(token, secretKey);
        console.log(`토큰 검증 완료, 사용자 id : ${decoded.id}`);

        // exec 명령어 실행
        const { stdout } = await execPromise(`ls /home/ubuntu/nodejs/pokecode/testCase`);
        
        // 성공 응답 반환
        return res.json({ result: 'success', data: stdout });
    }
    catch (error) {
        console.error(`문제 조회 에러: ${error}`);
        return res.json({ result: 'fail', data: `${error.message}` });
    }
};

// 17.1 코드 채점 => 완성
exports.runCode = async function(req, res) {

    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.json({ result: 'fail', message: '토큰이 제공되지 않았습니다.' });
    }

    try {
        // 토큰 검증
        const decoded = await verifyToken(token, secretKey);
        console.log(`토큰 검증 완료, 사용자 id : ${decoded.id}`);

        // 데이터베이스 연결
        conn = await createConnection();
        let sql;

        // 코드, 문제번호
        const code = req.body.code;
        const bojNumber = req.body.bojNumber;
        const elapsed_time = req.body.elapsed_time;
        const limit_time = req.body.limit_time;

        // 사용자 코드 저장 : 사용자id_문제번호 1234_3055
        await execPromise(`echo "${code.replace(/"/g, '\\"')}" > /tmp/${decoded.id}_${bojNumber}`);
        
        await execPromise(`chmod +x codeCompare.sh`);

        // 코드 비교 스크립트 실행
        const { stdout : codeCompare } = await execPromise(`./codeCompare.sh ${decoded.id}_${bojNumber} ${bojNumber}`);

        if(!codeCompare.includes('채점할 수 없습니다.')) {

            // 추가 테스트 케이스 ( 배열 형태 ) [{input, output}, {input, output} ...]
            const testCase = req.body.testCase;
    
            // 추가 테스트 케이스가 존재할 경우
            if(testCase) {
                if(testCase.length > 0) {
        
                    const testCaseJson = JSON.stringify(testCase);
                    const encodedTestCaseJson = encodeURIComponent(testCaseJson);
                    
                    await execPromise(`chmod +x codeCompare2.sh`);

                    // 코드 비교 스크립트 실행
                    const { stdout : codeCompare2 } = await execPromise(`./codeCompare2.sh ${decoded.id}_${bojNumber} ${encodedTestCaseJson}`);
                    
                    // 테케있음/정답 응답 반환 / 타이머, 정답여부 업데이트
                    if(codeCompare.includes('축하합니다')) {
                        sql = `SELECT success FROM resolved WHERE bakjoon_id=? AND problem_id=?`;
                        const [correct] = await conn.execute(sql, [decoded.id, bojNumber]);
                        const isCorrect = correct[0].success;

                        let get_exp = 0;
                        let get_credit = 0;

                        // 처음 푼 문제일 경우 경험치, 크레딧 지급
                        if(isCorrect === 0) {
                            await conn.beginTransaction();
    
                            try {
                                sql =`UPDATE resolved SET resolved_date=CURDATE(), elapsed_time=?, limit_time=?, success=? WHERE bakjoon_id=? AND problem_id=?`;
                                await conn.execute(sql, [elapsed_time, limit_time, 1, decoded.id, bojNumber]);
        
                                // 문제 맞을 때마다 현재 포켓몬 경험치 증가, 사용자 경험치 증가, 사용자 크레딧 증가
                                // 티어 가져오기
                                sql = `SELECT level FROM problem WHERE id=?`;
                                const [result] = await conn.execute(sql, [bojNumber]);
                                const tier = result[0].level;
        
                                // 획득할 경험치, 크레딧 가져오기
                                sql = `SELECT get_exp, get_credit FROM get_exp_credit WHERE problem_tier=?`;
                                const [result2] = await conn.execute(sql, [tier]);
                                get_exp = result2[0].get_exp;
                                get_credit = result2[0].get_credit;
        
                                // 사용자 현재 포켓몬 가져오기
                                sql = `SELECT cur_poke_id FROM user WHERE bakjoon_id=?`;
                                const [result3] = await conn.execute(sql, [decoded.id]);
                                const cur_poke_id = result3[0].cur_poke_id;
        
                                // 현재 포켓몬 경험치 증가
                                sql = `UPDATE book SET poke_Exp=poke_Exp+? WHERE bakjoon_id=? AND poke_id=?`;
                                await conn.execute(sql, [get_exp, decoded.id, cur_poke_id]);
        
                                // 사용자 경험치, 크레딧 증가
                                sql = `UPDATE user SET user_exp=user_exp+?, credit=credit+? WHERE bakjoon_id=?`
                                await conn.execute(sql, [get_exp, get_credit, decoded.id]);
    
                                await conn.commit();
        
                                return res.json({ result: 'success', message : '처음 해결한 문제입니다. 경험치, 크레딧을 지급합니다.', data: codeCompare, data2 : codeCompare2, isCorrect : 1, get_exp : get_exp, get_credit : get_credit});
                            }
                            catch(transactionError) {
                                await conn.rollback();
                                console.error(`트랜잭션 오류 : ${transactionError}`);
                                return res.json({ result : 'fail', data: `${transactionError.message}`});
                            }
                        }
                        // 이미 해결한 문제일 경우 경험치/크레딧 제공 안함
                        return res.json({ result: 'success', message : '이미 해결한 문제입니다.', data: codeCompare, data2 : codeCompare2, isCorrect : 1, get_exp : get_exp, get_credit : get_credit});
                    }
                    // 테케있음/오답 응답 반환
                    return res.json({ result: 'success', data: codeCompare, data2 : codeCompare2, isCorrect : 0});
                }
            }
        }
  
        // 테케없음/정답 응답 반환 / 타이머, 정답여부 업데이트
        if(codeCompare.includes('축하합니다')) {
            sql = `SELECT success FROM resolved WHERE bakjoon_id=? AND problem_id=?`;
            const [correct] = await conn.execute(sql, [decoded.id, bojNumber]);
            const isCorrect = correct[0].success;

            let get_exp = 0;
            let get_credit = 0;

            // 처음 해결한 문제일 경우 경험치/크레딧 제공
            if(isCorrect === 0) {
                await conn.beginTransaction();
            
                try {
                    sql =`UPDATE resolved SET resolved_date=CURDATE(), elapsed_time=?, limit_time=?, success=? WHERE bakjoon_id=? AND problem_id=?`;
                    await conn.execute(sql, [elapsed_time, limit_time, 1, decoded.id, bojNumber]);
    
                    // 문제 맞을 때마다 현재 포켓몬 경험치 증가, 사용자 경험치 증가, 사용자 크레딧 증가
                    // 티어 가져오기
                    sql = `SELECT level FROM problem WHERE id=?`;
                    const [result] = await conn.execute(sql, [bojNumber]);
                    const tier = result[0].level;
        
                    // 획득할 경험치, 크레딧 가져오기
                    sql = `SELECT get_exp, get_credit FROM get_exp_credit WHERE problem_tier=?`;
                    const [result2] = await conn.execute(sql, [tier]);
                    get_exp = result2[0].get_exp;
                    get_credit = result2[0].get_credit;
    
                    // 사용자 현재 포켓몬 가져오기
                    sql = `SELECT cur_poke_id FROM user WHERE bakjoon_id=?`;
                    const [result3] = await conn.execute(sql, [decoded.id]);
                    const cur_poke_id = result3[0].cur_poke_id;
    
                    // 현재 포켓몬 경험치 증가
                    sql = `UPDATE book SET poke_Exp=poke_Exp+? WHERE bakjoon_id=? AND poke_id=?`;
                    await conn.execute(sql, [get_exp, decoded.id, cur_poke_id]);
    
                    // 사용자 경험치, 크레딧 증가
                    sql = `UPDATE user SET user_exp=user_exp+?, credit=credit+? WHERE bakjoon_id=?`
                    await conn.execute(sql, [get_exp, get_credit, decoded.id]);
    
                    await conn.commit();
        
                    return res.json({ result: 'success', message : '처음 해결한 문제입니다. 경험치, 크레딧을 지급합니다.', data: codeCompare, isCorrect : 1, get_exp : get_exp, get_credit : get_credit });
                }
                catch(transactionError) {
                    await conn.rollback();
                    console.error(`트랜잭션 오류 : ${transactionError}`);
                    return res.json({ result: 'fail', data: `${transactionError.message}`});
                }
            }
            // 이미 해결한 문제일 경우 경험치/크레딧 제공 안함
            return res.json({ result: 'success', message : '이미 해결한 문제입니다.', data: codeCompare, isCorrect : 1, get_exp : get_exp, get_credit : get_credit });

        }
        // 테케없음/오답 응답 반환
        return res.json({ result: 'success', data: codeCompare, isCorrect : 0 });
    }
    catch (error) {
        console.error(`오류 발생: ${error}`);
        return res.json({ result: 'fail', data: `${error.message}` });
    }
    finally {
        if(conn) {
            await conn.end(); // 연결 종료
        }
    }
};


// 33. 문제 에디터 입장할 때 resolved 테이블에 데이터 추가
exports.selectOrUpdateResolvedProblem = async function(req, res) {

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

        const problem_id = req.body.problem_id;
        const problem_title = req.body.problem_title;
        const limit_time = req.body.limit_time;

        // resolved 데이터 있는지 찾기
        let sql = `SELECT elapsed_time, limit_time FROM resolved WHERE bakjoon_id=? AND problem_id=?`;
        const [result] = await conn.execute(sql, [decoded.id, problem_id]);

        // resolved 데이터가 없을 경우 추가
        if(result.length === 0) {
            
            // limit_time 존재하면 함께 추가
            if(limit_time) {
                sql = `INSERT INTO resolved (bakjoon_id, problem_id, elapsed_time, limit_time, success, problem_title) VALUES (?, ?, ?, ?, ?, ?)`;
                await conn.execute(sql, [decoded.id, problem_id, 0, limit_time, 0, problem_title]);

                return res.json({result : 'success', message : '문제에 처음 도전했습니다. resolved 테이블에 limit_time을 포함한 데이터 추가'})
            }

            // limit_time 없으면 추가 안함
            else {
                sql = `INSERT INTO resolved (bakjoon_id, problem_id, elapsed_time, success, problem_title)`;
                await conn.execute(sql, [decoded.id, problem_id, 0, 0, problem_title]);

                return res.json({result : 'success', message : '문제에 처음 도전했습니다. resolved 테이블에 데이터 추가'})
            }
        }

        // 기존 풀던 문제이지만 limit_time 설정했을 경우 update후 리턴
        if(limit_time) {
            sql = `UPDATE resolved SET limit_time=? WHERE bakjoon_id=? AND problem_id=?`;
            await conn.execute(sql, [limit_time, decoded.id, problem_id]);

            sql = `SELECT elapsed_time, limit_time FROM resolved WHERE bakjoon_id=? AND problem_id=?`;
            const [result2] = await conn.execute(sql, [decoded.id, problem_id]);

            return res.json({result : 'success', message : '기존에 풀던 문제, 제한시간 업데이트 성공', data : result2});

        }
        else {
            // resolved 데이터 있었을 경우 바로 리턴
            return res.json({result : 'success', message : '기존에 풀던 문제입니다. 데이터를 가져옵니다.', data : result});
        }
    }
    catch(error) {
        console.error(error);
        return res.json({ result: 'fail', message: '오류가 발생했습니다.', error : error });
    }
    finally {
        if(conn) {
            await conn.end(); // 연결 종료
        }
    }

}


// 34. 경과시간, 제한시간 저장하는 API
exports.setTime = async function(req, res) {

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

        // body 파싱
        const elapsed_time = req.body.elapsed_time;
        const limit_time = req.body.limit_time;
        const problem_id = req.body.problem_id;
        
        // resolved 타이머 업데이트
        const sql = `UPDATE resolved SET elapsed_time=?, limit_time=? WHERE bakjoon_id=? AND problem_id=?`;
        await conn.execute(sql, [elapsed_time, limit_time, decoded.id, problem_id]);

        return res.json({result : 'success', message : '타이머 업데이트 성공'})

    }
    catch(error) {
        return res.json({ result: 'fail', message: '오류가 발생했습니다.', error : error });
    }
    finally {
        if(conn) {
            await conn.end(); // 연결 종료
        }
    }
}
