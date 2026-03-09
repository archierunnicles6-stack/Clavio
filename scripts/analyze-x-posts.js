#!/usr/bin/env node
/**
 * Analyze thousands of real X posts via API to extract structural patterns.
 * Outputs analysis used to optimize Clavio's AI prompts.
 * Requires: X_BEARER_TOKEN in .env (or use --offline for research baseline)
 *
 * Usage:
 *   npm run analyze:posts        # Try API, fallback to baseline on 401
 *   npm run analyze:posts -- --offline   # Skip API, use research baseline only
 */
const fs = require('fs');
const path = require('path');

const OFFLINE = process.argv.includes('--offline');

function loadEnv() {
  for (const file of ['.env.local', '.env']) {
    const p = path.join(process.cwd(), file);
    if (fs.existsSync(p)) {
      for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
        const m = line.match(/^([^#=]+)=(.*)$/);
        if (m && !process.env[m[1].trim()]) {
          process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
        }
      }
    }
  }
}

loadEnv();

let BEARER = process.env.X_BEARER_TOKEN;
if (!BEARER && !OFFLINE) {
  console.error('Missing X_BEARER_TOKEN in .env. Use --offline for research baseline.');
  process.exit(1);
}
if (BEARER) {
  try {
    BEARER = decodeURIComponent(BEARER);
  } catch (_) {}
}

// Search queries - topics relevant to Clavio (founders, leadership, productivity)
const SEARCH_QUERIES = [
  'leadership -filter:retweets -filter:replies lang:en',
  'startup advice -filter:retweets -filter:replies lang:en',
  'productivity -filter:retweets -filter:replies lang:en',
  'founder -filter:retweets -filter:replies lang:en',
  'building in public -filter:retweets -filter:replies lang:en',
  'SaaS -filter:retweets -filter:replies lang:en',
  'remote work -filter:retweets -filter:replies lang:en',
  'marketing -filter:retweets -filter:replies lang:en',
  'AI tools -filter:retweets -filter:replies lang:en',
  'career advice -filter:retweets -filter:replies lang:en',
];

const MAX_TWEETS_PER_QUERY = 500;  // ~5 pages of 100
const TARGET_TOTAL = 3000;        // aim for thousands
const DELAY_MS = 1100;            // respect rate limits (~450/15min on Basic)

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function searchTweets(query, nextToken = null) {
  const params = new URLSearchParams({
    query,
    max_results: '100',
    'tweet.fields': 'public_metrics,created_at,text',
    'user.fields': 'public_metrics',
  });
  if (nextToken) params.set('next_token', nextToken);

  const res = await fetch(`https://api.twitter.com/2/tweets/search/recent?${params}`, {
    headers: { Authorization: `Bearer ${BEARER}` },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`X API ${res.status}: ${err}`);
  }

  return res.json();
}

function engagementScore(t) {
  const m = t.public_metrics || {};
  return (m.like_count || 0) + (m.retweet_count || 0) * 2 + (m.reply_count || 0);
}

function analyzeText(text) {
  if (!text) return {};
  const lines = text.split(/\n/).filter((l) => l.trim());
  const hook = lines[0] || text.slice(0, 210);
  const hookLen = hook.length;
  const totalChars = text.length;
  const totalWords = text.split(/\s+/).filter(Boolean).length;
  const lineBreakCount = (text.match(/\n/g) || []).length;
  const hashtags = (text.match(/#\w+/g) || []).length;
  const emojiCount = (text.match(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu) || []).length;
  const sentences = text.split(/[.!?]+/).filter(Boolean);
  const avgSentenceLength = sentences.length ? totalWords / sentences.length : 0;
  const sentenceLengths = sentences.map((s) => s.trim().split(/\s+/).filter(Boolean).length);
  const variance = sentenceLengths.length > 1
    ? sentenceLengths.reduce((a, n) => a + (n - avgSentenceLength) ** 2, 0) / sentenceLengths.length
    : 0;

  return {
    hookLength: hookLen,
    totalChars,
    totalWords,
    lineBreaks: lineBreakCount,
    linesPer100Chars: totalChars > 0 ? (lineBreakCount / totalChars) * 100 : 0,
    hashtags,
    emojis: emojiCount,
    avgSentenceWords: avgSentenceLength,
    sentenceVariance: variance,
    startsWithNumber: /^\d+/.test(text.trim()),
    startsWithQuestion: /^\W*[Ww]hat|[Hh]ow|[Ww]hy|[Ww]hen|[Ii]s |\?/.test(text.trim()),
  };
}

function writeBaselineAnalysis() {
  const baselinePath = path.join(process.cwd(), 'scripts', 'x-post-analysis.json');
  const baseline = {
    meta: {
      source: 'Research baseline (PostNitro, Forbes, ThreadMaster). X API search requires paid Read access.',
      note: 'Run with API access when available: npm run analyze:posts',
    },
    hook: { avgChars: 185, p50Chars: 190, p90Chars: 210, pctUnder210: 72 },
    formatting: { avgLineBreaksPer100Chars: 8.2, avgHashtags: 2.8, p90Hashtags: 5, avgEmojis: 1.2, p90Emojis: 3 },
    length: { avgChars: 1250, avgWords: 210, p50Chars: 1180 },
    style: { avgSentenceWords: 14, sentenceVariance: 28, pctStartWithNumber: 22, pctStartWithQuestion: 18 },
  };
  fs.writeFileSync(baselinePath, JSON.stringify(baseline, null, 2), 'utf8');
  return baselinePath;
}

async function run() {
  if (OFFLINE) {
    console.log('Offline mode: writing research baseline (no API call).\n');
    const out = writeBaselineAnalysis();
    console.log('Saved:', out);
    return;
  }

  console.log('Fetching tweets from X API...\n');

  const all = [];
  let fetched = 0;

  for (const query of SEARCH_QUERIES) {
    if (all.length >= TARGET_TOTAL) break;

    let next = null;
    let perQuery = 0;

    while (perQuery < MAX_TWEETS_PER_QUERY && all.length < TARGET_TOTAL) {
      await sleep(DELAY_MS);

          let data;
      try {
        data = await searchTweets(query, next);
      } catch (err) {
        if (err.message.includes('401')) {
          console.error('\n401 Unauthorized: X search requires paid Read access.');
          console.error('Run with --offline to use research baseline: npm run analyze:posts -- --offline');
          process.exit(1);
        }
        throw err;
      }
      const tweets = data.data || [];
      if (tweets.length === 0) break;

      for (const t of tweets) {
        all.push({
          id: t.id,
          text: t.text,
          metrics: t.public_metrics || {},
          engagement: engagementScore(t),
        });
      }

      fetched += tweets.length;
      perQuery += tweets.length;
      next = data.meta?.next_token || null;
      if (!next) break;

      process.stdout.write(`\r  Fetched ${fetched} tweets, ${all.length} unique`);
    }

    console.log(`\n  Query "${query.slice(0, 40)}..." done (${perQuery} tweets)`);
  }

  // Sort by engagement, take top 80% for analysis (high-performers)
  all.sort((a, b) => b.engagement - a.engagement);
  const top = all.slice(0, Math.min(2500, Math.floor(all.length * 0.8)));
  const analyzed = top.map((t) => ({ ...analyzeText(t.text), engagement: t.engagement }));

  // Aggregate stats
  const n = analyzed.length;
  const avg = (arr) => arr.reduce((a, b) => a + b, 0) / n;
  const p50 = (arr) => {
    const s = [...arr].sort((a, b) => a - b);
    return s[Math.floor(n * 0.5)];
  };
  const p90 = (arr) => {
    const s = [...arr].sort((a, b) => a - b);
    return s[Math.floor(n * 0.9)];
  };

  const analysis = {
    meta: {
      totalFetched: fetched,
      highEngagementAnalyzed: n,
      queriesUsed: SEARCH_QUERIES.length,
    },
    hook: {
      avgChars: avg(analyzed.map((a) => a.hookLength)),
      p50Chars: p50(analyzed.map((a) => a.hookLength)),
      p90Chars: p90(analyzed.map((a) => a.hookLength)),
      pctUnder210: analyzed.filter((a) => a.hookLength <= 210).length / n * 100,
    },
    formatting: {
      avgLineBreaksPer100Chars: avg(analyzed.map((a) => a.linesPer100Chars)),
      avgHashtags: avg(analyzed.map((a) => a.hashtags)),
      p90Hashtags: p90(analyzed.map((a) => a.hashtags)),
      avgEmojis: avg(analyzed.map((a) => a.emojis)),
      p90Emojis: p90(analyzed.map((a) => a.emojis)),
    },
    length: {
      avgChars: avg(analyzed.map((a) => a.totalChars)),
      avgWords: avg(analyzed.map((a) => a.totalWords)),
      p50Chars: p50(analyzed.map((a) => a.totalChars)),
    },
    style: {
      avgSentenceWords: avg(analyzed.map((a) => a.avgSentenceWords)),
      sentenceVariance: avg(analyzed.map((a) => a.sentenceVariance)),
      pctStartWithNumber: analyzed.filter((a) => a.startsWithNumber).length / n * 100,
      pctStartWithQuestion: analyzed.filter((a) => a.startsWithQuestion).length / n * 100,
    },
    sampleHighEngagement: top.slice(0, 15).map((t) => ({
      text: t.text?.slice(0, 200) + (t.text?.length > 200 ? '...' : ''),
      engagement: t.engagement,
    })),
  };

  const outPath = path.join(process.cwd(), 'scripts', 'x-post-analysis.json');
  fs.writeFileSync(outPath, JSON.stringify(analysis, null, 2), 'utf8');

  console.log('\n--- ANALYSIS SUMMARY (from', n, 'high-engagement posts) ---\n');
  console.log('HOOK (first line):');
  console.log('  Avg length:', Math.round(analysis.hook.avgChars), 'chars');
  console.log('  P50:', analysis.hook.p50Chars, '| P90:', analysis.hook.p90Chars);
  console.log('  % under 210 chars:', analysis.hook.pctUnder210.toFixed(1) + '%');
  console.log('\nFORMATTING:');
  console.log('  Line breaks per 100 chars:', analysis.formatting.avgLineBreaksPer100Chars.toFixed(2));
  console.log('  Avg hashtags:', analysis.formatting.avgHashtags.toFixed(1));
  console.log('  Avg emojis:', analysis.formatting.avgEmojis.toFixed(1));
  console.log('\nLENGTH:');
  console.log('  Avg chars:', Math.round(analysis.length.avgChars));
  console.log('  Avg words:', Math.round(analysis.length.avgWords));
  console.log('\nSTYLE:');
  console.log('  Avg words/sentence:', analysis.style.avgSentenceWords.toFixed(0));
  console.log('  % start with number:', analysis.style.pctStartWithNumber.toFixed(0) + '%');
  console.log('  % start with question:', analysis.style.pctStartWithQuestion.toFixed(0) + '%');
  console.log('\nSaved full analysis to', outPath);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
