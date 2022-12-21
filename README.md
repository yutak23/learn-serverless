## aws-node-serverless-stripe-webhook

Stripe の Webhook を、API Gateway→Lambda→Kinesis で構築するサーバレスアプリケーション

### 前提条件

- SSM パラメータストア
  - /stripe_webhook_production/stripe_secret_key
  - /stripe_webhook_production/stripe_endpoint_secret
- Kinesis Data Stream
  - kinesis-internal-events-production
