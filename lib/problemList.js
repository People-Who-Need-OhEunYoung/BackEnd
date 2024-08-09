const createConnection = require('./db2');

// 31. 문제 출력 => 완성
exports.problemList = async function(req, res) {
    
    let conn;
    try {
        // 데이터베이스 연결
        conn = await createConnection();

        const title = req.query.query // 검색어 (없으면 전부 보여줌)
        const order = req.query.direction // asc/desc 오름/내림차순
        const page = parseInt(req.query.page) || 1;  // 요청 페이지
        const sort = req.query.sort // 정렬기준 컬럼
        const itemsPerPage = 50;  // 페이지당 항목 수

        // 제목과 type 컬럼을 동시에 검색하는 쿼리
        const sql = `SELECT * FROM problem WHERE (title LIKE ? OR type LIKE ?) ORDER BY ${sort} ${order}`;
        const [result] = await conn.execute(sql, [`%${title}%`, `%${title}%`]);

        if(result.length === 0) {
            return res.json({ result: 'fail', message: '문제가 존재하지 않습니다.' });
        }

        // 페이지 번호에 따른 데이터 잘라내기
        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedResult = result.slice(startIndex, endIndex);

        // 전체 페이지 수 계산
        const totalPages = Math.ceil(result.length / itemsPerPage);

        return res.json({
            result: 'success',
            problem: paginatedResult,
            totalPages: totalPages,
            currentPage: page
        });
    }
    catch(error) {
        return res.json({ result: 'fail', message: '오류가 발생했습니다.', error: error });
    }
    finally {
        if(conn) {
            await conn.end();
        }
    }
}
