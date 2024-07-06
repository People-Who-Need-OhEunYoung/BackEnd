#!/bin/bash
# $1 -> 사용자 코드
# $2 -> 문제번호
#

result=""
i=1
inputPath="/home/ubuntu/nodejs/pokecode/testCase/$2"

# 디렉터리 존재여부 확인(문제번호 존재여부 확인)
if [ ! -d "$inputPath" ]; then
    echo "\"$2\"번 문제는 채점할 수 없습니다. 테스트용 데이터가 존재하지 않습니다."
    exit 0
fi


# 모든 inputdata를 넣고 실행하여 결과를 result에 저장한다
for inputdata in "$inputPath"/inputdata*; do
		
        outputdata="/home/ubuntu/nodejs/pokecode/testCase/$2/outputdata$i"
		
        userResult=$(python3.11 -c "$1" < "$inputdata" 2>&1) # 사용자 코드 실행
		exitCode=$?

		# 실행 중 오류났으면 오류메시지 출력
		if [ $exitCode -eq 0 ]; then
        	expectedOutput=$(cat "$outputdata")
        
			if [ "$userResult" == "$expectedOutput" ]; then
				result+="$i번 케이스 결과 : $userResult\n기댓값 : $expectedOutput\n정답입니다!\n\n"
			else
				result+="$i번 케이스 결과 : $userResult\n기댓값 : $expectedOutput\n오답입니다.\n\n"
			fi

		else
			result+="$i번 케이스 오류 발생: $userResult\n"
		fi

		i=$((i+1))
done

echo -e "$result"
