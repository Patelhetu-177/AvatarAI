export const WELCOME_EMAIL_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="format-detection" content="telephone=no">
    <meta name="x-apple-disable-message-reformatting">
    <title>Welcome to AvatarAI</title>
    <!--[if mso]>
    <noscript>
        <xml>
            <o:OfficeDocumentSettings>
                <o:AllowPNG/>
                <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
        </xml>
    </noscript>
    <![endif]-->
    <style type="text/css">
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

        @media (prefers-color-scheme: light) {
            .email-body { background-color: #F0F0F5 !important; }
            .email-card { background: #FFFFFF !important; border-color: #E2E2EA !important; }
            .text-primary { color: #1A1A2E !important; }
            .text-secondary { color: #4A4A6A !important; }
            .feature-card { background-color: #F5F5FA !important; }
            .feature-num { color: #6C63FF !important; }
            .footer-text { color: #888 !important; }
        }

        @media only screen and (max-width: 600px) {
            .email-wrapper { padding: 16px 10px !important; }
            .email-card { border-radius: 12px !important; }
            .card-padding { padding: 28px 20px !important; }
            .hero-title { font-size: 28px !important; }
            .hero-subtitle { font-size: 13px !important; }
            .feature-card { padding: 10px 12px !important; }
            .feature-text { font-size: 13px !important; }
            .cta-button { padding: 14px 30px !important; font-size: 14px !important; }
            .lang-bar { font-size: 11px !important; padding: 10px 15px !important; }
        }
    </style>
</head>
<body style="margin: 0; padding: 0; background-color: #0A0A0F; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;" class="email-body">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #0A0A0F;" class="email-body">
        <tr>
            <td align="center" class="email-wrapper" style="padding: 40px 20px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px;">

                    <!-- Logo Header -->
                    <tr>
                        <td align="center" style="padding-bottom: 24px;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                                <tr>
                                    <td>
                                        <h1 style="margin: 0; font-size: 28px; font-weight: 800; color: #FFFFFF; letter-spacing: -0.5px; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.1;">
                                            Avatar<span style="color: #16A34A;">AI</span>
                                        </h1>
                                    </td>
                                  
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Main Card -->
                    <tr>
                        <td class="email-card" style="background: linear-gradient(160deg, #13131A 0%, #1A1A2E 50%, #1E1035 100%); border-radius: 20px; border: 1px solid rgba(108, 99, 255, 0.15); overflow: hidden;">

                            <!-- Decorative Gradient Bar -->
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                <tr>
                                    <td style="height: 4px; background: linear-gradient(90deg, #6C63FF, #9D4EDD, #E040FB, #6C63FF);"></td>
                                </tr>
                            </table>

                            <!-- Card Content -->
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                <tr>
                                    <td class="card-padding" style="padding: 44px 40px;">

                                        <!-- Avatar Emoji Row -->
                                        <p style="margin: 0 0 16px 0; font-size: 36px; line-height: 1;">
                                            &#x1F3AD;&#x1F916;&#x2728;
                                        </p>

                                        <!-- Welcome Heading -->
                                        <h1 class="hero-title text-primary" style="margin: 0 0 6px 0; font-size: 32px; font-weight: 800; color: #FFFFFF; line-height: 1.2; letter-spacing: -0.5px;">
                                            Welcome aboard, {{name}}!
                                        </h1>
                                        <p class="hero-subtitle" style="margin: 0 0 28px 0; font-size: 14px; font-weight: 600; color: #6C63FF; letter-spacing: 1.5px; text-transform: uppercase;">
                                            Your AI-powered world is ready
                                        </p>

                                        <!-- AI-Generated Personalized Intro -->
                                        {{intro}}

                                        <!-- Divider -->
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                            <tr>
                                                <td style="padding: 0 0 24px 0;">
                                                    <div style="height: 1px; background: linear-gradient(90deg, transparent, rgba(108, 99, 255, 0.3), transparent);"></div>
                                                </td>
                                            </tr>
                                        </table>

                                        <!-- Feature Label -->
                                        <p class="text-primary" style="margin: 0 0 16px 0; font-size: 15px; font-weight: 700; color: #FFFFFF; letter-spacing: 0.3px;">
                                            Here's what you can do right now:
                                        </p>

                                        <!-- Feature Cards -->
                                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 28px;">
                                            <tr>
                                                <td class="feature-card" style="padding: 13px 16px; background-color: rgba(108, 99, 255, 0.08); border-radius: 10px; border-left: 3px solid #6C63FF;">
                                                    <p class="feature-text text-secondary" style="margin: 0; font-size: 14px; color: #CCDADC; line-height: 1.5;">
                                                        <span class="feature-num" style="color: #6C63FF; font-weight: 700;">01</span>&nbsp;&nbsp;Chat with AI avatars of celebrities, icons & historical figures
                                                    </p>
                                                </td>
                                            </tr>
                                            <tr><td style="height: 8px;"></td></tr>
                                            <tr>
                                                <td class="feature-card" style="padding: 13px 16px; background-color: rgba(157, 78, 221, 0.08); border-radius: 10px; border-left: 3px solid #9D4EDD;">
                                                    <p class="feature-text text-secondary" style="margin: 0; font-size: 14px; color: #CCDADC; line-height: 1.5;">
                                                        <span class="feature-num" style="color: #9D4EDD; font-weight: 700;">02</span>&nbsp;&nbsp;Create your own custom AI avatar from scratch
                                                    </p>
                                                </td>
                                            </tr>
                                            <tr><td style="height: 8px;"></td></tr>
                                            <tr>
                                                <td class="feature-card" style="padding: 13px 16px; background-color: rgba(224, 64, 251, 0.08); border-radius: 10px; border-left: 3px solid #E040FB;">
                                                    <p class="feature-text text-secondary" style="margin: 0; font-size: 14px; color: #CCDADC; line-height: 1.5;">
                                                        <span class="feature-num" style="color: #E040FB; font-weight: 700;">03</span>&nbsp;&nbsp;Practice AI mock interviews with real-time voice feedback
                                                    </p>
                                                </td>
                                            </tr>
                                            <tr><td style="height: 8px;"></td></tr>
                                            <tr>
                                                <td class="feature-card" style="padding: 13px 16px; background-color: rgba(108, 99, 255, 0.08); border-radius: 10px; border-left: 3px solid #6C63FF;">
                                                    <p class="feature-text text-secondary" style="margin: 0; font-size: 14px; color: #CCDADC; line-height: 1.5;">
                                                        <span class="feature-num" style="color: #6C63FF; font-weight: 700;">04</span>&nbsp;&nbsp;Use InterviewMate for structured Q&A on any subject
                                                    </p>
                                                </td>
                                            </tr>
                                            <tr><td style="height: 8px;"></td></tr>
                                            <tr>
                                                <td class="feature-card" style="padding: 13px 16px; background-color: rgba(157, 78, 221, 0.08); border-radius: 10px; border-left: 3px solid #9D4EDD;">
                                                    <p class="feature-text text-secondary" style="margin: 0; font-size: 14px; color: #CCDADC; line-height: 1.5;">
                                                        <span class="feature-num" style="color: #9D4EDD; font-weight: 700;">05</span>&nbsp;&nbsp;Take AI-generated quizzes & get personalized improvement tips
                                                    </p>
                                                </td>
                                            </tr>
                                            <tr><td style="height: 8px;"></td></tr>
                                            <tr>
                                                <td class="feature-card" style="padding: 13px 16px; background-color: rgba(224, 64, 251, 0.08); border-radius: 10px; border-left: 3px solid #E040FB;">
                                                    <p class="feature-text text-secondary" style="margin: 0; font-size: 14px; color: #CCDADC; line-height: 1.5;">
                                                        <span class="feature-num" style="color: #E040FB; font-weight: 700;">06</span>&nbsp;&nbsp;Upload PDF, Word or Excel files & chat with your documents
                                                    </p>
                                                </td>
                                            </tr>
                                        </table>

                                        <!-- CTA Button -->
                                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 28px;">
                                            <tr>
                                                <td align="center">
                                                    <a href="https://avatar-ai-swart.vercel.app" class="cta-button" style="display: inline-block; padding: 16px 44px; background: linear-gradient(135deg, #6C63FF 0%, #9D4EDD 100%); color: #FFFFFF; text-decoration: none; font-size: 15px; font-weight: 700; border-radius: 12px; letter-spacing: 0.5px;">
                                                        Start Exploring &rarr;
                                                    </a>
                                                </td>
                                            </tr>
                                        </table>

                                        <!-- Language Bar -->
                                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td class="lang-bar" align="center" style="padding: 12px 20px; background: rgba(108, 99, 255, 0.06); border-radius: 10px; border: 1px solid rgba(108, 99, 255, 0.1);">
                                                    <p style="margin: 0; font-size: 12px; color: #8888AA; line-height: 1.6;">
                                                        &#x1F30D;&nbsp; Available in 15+ languages: English &middot; &#x0939;&#x093F;&#x0928;&#x094D;&#x0926;&#x0940; &middot; &#x0A97;&#x0AC1;&#x0A9C;&#x0AB0;&#x0ABE;&#x0AA4;&#x0AC0; &middot; Espa&#241;ol &middot; Fran&#231;ais &middot; Deutsch &middot; &#x4E2D;&#x6587; &middot; &#x65E5;&#x672C;&#x8A9E; &middot; &#x0627;&#x0644;&#x0639;&#x0631;&#x0628;&#x064A;&#x0629; & more
                                                    </p>
                                                </td>
                                            </tr>
                                        </table>

                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="text-align: center; padding: 28px 20px 0 20px;">
                            <p class="footer-text" style="margin: 0 0 10px 0; font-size: 12px; color: #444;">
                                &copy; 2025 AvatarAI. All rights reserved.
                            </p>
                            <p class="footer-text" style="margin: 0; font-size: 11px;">
                                <a href="{{unsubscribeUrl}}" style="color: #888; text-decoration: underline;">Unsubscribe</a>
                            </p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;






export const MONTHLY_EXPLORE_EMAIL_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="format-detection" content="telephone=no">
    <meta name="x-apple-disable-message-reformatting">
    <title>Explore AvatarAI</title>
    <!--[if mso]>
    <noscript>
        <xml>
            <o:OfficeDocumentSettings>
                <o:AllowPNG/>
                <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
        </xml>
    </noscript>
    <![endif]-->
    <style type="text/css">
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

        @media (prefers-color-scheme: light) {
            .email-body { background-color: #F0F0F5 !important; }
            .email-card { background: #FFFFFF !important; border-color: #E2E2EA !important; }
            .text-primary { color: #1A1A2E !important; }
            .text-secondary { color: #4A4A6A !important; }
            .feature-card { background-color: #F5F5FA !important; }
            .footer-text { color: #888 !important; }
        }

        @media only screen and (max-width: 600px) {
            .email-wrapper { padding: 16px 10px !important; }
            .email-card { border-radius: 12px !important; }
            .card-padding { padding: 28px 20px !important; }
            .hero-title { font-size: 28px !important; }
            .hero-subtitle { font-size: 13px !important; }
            .feature-title { font-size: 14px !important; }
            .feature-body { font-size: 12px !important; }
            .cta-button { padding: 14px 30px !important; font-size: 14px !important; }
            .lang-bar { font-size: 11px !important; padding: 10px 15px !important; }
        }
    </style>
</head>
<body style="margin: 0; padding: 0; background-color: #0A0A0F; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;" class="email-body">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #0A0A0F;" class="email-body">
        <tr>
            <td align="center" class="email-wrapper" style="padding: 40px 20px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px;">

                    <!-- Logo Header -->
                    <tr>
                        <td align="center" style="padding-bottom: 24px;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                                <tr>
                                    <td>
                                        <h1 style="margin: 0; font-size: 28px; font-weight: 800; color: #FFFFFF; letter-spacing: -0.5px; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.1;">
                                            Avatar<span style="color: #16A34A;">AI</span>
                                        </h1>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Main Card -->
                    <tr>
                        <td class="email-card" style="background: linear-gradient(160deg, #13131A 0%, #1A1A2E 50%, #1E1035 100%); border-radius: 20px; border: 1px solid rgba(108, 99, 255, 0.15); overflow: hidden;">

                            <!-- Decorative Gradient Bar -->
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                <tr>
                                    <td style="height: 4px; background: linear-gradient(90deg, #6C63FF, #9D4EDD, #E040FB, #6C63FF);"></td>
                                </tr>
                            </table>

                            <!-- Card Content -->
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                <tr>
                                    <td class="card-padding" style="padding: 44px 40px;">

                                        <p style="margin: 0 0 16px 0; font-size: 34px; line-height: 1;">&#x2728;&#x1F680;</p>

                                        <h1 class="hero-title text-primary" style="margin: 0 0 6px 0; font-size: 32px; font-weight: 800; color: #FFFFFF; line-height: 1.2; letter-spacing: -0.5px;">
                                            Your AvatarAI Guide, {{name}}
                                        </h1>
                                        <p class="hero-subtitle" style="margin: 0 0 24px 0; font-size: 14px; font-weight: 600; color: #6C63FF; letter-spacing: 1.3px; text-transform: uppercase;">
                                            Explore more. Learn faster. Build smarter.
                                        </p>

                                        <p class="text-secondary" style="margin: 0 0 22px 0; font-size: 14px; color: #CCDADC; line-height: 1.7;">
                                            Hi {{name}}, here is your complete guide to everything you can do with AvatarAI. If you have only used one or two tools so far, this is the perfect time to unlock the full platform.
                                        </p>

                                        {{featureContent}}

                                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                                            <tr>
                                                <td align="center">
                                                    <a href="https://avatar-ai-swart.vercel.app" class="cta-button" style="display: inline-block; padding: 16px 44px; background: linear-gradient(135deg, #6C63FF 0%, #9D4EDD 100%); color: #FFFFFF; text-decoration: none; font-size: 15px; font-weight: 700; border-radius: 12px; letter-spacing: 0.4px;">
                                                        Visit AvatarAI &rarr;
                                                    </a>
                                                </td>
                                            </tr>
                                        </table>

                                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td class="lang-bar" align="center" style="padding: 12px 20px; background: rgba(108, 99, 255, 0.06); border-radius: 10px; border: 1px solid rgba(108, 99, 255, 0.1);">
                                                    <p style="margin: 0; font-size: 12px; color: #8888AA; line-height: 1.6;">
                                                        &#x1F30D;&nbsp; Available in 15+ languages: English &middot; &#x0939;&#x093F;&#x0928;&#x094D;&#x0926;&#x0940; &middot; &#x0A97;&#x0AC1;&#x0A9C;&#x0AB0;&#x0ABE;&#x0AA4;&#x0AC0; &middot; Espa&#241;ol &middot; Fran&#231;ais &middot; Deutsch &middot; &#x4E2D;&#x6587; &middot; &#x65E5;&#x672C;&#x8A9E; &middot; &#x0627;&#x0644;&#x0639;&#x0631;&#x0628;&#x064A;&#x0629; & more
                                                    </p>
                                                </td>
                                            </tr>
                                        </table>

                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <tr>
                        <td style="text-align: center; padding: 28px 20px 0 20px;">
                            <p class="footer-text" style="margin: 0 0 6px 0; font-size: 13px; color: #555; line-height: 1.5;">
                                Built with AI, made for <strong style="color: #16A34A;">you</strong>.
                            </p>
                            <p class="footer-text" style="margin: 0 0 10px 0; font-size: 12px; color: #444;">
                                &copy; 2025 AvatarAI. All rights reserved.
                            </p>
                            <p class="footer-text" style="margin: 0; font-size: 11px;">
                                <a href="{{unsubscribeUrl}}" style="color: #888; text-decoration: underline;">Unsubscribe</a>
                            </p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
