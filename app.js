require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const bodyParser = require('body-parser');
const path = require('path');
// const { exec } = require('child_process');  // app.js가 있는 경로를 기준으로 실행된다

// 실시간 협업 에디터
const WebSocket = require('ws');
const http = require('http');
const dotenv = require('dotenv');
dotenv.config();
const { setupWSConnection } = require('y-websocket/bin/utils');
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// 리팩토링 코드 파일
const mainPage = require('./lib/mainPage');
const startPage = require('./lib/startPage');
const myPage = require('./lib/myPage');
const codeEditor = require('./lib/codeEditor');
const problemList = require('./lib/problemList');
const authenticateToken = require('./lib/auth');
// const codeReview = require('./lib/codeReview');
// const ai = require('./lib/ai');

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
app.post('/headerData', authenticateToken, (req, res) => {
    mainPage.headerData(req, res);
});

// 2. 똥 치우기 버튼 => 완성
app.post('/clearPoo', authenticateToken, (req, res) => {
    mainPage.clearPoo(req, res);
});

// 25. 똥 개수 가져오기 => 완성
app.post('/getPoo', authenticateToken, (req, res) => {
    mainPage.getPoo(req, res);
});

// 6. 도감 출력 => 완성
app.get('/book', authenticateToken, (req, res) => {
    mainPage.book(req, res);
});

// 9. 포켓몬 id 받아서 book 등록 후 현재 포켓몬 설정 => 완성
app.post('/evolution', authenticateToken, (req, res) => {
    mainPage.evolution(req, res);
});

// 37. 전설의 포켓몬 뽑기 => 완성
app.post('/legendGambling', authenticateToken, (req, res) => {
    mainPage.legendGambling(req, res);
});

// 5. 마이페이지 입장 시 데이터 뿌려주기 => 완성
app.post('/myPage', authenticateToken, (req, res) => {
    myPage.myPage(req, res);
});       

// 7. 현재 포켓몬 변경 => 완성
app.post('/changeMonster', authenticateToken, (req, res) => {
    myPage.changeMonster(req, res);
});

// 8. 닉네임 수정 => 완성
app.post('/changeNickName', authenticateToken, (req, res) => {
    myPage.changeNickName(req, res);
});

// 32. 사용자가 푼 문제 + 획득 크레딧/경험치 및 기타정보 주기 => 완성
app.get('/resolvedProblems', authenticateToken, (req, res) => {
    myPage.resolvedProblems(req, res);
})

// 31. 문제 출력
app.get('/problemList', authenticateToken, (req, res) => {
    problemList.problemList(req, res);
});

// 17.1 코드 채점 => 완성
app.post('/runCode', authenticateToken, (req, res) => {
    codeEditor.runCode(req, res);
});

// 33. 문제 에디터 입장할 때 resolved 테이블에 데이터 추가
app.post('/selectOrUpdateResolvedProblem', authenticateToken, (req, res) => {
    codeEditor.selectOrUpdateResolvedProblem(req, res);
})

// 34. 경과시간, 제한시간 저장하는 API
app.post('/setTime', authenticateToken, (req, res) => {
    codeEditor.setTime(req, res);
});




// //서버 실행
server.listen(3000 || 44444, () => {
    console.log(`running on port:3000`);
});

// develop에 올릴 때 process.env.PORT로 바꾸기
// server.listen(process.env.PORT || 44444, () => {
//     console.log(process.env.PORT);
//     console.log(`Server running on port:${process.env.PROFILE}`);
// });