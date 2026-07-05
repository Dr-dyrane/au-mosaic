try {
  if (localStorage.getItem("aumosaic.theme") === "dark") {
    delete document.documentElement.dataset.theme;
  }
  var p = localStorage.getItem("aumosaic.palette");
  if (p === "maison") {
    delete document.documentElement.dataset.palette;
  } else if (p) {
    document.documentElement.dataset.palette = p;
  }
} catch (e) {}
