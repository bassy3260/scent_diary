# 1단계: 빌드
FROM node:18-alpine AS build-stage

# 컨테이너 내 작업 디렉토리 설정
WORKDIR /app

# 의존성 파일만 먼저 복사하여 캐싱 활용 (빌드 속도 향상)
COPY package*.json ./
RUN npm install

# 나머지 소스 코드 복사
COPY . .

# 프로젝트 빌드 (결과물 ./dist 폴더에 생성)
RUN npm run build

# 2단계: 실행 스테이지 (Nginx 환경)
FROM nginx:stable-alpine

# 빌드된 파일만 Nginx의 웹 루트로 복사
COPY --from=build-stage /app/dist /usr/share/nginx/html

# Nginx 설정 파일(default.conf)을 컨테이너 안으로 복사
COPY default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

# Nginx 실행 (컨테이너가 종료되지 않도록 foreground에서 실행)
CMD ["nginx", "-g", "daemon off;"]