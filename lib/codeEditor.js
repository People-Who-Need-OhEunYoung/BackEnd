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

        const code = req.body.code;
        const bojNumber = req.body.bojNumber;

        // 사용자 코드 저장 : 사용자id_문제번호 1234_3055
        await execPromise(`echo "${code.replace(/"/g, '\\"')}" > userCode/${decoded.id}_${bojNumber}`);

        // 코드 비교 스크립트 실행
        const { stdout } = await execPromise(`./codeCompare.sh ${decoded.id}_${bojNumber} ${bojNumber}`);



        
        // 성공 응답 반환
        return res.json({ result: 'success', data: stdout });
    }
    catch (error) {
        console.error(`오류 발생: ${error}`);
        return res.json({ result: 'fail', data: `${error.message}` });
    }
};


exports.runCodeTest = async function(req, res) {

    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.json({ result: 'fail', message: '토큰이 제공되지 않았습니다.' });
    }

    try {
        // 토큰 검증
        const decoded = await verifyToken(token, secretKey);
        console.log(`토큰 검증 완료, 사용자 id : ${decoded.id}`);

        // 코드, 문제번호
        const code = req.body.code;
        const bojNumber = req.body.bojNumber;

        // 사용자 코드 저장 : 사용자id_문제번호 1234_3055
        await execPromise(`echo "${code.replace(/"/g, '\\"')}" > userCode/${decoded.id}_${bojNumber}`);
        
        // 코드 비교 스크립트 실행
        const { stdout : codeCompare } = await execPromise(`./codeCompare.sh ${decoded.id}_${bojNumber} ${bojNumber}`);
        



        // 추가 테스트 케이스 ( 배열 형태 ) [{input, output}, {input, output} ...]
        const testCase = req.body.testCase;

        // 추가 테스트 케이스가 존재할 경우
        if(testCase.length > 0) {

            const testCaseJson = JSON.stringify(testCase);
            const encodedTestCaseJson = encodeURIComponent(testCaseJson);

            // 코드 비교 스크립트 실행
            const { stdout : codeCompare2 } = await execPromise(`./codeCompare2.sh ${decoded.id}_${bojNumber} ${encodedTestCaseJson}`);

            // 기본 + 추가 테스트케이스 응답 반환
            return res.json({ result: 'success', data: codeCompare, data2 : codeCompare2});
        }


        // 기본 테스트케이스 응답 반환
        return res.json({ result: 'success', data: codeCompare });
    }
    catch (error) {
        console.error(`오류 발생: ${error}`);
        return res.json({ result: 'fail', data: `${error.message}` });
    }
};









// 15. 테스트 케이스 추가 ( 작업필요 ) => 프론트에서함
// exports.addTC = async function(req, res) {

//     const authHeader = req.headers['authorization'];
//     const token = authHeader && authHeader.split(' ')[1];

//     if (!token) {
//         return res.json({ result: 'fail', message: '토큰이 제공되지 않았습니다.' });
//     }

//     let conn;
//     try {
//         // 토큰 검증
//         const decoded = await verifyToken(token, secretKey);
//         console.log(`토큰 검증 완료, 사용자 id : ${decoded.id}`);
//     }
//     catch(error) {
//         return res.json({ result : 'fail', message : '에러 발생', error : error});
//     }
//     finally {
//         if(conn) {
//             await conn.end();
//         }
//     }
// }