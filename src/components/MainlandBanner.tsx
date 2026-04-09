// import mainlandBanner from "../../images/mainland/banner.webp";

export function MainlandBanner() {
  // When a banner image is added, uncomment the import above and swap the fallback for:
  // <img className="mainland-banner-image" src={mainlandBanner} alt="Mainland banner" />
  return (
    <div className="mainland-banner">
      <div className="mainland-banner-fallback" />
      <div className="mainland-banner-scrim" />
      <div className="mainland-banner-label">Mainland</div>
    </div>
  );
}
