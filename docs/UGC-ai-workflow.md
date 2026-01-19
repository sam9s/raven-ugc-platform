# AI-Powered UGC Video Generation Workflow

**Version:** v1.0\
**Purpose:** End-to-end documentation for generating UGC-style video ads using user input, OpenAI API, and n8n automation.

***

## 1. Objective (Plain English)

The goal of this system is to:

1. Collect simple product information from a user (via a frontend form)
2. Use that information to automatically generate a high-converting UGC video script using the OpenAI API
3. Send that script into an n8n workflow
4. Automatically produce a short-form UGC-style video for social media platforms

This entire process is designed to be:

* Fully automated

* Repeatable for any product

* Easy for non-technical users

***

## 2. High-Level System Architecture

Frontend (User Form)

↓

OpenAI API (UGC Script Generator)

↓

n8n Automation Workflow

↓

UGC Video Output (TikTok, Reels, Shorts, etc.)

***

## 3. Core Design Principle

**The questions NEVER change.\
Only the answers change.**

This allows:

* A single frontend form

* A single system prompt

* Infinite products and videos

***

## 4. Frontend Input Schema (Canonical)

The frontend should collect the following **13 structured parameters**.

These fields are universal and work for any product or service.

```json
{
  "product_name": "",
  "product_category": "",
  "target_audience": "",
  "primary_pain_point": "",
  "dream_outcome": "",
  "unique_mechanism": "",
  "social_proof": "",
  "ease_of_use": "",
  "time_to_results": "",
  "offer_or_cta": "",
  "platforms": [],
  "tone": "",
  "video_length": ""
}

```

## 5. Tooltip Explanations (CRITICAL FOR NON-TECH USERS)

These tooltips should appear next to each input field in the frontend UI.

### 1. `product_name`

**Tooltip:**\
What is the name of the product or service you are selling?

**Example:**\
“Teeth Whitening Strips”

***

### 2. `product_category`

**Tooltip:**\
What type of product is this? (Helps the AI understand context.)

**Example:**\
“Beauty”, “Fitness”, “Software”, “Health”

***

### 3. `target_audience`

**Tooltip:**\
Who is this product for? Be as specific as possible.

**Example:**\
“Women aged 25–40 who drink coffee daily”

***

### 4. `primary_pain_point`

**Tooltip:**\
What problem is the customer actively trying to solve?

**Example:**\
“Yellow teeth caused by coffee and wine”

***

### 5. `dream_outcome`

**Tooltip:**\
What is the *ideal end result* the customer wants after using this product?

> This is NOT a feature.\
> This is how they want to *feel* or *look*.

**Example:**\
“Confidently smiling with visibly whiter teeth”

***

### 6. `unique_mechanism`

**Tooltip:**\
What makes this product different from other solutions?

> This answers:\
> “Why does THIS work when other things don’t?”

**Example:**\
“Enamel-safe whitening formula designed for daily coffee drinkers”

***

### 7. `social_proof`

**Tooltip:**\
Any proof that shows other people trust or use this product.

**Example:**\
“10,000+ five-star reviews”\
“As seen on Instagram”\
“Used by 50,000+ customers”

***

### 8. `ease_of_use`

**Tooltip:**\
How easy is it to use? Describe it in the simplest possible way.

**Example:**\
“Peel, stick, wait 30 minutes”

***

### 9. `time_to_results`

**Tooltip:**\
How quickly can users expect to see results?

**Example:**\
“Visible results in 3 days”

***

### 10. `offer_or_cta`

**Tooltip:**\
What should the viewer do after watching the video?

**Example:**\
“Shop now”\
“Try it risk-free”\
“Get 20% off today”

***

### 11. `platforms`

**Tooltip:**\
Where will this video be published?

**Example:**

* TikTok

* Instagram Reels

* YouTube Shorts

* Facebook Reels

(Default: All short-form platforms)

***

### 12. `tone`

**Tooltip:**\
How should the video sound?

**Example:**

* Casual

* Creator-style

* Educational

* Bold

* Relatable

(Default: Authentic UGC / creator-style)

***

### 13. `video_length`

**Tooltip:**\
How long should the video be?

**Example:**\
“20–30 seconds”\
“30–45 seconds”

***

## 6. OpenAI API Prompt Strategy

### System Prompt (Static – Never Changes)

This prompt defines the behavior of the AI.

You are a UGC video script generator for paid social ads.

Always follow this structure:

1. Hook (0–3 seconds)
2. Dream outcome
3. Likelihood of success (social proof)
4. Ease of use
5. Speed to results
6. Clear call-to-action

Rules:

* Sound like a real creator, not a brand

* Optimize for vertical short-form video

* Assume cold traffic

* Use simple, spoken language

* No emojis

* No hashtags

### User Prompt (Dynamic – From Frontend)

The frontend injects user answers into this prompt.

Generate a UGC video script using the following inputs:

Product Name: {{product\_name}}

Category: {{product\_category}}

Audience: {{target\_audience}}

Pain Point: {{primary\_pain\_point}}

Dream Outcome: {{dream\_outcome}}

Unique Mechanism: {{unique\_mechanism}}

Social Proof: {{social\_proof}}

Ease of Use: {{ease\_of\_use}}

Time to Results: {{time\_to\_results}}

CTA: {{offer\_or\_cta}}

Platforms: {{platforms}}

Tone: {{tone}}

Video Length: {{video\_length}}

<br />

## 7. Expected AI Output (Structured for Automation)

The OpenAI API should return **structured JSON**, not free text.

```
{
  "hook": "",
  "script_sections": {
    "dream_outcome": "",
    "social_proof": "",
    "ease": "",
    "speed": ""
  },
  "cta": "",
  "hook_variations": []
}
```

<br />

This structure allows n8n to:

 

* Assign voiceovers
* Sync captions
* Create multiple video variants

***

## 8. n8n Workflow Role

n8n receives:

* Script text
* Script sections
* Hook variations

n8n can then:

* Generate AI voice
* Match b-roll
* Add subtitles
* Render final videos
* Export or publish

***

## 9. Final Notes

* This system is fully scalable
* One frontend → infinite videos
* One prompt → infinite products
* One automation → consistent quality

This document should be treated as the **single source of truth** for:

* Frontend development
* Prompt engineering
* Automation logic
* AI video generation


---

