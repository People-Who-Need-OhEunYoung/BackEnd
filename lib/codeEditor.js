const createConnection = require('./db2');
const util = require('util');
const jwt = require('jsonwebtoken');
const secretKey = process.env.JWT_SECRET_KEY;
const { exec } = require('child_process');  // app.js가 있는 경로를 기준으로 실행된다

// jwt.verify와 exec를 Promise로 변환
const verifyToken = util.promisify(jwt.verify);
const execPromise = util.promisify(exec);


// 유형이 1개일 때 진화여부 체크
// math_exp, 오르기전 경험치, 오른후 경험치
// parts : ['수학']
async function evolution1(decodedId, leg1, leg2, parts, conn) {

    try {
        let evolvedPokemons = [];
        
        // 진화 시 row 리턴하면 될 것 같다.
        // 1 -> 2 진화 검사
        if(leg1 < 3000) {
            if(leg2 >= 3000) {
    
                // 진화할 포켓몬 정보 가져오기
                let sql = `SELECT * FROM poketmon WHERE poke_type=? AND poke_eval=?`;
                const [result] = await conn.execute(sql, [parts[0], 2]);
                const row = result[0];
    
                // 진화한 포켓몬 book에 넣기
                sql = `INSERT INTO book (bakjoon_id, poke_id, poke_title, poke_eval, poke_legend_yn, poke_type, poke_name, poke_img, poke_profile_img) values (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
                await conn.execute(sql, [decodedId, row.idx, row.poke_title, row.poke_eval, row.poke_legend_yn, row.poke_type, row.poke_name, row.poke_img, row.poke_profile_img]);
                
                // 진화된 포켓몬 정보 추가
                evolvedPokemons.push(row);
            }   
        }
        // 2 -> 3 진화 검사
        else if(leg1 < 6000) {
            if(leg2 >= 6000) {
    
                // 진화할 포켓몬 정보 가져오기
                let sql = `SELECT * FROM poketmon WHERE poke_type=? AND poke_eval=?`;
                const [result] = await conn.execute(sql, [parts[0], 3]);
                const row = result[0];
    
                // 진화한 포켓몬 book에 넣기
                sql = `INSERT INTO book (bakjoon_id, poke_id, poke_title, poke_eval, poke_legend_yn, poke_type, poke_name, poke_img, poke_profile_img) values (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
                await conn.execute(sql, [decodedId, row.idx, row.poke_title, row.poke_eval, row.poke_legend_yn, row.poke_type, row.poke_name, row.poke_img, row.poke_profile_img]);
    
                // 진화된 포켓몬 정보 추가
                evolvedPokemons.push(row);
            }   
        }
        // 진화된 포켓몬이 있다면 리턴, 없다면 false 리턴
        return evolvedPokemons.length > 0 ? evolvedPokemons : false;
    }
    catch(error) {
        console.error('evolution1 error :', error);
        return false;
    }
}

// 유형이 2개일 때 진화여부 체크
// 오르기전 경험치, 오른후 경험치
//parts : ['수학', '구현']
async function evolution2(decodedId, leg1, leg2, leg11, leg22, parts, conn) {
    
    try {
        let evolvedPokemons = [];
    
        // 진화 시 row 리턴하면 될 것 같다.
        // 1 -> 2 진화 검사 : 유형1
        if(leg1 < 3000) {
            if(leg2 >= 3000) {
                
                // 진화할 포켓몬 정보 가져오기
                let sql = `SELECT * FROM poketmon WHERE poke_type=? AND poke_eval=?`;
                const [result] = await conn.execute(sql, [parts[0], 2]);
                const row = result[0];
    
                // 진화한 포켓몬 book에 넣기
                sql = `INSERT INTO book (bakjoon_id, poke_id, poke_title, poke_eval, poke_legend_yn, poke_type, poke_name, poke_img, poke_profile_img) values (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
                await conn.execute(sql, [decodedId, row.idx, row.poke_title, row.poke_eval, row.poke_legend_yn, row.poke_type, row.poke_name, row.poke_img, row.poke_profile_img]);
    
                // 진화된 포켓몬 정보 추가
                evolvedPokemons.push(row);
            }   
        }
        // 2 -> 3 진화 검사
        else if(leg1 < 6000) {
            if(leg2 >= 6000) {
                
                // 진화할 포켓몬 정보 가져오기
                let sql = `SELECT * FROM poketmon WHERE poke_type=? AND poke_eval=?`;
                const [result] = await conn.execute(sql, [parts[0], 3]);
                const row = result[0];
    
                // 진화한 포켓몬 book에 넣기
                sql = `INSERT INTO book (bakjoon_id, poke_id, poke_title, poke_eval, poke_legend_yn, poke_type, poke_name, poke_img, poke_profile_img) values (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
                await conn.execute(sql, [decodedId, row.idx, row.poke_title, row.poke_eval, row.poke_legend_yn, row.poke_type, row.poke_name, row.poke_img, row.poke_profile_img]);
    
                // 진화된 포켓몬 정보 추가
                evolvedPokemons.push(row);
            }   
        }
    
        // 1 -> 2 진화 검사 : 유형2
        if(leg11 < 3000) {
            if(leg22 >= 3000) {
                
                // 진화할 포켓몬 정보 가져오기
                let sql = `SELECT * FROM poketmon WHERE poke_type=? AND poke_eval=?`;
                const [result] = await conn.execute(sql, [parts[1], 2]);
                const row2 = result[0];
    
                // 진화한 포켓몬 book에 넣기
                sql = `INSERT INTO book (bakjoon_id, poke_id, poke_title, poke_eval, poke_legend_yn, poke_type, poke_name, poke_img, poke_profile_img) values (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
                await conn.execute(sql, [decodedId, row2.idx, row2.poke_title, row2.poke_eval, row2.poke_legend_yn, row2.poke_type, row2.poke_name, row2.poke_img, row2.poke_profile_img]);
    
                // 진화된 포켓몬 정보 추가
                evolvedPokemons.push(row2);
            }   
        }
        // 2 -> 3 진화 검사
        else if(leg11 < 6000) {
            if(leg22 >= 6000) {
    
                // 진화할 포켓몬 정보 가져오기
                let sql = `SELECT * FROM poketmon WHERE poke_type=? AND poke_eval=?`;
                const [result] = await conn.execute(sql, [parts[1], 3]);
                const row2 = result[0];
    
                // 진화한 포켓몬 book에 넣기
                sql = `INSERT INTO book (bakjoon_id, poke_id, poke_title, poke_eval, poke_legend_yn, poke_type, poke_name, poke_img, poke_profile_img) values (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
                await conn.execute(sql, [decodedId, row2.idx, row2.poke_title, row2.poke_eval, row2.poke_legend_yn, row2.poke_type, row2.poke_name, row2.poke_img, row2.poke_profile_img]);
    
                // 진화된 포켓몬 정보 추가
                evolvedPokemons.push(row2);
            }   
        }
        // 진화했다면 진화한 포켓몬 리턴, 안했다면 false 리턴
        return evolvedPokemons.length > 0 ? evolvedPokemons : false;
    }
    catch(error) {
        console.error('evolution1 error:', error);
        return false;
    }
}



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
        
        // 유형 2개짜리 문제인지 확인하는 플래그 ( 1이면 2개 )
        let flag = 0;
        let evolutionflag = "";
        let evo = null;
        
        // 코드, 문제번호
        const code = req.body.code;
        const bojNumber = req.body.bojNumber;
        const elapsed_time = req.body.elapsed_time;
        const limit_time = req.body.limit_time;
        const correct1 = req.body.correct; // 정답여부, true OR false
        
        // 코인지급용 컬럼 매핑정보
        const typeMapping = {
            math_exp: 'math_coin',
            impl_exp: 'impl_coin',
            dp_exp: 'dp_coin',
            data_exp: 'data_coin',
            graph_exp: 'graph_coin'
        };

        // 전포 획득 알림용 변수
        let getLegend1 = '';
        let getLegend2 = '';


        // 정답일 경우
        if(correct1) {
            // 처음 풀었는지 확인
            sql = `SELECT success FROM resolved WHERE bakjoon_id=? AND problem_id=?`;
            const [correct] = await conn.execute(sql, [decoded.id, bojNumber]);
            const isCorrect = correct[0].success;
            
            let get_exp = 0;

            // 처음 푼 문제일 경우 경험치, 크레딧 지급
            if(isCorrect === 0) {
                await conn.beginTransaction();

                try {
                    
                    // 문제 맞을 때마다 현재 포켓몬 경험치 증가, 사용자 경험치 증가, 사용자 크레딧 증가
                    // 티어, 유형 가져오기
                    sql = `SELECT level, type FROM problem WHERE id=?`;
                    const [result] = await conn.execute(sql, [bojNumber]);
                    const tier = result[0].level;
                    const type = result[0].type;

                    // 알고리즘 유형을 컬럼명으로 치환
                    const keyword = {
                        "구현": "impl_exp",
                        "수학": "math_exp",
                        "DP": "dp_exp",
                        "자료구조": "data_exp",
                        "그래프": "graph_exp"
                    };

                    const parts = type.split(',');
                    const variables = parts.map(part => keyword[part]);
                    const type1 = variables[0];
                    const type2 = variables[1] || '';

                    
                    // 획득할 경험치 가져오기
                    sql = `SELECT get_exp FROM get_exp_credit WHERE problem_tier=?`;
                    const [result2] = await conn.execute(sql, [tier]);
                    get_exp = result2[0].get_exp;

                    // 풀었으니 resolved 테이블 업데이트
                    sql =`UPDATE resolved SET resolved_date=CURDATE(), elapsed_time=?, limit_time=?, success=?, get_Exp=?, problem_type=? WHERE bakjoon_id=? AND problem_id=?`;
                    await conn.execute(sql, [elapsed_time, limit_time, 1, get_exp, type, decoded.id, bojNumber]);
                    
                    
                    // 유형에 맞는 경험치 증가, 유형 2개면 분산해서 증가
                    if(type2 === '') {

                        // 오르기 전 경험치 확인
                        sql = `SELECT ${type1} FROM exp_by_type WHERE bakjoon_id=?`;
                        const [legend1] = await conn.execute(sql, [decoded.id]);
                        const leg1 = legend1[0][type1]; // 해당타입 경험치

                        sql = `UPDATE exp_by_type SET ${type1}=${type1}+? WHERE bakjoon_id=?`;
                        await conn.execute(sql, [get_exp, decoded.id]);

                        // 오른 후 경험치 확인
                        sql = `SELECT ${type1} FROM exp_by_type WHERE bakjoon_id=?`;
                        const [legend2] = await conn.execute(sql, [decoded.id]);
                        const leg2 = legend2[0][type1]; // 해당타입 경험치

                        const coinType = typeMapping[type1]


                        // 진화했을 경우, poketmon 테이블에서 진화한 포켓몬 정보 리턴
                        // 아니면 false 리턴
                        
                        evo = await evolution1(decoded.id, leg1, leg2, parts, conn);
                        if(evo) {
                            evolutionflag = '1'  // 한개만 진화했다

                        }
                        

                        // 진화하지 않았을 경우 전포 획득 여부 확인
                        else {
                            
                            // 레벨 100 첫 달성 시 전설의 포켓몬 지급
                            if(leg1 < 10000) {
                                if(leg2 >= 10000) {
                                    sql = `UPDATE user SET ${coinType}=${coinType}+1 WHERE bakjoon_id=?`;
                                    await conn.execute(sql, [decoded.id]);
                                    getLegend1 = `축하합니다!! ${parts[0]}유형 전설의 포켓몬 코인을 획득했습니다!!`;
                                }   
                            }
                            else if(leg1 < 11000) {
                                if(leg2 >= 11000) {
                                    sql = `UPDATE user SET ${coinType}=${coinType}+1 WHERE bakjoon_id=?`;
                                    await conn.execute(sql, [decoded.id]);
                                    getLegend1 = `축하합니다!! ${parts[0]}유형 전설의 포켓몬 코인을 획득했습니다!!`;
                                }
                            }
                            else if(leg1 < 12000) {
                                if(leg2 >= 12000) {
                                    sql = `UPDATE user SET ${coinType}=${coinType}+1 WHERE bakjoon_id=?`;
                                    await conn.execute(sql, [decoded.id]);
                                    getLegend1 = `축하합니다!! ${parts[0]}유형 전설의 포켓몬 코인을 획득했습니다!!`;
                                }
                            }
                            else if(leg1 < 13000) {
                                if(leg2 >= 13000) {
                                    sql = `UPDATE user SET ${coinType}=${coinType}+1 WHERE bakjoon_id=?`;
                                    await conn.execute(sql, [decoded.id]);
                                    getLegend1 = `축하합니다!! ${parts[0]}유형 전설의 포켓몬 코인을 획득했습니다!!`;
                                }
                            }
                        }
                    }
                    // 유형 2개일 때
                    else {
                        // 오르기 전 경험치 확인
                        sql = `SELECT ${type1}, ${type2} FROM exp_by_type WHERE bakjoon_id=?`;
                        const [legend1] = await conn.execute(sql, [decoded.id]);
                        const leg1 = legend1[0][type1]; // 해당타입 경험치
                        const leg11 = legend1[0][type2]; // 해당타입 경험치

                        flag = 1;
                        get_exp = (get_exp/2);
                        sql = `UPDATE exp_by_type SET ${type1}=${type1}+?, ${type2}=${type2}+? WHERE bakjoon_id=?`;
                        await conn.execute(sql, [get_exp, get_exp, decoded.id]);

                        // 오른 후 경험치 확인
                        sql = `SELECT ${type1}, ${type2} FROM exp_by_type WHERE bakjoon_id=?`;
                        const [legend2] = await conn.execute(sql, [decoded.id]);
                        const leg2 = legend2[0][type1]; // 해당타입 경험치
                        const leg22 = legend2[0][type2]; // 해당타입 경험치

                        const coinType1 = typeMapping[type1];
                        const coinType2 = typeMapping[type2];

                        evo = await evolution2(decoded.id, leg1, leg2, leg11, leg22, parts, conn);
                        if(evo) {
                            if(evo.length === 1) {
                                evolutionflag = '1'; // 1개만 진화
                            }
                            else if(evo.length === 2) {
                                evolutionflag = '2'; // 2개 다 진화
                            }

                        }
                        
                        // 진화 안했으면 전포 체크
                        else {
                            // 유형 1 전포 지급
                            if(leg1 < 10000) {
                                if(leg2 >= 10000) {
                                    sql = `UPDATE user SET ${coinType1}=${coinType1}+1 WHERE bakjoon_id=?`;
                                    await conn.execute(sql, [decoded.id]);
                                    getLegend1 = `축하합니다!! ${parts[0]}유형 전설의 포켓몬 코인을 획득했습니다!!`;
                                }   
                            }
                            else if(leg1 < 11000) {
                                if(leg2 >= 11000) {
                                    sql = `UPDATE user SET ${coinType1}=${coinType1}+1 WHERE bakjoon_id=?`;
                                    await conn.execute(sql, [decoded.id]);
                                    getLegend1 = `축하합니다!! ${parts[0]}유형 전설의 포켓몬 코인을 획득했습니다!!`;
                                }
                            }
                            else if(leg1 < 12000) {
                                if(leg2 >= 12000) {
                                    sql = `UPDATE user SET ${coinType1}=${coinType1}+1 WHERE bakjoon_id=?`;
                                    await conn.execute(sql, [decoded.id]);
                                    getLegend1 = `축하합니다!! ${parts[0]}유형 전설의 포켓몬 코인을 획득했습니다!!`;
                                }
                            }
                            else if(leg1 < 13000) {
                                if(leg2 >= 13000) {
                                    sql = `UPDATE user SET ${coinType1}=${coinType1}+1 WHERE bakjoon_id=?`;
                                    await conn.execute(sql, [decoded.id]);
                                    getLegend1 = `축하합니다!! ${parts[0]}유형 전설의 포켓몬 코인을 획득했습니다!!`;
                                }
                            }

                            // 유형 2 전포 지급
                            if(leg11 < 10000) {
                                if(leg22 >= 10000) {
                                    sql = `UPDATE user SET ${coinType2}=${coinType2}+1 WHERE bakjoon_id=?`;
                                    await conn.execute(sql, [decoded.id]);
                                    getLegend2 = `축하합니다!! ${parts[1]}유형 전설의 포켓몬 코인을 획득했습니다!!`;
                                }   
                            }
                            else if(leg11 < 11000) {
                                if(leg22 >= 11000) {
                                    sql = `UPDATE user SET ${coinType2}=${coinType2}+1 WHERE bakjoon_id=?`;
                                    await conn.execute(sql, [decoded.id]);
                                    getLegend2 = `축하합니다!! ${parts[1]}유형 전설의 포켓몬 코인을 획득했습니다!!`;
                                }
                            }
                            else if(leg11 < 12000) {
                                if(leg22 >= 12000) {
                                    sql = `UPDATE user SET ${coinType2}=${coinType2}+1 WHERE bakjoon_id=?`;
                                    await conn.execute(sql, [decoded.id]);
                                    getLegend2 = `축하합니다!! ${parts[1]}유형 전설의 포켓몬 코인을 획득했습니다!!`;
                                }
                            }
                            else if(leg11 < 13000) {
                                if(leg22 >= 13000) {
                                    sql = `UPDATE user SET ${coinType2}=${coinType2}+1 WHERE bakjoon_id=?`;
                                    await conn.execute(sql, [decoded.id]);
                                    getLegend2 = `축하합니다!! ${parts[1]}유형 전설의 포켓몬 코인을 획득했습니다!!`;
                                }
                            }
                        }
                    }
                    await conn.commit();
                    
                    // 유형 2개일 경우
                    if(flag === 1) {

                        // 1개만 진화했을 경우
                        if(evolutionflag === "1") {
                            
                            return res.json({ result: 'success', message : `포켓몬 1마리가 진화했습니다!!`, isCorrect : 1, evolutionPoketmon : evo});
                            
                        }
                        else if(evolutionflag === "2") {
                            return res.json({ result: 'success', message : `포켓몬 2마리가 진화했습니다!!`, isCorrect : 1, evolutionPoketmon : evo});
                        }
                        else {
                            if(getLegend1 !== '') {
                                if(getLegend2 !== '') {
                                    return res.json({ result: 'success', message : `${getLegend1}, ${getLegend2}`, isCorrect : 1, type1 :`${type1}+${get_exp}`, type2 : `${type2}+${get_exp}`, legendPoketmon1 : `${parts[0]}`, legendPoketmon2 : `${parts[1]}`});
                                }
                                else {
                                    return res.json({ result: 'success', message : `${getLegend1}`, isCorrect : 1, type1 :`${type1}+${get_exp}`, type2 : `${type2}+${get_exp}`, legendPoketmon1 : `${parts[0]}`});
                                }
                            }
                            else if(getLegend2 !== '') {
                                return res.json({ result: 'success', message : `${getLegend2}`, isCorrect : 1, type1 :`${type1}+${get_exp}`, type2 : `${type2}+${get_exp}`, legendPoketmon1 : `${parts[1]}`});
                            }

                            return res.json({ result: 'success', message : '처음 해결한 문제입니다. 유형별 경험치를 지급합니다.', isCorrect : 1, type1 :`${type1}+${get_exp}`, type2 : `${type2}+${get_exp}`});
                        }
                    }
                    // 유형 1개일 경우
                    else {
                        // 1개만 진화했을 경우
                        if(evolutionflag === "1") {
                            return res.json({ result: 'success', message : `포켓몬 1마리가 진화했습니다!!`, isCorrect : 1, evolutionPoketmon : evo});
                        }
                        else {
                            if(getLegend1 !== '') {
                                return res.json({ result: 'success', message : `${getLegend1}`, isCorrect : 1, type1 :`${type1}+${get_exp}`, legendPoketmon1 : `${parts[0]}`});    
                            }
                            // 일반 정답
                            return res.json({ result: 'success', message : '처음 해결한 문제입니다. 유형별 경험치를 지급합니다.', isCorrect : 1, type1 :`${type1}+${get_exp}`});
                        }
                    }
                }
                catch(transactionError) {
                    await conn.rollback();
                    console.error(`트랜잭션 오류 : ${transactionError}`);
                    return res.json({ result : 'fail', data: `${transactionError.message}`});
                }
            }
            // 이미 해결한 문제일 경우 경험치/크레딧 제공 안함
            // 일반 이미 정답
            return res.json({ result: 'success', message : '이미 해결한 문제입니다.', isCorrect : 1, get_exp : get_exp});
        }
        // 테케있음/오답 응답 반환
        // 일반 오답
        return res.json({ result: 'success', message : '오답입니다!!', isCorrect : 0});
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

        let sql = `SELECT type FROM problem WHERE id=?`;
        const [typeQuery] = await conn.execute(sql, [problem_id]);
        const type = typeQuery[0].type;


        // resolved 데이터 있는지 찾기
        sql = `SELECT elapsed_time, limit_time FROM resolved WHERE bakjoon_id=? AND problem_id=?`;
        const [result] = await conn.execute(sql, [decoded.id, problem_id]);

        // resolved 데이터가 없을 경우 추가
        if(result.length === 0) {
            
            // limit_time 존재하면 함께 추가
            if(limit_time) {
                sql = `INSERT INTO resolved (bakjoon_id, problem_id, elapsed_time, limit_time, success, problem_title, problem_type) VALUES (?, ?, ?, ?, ?, ?, ?)`;
                await conn.execute(sql, [decoded.id, problem_id, 0, limit_time, 0, problem_title, type]);

                return res.json({result : 'success', message : '문제에 처음 도전했습니다. resolved 테이블에 limit_time을 포함한 데이터 추가'})
            }

            // limit_time 없으면 추가 안함
            else {
                sql = `INSERT INTO resolved (bakjoon_id, problem_id, elapsed_time, success, problem_title, problem_type) VALUES (?, ?, ?, ?, ?, ?)`;
                await conn.execute(sql, [decoded.id, problem_id, 0, 0, problem_title, type]);

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
