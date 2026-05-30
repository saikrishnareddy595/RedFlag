<div align="center">

# 🚩 RedFlag — AI Contract Risk Scanner

**Spot the red flags before you sign.**

Paste or upload any contract and let AI surface risky clauses, rank them by
severity, explain each one in plain English, and generate a downloadable PDF
risk report — in seconds.

[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38bdf8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![NVIDIA NIM](https://img.shields.io/badge/NVIDIA-NIM-76b900?logo=nvidia&logoColor=white)](https://build.nvidia.com)

</div>

---

## 📸 Screenshot

> _Add your screenshots here_

| Home | Results |
| --- | --- |
| `./docs/home.png` | `./docs/results.png` |

---

## ✨ Features

- **Clause-level risk flags** — every risky, unusual, or one-sided clause is called out individually.
- **Severity ranking** — high / medium / low badges plus an overall **0–100 risk score**.
- **Plain-English explanations** — no legalese, just what each clause actually means for you.
- **Actionable suggestions** — negotiate, clarify, remove, or accept, with the reasoning behind each.
- **Multi-format input** — paste text or upload **PDF, DOCX, or TXT** (parsed privately in your browser).
- **Downloadable PDF report** — branded, multi-page report with a legal disclaimer on every page.
- **Privacy-first** — contract text is processed and discarded; nothing is stored server-side.
- **Premium, responsive UI** — polished glassmorphism design that works on mobile and desktop.

---

## 🧱 Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | **Next.js 14** (App Router, TypeScript, strict mode) |
| Styling | **Tailwind CSS** + Framer Motion + lucide-react |
| LLM | **NVIDIA NIM API** — `meta/llama-3.1-8b-instruct` (override via `NVIDIA_MODEL`) |
| File parsing | **pdf.js** (PDF) · **mammoth** (DOCX) — client-side |
| PDF export | **jsPDF** |
| Hosting | **Vercel** (serverless) |

---

## 🚀 Local Setup

```bash
# 1. Clone the repository
git clone https://github.com/YOUR_USERNAME/redflag.git
cd redflag

# 2. Install dependencies
npm install

# 3. Add your environment variables
cp .env.example .env.local
#   then edit .env.local and paste your key:
#   NVIDIA_API_KEY=nvapi-xxxxxxxxxxxxxxxxxxxxxxxx

# 4. Run the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. 🎉

### 🔑 Getting an NVIDIA API key (free)

1. Go to **[build.nvidia.com](https://build.nvidia.com)** and sign in.
2. Open the **`meta / llama-3.1-8b-instruct`** model (fast and reliable on the free tier).
3. Click **"Get API Key"** and copy the key (it starts with `nvapi-`).
4. Paste it into `.env.local` as `NVIDIA_API_KEY`.

> Want a different model? Set `NVIDIA_MODEL` (e.g. `meta/llama-3.1-70b-instruct`) — note larger models are slower and may exceed serverless timeouts on the free tier.

The free tier includes generous credits — plenty to evaluate RedFlag.

---

## ☁️ Deploy to Vercel

1. Push this repo to GitHub.
2. Go to **[vercel.com/new](https://vercel.com/new)** and import the repository.
3. Under **Settings → Environment Variables**, add:
   - `NVIDIA_API_KEY` = your NVIDIA NIM key
4. Click **Deploy**.

Every push to `main` triggers an automatic production deploy. The analysis API
route is configured (`vercel.json`) with a 60-second max duration to allow for
longer contracts.

Or deploy from the CLI:

```bash
npx vercel        # link & deploy a preview
npx vercel --prod # deploy to production
```

---

## 📂 Project Structure

```
redflag/
├── app/
│   ├── layout.tsx              # Root layout + fonts + metadata
│   ├── page.tsx                # Home: upload + contract type selector
│   ├── results/page.tsx        # Results: flagged clauses + summary
│   └── api/analyze/route.ts    # POST endpoint → NVIDIA NIM call
├── components/
│   ├── ContractUpload.tsx      # Drag-drop + paste, tabbed
│   ├── ContractTypeSelector.tsx# Custom dropdown
│   ├── RiskFlag.tsx            # Single flagged-clause card
│   ├── RiskSummary.tsx         # Overall score gauge + summary
│   └── DownloadReport.tsx      # jsPDF export
├── lib/
│   ├── nvidia.ts               # NVIDIA NIM API wrapper
│   ├── parseContract.ts        # PDF / DOCX / TXT → text
│   └── types.ts                # Shared TypeScript interfaces
├── .env.example
├── vercel.json
└── package.json
```

---

## 🔐 Security & Privacy

- The `NVIDIA_API_KEY` is **only** ever used server-side in `app/api/analyze/route.ts`. It is never exposed to the client.
- Uploaded files are parsed **in your browser**; only the extracted text is sent to the API.
- Contract text is processed in-memory and **never persisted** server-side.

---

## ⚖️ Disclaimer

> RedFlag is an AI-powered tool that provides **automated guidance only**. Its
> output **does not constitute legal advice** and may be incomplete or
> incorrect. Always consult a qualified attorney before signing any contract.

---

## 👥 Team

Built with care by:

- **Sai Krishna Reddy**
- **Akshay Ravi**
- **Jose Paredes-Quiroz**
- **Vipul Tyagi**

---

<div align="center">
<sub>Made with Next.js & NVIDIA NIM · © RedFlag</sub>
</div>
