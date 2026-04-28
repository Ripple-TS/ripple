export const DEFAULT_DEMO_SOURCE = `export component FeatureCard({
  title,
  items,
  ready,
}: {
  title: string;
  items: string[];
  ready: boolean;
}) {
  <section class="feature-card">
    <h2>{title}</h2>

    if (ready) {
      <ul>
        for (const item of items; index index) {
          <li>{item}</li>
        }
      </ul>
    } else {
      <p>"Loading output..."</p>
    }
  </section>

  <style>
    .feature-card {
      padding: 1rem;
      border: 1px solid rgba(90, 108, 255, 0.2);
      background: rgba(255, 255, 255, 0.78);
    }

    .feature-card h2 {
      margin: 0 0 0.75rem;
      font-size: 1.15rem;
    }

    .feature-card ul {
      margin: 0;
      padding-left: 1.1rem;
    }
  </style>
}`;
