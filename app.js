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
const ai = require('./lib/ai');

wss.on('connection', (ws, req) => {
    setupWSConnection(ws, req);
});

app.use(cors());
app.use(bodyParser.urlencoded({extended: true})); // post body 데이터 받아오기 위함
app.use(express.json());
//app.use(express.static(path.join(__dirname, 'views')));

// min ~ max 사이 숫자 중 하나를 랜덤으로 고르는 함수
function getRandomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

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

// 0. 로그인
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

// 24. 토큰 검증
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
app.post('/book', (req, res) => {
    mainPage.book(req, res);
});

// 9. 뽑기 => 완성
// 수정사항 : 크레딧 0 아래로 안 내려가게 바꿔야 한다
app.post('/gambling', (req, res) => {
    mainPage.gambling(req, res);
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

// 11. 코드리뷰 로비 입장 시 방목록 뿌려주기
app.post('/reviewList', (req, res) => {
    codeReview.reviewList(req, res);
});

// 13. 방 만들기 => 완성
app.post('/createReview', (req, res) => {
    codeReview.createReview(req, res);
});

// 15. 테스트 케이스 추가 ( 미완성, 작업필요 )
app.post('/addTC', (req, res) => {
    codeEditor.addTC(req, res);
});

// 30. 채점 가능한 문제 보기
app.post('/viewProblem', (req, res) => {
    codeEditor.viewProblem(req, res);
});

// 17.1 코드 채점 => 완성
app.post('/runCode', (req, res) => {
    codeEditor.runCode(req, res);
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





server.listen(process.env.PORT || 44444, () => {
    console.log(process.env.PORT);
    console.log(`Server running on port:${process.env.PROFILE}`);
});