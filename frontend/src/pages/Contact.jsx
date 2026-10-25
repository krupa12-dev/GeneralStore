export default function Contact() {
  const mapUrl =
    "https://www.google.com/maps/search/?api=1&query=Bazarpeth%2C+Phondaghat";

  return (
    <section className="contact" id="contact">
      <div className="contact-inner">
        <div>
          <span className="eyebrow">WE'RE HERE TO HELP</span>

          <h2>Visit our store</h2>

          <p>
            Your neighbourhood destination for everyday essentials.
          </p>
        </div>

        <div className="contact-details">
          <p>
            <strong>Address</strong>
            <span>Bazarpeth, Phondaghat</span>
          </p>

          <p>
            <strong>Phone</strong>
            <a href="tel:+919209903162">+91 9209903162</a>
          </p>

          <p>
            <strong>Location</strong>
            <span>Find us in Phondaghat, Maharashtra.</span>
          </p>

          <a
            href={mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="primary-button"
          >
            Get Directions ↗
          </a>
        </div>
      </div>
    </section>
  );
}
