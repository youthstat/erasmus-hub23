import Header from '../components/layout/Header.jsx';
import { Banner, Card, List } from '../components/games/RulesBits.jsx';
import { COPYRIGHT } from '../config/settings.js';

export default function CopyrightPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">
      <Header back />
      <Banner title="Copyright notice" cls="bg-sun">
        Copyright © {COPYRIGHT.year} {COPYRIGHT.owner}. All rights reserved.
      </Banner>
      <Card title="Author and copyright holder" cls="bg-white">
        <p><b>{COPYRIGHT.owner}</b> is the author and the sole owner of the copyright in this website, including its source code, interface, design, layout, texts, graphics, animations, mascot and all related materials.</p>
      </Card>
      <Card title="✕ Not allowed without the prior written permission of the author" cls="bg-hot/20">
        <List mark="✕" items={[
          'Copying, reproducing or saving the code, design, texts or graphics.',
          'Modifying, translating or creating derivative works.',
          'Publishing, distributing, selling, renting or sublicensing any part of the website.',
          'Using the website or any part of it for another event, project or product.',
        ]} />
      </Card>
      <Card title="✓ Allowed" cls="bg-neon/40">
        <List mark="✓" items={['Event participants may open and use the website in a browser for its intended purpose. This does not transfer any rights.']} />
      </Card>
      <Card title="Third-party components" cls="bg-white">
        <p>React, Firebase, Tailwind CSS and Google Fonts belong to their respective owners and remain under their own licences. “Erasmus+” is a programme of the European Union; no affiliation or endorsement is implied.</p>
      </Card>
      <Card title="Permissions and information" cls="bg-sun">
        <p>To request permission to use any part of this website, or to get more information, contact the author:</p>
        <a href={`mailto:${COPYRIGHT.email}`} className="font-extrabold text-lg underline break-all">{COPYRIGHT.email}</a>
      </Card>
    </div>
  );
}
