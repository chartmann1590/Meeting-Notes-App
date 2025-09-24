# MeetingScribe AI

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/chartmann1590/Meeting-Notes-App)

MeetingScribe AI is a visually stunning, minimalist web application designed to streamline meeting documentation. It leverages the browser's microphone to capture audio, provides a real-time (simulated) transcription, and then uses a powerful LLM via Cloudflare Workers to generate a concise, structured summary. The summary includes key discussion points, action items, and decisions made. The entire experience is contained within a single, elegant interface, focusing on simplicity and efficiency.

## Key Features

-   **🎤 In-Browser Audio Recording:** Capture meeting audio directly from your browser with a single click.
-   **✍️ Real-Time Transcription:** See a live (simulated) transcript of your meeting as it happens.
-   **🤖 AI-Powered Summarization:** Automatically generate structured summaries including key points, action items, and decisions using a powerful LLM on Cloudflare Workers.
-   **✨ Minimalist & Elegant UI:** A clean, uncluttered, and visually appealing interface that is a joy to use.
-   **📋 One-Click Copy:** Easily copy the full transcript or the AI-generated summary to your clipboard.
-   **🚀 Built on Cloudflare:** Leverages the power and speed of Cloudflare Workers for backend processing.

## Technology Stack

-   **Frontend:** React, Vite, Tailwind CSS
-   **UI Components:** shadcn/ui
-   **State Management:** Zustand
-   **Animation & Interactions:** Framer Motion
-   **Icons:** Lucide React
-   **Notifications:** Sonner
-   **Backend & AI:** Cloudflare Workers

## Getting Started

Follow these instructions to get a local copy up and running for development and testing purposes.

### Prerequisites

-   [Bun](https://bun.sh/) installed on your machine.
-   A [Cloudflare account](https://dash.cloudflare.com/sign-up).

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/meetingscribe-ai.git
    cd meetingscribe-ai
    ```

2.  **Install dependencies:**
    ```bash
    bun install
    ```

3.  **Configure Cloudflare Workers:**
    You need to set up your Cloudflare AI Gateway credentials. Create a `.dev.vars` file in the root of the project for local development:

    ```ini
    # .dev.vars
    CF_AI_BASE_URL="https://gateway.ai.cloudflare.com/v1/YOUR_ACCOUNT_ID/YOUR_GATEWAY_ID/openai"
    CF_AI_API_KEY="YOUR_CLOUDFLARE_API_KEY"
    ```

    Replace the placeholder values with your actual Cloudflare Account ID, Gateway ID, and an API Key.

## Development

To start the local development server, run the following command. This will start the Vite frontend and the Wrangler dev server for the worker.

```bash
bun dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application in your browser. The page will auto-update as you edit the files.

## Usage

1.  Open the application in your browser.
2.  Click the **Start Recording** button.
3.  Your browser will prompt you for microphone access. Click **Allow**.
4.  The button will turn red, indicating that recording has started. A live transcript will appear.
5.  When your meeting is finished, click the **Stop Recording** button.
6.  The button will show a spinner while the transcript is being summarized.
7.  The AI-generated summary, key points, and action items will appear in the "AI Summary" card.
8.  Use the copy buttons to save the transcript or summary to your clipboard.

## Deployment

This project is designed for easy deployment to Cloudflare Pages.

### One-Click Deploy

You can deploy this application to your own Cloudflare account with a single click.

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/chartmann1590/Meeting-Notes-App)

### Manual Deployment via CLI

1.  **Build the project:**
    ```bash
    bun run build
    ```

2.  **Deploy to Cloudflare:**
    Log in to Cloudflare with Wrangler, then run the deploy command.

    ```bash
    bun wrangler login
    bun run deploy
    ```

    This command will build the application and deploy it to Cloudflare Pages, including the backend Worker functions.

## License

This project is licensed under the MIT License - see the LICENSE file for details.