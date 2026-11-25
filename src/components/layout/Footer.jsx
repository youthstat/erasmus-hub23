import { Link } from 'react-router-dom';
import { COPYRIGHT } from '../../config/settings.js';

// Copyright line on every page
export default function Footer() {
  return (
    <footer className="bg-ink text-white border-t-[3px] border-ink mt-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col gap-1 font-mono text-xs">
        <div className="font-bold">Copyright © {COPYRIGHT.year} {COPYRIGHT.owner}. All rights reserved.</div>
        <div className="opacity-80">The design, texts, code and all materials of this website are protected by copyright. Copying, reproduction or any reuse without the prior written permission of the author is prohibited.</div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
          <span>Permissions and information: <a href={`mailto:${COPYRIGHT.email}`} className="underline font-bold text-sun">{COPYRIGHT.email}</a></span>
          <Link to="/copyright" className="underline font-bold text-sun">Copyright notice →</Link>
        </div>
      </div>
    </footer>
  );
}
