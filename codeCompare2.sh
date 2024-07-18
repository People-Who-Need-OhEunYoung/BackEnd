#!/bin/bash

userCodePath="/tmp/$1"
encodedTestCaseJson=$2
inputFilePath="/tmp/test_input_case.txt"
outputFilePath="/tmp/test_output_case.txt"

# JSON 문자열 디코딩
testCaseJson=$(echo "$encodedTestCaseJson" | python3 -c "import sys, urllib.parse as ul; print(ul.unquote(sys.stdin.read()))")

result=""
i=1

# 각 테스트 케이스 처리
while read -r testCase; do
    input_case=$(echo "$testCase" | jq -r '.input_case')
    output_case=$(echo "$testCase" | jq -r '.output_case')

    # 입력값을 파일로 저장
    echo -e "$input_case" > "$inputFilePath"
    echo -e "$output_case" > "$outputFilePath"

    userResult=$(python3.11 "$userCodePath" < "$inputFilePath" 2>&1)
    exitCode=$?

    if [ $exitCode -eq 0 ]; then
        if [ "$userResult" == "$(cat $outputFilePath)" ]; then
            result+="$i번 케이스 결과 : $userResult\n기댓값 : $(cat $outputFilePath)\n정답입니다!\n\n"
        else
            result+="$i번 케이스 결과 : $userResult\n기댓값 : $(cat $outputFilePath)\n오답입니다.\n\n"
        fi
    else
        result+="$i번 케이스 오류 발생: $userResult\n"
    fi

    i=$((i+1))
done < <(echo "$testCaseJson" | jq -c '.[]')

echo -e "$result"