## 该项目是借助manius开发Nextjs小项目
# 用于计数，计算日期或者是倒数
# 项目并没有用户登录注册
数据库是：UPSTASH

# [read.me](https://github.com/bactdt/cdhost/blob/main/README.md)
# [ios版本](https://github.com/bactdt/contcd)
----
demo

[作者部署的版本](https://cdhost.vercel.app)

![一](https://raw.githubusercontent.com/bactdt/cdhost/refs/heads/main/Png/%E6%88%AA%E5%B1%8F2025-05-16%2017.49.09.png)
![添加](https://raw.githubusercontent.com/bactdt/cdhost/refs/heads/main/Png/%E6%88%AA%E5%B1%8F2025-05-16%2017.48.42.png)

[demo](https://xonplgjx.manus.space)
-----
# .env
```
UPSTASH_REDIS_REST_URL="https://concrete.upstash.io"
UPSTASH_REDIS_REST_TOKEN="你的密钥"
NEXT_PUBLIC_CLERK_SIGN_UP_URL = /sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL = /
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL =/
NEXT_PUBLIC_CLERK_SIGN_IN_URL = /sign-in
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk //登录功能采用clerk集成
CLERK_SECRET_KEY= clerk密钥
# NextAuth.js Credentials (if using next-auth)
# Example for GitHub provider
# GITHUB_ID="your_github_oauth_client_id"
# GITHUB_SECRET="your_github_oauth_client_secret"

# NEXTAUTH_URL is automatically set by Vercel, but you might need it for local development
# NEXTAUTH_URL="http://localhost:3000"
# A random string used to hash tokens, sign cookies and generate cryptographic keys.
NEXTAUTH_SECRET="your_super_secret_nextauth_secret_here"

```
