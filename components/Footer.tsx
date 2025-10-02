import React from "react";

export default function Footer(): JSX.Element {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <h4 className="text-white font-semibold mb-3">Company</h4>
            <ul className="space-y-2 text-secondary-400">
              <li><a href="/about" className="text-secondary-400 hover:text-white transition-colors">About</a></li>
              <li><a href="#" className="text-secondary-400 hover:text-white transition-colors">Careers</a></li>
              <li><a href="#" className="text-secondary-400 hover:text-white transition-colors">Blog</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-3">Resources</h4>
            <ul className="space-y-2 text-secondary-400">
              <li><a href="#" className="text-secondary-400 hover:text-white transition-colors">Docs</a></li>
              <li><a href="#" className="text-secondary-400 hover:text-white transition-colors">API</a></li>
              <li><a href="#" className="text-secondary-400 hover:text-white transition-colors">Support</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-3">Legal</h4>
            <ul className="space-y-2 text-secondary-400">
              <li><a href="#" className="text-secondary-400 hover:text-white transition-colors">Terms</a></li>
              <li><a href="#" className="text-secondary-400 hover:text-white transition-colors">Privacy</a></li>
              <li><a href="#" className="text-secondary-400 hover:text-white transition-colors">Cookies</a></li>
            </ul>
          </div>
          <div className="md:text-right">
            <h4 className="text-white font-semibold mb-3">Get in touch</h4>
            <p className="text-secondary-400">hello@example.com</p>
            <p className="text-secondary-400">(555) 123-4567</p>
          </div>
        </div>
        <div className="mt-10 border-t border-white/10 pt-6 text-sm text-secondary-500">© {new Date().getFullYear()} Kairo. All rights reserved.</div>
      </div>
    </footer>
  );
}
