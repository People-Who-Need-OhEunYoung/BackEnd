const jwt = require('jsonwebtoken');
const util = require('util');
const secretKey = process.env.JWT_SECRET_KEY;
const https = require('follow-redirects').https;

// jwt.verify를 Promise로 변환
const verifyToken = util.promisify(jwt.verify);

// 27. AI - 알고리즘 힌트 => 완성
exports.aiAlgoHint = async function(req, res) {

    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.json({ result: 'fail', message: '토큰이 제공되지 않았습니다.' });
    }

    try {
        // 토큰 검증
        const decoded = await verifyToken(token, secretKey);
        console.log(`토큰 검증 완료, 사용자 id : ${decoded.id}`);

        console.log('알고리즘 힌트 응답 수신 중...');
        const number = req.body.bojNumber;
        const data = `백준 ${number}번 문제 풀이법에 대한 힌트를 간략하게 5줄로 말해줘`;

        // API 호출
        const response = await callApi(data);

        // 성공 응답 반환
        return res.json({ result: 'success', message: 'AI 응답 수신', data: response });
    }
    catch (error) {
        console.error(`오류 발생: ${error}`);
        return res.json({ result: 'fail', message: 'AI 응답 수신 실패', data: `${error.message}` });
    }
};



// 28. AI - 알고리즘 정답/오답 코드 피드백 => 완성
exports.aiAlgoFeedBack = async function(req, res) {

    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.json({ result: 'fail', message: '토큰이 제공되지 않았습니다.' });
    }

    try {
        // 토큰 검증
        const decoded = await verifyToken(token, secretKey);
        console.log(`토큰 검증 완료, 사용자 id : ${decoded.id}`);

        // AI 질문 전송 준비
        console.log('알고리즘 코드 피드백 수신 중...');
        const number = req.body.bojNumber;
        const code = req.body.code;
        const isCorrect = req.body.isCorrect; // 1 또는 0

        let data;
        if (isCorrect == 1) {
            data = `${code}\n\n백준 ${number}번 문제에 대한 정답 코드인데, 코드는 제외하고 반드시 5줄 안으로 구체적인 피드백 부탁해`;
        } else {
            data = `${code}\n\n백준 ${number}번 문제에 대한 오답 코드인데, 코드는 제외하고 반드시 5줄 안으로 구체적인 피드백 부탁해`;
        }

        // API 호출
        const response = await callApi(data);

        // 성공 응답 반환
        return res.json({ result: 'success', message: 'AI 응답 수신', data: response });
    }
    catch (error) {
        console.error(`오류 발생: ${error}`);
        return res.json({ result: 'fail', message: 'AI 응답 수신 실패', data: `${error.message}` });
    }
};



// 29. AI - 일반 코드 피드백 => 완성
exports.aiFeedBack = async function(req, res) {

    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.json({ result: 'fail', message: '토큰이 제공되지 않았습니다.' });
    }

    try {
        // 토큰 검증
        const decoded = await verifyToken(token, secretKey);
        console.log(`토큰 검증 완료, 사용자 id : ${decoded.id}`);

        // AI 질문 전송 준비
        console.log('코드 피드백 수신 중...');
        const code = req.body.code;
        const data = `${code}\n\n내가 작성한 코드인데, 5줄 내로 피드백 부탁해`;

        // API 호출
        const response = await callApi(data);

        // 성공 응답 반환
        return res.json({ result: 'success', message: 'AI 응답 수신', data: response });
    }
    catch (error) {
        console.error(`오류 발생: ${error}`);
        return res.json({ result: 'fail', message: 'AI 응답 수신 실패', data: `${error.message}` });
    }
};

// AI 함수
function callApi(data) {
    return new Promise((resolve, reject) => {
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
            let rawData = '';
            
            res.on("data", (chunk) => {
                rawData += chunk.toString();
            });
            
            res.on("end", () => {
                try {
                    // 여러 줄의 데이터를 줄 단위로 처리
                    const lines = rawData.split('\n');
                    let finalContent = '';
                    
                    lines.forEach(line => {
                        if (line.trim().startsWith('data: ')) {
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
                                finalContent += content; // 응답을 누적
                            }
                        }
                    });
                    
                    resolve(finalContent); // 최종 응답을 resolve
                } catch (error) {
                    
                    reject("데이터 처리 중 오류 발생: " + error);
                }
            });
            
            res.on("error", (error) => {
                
                reject('Error in response: ' + error); // 에러 처리
            });
        });

        let postData = JSON.stringify({
            "messages": [
                {
                    "content": "You are a helpful assistant",
                    "role": "system"
                },
                {
                    "content": `${data}`,
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
    });
}