import { Card, CardContent, CardHeader } from "../components/ui/Card.jsx";
import { LightCurveChart } from "../components/LightCurveChart.jsx";
import { insights, lightCurveSeries } from "../data/mockLightCurves.js";

export default function Dashboard() {
  return (
    <main>
      <section className="header">
        <div>
          <h1 className="header-title">Exoplanet Signal Observatory</h1>
          <p className="header-subtitle">
            Track the latest photometric readings from NASA missions, surface likely
            transits, and highlight promising exoplanet candidates in real time.
          </p>
        </div>
        <span className="header-subtitle">Updated 12 minutes ago</span>
      </section>

      <section className="cards-grid">
        <Card>
          <CardHeader
            title="Light Curve"
            description="Flux intensity drift"
            action={<span>Kepler-452 System</span>}
          />
          <CardContent>
            <LightCurveChart data={lightCurveSeries} />
          </CardContent>
        </Card>

        {insights.map((item) => (
          <Card key={item.id}>
            <CardHeader title={item.label} description={item.value} />
            <CardContent>
              <p className="header-subtitle">{item.change}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <p className="footer-note">
        Data simulated for hackathon demo purposes. Swap with mission telemetry to see the
        real-time charts update automatically.
      </p>
    </main>
  );
}
