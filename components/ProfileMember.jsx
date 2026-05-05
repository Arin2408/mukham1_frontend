"use client";

export default function ProfileMember() {
  return (
    <iframe
      src="/profile?embed=true"
      style={{ width: "100%", border: "none", minHeight: "600px", overflow: "hidden" }}
      scrolling="no"
      onLoad={(e) => {
        try {
          const iframe = e.target;
          const doc = iframe.contentWindow?.document;
          if (doc && doc.body) {
            // Initial resize
            iframe.style.height = doc.body.scrollHeight + 'px';
            
            // Watch for any changes
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