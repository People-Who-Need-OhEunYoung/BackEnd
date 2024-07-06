const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const port = 3000;
const mysql = require('mysql2');
const jwt = require('jsonwebtoken');
const secretKey = '1234';
const { exec } = require('child_process');  // app.js가 있는 경로를 기준으로 실행된다
const https = require('follow-redirects').https;
const path = require('path');

var db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'practice'
    });
db.connect();

app.use(bodyParser.urlencoded({extended: true})); // post body 데이터 받아오기 위함
app.use(express.json());
app.use(express.static(path.join(__dirname, 'views')));



////////////////////////////////////////////////// API 시작 ////////////////////////////////////////////////

// 프론트에서 만든 리액트 페이지들
app.get('/', (req, res) => {
    // res.render('index');  // ./views/index.ejs 리턴
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});


// 내가 만든 백 로직 테스트 페이지
app.get('/sunkue', (req, res) => {
    // res.render('indexx.html');
    res.sendFile(path.join(__dirname, 'views', 'indexx.html'));
});


// 로그인
app.post('/login', (request, response) => {
    const id = request.body.id;
    const pw = request.body.pw;
    
    let sql = `SELECT * FROM practice WHERE id=? AND pw=?`;
    db.query(sql, [id, pw], function(error, result) {
        if(error) {
            return response.json({result : 'fail'});
        }
        // DB에 id, pw에 해당하는 계정이 있으면 success 리턴 
        if(result.length !== 0) {

            // 토큰 생성
            token = jwt.sign({
                type: 'JWT',
                id: id
            }, secretKey, {            // secret key : 1234
                expiresIn: '30m', // 만료시간 30분
                issuer: 'ysk'
            });

            response.json({ result : 'success', id: id, pw: pw, token: token});
        }
        else {
            response.json({result : 'fail'});
        }    
    })
});


// 토큰 검증
app.post('/tokenTest', (req, res) => {

    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    // jwt 토큰 복호화
    jwt.verify(token, secretKey, (error, decoded) => {
        if(error) {
            return res.json({result : 'fail'})
        }
        console.log(`토큰 검증 완료, 사용자 id : ${decoded.id}`)
        res.json({result : 'success'});
    });
});


// 채점 가능한 문제 보기
app.post('/viewProblem', (req, res) => {

    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    // jwt 토큰 복호화
    jwt.verify(token, secretKey, (error, decoded) => {
        if(error) {
            return res.json({result : 'fail'})
        }
        console.log(`토큰 검증 완료, 사용자 id : ${decoded.id}`)

        exec(`ls /home/ubuntu/nodejs/pokecode/testCase`, (error, stdout, stderr) => {
            if(error) {
                console.error(`문제 조회 에러: ${error}`);
                res.json({result : 'fail', data : `${error}`});
                return;
            }
            
            res.json({result : 'success', data : `${stdout}`});
        });
    });  
});


// 코드 채점
app.post('/runCode', (req, res) => {

    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    // jwt 토큰 복호화
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
});


////////////////////////////////////////////////// deepseek AI ////////////////////////////////////////////////
app.get('/aiTest', function (req, res) {
    console.log('deepseek테스트 들어옴');
    callApi();
    // console.log( callChatGPT('안녕, 너 몇살이니?') );
});

// 스트리밍 성공. 바닐라버전임
function callApi() {
    let options = {
        'method': 'POST',
        'hostname': 'api.deepseek.com',
        'path': '/chat/completions',
        'headers': {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': 'Bearer sk-880772ade7984d4ba70c1fb1c62da44a'
        },
        'maxRedirects': 20
    };

    const req = https.request(options, (res) => {
        res.on("data", (chunk) => {
            let rawData = chunk.toString();

            // 여러 줄의 데이터가 올 수 있으므로 줄 단위로 처리
            const lines = rawData.split('\n');

            lines.forEach(line => {
                if (line.trim().startsWith('data: ')) {
                    try {
                        // "data:" 제거 및 앞뒤 공백 제거
                        const jsonStr = line.replace(/^data:\s*/, '').trim();

                        // '[DONE]' 신호 확인
                        if (jsonStr === '[DONE]') {
                            console.log("스트림 완료 신호 받음");
                            return;
                        }

                        // JSON 파싱
                        const chunkData = JSON.parse(jsonStr);

                        // content에 접근
                        const content = chunkData.choices[0]?.delta?.content;

                        if (content) {
                            process.stdout.write(content); // 줄바꿈 없이 즉시 출력
                        }
                    } catch (error) {
                        console.error("데이터 처리 중 오류 발생:", error);
                    }
                }
            });
        });


        res.on("end", () => {
            console.log('Response has ended.'); // 응답 종료 로그
        });

        res.on("error", (error) => {
            console.error('Error in response:', error); // 에러 처리
        });
    });

    let postData = JSON.stringify({
        "messages": [
            {
                "content": "You are a helpful assistant",
                "role": "system"
            },
            {
                "content": "백준 3055번 탈출 문제 풀이법에 대한 힌트를 간략하게 5줄로 말해줘",
                "role": "user"
            }
        ],
        "model": "deepseek-coder",
        "frequency_penalty": 0,
        "max_tokens": 2048,
        "presence_penalty": 0,
        "stop": null,
        "stream": true,
        "temperature": 1,
        "top_p": 1,
        "logprobs": false,
        "top_logprobs": null
    });

    req.write(postData); // POST 데이터 쓰기
    req.end(); // 요청 종료
}
////////////////////////////////////////////////// deepseek AI ////////////////////////////////////////////////




app.listen(port, () => {
    console.log(`Server running... port: ${port}`);
});
