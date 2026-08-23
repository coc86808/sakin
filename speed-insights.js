// Vercel Speed Insights initialization
// This script loads and initializes Vercel Speed Insights for performance monitoring

(function() {
  // Speed Insights queue initialization
  window.si = window.si || function() {
    (window.siq = window.siq || []).push(arguments);
  };
  
  // Load Speed Insights script
  var script = document.createElement('script');
  script.defer = true;
  script.src = 'https://va.vercel-scripts.com/v1/speed-insights/script.js';
  
  // Append to head
  document.head.appendChild(script);
})();
