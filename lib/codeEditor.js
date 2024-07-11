const db = require('./db');
const jwt = require('jsonwebtoken');
const secretKey = process.env.JWT_SECRET_KEY;
const { exec } = require('child_process');  // app.js가 있는 경로를 기준으로 실행된다

// 30. 채점 가능한 문제 보기
exports.viewProblem = function(req, res) {

    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    // jwt 토큰 검증
    jwt.verify(token, secretKey, (error, decoded) => {
        if(error) {
            return res.json({result : 'fail'});
        }
        console.log(`토큰 검증 완료, 사용자 id : ${decoded.id}`);

        exec(`ls /home/ubuntu/nodejs/pokecode/testCase`, (error, stdout, stderr) => {
            if(error) {
                console.error(`문제 조회 에러: ${error}`);
                res.json({result : 'fail', data : `${error}`});
                return;
            }
            
            res.json({result : 'success', data : `${stdout}`});
        });
    });
};

// 17.1 코드 채점 => 완성
exports.runCode = function(req, res) {

    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    // jwt 토큰 검증
    jwt.verify(token, secretKey, (error, decoded) => {
        if(error) {
            return res.json({result : 'fail'})
        }
        console.log(`토큰 검증 완료, 사용자 id : ${decoded.id}`)

        const code = req.body.code;
        const bojNumber = req.body.bojNumber;

        // 사용자 코드 저장 : 사용자id_문제번호 1234_3055
        exec(`echo "${code.replace(/"/g, '\\"')}" > userCode/${decoded.id}_${bojNumber}`, (error, stdout, stderr) => {
            if(error) {
                console.error(`사용자 코드 저장 실패: ${error}`);
                res.json({result : 'fail', data : `${error}`});
                return;
            }
            
            exec(`./codeCompare.sh ${decoded.id}_${bojNumber} ${bojNumber}`, (error, stdout, stderr) => {
                if(error) {
                    console.error(`파이썬 실행 에러: ${error}`);
                    res.json({result : 'fail', data : `${error}`});
                    return;
                }
                
                res.json({result : 'success', data : `${stdout}`});
            });
        });
    });
};


// 15. 테스트 케이스 추가 ( 작업필요 )
exports.addTC = function(req, res) {

    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    // jwt 토큰 검증
    jwt.verify(token, secretKey, (error, decoded) => {
        if(error) {
            return res.json({result : 'fail'});
        }
        console.log(`토큰 검증 완료, 사용자 id : ${decoded.id}`);


        // 테스트케이스 추가 ( 작업필요 )
    });
}