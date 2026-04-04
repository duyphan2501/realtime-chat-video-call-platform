# Stage 1: Install dependencies
FROM node:20-alpine AS bds
RUN apk add --no-cache libc6-compat
RUN apk add --no-cache curl

WORKDIR /app

# Copy các file định nghĩa thư viện
COPY package.json package-lock.json* ./

# Cài đặt tất cả dependencies (bao gồm cả devDependencies để build nếu cần)
RUN npm ci

# Stage 2: Build (Nếu bạn dùng TypeScript hoặc Babel)
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=bds /app/node_modules ./node_modules
COPY . .

# Nếu bạn dùng TypeScript, hãy uncomment dòng dưới đây
# RUN npm run build 

# Stage 3: Production (Runner)
FROM node:20-alpine AS runner
WORKDIR /app

# Thiết lập biến môi trường
ENV NODE_ENV production

# Tạo user node để bảo mật (tránh dùng root)
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 expressjs

# Chỉ cài đặt các dependencies cần cho runtime (loại bỏ devDependencies)
COPY package.json package-lock.json* ./
RUN npm ci --only=production

# Copy mã nguồn từ Stage 2 (Hoặc copy thư mục dist nếu build TS)
COPY --from=builder /app ./ 

# Thay đổi quyền sở hữu thư mục app cho user expressjs
RUN chown -R expressjs:nodejs /app

USER expressjs

EXPOSE 8000
ENV PORT 8000

# Lệnh chạy ứng dụng
CMD ["node", "index.js"]