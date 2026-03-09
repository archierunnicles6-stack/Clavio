# LinkedIn Ghostwriter Setup

## Environment Configuration

Create a `.env.local` file in the root directory with your OpenAI API key:

```
OPENAI_API_KEY=your_openai_api_key_here
```

## Running the Application

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. Paste your voice transcript in the input field
2. Select your target audience, goal, and tone
3. Click "Generate 15 LinkedIn Posts"
4. Review the ranked posts and copy or download them

## Features

- Generates 15 distinct LinkedIn posts from voice transcripts
- Scores posts based on emotional impact, relatability, authority, and engagement potential
- Supports different audiences, goals, and tones
- Clean, modern interface with copy and download functionality
- Posts are formatted for LinkedIn with proper spacing and structure
