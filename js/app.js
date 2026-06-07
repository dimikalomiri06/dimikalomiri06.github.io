document.addEventListener("DOMContentLoaded", () => {
  const grid = document.getElementById("articles-grid");
  const buttons = document.querySelectorAll("nav button");

  // Initialize application
  async function init() {
    setupFilters();
    const activeCategory = getCategoryFromURL();
    setActiveButton(activeCategory);
    await loadArticles(activeCategory);
  }

  // Parse URL parameter ?category=XYZ
  function getCategoryFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get("category") || "all";
  }

  // Update the visual active state of navigation buttons
  function setActiveButton(category) {
    buttons.forEach(btn => {
      if (btn.getAttribute("data-category") === category) {
        btn.classList.add("active-filter");
      } else {
        btn.classList.remove("active-filter");
      }
    });
  }

  // Add click listeners to buttons to alter the URL without page reloads
  function setupFilters() {
    buttons.forEach(btn => {
      btn.addEventListener("click", () => {
        const cat = btn.getAttribute("data-category");
        const newUrl = cat === "all" ? window.location.pathname : `?category=${encodeURIComponent(cat)}`;
        window.history.pushState({}, "", newUrl);
        setActiveButton(cat);
        loadArticles(cat);
      });
    });
    
    // Listen for browser back/forward buttons
    window.addEventListener("popstate", () => {
      const cat = getCategoryFromURL();
      setActiveButton(cat);
      loadArticles(cat);
    });
  }

  // Main data fetching pipeline
  async function loadArticles(filterCategory) {
    grid.innerHTML = "<p style='font-weight:bold;'>FETCHING MANIFEST...</p>";
    
    try {
      // 1. Fetch the master index manifest containing file names
      const indexResponse = await fetch("content/index.json");
      if (!indexResponse.ok) throw new Error("Could not load content index.");
      const articleFiles = await indexResponse.json();

      // 2. Fetch all JSON entries simultaneously
      const fetchPromises = articleFiles.map(file => 
        fetch(`content/articles/${file}`).then(res => res.json())
      );
      const articles = await Promise.all(fetchPromises);

      // Sort by newest date first
      articles.sort((a, b) => new Date(b.date) - new Date(a.date));

      // 3. Filter entries based on choice
      const filteredArticles = filterCategory === "all" 
        ? articles 
        : articles.filter(art => art.category === filterCategory);

      // 4. Render Layout
      renderGrid(filteredArticles);

    } catch (err) {
      grid.innerHTML = `<div class="neo-container" style="background: red; color: white;">Error mapping feed: ${err.message}</div>`;
    }
  }

  // Dynamic template injector using NeoBrutalismCSS utilities
  function renderGrid(articles) {
    grid.innerHTML = "";
    
    if (articles.length === 0) {
      grid.innerHTML = "<p style='font-weight:bold;'>No records found here.</p>";
      return;
    }

    articles.forEach(article => {
      const card = document.createElement("article");
      // Applying high contrast brutalist styles
      card.className = "neo-container neo-black-shadow";
      card.style.backgroundColor = article.color || "#ffffff";
      card.style.padding = "1.5rem";
      card.style.display = "flex";
      card.style.flexDirection = "column";
      card.style.justifyContent = "space-between";

      const formattedDate = new Date(article.date).toLocaleDateString("en-US", {
        year: "numeric", month: "short", day: "numeric"
      });

      card.innerHTML = `
        <div>
          ${article.image ? `<img src="${article.image}" alt="${article.title}" class="neo-img" style="width:100%; height:180px; object-fit:cover; margin-bottom:1rem; border: 3px solid #000;">` : ''}
          <span style="font-weight:900; text-transform:uppercase; background:#000; color:#fff; padding:2px 6px; font-size:0.8rem;">
            ${article.category}
          </span>
          <h2 style="margin: 0.5rem 0; font-size:1.8rem; text-transform:uppercase; line-height:1.1;">${article.title}</h2>
          <p style="font-size:0.9rem; margin-bottom:1rem; font-style:italic;">By ${article.author} on ${formattedDate}</p>
          <div style="font-weight:500; font-size:1rem; line-height:1.4;">${article.body}</div>
        </div>
      `;
      grid.appendChild(card);
    });
  }

  init();
});