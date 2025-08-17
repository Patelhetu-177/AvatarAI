function Footer() {
  return (
    <footer className="bg-gray-100 text-gray-800 dark:bg-black dark:text-gray-100 py-12">
      <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 px-4 sm:px-6 lg:px-8">
        {/* About Section */}
        <div>
          <h2 className="text-lg font-semibold mb-4">About AvatarAI</h2>
          <p className="text-gray-700 dark:text-gray-400 text-sm leading-relaxed">
            Powered by <span className="font-semibold">AvatarAI</span> —
            bringing you lifelike avatars, smarter conversations, and endless
            possibilities. Redefine how you connect, learn, and express yourself
            online.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Quick Links</h2>
          <ul className="space-y-2 text-sm">
            <li>
              <a
                href="/skillwise"
                className="hover:text-primary-200 transition-colors"
              >
                SkillWise
              </a>
            </li>
            <li>
              <a
                href="/interviewz"
                className="hover:text-primary-200 transition-colors"
              >
                InterviewMate
              </a>
            </li>
            <li>
              <a
                href="/companion"
                className="hover:text-primary-200 transition-colors"
              >
                Companion
              </a>
            </li>
          </ul>
        </div>

        {/* Follow Us */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Follow Us</h2>
          <div className="flex flex-col space-y-2 text-sm">
            <a
              href="https://github.com/Patelhetu-177"
              className="hover:text-primary-200 transition-colors"
            >
              Github
            </a>
            <a
              href="https://www.linkedin.com/in/hetu-patel-61a8b1288/"
              className="hover:text-primary-200 transition-colors"
            >
              LinkedIn
            </a>
          </div>
        </div>

        {/* Contact */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Contact Us</h2>
          <ul className="space-y-1 text-sm">
            <li>
              Email:{" "}
              <a
                href="mailto:hetup1707@gmail.com"
                className="hover:text-primary-200"
              >
                hetup1707@gmail.com
              </a>
            </li>
            <li>
              <a
                href="/contact"
                className="hover:text-primary-200 transition-colors"
              >
                Contact
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Note */}
      <p className="text-center text-xs pt-8 text-gray-600 dark:text-gray-400 border-t border-gray-300 dark:border-gray-700 mt-8">
        © 2025 AvatarAI. All rights reserved.
      </p>
    </footer>
  );
}

export default Footer;
