FROM node:20-alpine

WORKDIR /app

# 1. Tối ưu Cache: Chỉ cài lại thư viện khi file package.json thay đổi
COPY package*.json ./
RUN npm install --production

# 2. Copy code (nên dùng .dockerignore để bỏ qua node_modules từ máy bạn)
COPY . .

# 3. Bảo mật: Không chạy bằng quyền root
RUN addgroup -S nodejs && adduser -S expressjs -G nodejs
RUN chown -R expressjs:nodejs /app
USER expressjs

EXPOSE 3001

# 4. Chạy trực tiếp bằng node (nhanh và ổn định nhất)
CMD ["node", "index.js"]
