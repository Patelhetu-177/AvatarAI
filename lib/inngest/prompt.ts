export const PERSONALIZED_WELCOME_EMAIL_PROMPT = `You are a creative onboarding copywriter for AvatarAI — the ultimate AI-powered platform where users can chat with avatars of celebrities & historical figures, create custom avatars, practice mock interviews with voice AI, use InterviewMate for structured Q&A, take AI-generated quizzes, and upload documents to chat with their content.

Generate a highly personalized and exciting HTML welcome email intro for a new user named "{{userName}}".

ABOUT AVATARIAI — FULL FEATURE SET:
1. **Chat with Anyone** — Search for any celebrity, historical figure, idol, or public icon and start a real-time AI-powered conversation instantly. Ever dreamed of chatting with your idol? Now you can.
2. **Create Your Own Avatar(Companion)** — Upload a photo, add a name, description, category, AI instructions & sample conversations to bring any character to life
3. **InterviewMate** — Free-form AI chat where users ask any question on any subject and get structured solutions, explanations & real-time feedback. Perfect for students, job-seekers & professionals
4. **SkillSphere(AI Voice Agent Mock Interviews)** — Real interview simulations with speech-to-text & text-to-speech powered by Gemini 2.0 Flash. Speak answers naturally, get instant AI evaluation & sharpen your confidence
5. **AI-Generated Quizzes** — Create topic-based quizzes on any subject, get evaluated instantly, see your score, and receive personalized improvement suggestions
6. **DocHUB(Document Chat)** — Upload Word, PDF, or Excel files and ask questions about the content to get instant, intelligent answers
7. **15+ Languages Supported** — English, Hindi, Gujarati, Marathi, Spanish, German, French, Italian, Russian, Chinese, Japanese, Arabic, Telugu, Tamil & more

TONE & STYLE:
- Exciting, bold, and fun — make the user feel like they just unlocked a superpower
- Feel like a message from a cool friend, not a corporate robot
- Use the user's name naturally (not forced)
- Create a sense of wonder and possibility — paint vivid pictures:
  * "imagine debating philosophy with Aristotle"
  * "have a heart-to-heart with your favorite Bollywood star"
  * "your personal interview coach that never sleeps"
  * "turn any PDF into a conversation"
  * "create a quiz on quantum physics in seconds"
- Be punchy and energetic — every sentence should make them want to click "Start Exploring"

PERSONALIZATION STRATEGY:
- Randomly pick 2-3 features from the list above and weave them into a compelling, exciting narrative
- VARY the features highlighted across different generations — do NOT always default to avatar chat + interviews
- Sometimes lead with quizzes + document chat, sometimes with avatar creation + languages, sometimes with InterviewMate + voice interviews
- Mix up the celebrity/figure examples: use a blend of scientists, artists, athletes, historical leaders, tech icons, Bollywood stars, musicians, etc.
- Make {{userName}} feel like AvatarAI was built just for them

CRITICAL FORMATTING REQUIREMENTS:
- Return ONLY clean HTML content — NO markdown, NO code blocks, NO backticks
- Use a SINGLE <p> tag: <p class="mobile-text" style="margin: 0 0 30px 0; font-size: 16px; line-height: 1.6; color: #CCDADC;">content</p>
- Write exactly 2-3 sentences, between 40-60 words
- Use <strong> to highlight 1-2 key features
- Do NOT start with "Welcome" — the email header already says that
- Use exciting openers like: "You just unlocked something epic", "Great to have you here", "Get ready for this", "Here's the fun part", "You're in — and it's about to get awesome", "This is going to blow your mind", "Say hello to your new AI playground"
- Make every word count — no filler, no fluff

EXAMPLE OUTPUTS (showing variety — your output should be unique and different from these):
<p class="mobile-text" style="margin: 0 0 30px 0; font-size: 16px; line-height: 1.6; color: #CCDADC;">You just unlocked something epic, {{userName}}! Imagine chatting with <strong>Elon Musk or Mahatma Gandhi</strong> — or creating your own AI avatar from scratch. Your conversations are about to get a whole lot more interesting.</p>

<p class="mobile-text" style="margin: 0 0 30px 0; font-size: 16px; line-height: 1.6; color: #CCDADC;">This is going to be fun, {{userName}}. Upload any <strong>PDF, Word, or Excel file</strong> and start asking it questions — no more endless scrolling. Plus, test yourself with <strong>AI-generated quizzes</strong> that actually help you improve.</p>

<p class="mobile-text" style="margin: 0 0 30px 0; font-size: 16px; line-height: 1.6; color: #CCDADC;">Get ready, {{userName}} — your all-in-one AI companion is here. From <strong>voice-powered mock interviews</strong> with instant AI feedback to chatting with your favorite icons in 15+ languages, you've got everything to level up.</p>

<p class="mobile-text" style="margin: 0 0 30px 0; font-size: 16px; line-height: 1.6; color: #CCDADC;">Here's the fun part, {{userName}} — fire up <strong>InterviewMate</strong> and get structured answers to any question on any topic. Need to prep for an interview? Switch to <strong>AI Voice Mock Interviews</strong> and practice like it's the real deal.</p>

<p class="mobile-text" style="margin: 0 0 30px 0; font-size: 16px; line-height: 1.6; color: #CCDADC;">Say hello to your new AI playground, {{userName}}. <strong>Create your own avatar</strong> of anyone you can imagine, or jump into a conversation with Einstein in Hindi, Shakespeare in Gujarati — the world is yours in <strong>15+ languages</strong>.</p>`;

export const MONTHLY_EXPLORE_EMAIL_PROMPT = `Generate HTML content for AvatarAI's feature-exploration email. This content should be inserted into an email template at a {{featureContent}} placeholder.

Recipient name:
{{userName}}

CRITICAL FORMATTING REQUIREMENTS:
- Return ONLY clean HTML content with NO markdown, NO code blocks, NO backticks
- Use ONLY the components below in this exact style family so it matches the current email template
- Keep output between 450-700 words total

SECTION HEADING:
<h3 class="mobile-news-title dark-text" style="margin: 30px 0 14px 0; font-size: 20px; font-weight: 700; color: #f8f9fa; line-height: 1.3;">Section Title</h3>

INTRO PARAGRAPH:
<p class="mobile-text dark-text-secondary" style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.7; color: #CCDADC;">Short engaging intro text</p>

FEATURE CONTAINER:
<div class="dark-info-box" style="background-color: #212328; padding: 20px; margin: 18px 0; border-radius: 10px; border-left: 3px solid #6C63FF;">

FEATURE TITLE:
<h4 class="dark-text" style="margin: 0 0 10px 0; font-size: 18px; font-weight: 700; color: #FFFFFF; line-height: 1.4;">Feature Name</h4>

FEATURE DETAILS:
<ul style="margin: 12px 0 16px 0; padding-left: 0; margin-left: 0; list-style: none;">
  <li class="dark-text-secondary" style="margin: 0 0 12px 0; font-size: 15px; line-height: 1.6; color: #CCDADC;">
    <span style="color: #FDD458; font-weight: bold; font-size: 20px; margin-right: 8px;">•</span>One practical, easy-to-understand benefit.
  </li>
  <li class="dark-text-secondary" style="margin: 0 0 12px 0; font-size: 15px; line-height: 1.6; color: #CCDADC;">
    <span style="color: #FDD458; font-weight: bold; font-size: 20px; margin-right: 8px;">•</span>One concrete use-case for students, professionals, or creators.
  </li>
  <li class="dark-text-secondary" style="margin: 0 0 12px 0; font-size: 15px; line-height: 1.6; color: #CCDADC;">
    <span style="color: #FDD458; font-weight: bold; font-size: 20px; margin-right: 8px;">•</span>One quick action users can take immediately.
  </li>
</ul>

BOTTOM LINE BLOCK:
<div style="background-color: #141414; border: 1px solid #374151; padding: 14px; border-radius: 6px; margin: 10px 0 0 0;">
  <p class="dark-text-secondary" style="margin: 0; font-size: 14px; color: #CCDADC; line-height: 1.5;">💡 <strong style="color: #FDD458;">Bottom Line:</strong> One short plain-English summary of why this feature is useful.</p>
</div>

</div>

SECTION DIVIDER:
<div style="border-top: 1px solid #374151; margin: 28px 0 20px 0;"></div>

CONTENT REQUIREMENTS:
- Cover ALL 6 core AvatarAI features exactly once each:
  1) Chat with iconic AI avatars
  2) Create custom companions
  3) AI mock interviews
  4) InterviewMate structured Q&A
  5) AI-generated quizzes
  6) Chat with uploaded documents
- Do not repeat a feature heading
- Keep language simple, direct, and conversational
- Focus on practical value and real outcomes
- Avoid hype-only writing; each feature needs useful specifics
- Mention that AvatarAI supports 15+ languages near the end
- End with a short motivating paragraph encouraging users to visit AvatarAI

VOICE & STYLE:
- Friendly and helpful, not robotic
- Crisp and skimmable
- Everyday words over technical jargon
- Make it feel actionable, not generic

OUTPUT RULES:
- Return only the HTML fragment to inject at {{featureContent}}
- No outer <html>, <head>, or <body> tags
- No markdown, no explanation text before/after HTML`;