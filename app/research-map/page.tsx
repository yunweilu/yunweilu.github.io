import Navbar from "@/components/Navbar";
import ResearchMap from "@/components/ResearchMap";
import type { ResearchDataset } from "@/components/ResearchMap";
import researchGroups from "@/data/research_groups.json";

export default function ResearchMapPage() {
  return (
    <main className="research-page">
      <Navbar />
      <ResearchMap dataset={researchGroups as ResearchDataset} />
    </main>
  );
}
