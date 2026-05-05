"use client";

export default function DashboardMember() {
  return (
    <iframe
      src="/dashboard2?embed=true"
      style={{ width: "100%", border: "none", minHeight: "800px", overflow: "hidden" }}
      scrolling="no"
      onLoad={(e) => {
        try {
          const iframe = e.target;
          const doc = iframe.contentWindow?.document;
          if (doc && doc.body) {
            // Initial resize
            iframe.style.height = doc.body.scrollHeight + 'px';
            
            // Watch for any content changes (like starting a shift)
            const resizeObserver = new ResizeObserver(() => {
              iframe.style.height = doc.body.scrollHeight + 'px';
            });
            resizeObserver.observe(doc.body);
          }
        } catch (err) {
          console.error("Iframe resize observer failed", err);
        }
      }}
    />
  );
}