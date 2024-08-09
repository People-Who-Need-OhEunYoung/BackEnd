const createConnection = require('./db2');

// 5. 마이페이지 입장 시 데이터 뿌려주기 => 완성
exports.myPage = async function(req, res) {

    let conn;
    try {
        // 데이터베이스 연결
        conn = await createConnection();

        // 사용자 닉네임, 크레딧, 현재 포켓몬 ID 조회
        let sql = `SELECT nick_name, cur_poke_id, user_exp FROM user WHERE bakjoon_id=?`;
        const [userRows] = await conn.execute(sql, [req.user.id]);

        if (userRows.length === 0) {
            return res.json({ result: 'fail', message: '사용자를 찾을 수 없습니다.' });
        }

        const user = userRows[0];

        // 레벨, 경험치 계산
        user_level = Math.floor(user.user_exp / 100) + 1;
        user_cur_exp = user.user_exp % 100;
        user_need_exp = 100 - user_cur_exp;

        // 푼 문제 수 조회
        sql = `SELECT COUNT(*) as count FROM resolved WHERE bakjoon_id=? AND success=?`;
        const [resolvedRows] = await conn.execute(sql, [req.user.id, 1]);

        const resolvedCount = resolvedRows[0].count || 0;

        // 결과 리턴
        return res.json({
            result: 'success',
            nickName: user.nick_name,
            curPokeId: user.cur_poke_id,
            resolvedCount: resolvedCount,
            userLevel : user_level,
            userCurExp : user_cur_exp,
            userNeedExp : user_need_exp
        });
    }
    catch (error) {
        console.error(error);
        return res.json({ result: 'fail', message: '오류가 발생했습니다.' });
    }
    finally {
        if (conn) {
            await conn.end(); // 연결 종료
        }
    }
};


// 7. 현재 포켓몬 변경 => 완성
exports.changeMonster = async function(req, res) {

    let conn;
    try {
        // 선택된 포켓몬 ID
        const pok_id = req.body.pok_id;

        // 데이터베이스 연결
        conn = await createConnection();

        // 선택된 포켓몬을 소유하고 있는지 확인
        let sql = `SELECT * FROM book WHERE bakjoon_id=? AND poke_id=?`;
        const [bookRows] = await conn.execute(sql, [req.user.id, pok_id]);

        if (bookRows.length === 0) {
            return res.json({ result: 'fail', message: '소유하지 않은 포켓몬' });
        }

        // 포켓몬 변경
        sql = `UPDATE user SET cur_poke_id=? WHERE bakjoon_id=?`;
        await conn.execute(sql, [pok_id, req.user.id]);

        // 성공 응답 반환
        return res.json({ result: 'success', message: '포켓몬 변경 완료' });
    }
    catch (error) {
        console.error(error);
        return res.json({ result: 'fail', message: '오류가 발생했습니다.' });
    }
    finally {
        if (conn) {
            await conn.end(); // 연결 종료
        }
    }
};


// 8. 닉네임 수정 => 완성
exports.changeNickName = async function(req, res) {

    let conn;
    try {
        // 닉네임 수정
        const nickName = req.body.nickName;

        // 데이터베이스 연결
        conn = await createConnection();

        let sql = `UPDATE user SET nick_name=? WHERE bakjoon_id=?`;
        await conn.execute(sql, [nickName, req.user.id]);

        // 성공 응답 반환
        return res.json({ result: 'success', message: '닉네임 수정 완료' });
    }
    catch (error) {
        console.error(error);
        return res.json({ result: 'fail', message: '오류가 발생했습니다.' });
    }
    finally {
        if (conn) {
            await conn.end(); // 연결 종료
        }
    }
};

// 32. 사용자가 푼 문제 + 획득 크레딧/경험치 및 기타정보 주기 => 완성
exports.resolvedProblems = async function(req, res) {

    let conn;
    try {
        // 데이터베이스 연결
        conn = await createConnection();
        
        // 문제번호, 크레딧, 경험치, 푼날짜, 경과시간, 제한시간
        let sql = `SELECT problem_id, get_credit, resolved_date, get_Exp, elapsed_time, limit_time, problem_title FROM resolved WHERE bakjoon_id=? AND success=?`;
        const [result] = await conn.execute(sql, [req.user.id, 1]);

        if(result.length === 0) {
            return res.json({result : 'fail', message : '해결한 문제가 없습니다.'})
        }

        console.log(result[0].resolved_date);
        result[0].resolved_date = result[0].resolved_date.toISOString().split('T')[0];

        return res.json({result : 'success', resolvedProblems : result});

    }
    catch(error) {
        console.error(error);
        return res.json({ result: 'fail', message: '오류가 발생했습니다.', error: error });
    }
    finally {
        if(conn) {
            await conn.end();
        }
    }
}