import ResearchBanner from './ResearchBanner';

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-gray-200 bg-white">
      <ResearchBanner />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <p className="text-center text-sm text-gray-500">
          © {new Date().getFullYear()} PlantGuard AI — Research Prototype
        </p>
      </div>
    </footer>
  );
}
