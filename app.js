require('dotenv').config();
const express = require('express');
const cors = require('cors');

// 실시간 협업 에디터
const WebSocket = require('ws');
const http = require('http');
const dotenv = require('dotenv');
dotenv.config();
const { setupWSConnection } = require('y-websocket/bin/utils');

const app = express();
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const jwt = require('jsonwebtoken');
const secretKey = process.env.SECRETKEY;
const { exec } = require('child_process');  // app.js가 있는 경로를 기준으로 실행된다
const https = require('follow-redirects').https;
const path = require('path');
const crypto = require('crypto');

// 실시간 협업 에디터
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });


wss.on('connection', (ws, req) => {
    setupWSConnection(ws, req);
});

var db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
    });
db.connect();

// var db = mysql.createConnection({
//     host: 'localhost',
//     user: 'sunkue',
//     password: 'Tjsrb123!@',
//     database: 'myweapon'
//     });
// db.connect();

app.use(cors());
app.use(bodyParser.urlencoded({extended: true})); // post body 데이터 받아오기 위함
app.use(express.json());
//app.use(express.static(path.join(__dirname, 'views')));

// min ~ max 사이 숫자 중 하나를 랜덤으로 고르는 함수
function getRandomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}


////////////////////////////////////////////////// API 시작 ////////////////////////////////////////////////

// 프론트에서 만든 리액트 페이지들
// app.get('/', (req, res) => {
//     // res.render('index');  // ./views/index.ejs 리턴
//     res.sendFile(path.join(__dirname, 'views', 'index.html'));
// });


// 내가 만든 백 로직 테스트 페이지

// 무중단 배포 서버 프로필 확인 (check status)
app.get('/status',(req,res)=>{
    const serverProfile = process.env.PROFILES || 'No color set'
    res.status(200).send(`${serverProfile}`);
})

app.get('/sunkue', (req, res) => {
    // res.render('indexx.html');
    res.sendFile(path.join(__dirname, 'views', 'indexx.html'));
});


// 0. 로그인
app.post('/login', (req, res) => {
    const id = req.body.id;
    const pw = req.body.pw;

    // SHA256 해시
    const hashPw = crypto.createHash('sha256').update(pw).digest('hex');
    
    let sql = `SELECT * FROM user WHERE bakjoon_id=? AND bakjoon_pw=?`;
    db.query(sql, [id, hashPw], function(error, result) {
        if(error) {
            return res.json({result : 'fail'});
        }
        // DB에 id, pw에 해당하는 계정이 있으면 success 리턴 
        if(result.length !== 0) {

            // 토큰 생성
            token = jwt.sign({
                type: 'JWT',
                id: id
            }, secretKey, {            // secret key : 1234
                expiresIn: '24h', // 만료시간 30분
                issuer: 'ysk'
            });

            // 마지막 접속일 업데이트
            sql = `UPDATE user SET last_login=CURDATE() WHERE bakjoon_id=?`
            db.query(sql, [id], function(error, result) {
                if(error) {
                    return res.json({result : 'fail', message : '쿼리 오류'});
                }
            });

            // 로그인, 토큰발급, 접속일 업데이트 성공 시 success 리턴
            res.json({ result : 'success', id: id, token: token});
        }
        else {
            res.json({result : 'fail', message : 'ID 또는 PW가 틀렸습니다.'});
        }    
    });
});


// 24. 토큰 검증
app.post('/tokenTest', (req, res) => {

    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    // jwt 토큰 검증
    jwt.verify(token, secretKey, (error, decoded) => {
        if(error) {
            return res.json({result : 'fail'})
        }
        console.log(`토큰 검증 완료, 사용자 id : ${decoded.id}`);
        res.json({result : 'success', id : decoded.id});
    });
});



// 1. 헤더 데이터 ( 닉네임, 크레딧, 현재 포켓몬ID 뿌려주기 ) => 완성
app.post('/headerData', (req, res) => {

    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    // jwt 토큰 검증
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
});


// 2. 똥 치우기 버튼 => 완성
app.post('/clearPoo', (req, res) => {

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
});


// 25. 똥 개수 가져오기 => 완성
app.post('/getPoo', (req, res) => {

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
});


// 4. 회원가입 ( 사용자, 똥, 도감 테이블 추가 ) => 완성
app.post('/signUp', (req, res) => {
    const id = req.body.id;
    const pw = req.body.pw;
    const nickName = req.body.nickName;

    // id 중복검사
    let sql = `SELECT * FROM user WHERE bakjoon_id=?`;
    db.query(sql, [id], function(error, result) {
        if(error) {
            return res.json({result : 'fail', message : '쿼리 오류'});
        }
        if(result.length > 0) {
            return res.json({result : 'fail', message : '중복된 ID입니다.'});
        }
    });


    // 닉네임 중복검사
    sql = `SELECT * FROM user WHERE nick_name=?`;
    db.query(sql, [nickName], function(error, result) {
        if(error) {
            return res.json({result : 'fail', message : '쿼리 오류'});
        }
        if(result.length > 0) {
            return res.json({result : 'fail', message : '중복된 닉네임입니다.'});
        }
    });

    // 회원가입 - 사용자 테이블에 추가
    const hashPw = crypto.createHash('sha256').update(pw).digest('hex');
    const pok_id = getRandomNumber(1, 649);
    sql = `INSERT INTO user (bakjoon_id, bakjoon_pw, nick_name, cur_poke_id, credit) VALUES (
    ?, ?, ?, ?, ?
    )`;
    db.query(sql, [id, hashPw, nickName, pok_id, 100], function(error, result) {
        if(error) {
            return res.json({result : 'fail', message : '쿼리 오류'});
        }
        
        // 회원가입 - 똥 테이블에 추가
        sql = `INSERT INTO poo (bakjoon_id, days) VALUES (?, ?)`;
        db.query(sql, [id, 0], function(error2, result2) {
            if(error) {
                return res.json({result : 'fail', message : '쿼리 오류'});
            }

            // 회원가입 - 도감 테이블에 추가
            sql = `INSERT INTO book (bakjoon_id, poke_id, poke_Lv, poke_Exp) VALUES (?, ?, ?, ?)`;
            db.query(sql, [id, pok_id, 1, 0], function(error3, result3) {
                if(error) {
                    return res.json({result : 'fail', message : '쿼리 오류'});
                }

                return res.json({result : 'success', message : '회원가입 성공'});
            });
        });
    });
});


// 5. 마이페이지 입장 시 데이터 뿌려주기 => 완성
app.post('/myPage', (req, res) => {

    // 토큰 검증 및 id얻기
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    jwt.verify(token, secretKey, (error, decoded) => {
        if(error) {
            return res.json({result : 'fail'})
        }
        console.log(`토큰 검증 완료, 사용자 id : ${decoded.id}`);
        
        // 닉네임, 크레딧, 포켓몬ID 조회
        let sql = `SELECT nick_name, credit, cur_poke_id FROM user WHERE bakjoon_id=?`;
        db.query(sql, [decoded.id], function(error, result) {
            if(error) {
                return res.json({result : 'fail', message : '쿼리 오류'})
            }
            const row = result[0];
            
            // 푼 문제 수 조회
            sql = `SELECT COUNT(*) FROM resolved WHERE bakjoon_id=?`;
            db.query(sql, [decoded.id], function(error2, result2) {
                if(error) {
                    return res.json({result : 'fail', message : '쿼리 오류'})
                }
                let count = result2[0].count;

                // 조회된 행이 없을 경우 0을 리턴
                if(count === undefined) {
                    count = 0;
                }
                // 결과 리턴
                return res.json({
                    result : 'success',
                    nickName : row.nick_name,
                    credit : row.credit,
                    curPokeId : row.cur_poke_id,
                    resolvedCount : count});
            });
        });
    });
});



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
        


// 6. 도감 출력 => 완성
app.post('/book', (req, res) => {

    const id = req.body.id;
    
    let sql = `SELECT poke_id, poke_Lv, poke_Exp FROM book WHERE bakjoon_id=?`;
    db.query(sql, [id], function(error, result) {
        if(error) {
            return res.json({result : 'fail', message : '쿼리 오류'})
        }
        
        return res.json({result : 'success', book : result});
    });
});


// 7. 현재 포켓몬 변경 => 완성
app.post('/changeMonster', (req, res) => {

    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    // jwt 토큰 검증
    jwt.verify(token, secretKey, (error, decoded) => {
        if(error) {
            return res.json({result : 'fail'})
        }
        console.log(`토큰 검증 완료, 사용자 id : ${decoded.id}`);


        // 선택된 포켓몬을 소유하고 있는지 확인
        let pok_id = req.body.pok_id;
        let sql = `SELECT * FROM book WHERE bakjoon_id=? AND poke_id=?`;
        db.query(sql, [decoded.id, pok_id], function(error, result) {
            if(error) {
                return res.json({result : 'fail', message : '쿼리 오류'})
            }
            if(result.length === 0) {
                return res.json({result : 'fail', message : '소유하지 않은 포켓몬'});
            }


            // 포켓몬 변경
            sql = `UPDATE user SET cur_poke_id=? WHERE bakjoon_id=?`;
            db.query(sql, [pok_id, decoded.id], function(error2, result2) {
                if(error) {
                    return res.json({result : 'fail', message : '쿼리 오류'})
                }
                return res.json({result : 'success', message : '포켓몬 변경 완료'});
            });
        });
    });
});


// 8. 닉네임 수정 => 완성
app.post('/changeNickName', (req, res) => {

    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    // jwt 토큰 검증
    jwt.verify(token, secretKey, (error, decoded) => {
        if(error) {
            return res.json({result : 'fail'})
        }
        console.log(`토큰 검증 완료, 사용자 id : ${decoded.id}`);


        // 닉네임 수정
        const nickName = req.body.nickName;
        let sql = `UPDATE user SET nick_name=? WHERE bakjoon_id=?`;
        db.query(sql, [nickName, decoded.id], function(error, result) {
            if(error) {
                return res.json({result : 'fail', message : '쿼리 오류'})
            }

            return res.json({result : 'success', message : '닉네임 수정 완료'});
        });
    });
});


// 9. 뽑기 => 완성
app.post('/gambling', (req, res) => {

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
});


// 11. 코드리뷰 로비 입장 시 방목록 뿌려주기
app.post('/reviewList', (req, res) => {

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

            let reviewIds = result.map(row => row.review_id);
            let queries = reviewIds.map(review_id => {
                return new Promise((resolve, reject) => {
                    let countSql = `SELECT COUNT(*) AS count FROM your_table WHERE review_id = ?`;
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
                    res.json({ result: 'success', counts: countResults });
                })
                .catch(err => {
                    res.json({ result: 'fail', message: '카운트 쿼리 오류', error: err });
                });
        });



    });
});




// 채점 가능한 문제 보기
app.post('/viewProblem', (req, res) => {

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
});


// 코드 채점 => 완성
app.post('/runCode', (req, res) => {

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
});

////////////////////////////////////////////////// deepseek AI ////////////////////////////////////////////////
app.get('/aiTest', function (req, res) {
    console.log('deepseek테스트 들어옴');
    callApi();
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

server.listen(process.env.PORT || 44444, () => {
    console.log(`Server running on ${process.env.PROFILES}`);
    console.log(`running on port:${process.env.PORT}`);
});