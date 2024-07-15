#!/bin/bash
# $1 -> 사용자 코드 파일명
# $2 -> 문제번호


result=""
i=1
userCodePath="/home/ubuntu/nodejs/pokecode/userCode/$1"

DB_HOST="localhost"
DB_USER="sunkue"
DB_PASS="Tjsrb123!@"
DB_NAME="myweapon"

# 문제번호 존재여부 확인을 위한 쿼리 실행
sql="SELECT input_case, output_case FROM problem_tc WHERE id=$2;"
test_cases=$(mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -se "$sql")

# 쿼리 결과가 비어있으면 문제번호가 존재하지 않는 것
if [ -z "$test_cases" ]; then
    echo "\"$2\"번 문제는 채점할 수 없습니다. 테스트용 데이터가 존재하지 않습니다."
    exit 0
fi


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