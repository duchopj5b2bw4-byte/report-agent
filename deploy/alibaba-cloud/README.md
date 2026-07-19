# Alibaba Cloud deployment proof

ReportAgent uses three Alibaba Cloud Qwen services in `lib/qwen.ts`:

- `qwen3.7-plus` for multimodal understanding and report reasoning.
- `text-embedding-v3` for semantic memory retrieval.
- `qwen3-tts-flash` for report narration.

The included `s.yaml` deploys the Dockerized Next.js backend as an Alibaba Cloud Function Compute 3.0 custom-container function. Before deployment:

1. Create an ACR repository in `ap-southeast-1`.
2. Replace `REPLACE_NAMESPACE` in `s.yaml`.
3. Configure Serverless Devs access and store `DASHSCOPE_API_KEY` as an encrypted Function Compute environment variable.
4. From this directory run `s deploy -y`.

The API key is intentionally never stored in source control.
