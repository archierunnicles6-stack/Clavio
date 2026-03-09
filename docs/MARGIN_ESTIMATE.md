# Clavio Margin & API Cost Estimate

## Current Setup (85% margin target)

| Feature | Model | Your Token Cost |
|---------|-------|-----------------|
| Generation (16 posts) | `gpt-4o` | 20 tokens |
| AI Chat | `gpt-4o-mini` | 3 tokens |

**Limits:** 2,040 tokens/month (≈102 generations, ~3/day) or 12,720/year (≈636 gen/yr)

---

## API Cost Per Call (Estimated)

### Generation (16 LinkedIn posts)

| Component | Est. Tokens | GPT-4 (legacy) | GPT-4o (in use) |
|-----------|-------------|----------------|-----------------|
| Input (system + user) | ~1,300 | $0.039 | $0.003 |
| Output (16 posts) | ~3,000 | $0.180 | $0.030 |
| **Total per generation** | **~4,300** | **~$0.22** | **~$0.033** |

*GPT-4: $30/1M input, $60/1M output | GPT-4o: $2.50/1M input, $10/1M output*

### AI Chat (1 message)

| Component | Est. Tokens | GPT-4o-mini |
|-----------|-------------|-------------|
| Input | ~600 | $0.00009 |
| Output | ~300 | $0.00018 |
| **Total per chat** | **~900** | **~$0.0003** |

*GPT-4o-mini: $0.15/1M input, $0.60/1M output — effectively negligible*

---

## Margin Scenarios (Monthly Plan £17.99 ≈ $22.50)

### Worst case: 180 generations at GPT-4 pricing
- **API cost:** 180 × $0.22 = **$39.60**
- **Revenue:** $22.50
- **Margin:** **-$17.10 (loss)**

### With GPT-4 Turbo (if available)
- **API cost:** 180 × $0.10 = **$18**
- **Revenue:** $22.50
- **Margin:** **~$4.50 (20%)**

### With GPT-4o (recommended)
- **API cost:** 180 × $0.033 = **$5.94**
- **Revenue:** $22.50
- **Margin:** **~$16.56 (74%)**

### Mixed usage (150 gen + 500 chats)
- Gen: 150 × $0.033 = $4.95
- Chat: 500 × $0.0003 = $0.15
- **Total API:** ~$5.10
- **Margin:** ~$17.40 (77%)

---

## Token Limits (85% margin)

| Plan | Tokens | Generations | Max API cost | Margin |
|------|--------|-------------|--------------|--------|
| Monthly £17.99 | 2,040 | ~102 (~3/day) | ~$3.37 (15%) | 85% |
| Yearly £111.99 (discounted ~48%) | 12,720 | ~636 (~53/mo) | ~$21 (15%) | 85% |

*Yearly gets fewer tokens than 12× monthly (12,720 vs 24,480) to keep 85% margin on the discounted price.*

---

## Quick Reference: OpenAI Pricing (per 1M tokens)

| Model | Input | Output |
|-------|-------|--------|
| gpt-4 (legacy) | $30 | $60 |
| gpt-4-turbo | $10 | $30 |
| gpt-4o | $2.50 | $10 |
| gpt-4o-mini | $0.15 | $0.60 |

---

## Scenario: 500 Monthly Users

**Usage per user:**
- 3 post generations/day
- 6 AI chats/day

**Monthly totals:**
- Generations: 500 × 3 × 30 = **45,000**
- Chats: 500 × 6 × 30 = **90,000**

*(2,040 tokens ≈ 102 gen or ~3/day. Heavier users hit limit; cap keeps 85% margin.)*

### Revenue
| Item | Amount |
|------|--------|
| 500 × £17.99 | **£8,995/month** |
| At $1.25/£ | **~$11,244/month** |

### API Costs

| Scenario | Generation Cost | Chat Cost | **Total API** |
|----------|-----------------|-----------|---------------|
| **gpt-4 (current)** | 45,000 × $0.22 = $9,900 | 90,000 × $0.0003 = $27 | **$9,927** |
| **gpt-4o (recommended)** | 45,000 × $0.033 = $1,485 | 90,000 × $0.0003 = $27 | **$1,512** |

### Other Costs (rough)
| Item | Est. monthly |
|------|--------------|
| Supabase | ~$25–75 |
| Vercel/hosting | ~$20–50 |
| Stripe fees (2.9% + 20p) | ~£260 |
| **Total infra** | **~$400** |

### Net Result

|  | gpt-4 (old) | gpt-4o (in use) |
|--|--------------|-----------------|
| Revenue | $11,244 | $11,244 |
| API | -$9,927 | -$1,512 |
| Infra | -$400 | -$400 |
| **Profit** | ~$917 (8%) | **~$9,332** (83%) |

*With 2,040 tokens/user, max API cost = 500 × 102 × $0.033 = $1,683 → 85% margin preserved.*
