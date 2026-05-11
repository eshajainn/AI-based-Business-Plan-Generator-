// ================================================
// BizForge — AI Business Plan Generator
// Final Year Project · Powered by Groq + LLaMA 3.3
// ================================================

// ⚠️  PASTE YOUR GROQ API KEY HERE (from console.groq.com)
const GROQ_API_KEY = "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";

const GROQ_MODEL = "llama-3.3-70b-versatile";

// ---- Generate Business Plan ----
async function generatePlan() {
  // Collect form data
  const bizName     = document.getElementById('bizName').value.trim();
  const bizIdea     = document.getElementById('bizIdea').value.trim();
  const industry    = document.getElementById('industry').value;
  const targetMkt   = document.getElementById('targetMarket').value.trim();
  const budget      = document.getElementById('budget').value;
  const bizModel    = document.getElementById('bizModel').value;
  const competitors = document.getElementById('competitors').value.trim();
  const uvp         = document.getElementById('uvp').value.trim();

  // Validate
  if (!bizIdea) {
    alert('Please describe your business idea before generating.');
    return;
  }

  // Get selected sections
  const checkboxes = document.querySelectorAll('.checkbox-item input[type="checkbox"]:checked');
  const sections = Array.from(checkboxes).map(c => c.value);
  if (sections.length === 0) {
    alert('Please select at least one section to generate.');
    return;
  }

  // Show loading
  showLoading();
  startLoadingAnimation();

  // Build prompt
  const prompt = buildPrompt({ bizName, bizIdea, industry, targetMkt, budget, bizModel, competitors, uvp, sections });

  try {
    const plan = await callGroq(prompt);
    showResult(plan, bizName || 'My Business');
  } catch (err) {
    hideLoading();
    let msg = err.message;
    if (msg.includes('401') || msg.includes('invalid_api_key')) {
      msg = 'Invalid Groq API key. Open bizplan.js and replace YOUR_GROQ_API_KEY_HERE with your real key from console.groq.com';
    }
    showPlaceholder();
    alert('Error: ' + msg);
  }
}

// ---- Build Prompt ----
function buildPrompt({ bizName, bizIdea, industry, targetMkt, budget, bizModel, competitors, uvp, sections }) {
  return `You are an expert business consultant and MBA advisor. Generate a detailed, professional business plan for the following business.

BUSINESS DETAILS:
- Business Name: ${bizName || 'Not specified'}
- Business Idea: ${bizIdea}
- Industry: ${industry || 'Not specified'}
- Target Market: ${targetMkt || 'Not specified'}
- Startup Budget: ${budget || 'Not specified'}
- Business Model: ${bizModel || 'Not specified'}
- Key Competitors: ${competitors || 'Not specified'}
- Unique Value Proposition: ${uvp || 'Not specified'}

Generate the following sections ONLY:
${sections.map((s, i) => `${i + 1}. ${s}`).join('\n')}

FORMAT INSTRUCTIONS:
- Use ## for section headings (e.g. ## Executive Summary)
- Use ### for sub-headings
- Use bullet points with - for lists
- Use **bold** for key terms and important numbers
- Be specific, realistic, and detailed
- Include actual data estimates, percentages, and financial figures where relevant
- Write in a professional yet clear tone suitable for investors
- Each section should be at least 150 words
- Start with the business name as a # heading

Generate the complete business plan now:`;
}

// ---- Call Groq API ----
async function callGroq(prompt) {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are an expert business consultant who writes detailed, professional, investor-ready business plans. Always use proper markdown formatting with headers, bullet points, and bold text.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 4096,
      temperature: 0.7
    })
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error?.message || `HTTP ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// ---- Render Markdown to HTML ----
function renderMarkdown(text) {
  return text
    // h1
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    // h2
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    // h3
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    // Bold
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Bullet lists — wrap in section blocks per section
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
    // Numbered lists
    .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
    // Line breaks
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(?!<[hup]|<li|<\/)(.*)/gm, (match) => match ? `<p>${match}</p>` : '')
    // Clean up empty p tags
    .replace(/<p><\/p>/g, '')
    .replace(/<p>\s*<\/p>/g, '');
}

// ---- Show / Hide States ----
function showLoading() {
  document.getElementById('placeholder').style.display = 'none';
  document.getElementById('result').style.display = 'none';
  document.getElementById('loading').style.display = 'flex';
  document.getElementById('generateBtn').disabled = true;
}

function hideLoading() {
  document.getElementById('loading').style.display = 'none';
  document.getElementById('generateBtn').disabled = false;
}

function showPlaceholder() {
  document.getElementById('placeholder').style.display = 'flex';
  document.getElementById('result').style.display = 'none';
  document.getElementById('loading').style.display = 'none';
  document.getElementById('generateBtn').disabled = false;
}

function showResult(planText, bizName) {
  hideLoading();
  document.getElementById('placeholder').style.display = 'none';
  document.getElementById('result').style.display = 'block';

  const title = bizName ? `${bizName} — Business Plan` : 'Business Plan';
  document.getElementById('resultTitle').textContent = title;
  document.getElementById('resultBody').innerHTML = renderMarkdown(planText);

  // Store raw text for copy/download
  window._planText = planText;
  window._planTitle = title;

  // Scroll to top of result
  document.getElementById('result').scrollIntoView({ behavior: 'smooth' });
}

// ---- Loading Animation ----
function startLoadingAnimation() {
  const steps = ['ls1', 'ls2', 'ls3', 'ls4'];
  let current = 0;

  // Reset all steps
  steps.forEach(id => {
    const el = document.getElementById(id);
    el.classList.remove('active', 'done');
  });
  document.getElementById('ls1').classList.add('active');

  const interval = setInterval(() => {
    if (current < steps.length - 1) {
      document.getElementById(steps[current]).classList.remove('active');
      document.getElementById(steps[current]).classList.add('done');
      current++;
      if (current < steps.length) {
        document.getElementById(steps[current]).classList.add('active');
      }
    } else {
      clearInterval(interval);
    }
  }, 3500);

  // Store interval to clear if needed
  window._loadingInterval = interval;
}

// ---- Copy Plan ----
function copyPlan() {
  if (!window._planText) return;
  navigator.clipboard.writeText(window._planText).then(() => {
    const btn = document.querySelector('.action-btn:not(.primary)');
    const orig = btn.textContent;
    btn.textContent = '✓ Copied!';
    btn.style.color = '#2d6a4f';
    btn.style.borderColor = '#2d6a4f';
    setTimeout(() => {
      btn.textContent = orig;
      btn.style.color = '';
      btn.style.borderColor = '';
    }, 2000);
  });
}

// ---- Download Plan as .txt ----
function downloadPlan() {
  if (!window._planText) return;
  const blob = new Blob([window._planText], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = (window._planTitle || 'business-plan').replace(/[^a-z0-9]/gi, '-').toLowerCase() + '.txt';
  a.click();
  URL.revokeObjectURL(url);
}
