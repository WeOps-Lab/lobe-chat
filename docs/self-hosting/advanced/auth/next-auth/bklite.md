# BkLite Authentication Provider

这是一个自定义的 Next.js Auth provider，支持用户名和密码登录。

## 环境变量配置

在你的 `.env.local` 文件中添加以下环境变量：

```bash
# 启用 NextAuth
NEXT_PUBLIC_ENABLE_NEXT_AUTH=1

# NextAuth 基础配置
NEXT_AUTH_SECRET=your-secret-key-here
NEXT_AUTH_SSO_PROVIDERS=bklite

# BkLite 配置
AUTH_BKLITE_API_URL=https://your-bklite-api.com/api/login
```

## 配置说明

### 必需的环境变量

| 环境变量 | 类型 | 描述 |
|---------|------|------|
| `NEXT_PUBLIC_ENABLE_NEXT_AUTH` | 必选 | 设置为 `1` 启用 NextAuth |
| `NEXT_AUTH_SECRET` | 必选 | 用于加密会话令牌的密钥，可使用 `openssl rand -base64 32` 生成 |
| `NEXT_AUTH_SSO_PROVIDERS` | 必选 | 设置为 `bklite` 或包含 `bklite` 的逗号分隔列表 |
| `AUTH_BKLITE_API_URL` | 必选 | BkLite 登录 API 的完整 URL |

### API 接口要求

BkLite 登录 API 应该接受 POST 请求，请求体格式：

```json
{
  "username": "用户名",
  "password": "密码"
}
```

成功响应格式：

```json
{
  "success": true,
  "user": {
    "id": "用户唯一ID",
    "username": "用户名",
    "email": "用户邮箱（可选）",
    "name": "显示名称（可选）"
  }
}
```

失败响应格式：

```json
{
  "success": false,
  "message": "错误信息"
}
```

## 使用方式

1. **登录页面**: 用户访问 `/next-auth/signin` 时会看到 BkLite 登录选项
2. **自动弹窗**: 如果只配置了 bklite provider，未登录用户会自动弹出登录表单
3. **自定义表单**: 点击 BkLite 登录按钮会显示用户名和密码输入表单

## 功能特性

- ✅ 用户名和密码登录
- ✅ 自定义登录表单
- ✅ 自动登录弹窗
- ✅ 错误处理和用户反馈
- ✅ 与 NextAuth 会话管理集成
- ✅ 支持多 provider 配置

## 示例配置

### 单独使用 BkLite

```bash
NEXT_AUTH_SSO_PROVIDERS=bklite
```

### 与其他 provider 混合使用

```bash
NEXT_AUTH_SSO_PROVIDERS=bklite,github,google
```

## 安全注意事项

1. 确保 `AUTH_BKLITE_API_URL` 使用 HTTPS
2. `NEXT_AUTH_SECRET` 应该是强随机字符串
3. BkLite API 应该实现适当的速率限制和安全措施
4. 建议在生产环境中使用环境变量管理工具