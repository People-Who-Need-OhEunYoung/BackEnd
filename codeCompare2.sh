#!/bin/bash
# $1 -> 사용자 코드 파일명
# $2 -> 추가 테스트 케이스 배열

result=""
i=1
userCodePath="/home/ubuntu/nodejs/pokecode/userCode/$1"
testCaseJson=$2

testCase=$(echo "$testCaseJson" | jq -c '.[]')

# 각 테스트 케이스 처리
for testCase in $testCases; do
    input_case=$(echo "$testCase" | jq -r '.input_case')
    output_case=$(echo "$testCase" | jq -r '.output_case')

    userResult=$(python3.11 "$userCodePath" <<< "$input_case" 2>&1)
    exitCode=$?

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
done

echo -e "$result"