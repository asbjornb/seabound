import mainlandBanner from "../../images/mainland/banner.webp";

export function MainlandBanner() {
  return (
    <div className="mainland-banner">
      <img className="mainland-banner-image" src={mainlandBanner} alt="Mainland banner" />
      <div className="mainland-banner-scrim" />
      <div className="mainland-banner-label">Mainland</div>
    </div>
  );
}
