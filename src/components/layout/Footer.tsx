export function Footer() {
  return (
    <footer className="py-8 mt-auto border-t border-gray-200 bg-white">
      <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="text-sm text-gray-500">
          © 2026 Smart Recipe Finder. All rights reserved.
        </div>

        <div className="flex items-center gap-6 text-sm font-medium text-gray-600">
          <a href="#" className="hover:text-black transition-colors">
            Privacy
          </a>
          <a href="#" className="hover:text-black transition-colors">
            Terms
          </a>
          <a
            href="https://github.com/cesar0k/smart-recipe-finder"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-black transition-colors"
          >
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}
