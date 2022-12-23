## aws-node-serverless-kinesis-consumer-lambda

Stripe の Webhook を、API Gateway→Lambda→Kinesis で構築するサーバレスアプリケーション

### 前提条件

- SSM パラメータストア
  - /stripe_webhook_production/stripe_secret_key
- Kinesis Data Stream
  - kinesis-internal-events-production
