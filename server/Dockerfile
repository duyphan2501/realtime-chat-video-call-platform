# Stage 1: Dependencies (Install once)
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
# Cài đặt tất cả để phục vụ việc build (nếu có TS)
RUN npm ci

# Stage 2: Build (Dành cho TS hoặc các bước xử lý code)
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# RUN npm run build # Nếu có bước biên dịch code

# Stage 3: Runner (Sạch và Nhẹ)
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 expressjs

# TỐI ƯU TẠI ĐÂY: Thay vì chạy 'npm ci' lần nữa, ta chỉ copy code và node_modules cần thiết
# Nếu bạn có bước build, hãy copy thư mục /dist và các file cần chạy
COPY --from=builder /app ./ 

# Loại bỏ devDependencies ngay trong layer này để giảm dung lượng image cuối
RUN npm prune --production

RUN chown -R expressjs:nodejs /app
USER expressjs

EXPOSE 8000
ENV PORT 8000

CMD ["node", "index.js"]
