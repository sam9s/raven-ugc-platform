# Workflow Analysis

Total Nodes: 35

1. **Webhook Trigger**
   - Type: n8n-nodes-base.webhook
   - ID: webhook-trigger
   - Path: /webhook/ugc-video-generate
   - Method: POST

2. **Validate API Key**
   - Type: n8n-nodes-base.if
   - ID: validate-api-key

3. **Respond 401 Unauthorized**
   - Type: n8n-nodes-base.respondToWebhook
   - ID: respond-401

4. **Validate Fields**
   - Type: n8n-nodes-base.code
   - ID: code-validate-fields

5. **Check Fields Valid**
   - Type: n8n-nodes-base.if
   - ID: if-fields-valid

6. **Respond 400 Bad Request**
   - Type: n8n-nodes-base.respondToWebhook
   - ID: respond-400

7. **Deduct Credit**
   - Type: n8n-nodes-base.httpRequest
   - ID: http-deduct-credit
   - URL: https://crgbmbotbmzfibzupdhi.supabase.co/rest/v1/rpc/deduct_credit
   - Method: POST

8. **Check Credit Result**
   - Type: n8n-nodes-base.code
   - ID: code-check-credit

9. **Credit Deducted?**
   - Type: n8n-nodes-base.if
   - ID: if-credit-success

10. **Respond 402 No Credits**
   - Type: n8n-nodes-base.respondToWebhook
   - ID: respond-402

11. **Generate Image Prompt**
   - Type: n8n-nodes-base.httpRequest
   - ID: http-openai-image-prompt
   - URL: https://api.openai.com/v1/chat/completions
   - Method: POST

12. **Extract Image Prompt**
   - Type: n8n-nodes-base.code
   - ID: code-extract-prompt

13. **Generate Image - KIE.AI**
   - Type: n8n-nodes-base.httpRequest
   - ID: http-kie-image
   - URL: https://api.kie.ai/api/v1/flux/kontext/generate
   - Method: POST

14. **Get Image Task ID**
   - Type: n8n-nodes-base.code
   - ID: code-get-image-task

15. **Wait for Image**
   - Type: n8n-nodes-base.wait
   - ID: wait-image
   - Duration: 10 undefined

16. **Poll Image Status**
   - Type: n8n-nodes-base.httpRequest
   - ID: http-poll-image
   - URL: ={{ 'https://api.kie.ai/api/v1/flux/kontext/record-info?taskId=' + $json.imageTaskId }}
   - Method: undefined

17. **Check Image Status**
   - Type: n8n-nodes-base.code
   - ID: code-check-image

18. **Image Ready?**
   - Type: n8n-nodes-base.if
   - ID: if-image-ready

19. **Analyze Image - OpenAI**
   - Type: n8n-nodes-base.httpRequest
   - ID: http-openai-vision
   - URL: https://api.openai.com/v1/chat/completions
   - Method: POST

20. **Extract Video Prompt**
   - Type: n8n-nodes-base.code
   - ID: code-extract-video-prompt

21. **Generate Video - KIE.AI**
   - Type: n8n-nodes-base.httpRequest
   - ID: http-kie-video
   - URL: https://api.kie.ai/api/v1/veo/generate
   - Method: POST

22. **Get Video Task ID**
   - Type: n8n-nodes-base.code
   - ID: code-get-video-task

23. **Wait for Video**
   - Type: n8n-nodes-base.wait
   - ID: wait-video
   - Duration: 15 undefined

24. **Poll Video Status**
   - Type: n8n-nodes-base.httpRequest
   - ID: http-poll-video
   - URL: ={{ 'https://api.kie.ai/api/v1/jobs/recordInfo?taskId=' + $json.videoTaskId }}
   - Method: undefined

25. **Check Video Status**
   - Type: n8n-nodes-base.code
   - ID: code-check-video

26. **Video Ready?**
   - Type: n8n-nodes-base.if
   - ID: if-video-ready

27. **Update Video Record**
   - Type: n8n-nodes-base.httpRequest
   - ID: http-update-db
   - URL: ={{ 'https://crgbmbotbmzfibzupdhi.supabase.co/rest/v1/videos?id=eq.' + $json.body.video_id }}
   - Method: PATCH

28. **Respond Success**
   - Type: n8n-nodes-base.respondToWebhook
   - ID: respond-success

29. **Check if Refund Needed**
   - Type: n8n-nodes-base.code
   - ID: code-check-refund

30. **Needs Refund?**
   - Type: n8n-nodes-base.if
   - ID: if-needs-refund

31. **Execute Refund**
   - Type: n8n-nodes-base.httpRequest
   - ID: http-do-refund
   - URL: https://crgbmbotbmzfibzupdhi.supabase.co/rest/v1/rpc/refund_credit
   - Method: POST

32. **Image Generation Failed?**
   - Type: n8n-nodes-base.if
   - ID: if-image-has-error

33. **Update Failed Status**
   - Type: n8n-nodes-base.httpRequest
   - ID: http-update-failed-image
   - URL: ={{ 'https://crgbmbotbmzfibzupdhi.supabase.co/rest/v1/videos?id=eq.' + $json.body.video_id }}
   - Method: PATCH

34. **Refund Credit (Image Failed)**
   - Type: n8n-nodes-base.httpRequest
   - ID: http-refund-image-fail
   - URL: https://crgbmbotbmzfibzupdhi.supabase.co/rest/v1/rpc/refund_credit
   - Method: POST

35. **Respond Image Failed**
   - Type: n8n-nodes-base.respondToWebhook
   - ID: respond-image-failed


## Connections

Webhook Trigger -> Validate API Key
Validate API Key -> Validate Fields
Validate API Key -> Respond 401 Unauthorized
Validate Fields -> Check Fields Valid
Check Fields Valid -> Deduct Credit
Check Fields Valid -> Respond 400 Bad Request
Deduct Credit -> Check Credit Result
Check Credit Result -> Credit Deducted?
Credit Deducted? -> Generate Image Prompt
Credit Deducted? -> Respond 402 No Credits
Generate Image Prompt -> Extract Image Prompt
Extract Image Prompt -> Generate Image - KIE.AI
Generate Image - KIE.AI -> Get Image Task ID
Get Image Task ID -> Wait for Image
Wait for Image -> Poll Image Status
Poll Image Status -> Check Image Status
Check Image Status -> Image Ready?
Image Ready? -> Image Generation Failed?
Image Ready? -> Wait for Image
Analyze Image - OpenAI -> Extract Video Prompt
Extract Video Prompt -> Generate Video - KIE.AI
Generate Video - KIE.AI -> Get Video Task ID
Get Video Task ID -> Wait for Video
Wait for Video -> Poll Video Status
Poll Video Status -> Check Video Status
Check Video Status -> Video Ready?
Video Ready? -> Update Video Record
Video Ready? -> Wait for Video
Update Video Record -> Check if Refund Needed
Check if Refund Needed -> Needs Refund?
Needs Refund? -> Execute Refund
Needs Refund? -> Respond Success
Execute Refund -> Respond Success
Image Generation Failed? -> Update Failed Status
Image Generation Failed? -> Analyze Image - OpenAI
Update Failed Status -> Refund Credit (Image Failed)
Refund Credit (Image Failed) -> Respond Image Failed
