import Navbar from "@/components/Navbar";

export default function HomePage() {
  return (
    <main>
      <Navbar />
      <section className="home-hero" id="research-interest">
        <p className="eyebrow">Research Interest</p>
        <h1>Yunwei Lu</h1>
        <ul className="interest-list">
          <li>Superconducting Qubits</li>
          <li>Quantum Open System</li>
          <li>Quantum Control</li>
        </ul>
      </section>
    </main>
  );
}
