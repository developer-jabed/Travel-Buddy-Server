 set -o errexit

 npm install
 npm run build
 npx prisma generate
 npx prisma migrate deploy