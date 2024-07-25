require('dotenv').config();
const express = require('express');
const cors = require('cors');
const amqp = require('amqplib/callback_api');
const createConnection = require('./lib/db2');
const { v4: uuidv4 } = require('uuid');



// 실시간 협업 에디터
const WebSocket = require('ws');
const http = require('http');
const dotenv = require('dotenv');
dotenv.config();
const { setupWSConnection } = require('y-websocket/bin/utils');

const app = express();
const bodyParser = require('body-parser');
const { exec } = require('child_process');  // app.js가 있는 경로를 기준으로 실행된다
const path = require('path');

// 실시간 협업 에디터
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// 리팩토링 코드 파일
const mainPage = require('./lib/mainPage');
const startPage = require('./lib/startPage');
const myPage = require('./lib/myPage');
const codeReview = require('./lib/codeReview');
const codeEditor = require('./lib/codeEditor');
const problemList = require('./lib/problemList');
const ai = require('./lib/ai');

wss.on('connection', (ws, req) => {
    setupWSConnection(ws, req);
});

app.use(cors());
app.use(bodyParser.urlencoded({extended: true})); // post body 데이터 받아오기 위함
app.use(express.json());

////////////////////////////////////////////////// API 시작 ////////////////////////////////////////////////


//health check 지우지 말것
app.get('/',(req,res)=>{ 
    res.status(200);
})

// 무중단 배포 서버 프로필 확인 (check status)
app.get('/status',(req,res)=>{
    const serverProfile = process.env.PROFILES || 'No color set'
    res.status(200).send(`${serverProfile}`);
});

// 내가 만든 백 로직 테스트 페이지
app.get('/sunq', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'indexx.html'));
});

// 0. 로그인 => 완성
app.post('/login', (req, res) => {
    startPage.login(req, res);
});

// 4. 회원가입 ( 사용자, 똥, 도감 테이블 추가 ) => 완성
app.post('/signUp', (req, res) => {
    startPage.signUp(req, res);
});

// 26. 닉네임 중복검사 => 완성
app.post('/checkNickName', (req, res) => {
    startPage.checkNickName(req, res);
});

// 24. 토큰 검증 => 완성
app.post('/tokenTest', (req, res) => {
    startPage.tokenTest(req, res);
});

// 1. 헤더 데이터 ( 닉네임, 크레딧, 현재 포켓몬ID 뿌려주기 ) => 완성
app.post('/headerData', (req, res) => {
    mainPage.headerData(req, res);
});

// 27. 메인페이지 헤더 데이터 ( 1번 헤더 데이터 + 포켓몬레벨 + 경험치 ) => 완성
app.post('/mainPageHeaderData', (req, res) => {
    mainPage.mainPageHeaderData(req, res);
});

// 2. 똥 치우기 버튼 => 완성
app.post('/clearPoo', (req, res) => {
    mainPage.clearPoo(req, res);
});

// 25. 똥 개수 가져오기 => 완성
app.post('/getPoo', (req, res) => {
    mainPage.getPoo(req, res);
});

// 6. 도감 출력 => 완성
app.get('/book', (req, res) => {
    mainPage.book(req, res);
});


// 9. 포켓몬 id 받아서 book 등록 후 현재 포켓몬 설정 => 완성
app.post('/evolution', (req, res) => {
    mainPage.evolution(req, res);
});


// 37. 전설의 포켓몬 뽑기 => 작업 진행 중
app.post('/legendGambling', (req, res) => {
    mainPage.legendGambling(req, res);
});


// 5. 마이페이지 입장 시 데이터 뿌려주기 => 완성
app.post('/myPage', (req, res) => {
    myPage.myPage(req, res);
});       

// 7. 현재 포켓몬 변경 => 완성
app.post('/changeMonster', (req, res) => {
    myPage.changeMonster(req, res);
});

// 8. 닉네임 수정 => 완성
app.post('/changeNickName', (req, res) => {
    myPage.changeNickName(req, res);
});

// 32. 사용자가 푼 문제 + 획득 크레딧/경험치 및 기타정보 주기 => 완성
app.get('/resolvedProblems', (req, res) => {
    myPage.resolvedProblems(req, res);
})

// 31. 문제 출력
app.get('/problemList', (req, res) => {
    problemList.problemList(req, res);
});

// 11. 코드리뷰 로비 입장 시 방목록 뿌려주기
// app.get('/reviewList', (req, res) => {
//     codeReview.reviewList(req, res);
// });

app.get('/reviewList', (req, res) => {
    codeReview.reviewList(req, res);
});

// 13. 방 만들기 => 완성
app.post('/createReview', (req, res) => {
    codeReview.createReview(req, res);
});

// 35. 해결 버튼 => 완성
app.post('/complete', (req, res) => {
    codeReview.complete(req, res);
})

// 36. 강퇴 버튼
app.post('/kick', (req, res) => {
    codeReview.kick(req, res);
})


// 30. 채점 가능한 문제 보기 => 수정필요
app.post('/viewProblem', (req, res) => {
    codeEditor.viewProblem(req, res);
});

// 33. 문제 에디터 입장할 때 resolved 테이블에 데이터 추가
app.post('/selectOrUpdateResolvedProblem', (req, res) => {
    codeEditor.selectOrUpdateResolvedProblem(req, res);
})

// 17.1 코드 채점 => 완성
app.post('/runCode', (req, res) => {
    codeEditor.runCode(req, res);
});

// 34. 경과시간, 제한시간 저장하는 API
app.post('/setTime', (req, res) => {
    codeEditor.setTime(req, res);
});

// AI 수정사항 : 토큰 만료 시 질문할 수 없도록 수정해야 함
// 27. AI - 알고리즘 힌트 => 완성
app.post('/aiAlgoHint', (req, res) => {
    ai.aiAlgoHint(req, res);
});

// 28. AI - 알고리즘 정답/오답 코드 피드백 => 완성
app.post('/aiAlgoFeedBack', (req, res) => {
    ai.aiAlgoFeedBack(req, res);
});

// 29. AI - 일반 코드 피드백 => 완성
app.post('/aiFeedBack', (req, res) => {
    ai.aiFeedBack(req, res);

});



////////////////////////////////////////////////// Rabbit MQ 연결  나중에 정리 하겠슴////////////////////////////////////////////////
// RabbitMQ 연결 및 채널 생성


// function generateUuid() {
//     return Math.random().toString() + Math.random().toString() + Math.random().toString();
// }
let currentQueue = 1; // 현재 큐 인덱스를 1로 초기화
let channel = null;
const amqpURL = 'amqp://myuser:mypassword@13.209.214.53';
amqp.connect(amqpURL, (error0, connection) => { 
    if (error0) {
        throw error0;
    }
    connection.createChannel((error1, ch) => {
        if (error1) {
            throw error1;
        }
        channel = ch;
        const queues = Array.from({ length: 15 }, (_, i) => `task_queue_${i + 1}`);
        queues.forEach(queue => {
            channel.assertQueue(queue, { durable: true });
        });
    });
});

app.post('/submit', async (req, res) => {
    const { code, lang, bojNumber, elapsed_time, limit_time, testCase } = req.body;
  
    // 데이터베이스 연결
    let conn;
    try {
        conn = await createConnection();

        if (!code || !lang || !bojNumber) {
            return res.status(400).json({ error: '필드 누락' });
        }

        let finalTestCase = testCase;

        if (Array.isArray(testCase) && testCase.length === 0) { // 사용자 테케가 없는 경우 == 제출하기 버튼을 눌렀을 경우
            // bojNumber에 해당하는 테스트 케이스 데이터를 가져옴
            const [rows] = await conn.execute('SELECT input_case, output_case FROM `problem_tc` WHERE `id` = ?', [bojNumber]);
            console.log("DB에서 꺼낸 테스트 케이스 개수 :", rows.length)
            finalTestCase = rows.map(row => ({ input_case: row.input_case, output_case: row.output_case }));
        
        }

        //console.log(finalTestCase);
        const correlationId = uuidv4();

        channel.assertQueue('', { exclusive: true }, (err, q) => {
            if (err) {
                throw err;
            }
            const replyQueue = q.queue;
            const message = JSON.stringify({ code, lang, bojNumber, elapsed_time, limit_time, testCase: finalTestCase });
            console.log(finalTestCase);
            const queue = `task_queue_${currentQueue}`;

            channel.sendToQueue(queue, Buffer.from(message), {
                persistent: true,
                correlationId: correlationId,
                replyTo: replyQueue
            });

            console.log(" [x] Sent '%s' to %s", message, queue);

            currentQueue = currentQueue < 15 ? currentQueue + 1 : 1;

            channel.consume(replyQueue, (msg) => {
                //console.log(msg)
                if (msg && msg.properties.correlationId === correlationId) {
                    res.status(200).json({ result: JSON.parse(msg.content.toString()) });
                    channel.deleteQueue(replyQueue);
                }
            }, {
                noAck: true
            });
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: '서버 오류' });
    } finally {
        if (conn) conn.end();
    }
});
////////////////////////////////////////////////// 우똥이가 추가했음 ////////////////////////////////////////////////////////////////





//서버 실행
server.listen(3000, () => {
    console.log(`running on port:3000`);
});

// // develop에 올릴 때 process.env.PORT로 바꾸기
// server.listen(process.env.PORT || 44444, () => {
//     console.log(process.env.PORT);
//     console.log(`Server running on port:${process.env.PROFILE}`);
// });