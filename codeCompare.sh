#!/bin/bash
# $1 -> 사용자 코드 파일명
# $2 -> 문제번호

# .env 파일을 읽어들여 환경변수 설정
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs | tr -d '\r')
fi

# 문제번호 앞뒤 공백 및 개행문자 제거
problem_id=$(echo "$2" | tr -d '\n' | tr -d ' ')

# 문제번호 존재여부 확인을 위한 쿼리 실행
sql="SELECT input_case, output_case FROM problem_tc WHERE id=$problem_id;"
test_cases=$(mysql -h "$DB_HOST" -u "$DB_USERNAME" -p"$DB_PASSWORD" "$DB_NAME" -se "$sql")

# 쿼리 결과가 비어있으면 문제번호가 존재하지 않는 것
if [ -z "$test_cases" ]; then
    echo "\"$problem_id\"번 문제는 채점할 수 없습니다. 테스트용 데이터가 존재하지 않습니다."
    exit 0
fi

result=""
i=1
userCodePath="/home/ubuntu/nodejs/pokecode/userCode/$1"

# 쿼리 결과를 한 줄씩 처리
while IFS=$'\t' read -r input_case output_case; do
    userResult=$(python3.11 "$userCodePath" <<< "$input_case" 2>&1) # 사용자 코드 실행
    exitCode=$?

    # 실행 중 오류났으면 오류메시지 출력
    if [ $exitCode -eq 0 ]; then
        if [ "$userResult" == "$output_case" ]; then
            result+="$i번 케이스 결과 : $userResult\n기댓값 : $output_case\n정답입니다!\n\n"
        else
            result+="$i번 케이스 결과 : $userResult\n기댓값 : $output_case\n오답입니다.\n\n"
        fi
    else
        result+="$i번 케이스 오류 발생: $userResult\n"
    fi

    i=$((i+1))
done <<< "$test_cases"

echo -e "$result"
