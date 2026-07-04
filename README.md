# InstaPlaylist AI

InstaPlaylist AI is a powerful Next.js application that helps you generate, preview, and export high-quality Instagram carousels and publishing assets (captions, hashtags, SEO metadata) in seconds. It is specifically tailored for the developer and tech niche, featuring a modern, dark-themed aesthetic with vibrant yellow accents.

## ✨ Features

*   **AI-Powered Carousel Generation**: Instantly generate 6-slide Instagram carousels based on a topic using OpenRouter AI.
*   **Dynamic Visuals**: Automatically fetches relevant background images from Pollinations.ai with beautiful dark gradients and grid overlays.
*   **Dual View Modes**: Switch between "Single Slide" (slider) and "Deck View" (grid) to preview your content.
*   **High-Quality Export**:
    *   **Download All PNGs**: Export all slides in a single ZIP file at ultra-HD resolution (3x scale, 1080x1350 aspect ratio).
    *   **Export Active PNG**: Download individual slides.
    *   **Export Full PDF**: Export the entire carousel as a multi-page PDF.
*   **The Publish Pack**: A unified panel that provides everything you need to post:
    *   AI-generated, engaging captions with character counts.
    *   Curated hashtags.
    *   Markdown-formatted resources list.
    *   SEO metadata (Title, Description, Keywords, Slug) for blog or website publishing.
    *   One-click "Copy Everything" or "Download .md" for a seamless workflow.
*   **Robust Fallbacks & Retries**: API routes feature built-in retries and graceful fallbacks, ensuring the app works smoothly even if the AI model fails or if you are using it in keyless mode.

## 🚀 Tech Stack

*   **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
*   **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
*   **Icons**: [Lucide React](https://lucide.dev/)
*   **Image Generation**: [Pollinations.ai](https://pollinations.ai/)
*   **Text Generation**: [OpenRouter API](https://openrouter.ai/)
*   **Export Utilities**:
    *   `html-to-image`: For rendering DOM elements to high-quality PNGs (supports modern CSS).
    *   `jspdf`: For PDF generation.
    *   `jszip`: For bundling multiple PNGs into a single download.

## 🛠️ Getting Started

### Prerequisites

*   Node.js (v20 or higher recommended)
*   npm

### Installation

1.  Clone the repository and navigate to the project directory.
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the development server:
    ```bash
    npm run dev
    ```
4.  Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📸 Usage

1.  **Enter a Topic**: Type your desired topic (e.g., "10 GitHub Repos Every Developer Should Star") in the main input field.
2.  **Generate**: Click the "Generate Deck" button. The AI will create the slide content, caption, and SEO metadata.
3.  **Review & Customize**:
    *   Use the **Carousel Simulator** tab to review the slides. Click the Sparkles ✨ icon on any slide to regenerate its background image.
    *   Use the **Publish Pack** tab to review and edit the caption, hashtags, and SEO data.
4.  **Export**:
    *   In the Carousel Simulator, use the yellow **Download All PNGs** button to get a ZIP file of all your slides ready for Instagram.
    *   In the Publish Pack, use the **Copy Everything** or **Download .md** button to grab your text assets.

## 📝 License

This project is open-source and available under the MIT License.
