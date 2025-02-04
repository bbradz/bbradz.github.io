// Update the toggleCollapse function
function toggleCollapse(button) {
  const container = button.closest(".collapsible-code-container");
  if (!container) return;

  const codeContainer = container.querySelector(".code-container");
  if (!codeContainer) return;

  // Toggle the visibility of the code container
  codeContainer.classList.toggle("visible");

  // Toggle the expanded state of the button
  button.classList.toggle("expanded");

  // Update the button text based on the state
  const buttonText = button.querySelector("span");
  if (codeContainer.classList.contains("visible")) {
    buttonText.textContent = "hide code";
  } else {
    buttonText.textContent = "show code";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const buttonContainers = document.querySelectorAll(".button-container");
  buttonContainers.forEach((container) => {
    container.addEventListener("mouseenter", () => {
      const copyButton = container.querySelector(".copy-button");
      if (copyButton) {
        copyButton.classList.add("visible");
      }
    });

    container.addEventListener("mouseleave", () => {
      const copyButton = container.querySelector(".copy-button");
      if (copyButton) {
        copyButton.classList.remove("visible");
      }
    });
  });
});

function handleMouseMove(event, container) {
  const copyButton = container.querySelector(".copy-button");
  if (!copyButton) return;

  const rect = container.getBoundingClientRect();
  const mouseX = event.clientX - rect.left;
  const mouseY = event.clientY - rect.top;

  const buttonRect = copyButton.getBoundingClientRect();
  const buttonCenterX = buttonRect.left + buttonRect.width / 2 - rect.left;
  const buttonCenterY = buttonRect.top + buttonRect.height / 2 - rect.top;

  const distance = Math.sqrt(
    Math.pow(mouseX - buttonCenterX, 2) + Math.pow(mouseY - buttonCenterY, 2)
  );

  if (distance <= 150) {
    copyButton.classList.add("visible");
  } else {
    copyButton.classList.remove("visible");
  }
}

// ======================
// Theme toggle
// ======================
function toggleTheme() {
  const html = document.documentElement;
  const currentTheme = html.getAttribute("data-theme");
  const newTheme = currentTheme === "light" ? "dark" : "light";
  html.setAttribute("data-theme", newTheme);

  // Save the selected theme in localStorage
  localStorage.setItem("theme", newTheme);
}

document.addEventListener("DOMContentLoaded", () => {
  const savedTheme = localStorage.getItem("theme") || "dark"; // Default to dark
  document.documentElement.setAttribute("data-theme", savedTheme);
});

// ======================
// Table of Contents toggle
// ======================
function toggleTOC() {
  const toc = document.getElementById("toc");
  if (!toc) return;
  toc.classList.toggle("expanded");

  const arrow = document.querySelector(".toc-header span:first-child");
  if (arrow) {
    arrow.textContent = toc.classList.contains("expanded") ? "▼" : "▶";
  }
}

// ======================
// Copy code functionality
// ======================
let timeoutId;
const PROXIMITY_THRESHOLD = 150; // pixels

function handleMouseMove(event, buttonId = null) {
  const targetButton = buttonId
    ? document.getElementById(buttonId)
    : document.querySelector(".copy-button");
  if (!targetButton) return;

  const rect = targetButton.getBoundingClientRect();
  const buttonCenterX = rect.left + rect.width / 2;
  const buttonCenterY = rect.top + rect.height / 2;

  const distance = Math.sqrt(
    Math.pow(event.clientX - buttonCenterX, 2) +
      Math.pow(event.clientY - buttonCenterY, 2)
  );

  clearTimeout(timeoutId);

  if (distance <= PROXIMITY_THRESHOLD) {
    targetButton.classList.add("visible");
    timeoutId = setTimeout(() => {
      if (!targetButton.matches(":hover")) {
        targetButton.classList.remove("visible");
      }
    }, 1000);
  } else {
    targetButton.classList.remove("visible");
  }
}

// Update the copyCode function
function copyCode(event) {
  event.preventDefault();
  const button = event.currentTarget;
  const codeContainer = button.closest(".collapsible-code-container");
  const codeEl = codeContainer ? codeContainer.querySelector("code") : null;

  if (!codeEl) return;

  navigator.clipboard
    .writeText(codeEl.innerText || "")
    .then(() => {
      console.log("Copy button clicked, adding 'copied' class"); // Debug log
      button.classList.add("copied");
      setTimeout(() => {
        console.log("Removing 'copied' class"); // Debug log
        button.classList.remove("copied");
      }, 500);
    })
    .catch((err) => {
      console.error("Failed to copy code:", err);
    });
}

// Add event listeners to all copy buttons
document.addEventListener("DOMContentLoaded", () => {
  const copyButtons = document.querySelectorAll(".copy-button");
  copyButtons.forEach((button) => {
    button.addEventListener("click", copyCode);
  });
});

// ======================
// Scroll to top
// ======================
window.onscroll = function () {
  const scrollButton = document.getElementById("scrollToTop");
  if (!scrollButton) return;

  if (
    document.body.scrollTop > window.innerHeight ||
    document.documentElement.scrollTop > window.innerHeight
  ) {
    scrollButton.style.opacity = "1";
  } else {
    scrollButton.style.opacity = "0";
  }
};

function scrollToTop() {
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
}

// ======================
// Copy citation
// ======================
function copyCitation(event) {
  event.preventDefault();
  const button = event.currentTarget;
  const citationContainer = button.closest(".citation-container");
  const citationEl = citationContainer
    ? citationContainer.querySelector("code")
    : null;

  if (!citationEl) return;

  navigator.clipboard
    .writeText(citationEl.innerText || "")
    .then(() => {
      console.log("Citation button clicked, adding 'copied' class"); // Debug log
      button.classList.add("copied");
      setTimeout(() => {
        console.log("Removing 'copied' class"); // Debug log
        button.classList.remove("copied");
      }, 500);
    })
    .catch((err) => {
      console.error("Failed to copy citation:", err);
    });
}

// Add event listeners to all copy buttons
document.addEventListener("DOMContentLoaded", () => {
  const copyButtons = document.querySelectorAll(".copy-button");
  copyButtons.forEach((button) => {
    button.addEventListener("click", copyCode);
  });

  const citationCopyButtons = document.querySelectorAll(
    "#citation-copy-button"
  );
  citationCopyButtons.forEach((button) => {
    button.addEventListener("click", copyCitation);
  });
});

// ======================
// DOMContentLoaded
// ======================
document.addEventListener("DOMContentLoaded", () => {
  // ----- Safely bind events on .code-container and .copy-button -----
  const codeContainer = document.querySelector(".code-container");
  const copyButton = document.querySelector(".copy-button");

  if (codeContainer) {
    codeContainer.addEventListener("mouseleave", () => {
      clearTimeout(timeoutId);
      if (copyButton) {
        copyButton.classList.remove("visible");
      }
    });
  }

  if (copyButton) {
    copyButton.addEventListener("mouseenter", () => {
      clearTimeout(timeoutId);
      copyButton.classList.add("visible");
    });

    copyButton.addEventListener("mouseleave", () => {
      if (!timeoutId) {
        timeoutId = setTimeout(() => {
          copyButton.classList.remove("visible");
        }, 1000);
      }
    });
  }

  // ----- Sidebar TOC + on-scroll logic -----
  const sidebarToc = document.getElementById("sidebar-toc");
  const sidebarLinks = document.querySelector(".sidebar-toc-links");
  const mainToc = document.querySelector(".toc-container");
  let ticking = false;

  if (sidebarLinks) {
    sidebarLinks.style.scrollBehavior = "smooth";
  }

  const handleScroll = () => {
    if (!mainToc || !sidebarToc) return;

    const mainTocRect = mainToc.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const headerOffset = 80;

    // Show sidebar TOC when main TOC is not visible
    const mainTocVisible =
      mainTocRect.top < viewportHeight - headerOffset &&
      mainTocRect.bottom > headerOffset;

    if (mainTocVisible) {
      sidebarToc.classList.remove("visible");
    } else {
      sidebarToc.classList.add("visible");
      updateActiveTocLink();
    }
  };

  const updateActiveTocLink = () => {
    if (!sidebarLinks) return;

    // Look for headings with IDs
    const headings = Array.from(
      document.querySelectorAll("h1[id], h2[id], h3[id], h4[id]")
    ).filter((heading) => heading.id);

    const scrollPosition = window.scrollY;
    const headerOffset = 100;

    let currentActive = null;
    for (const heading of headings) {
      if (scrollPosition >= heading.offsetTop - headerOffset) {
        currentActive = heading;
      } else {
        break;
      }
    }

    const allLinks = sidebarLinks.querySelectorAll("a");
    allLinks.forEach((link) => {
      link.classList.remove("active", "active-parent");
    });

    if (currentActive) {
      const activeLink = sidebarLinks.querySelector(
        `a[href="#${currentActive.id}"]`
      );

      if (activeLink) {
        activeLink.classList.add("active");

        // Highlight parents
        let parent = activeLink.parentElement;
        while (parent && parent !== sidebarLinks) {
          if (parent.tagName === "LI") {
            const parentLink = parent.querySelector(":scope > a");
            if (parentLink) {
              parentLink.classList.add("active-parent");
            }
          }
          parent = parent.parentElement;
        }

        // Auto-scroll in TOC if out of view
        const linkRect = activeLink.getBoundingClientRect();
        const tocRect = sidebarLinks.getBoundingClientRect();
        if (linkRect.top < tocRect.top || linkRect.bottom > tocRect.bottom) {
          activeLink.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }
      }
    }
  };

  window.addEventListener("scroll", () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        handleScroll();
        ticking = false;
      });
      ticking = true;
    }
  });

  // Handle smooth scrolling for sidebar links
  if (sidebarLinks) {
    sidebarLinks.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const targetId = link.getAttribute("href").slice(1);
        const targetElement = document.getElementById(targetId);
        if (targetElement) {
          const headerOffset = 80;
          const elementPosition = targetElement.offsetTop;
          const offsetPosition = elementPosition - headerOffset;

          window.scrollTo({
            top: offsetPosition,
            behavior: "smooth",
          });
        }
      });
    });
  }

  // Run initial scroll logic
  handleScroll();

  // ----- Game of Life logic -----
  const canvas = document.getElementById("gameOfLife");
  if (canvas) {
    // If we have the canvas, run the GOL

    // 1. Random Number Generator
    class SeededRandom {
      constructor(seed = Date.now()) {
        this.seed = seed;
      }
      next() {
        this.seed ^= this.seed << 13;
        this.seed ^= this.seed >> 17;
        this.seed ^= this.seed << 5;
        return (this.seed >>> 0) / 0x100000000;
      }
    }

    // 2. Get 2D context
    const ctx = canvas.getContext("2d");
    const resolution = 10;
    const cols = canvas.width / resolution;
    const rows = canvas.height / resolution;

    // 3. Initialize local storage logic
    function initializeGame(useSeed = false, providedSeed = null) {
      const seed = providedSeed || Date.now();
      console.log(seed);
      localStorage.setItem("gameOfLifeUseSeed", useSeed);
      if (useSeed) {
        localStorage.setItem("gameOfLifeSeed", seed.toString());
      }
      localStorage.removeItem("gameOfLifeGrid");
      localStorage.removeItem("gameOfLifeInitialTimestamp");
      grid = buildGrid();
      return grid;
    }

    function getInitialTimestamp() {
      const stored = localStorage.getItem("gameOfLifeInitialTimestamp");
      if (!stored) {
        const timestamp = Date.now();
        localStorage.setItem(
          "gameOfLifeInitialTimestamp",
          timestamp.toString()
        );
        return timestamp;
      }
      return parseInt(stored);
    }

    function calculateCurrentGeneration(initialTimestamp) {
      const timeElapsed = Date.now() - initialTimestamp;
      // ~60 generations per second
      return Math.floor(timeElapsed / (1000 / 60));
    }

    // 4. Building the grid
    function buildGrid() {
      const storedGrid = localStorage.getItem("gameOfLifeGrid");
      const initialTimestamp = getInitialTimestamp();

      if (!storedGrid) {
        const useSeed = localStorage.getItem("gameOfLifeUseSeed") === "true";
        let rng;

        if (useSeed) {
          const seed = parseInt(localStorage.getItem("gameOfLifeSeed"));
          rng = new SeededRandom(seed);
        }

        // create new grid
        const newGrid = new Array(cols)
          .fill(null)
          .map(() =>
            new Array(rows)
              .fill(null)
              .map(() =>
                useSeed
                  ? Math.floor(rng.next() * 2)
                  : Math.floor(Math.random() * 2)
              )
          );

        // Add gliders
        addGlider(newGrid, 1, 1);
        addGlider(newGrid, 1, 10);
        addGlider(newGrid, 1, 20);
        addGlider(newGrid, 1, 30);

        localStorage.setItem("gameOfLifeGrid", JSON.stringify(newGrid));
        return newGrid;
      }

      // If stored grid exists, forward-simulate
      let grid = JSON.parse(storedGrid);
      const targetGeneration = calculateCurrentGeneration(initialTimestamp);

      for (let i = 0; i < targetGeneration; i++) {
        grid = nextGen(grid);
      }

      return grid;
    }

    function drawGrid(grid) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let col = 0; col < grid.length; col++) {
        for (let row = 0; row < grid[col].length; row++) {
          const cell = grid[col][row];

          ctx.beginPath();
          ctx.rect(
            col * resolution,
            row * resolution,
            resolution - 1,
            resolution - 1
          );
          ctx.fillStyle = cell ? "#4a9eff" : "transparent";
          ctx.fill();
        }
      }
    }

    function countNeighbors(grid, x, y) {
      let sum = 0;
      for (let i = -1; i < 2; i++) {
        for (let j = -1; j < 2; j++) {
          let col = x + i;
          let row = y + j;

          // wrap edges
          if (col < 0) col = cols - 1;
          if (row < 0) row = rows - 1;

          if (col < cols && row < rows) {
            sum += grid[col][row];
          }
        }
      }
      sum -= grid[x][y];
      return sum;
    }

    function nextGen(grid) {
      const nextGrid = grid.map((arr) => [...arr]);

      for (let col = 0; col < grid.length; col++) {
        for (let row = 0; row < grid[col].length; row++) {
          const cell = grid[col][row];
          const neighbors = countNeighbors(grid, col, row);

          if (cell === 1 && (neighbors < 2 || neighbors > 3)) {
            nextGrid[col][row] = 0;
          } else if (cell === 0 && neighbors === 3) {
            nextGrid[col][row] = 1;
          }
        }
      }
      return nextGrid;
    }

    function addGlider(grid, x, y) {
      const glider = [
        [0, 1, 0],
        [0, 0, 1],
        [1, 1, 1],
      ];

      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          let placeX = x + i;
          let placeY = y + j;

          if (placeX < 0) placeX = cols - 1;
          if (placeY < 0) placeY = rows - 1;

          if (placeX < cols && placeY < rows) {
            grid[placeX][placeY] = glider[i][j];
          }
        }
      }
      return grid;
    }

    // 5. Initialize, run the animation
    let grid = buildGrid();

    function update() {
      grid = nextGen(grid);
      drawGrid(grid);
      requestAnimationFrame(update);
    }

    requestAnimationFrame(update);

    // We can set seeded or random here as desired.
    // For random initialization:
    initializeGame(false);

    // For seeded initialization:
    // initializeGame(true, 1736329082156); // Use any number as seed

    /* 
        OTHER GOOD SEEDS

    1736329157225
    1736329263658
    
    
    */
  }
});

const hashString = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
};

function getTagColor(tag) {
  switch (tag) {
    case "YT":
      return "#FF0000";
    case "Arxiv":
      return "#A51C30";
    case "Site":
      return "#F5F5DC";
    default:
      const hash = hashString(tag);
      const hue = hash % 360;
      const saturation = 40 + (hash % 15);
      const lightness = 30 + (hash % 10);
      return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  }
}

function getTextColor(tag) {
  if (tag === "Site") {
    return "#000000";
  }
  return "#FFFFFF";
}

function initializeTagColors() {
  const tags = document.querySelectorAll(".tags span");
  tags.forEach((tag) => {
    const tagType = tag.getAttribute("data-type");
    tag.style.backgroundColor = getTagColor(tagType);
    tag.style.color = getTextColor(tagType);
  });
}

// Debounce function to limit how often searchItems is called
function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

// Optimized search function
function searchItems() {
  const searchTerm = document.getElementById("search").value.toLowerCase();
  const items = document.querySelectorAll("#reading-list li");

  items.forEach((item) => {
    const cachedText =
      item.dataset.cachedText || item.textContent.toLowerCase();
    item.dataset.cachedText = cachedText; // Cache the lowercase text
    item.style.display = cachedText.includes(searchTerm) ? "" : "none";
  });

  window.dispatchEvent(window.documentVisibilityChanged);
}

// Debounced version of searchItems
const debouncedSearchItems = debounce(searchItems, 300);

function formatDate(dateString) {
  if (dateString === "Not specified") return dateString;
  const parsed = new Date(dateString);
  if (isNaN(parsed)) return dateString;
  return parsed.toLocaleString("en-US", {
    month: "short",
    year: "numeric",
  });
}

function generateReadingListHTML(data) {
  const readingList = document.getElementById("reading-list");
  readingList.innerHTML = ""; // Clear existing content

  data.forEach((item) => {
    const li = document.createElement("li");
    li.setAttribute("data-release", item.releaseDate);
    li.setAttribute("data-time", item.readTime);
    li.setAttribute("data-read", item.isRead);

    const html = `
            ${item.isRead ? '<span class="read-indicator">&#10003;</span>' : ""}
            <div class="item-header">
                <div class="item-title">
                    <strong>"${item.title}" by ${item.author}</strong>
                    <span class="meta">${
                      item.isRead ? "Read: " : ""
                    }${formatDate(item.releaseDate)} | Est. Time ${
      item.readTime
    } hours</span>
                </div>
                <div class="tags">
                    ${item.tags
                      .map(
                        (tag) =>
                          `<span data-type="${tag}" onclick="filterByTag('${tag}')">${tag}</span>`
                      )
                      .join("")}
                </div>
            </div>
            <div class="description">
                ${item.description}
            </div>
            ${
              item.downloadLink
                ? `<a class="download-link" href="${item.downloadLink}" download>Source</a>`
                : ""
            }
        `;

    li.innerHTML = html;
    readingList.appendChild(li);
  });

  initializeTagColors();
}

document.addEventListener("DOMContentLoaded", () => {
  generateReadingListHTML(readingListData);
  const searchInput = document.getElementById("search");
  if (searchInput) {
    searchInput.addEventListener("input", debouncedSearchItems);
  }
  initializeTagColors();
});

let readFilterState = 0;

function toggleReadFilter(button) {
  const items = document.querySelectorAll("#reading-list li");

  switch (readFilterState) {
    case 0:
      button.textContent = "Filter: Read";
      button.classList.add("active");
      items.forEach((item) => {
        const isRead = item.getAttribute("data-read") === "true";
        item.style.display = isRead ? "" : "none";
      });
      readFilterState = 1;
      break;

    case 1:
      button.textContent = "Filter: Unread";
      items.forEach((item) => {
        const isRead = item.getAttribute("data-read") === "true";
        item.style.display = !isRead ? "" : "none";
      });
      readFilterState = 2;
      break;

    case 2:
      button.textContent = "Filter: All";
      button.classList.remove("active");
      items.forEach((item) => {
        item.style.display = "";
      });
      readFilterState = 0;
      break;
  }
  window.dispatchEvent(window.documentVisibilityChanged);
}

function toggleSort(button, criteria) {
  const currentOrder = button.dataset.order || "unsorted";
  let newOrder;

  if (currentOrder === "unsorted") {
    newOrder = "asc";
  } else if (currentOrder === "asc") {
    newOrder = "desc";
  } else {
    newOrder = "unsorted";
  }

  const buttons = document.querySelectorAll(".sort-bar button");
  buttons.forEach((btn) => {
    btn.classList.remove("active");
    const arrowSpan = btn.querySelector(".sort-arrow");
    if (arrowSpan) arrowSpan.textContent = "";
  });

  if (newOrder !== "unsorted") {
    button.classList.add("active");
    button.dataset.order = newOrder;

    const arrowSpan = button.querySelector(".sort-arrow");
    if (arrowSpan) arrowSpan.textContent = newOrder === "asc" ? "↑" : "↓";

    sortBy(criteria, newOrder);
  } else {
    button.dataset.order = "unsorted";
    resetList(false);
  }
}

function toggleFilterType(button, type) {
  const isActive = button.classList.contains("active");
  const buttons = document.querySelectorAll(".sort-bar button");
  buttons.forEach((btn) => {
    if (btn !== document.getElementById("filter-read")) {
      btn.classList.remove("active");
      btn.style.removeProperty("--active-color");
      btn.style.removeProperty("--active-text-color");
    }
  });

  if (!isActive) {
    button.classList.add("active");
    switch (type) {
      case "YT":
        button.style.setProperty("--active-color", "#FF0000");
        button.style.setProperty("--active-text-color", "#FFFFFF");
        break;
      case "Arxiv":
        button.style.setProperty("--active-color", "#A51C30");
        button.style.setProperty("--active-text-color", "#FFFFFF");
        break;
      case "Site":
        button.style.setProperty("--active-color", "#F5F5DC");
        button.style.setProperty("--active-text-color", "#000000");
        break;
    }
    filterByType(type);
  } else {
    button.style.removeProperty("--active-color");
    button.style.removeProperty("--active-text-color");
    resetList();
    window.dispatchEvent(window.documentVisibilityChanged);
  }
}

function sortBy(criteria, order) {
  const list = document.getElementById("reading-list");
  const items = Array.from(list.children);

  items.sort((a, b) => {
    let valueA =
      criteria === "release"
        ? new Date(a.dataset.release).getTime() || 0
        : parseFloat(a.dataset.time) || 0;
    let valueB =
      criteria === "release"
        ? new Date(b.dataset.release).getTime() || 0
        : parseFloat(b.dataset.time) || 0;

    return order === "asc" ? valueA - valueB : valueB - valueA;
  });

  items.forEach((item) => list.appendChild(item));
}

function filterByType(type) {
  const items = document.querySelectorAll("#reading-list li");
  items.forEach((item) => {
    const tags = Array.from(item.querySelectorAll(".tags span"));
    const hasTag = tags.some((tag) => tag.dataset.type === type);
    item.style.display = hasTag ? "" : "none";
  });
  window.dispatchEvent(window.documentVisibilityChanged);
}

function filterByTag(tag) {
  const activeTags = document.getElementById("active-tags");
  if (!Array.from(activeTags.children).some((t) => t.textContent === tag)) {
    const tagSpan = document.createElement("span");
    tagSpan.textContent = tag;
    tagSpan.dataset.type = tag;
    tagSpan.style.backgroundColor = getTagColor(tag);
    tagSpan.style.color = getTextColor(tag);

    tagSpan.onclick = () => {
      tagSpan.remove();
      refreshFilters();
    };

    activeTags.appendChild(tagSpan);
    refreshFilters();
  }
}

function refreshFilters() {
  const activeTags = Array.from(
    document.getElementById("active-tags").children
  ).map((t) => t.textContent);
  const items = document.querySelectorAll("#reading-list li");

  items.forEach((item) => {
    const tags = Array.from(item.querySelectorAll(".tags span")).map(
      (tag) => tag.textContent
    );
    const matches = activeTags.every((tag) => tags.includes(tag));
    item.style.display = matches || activeTags.length === 0 ? "" : "none";
  });
  window.dispatchEvent(window.documentVisibilityChanged);
}

function resetList(shouldUpdateGraph = true) {
  const items = document.querySelectorAll("#reading-list li");
  items.forEach((item) => {
    item.style.display = "";
  });
  if (shouldUpdateGraph) {
    window.dispatchEvent(window.documentVisibilityChanged);
  }
}

document.addEventListener("DOMContentLoaded", initializeTagColors);

const readingListData = [
  {
    title: "From Softmax to Sparsemax",
    author: "Martins et. al",
    description:
      "Proposes sparsemax, a new activation function similar to the traditional softmax, but able to output sparse probabilities.",
    tags: ["Machine Learning", "Activation Functions", "Arxiv"],
    readTime: 0.5,
    releaseDate: "2016-02-08",
    isRead: false,
    downloadLink: "https://arxiv.org/pdf/1602.02068",
  },
  {
    title: "Monte Carlo Methods in Financial Engineering",
    author: "Not specified",
    description:
      "A comprehensive guide on Monte Carlo methods applied in financial engineering.",
    tags: ["Finance", "Site"],
    readTime: 16.3,
    releaseDate: "Not specified",
    isRead: false,
    downloadLink:
      "https://www.bauer.uh.edu/spirrong/Monte_Carlo_Methods_In_Financial_Engineering.pdf",
  },
  {
    title: "Information Theory: A Tutorial Introduction",
    author: "University of Sheffield",
    description: "Introduces the main ideas in Shannon’s theory.",
    tags: ["Information Theory", "Arxiv"],
    readTime: 0.5,
    releaseDate: "2019-06-13",
    isRead: false,
    downloadLink: "https://arxiv.org/pdf/1802.05968",
  },
  {
    title: "What Every Programmer Should Know About Memory",
    author: "Redhat",
    description: "An in-depth look at memory management for programmers.",
    tags: ["Programming", "Site"],
    readTime: 6.5,
    releaseDate: "Not specified",
    isRead: false,
    downloadLink: "https://people.freebsd.org/~lstewart/articles/cpumemory.pdf",
  },
  {
    title:
      "PowerSGD: Practical Low-Rank Gradient Compression for Distributed Optimization",
    author: "EPFL",
    description:
      "Proposes gradient compressor achieving test performance on par with SGD with consistent wall-clock speedups.",
    tags: ["Optimization", "Distributed Computing", "Arxiv"],
    readTime: 1,
    releaseDate: "2020-02-18",
    isRead: false,
    downloadLink: "https://arxiv.org/pdf/1905.13727",
  },
  {
    title: "Step-by-Step Diffusion: An Elementary Tutorial",
    author: "University of Montreal",
    description: "A tutorial on diffusion models.",
    tags: ["Diffusion Models", "Tutorial", "Arxiv"],
    readTime: 1.5,
    releaseDate: "Not specified",
    isRead: false,
    downloadLink: "https://arxiv.org/pdf/2406.08929",
  },
  {
    title:
      "A Loss Curvature Perspective on Training Instability in Deep Learning",
    author: "Google",
    description:
      "Combine learning rate, model structure, and weight initialization to analyze the evolution of Hessian loss.",
    tags: ["Deep Learning", "Optimization", "Arxiv"],
    readTime: 1,
    releaseDate: "2020-10-08",
    isRead: false,
    downloadLink: "https://arxiv.org/pdf/2110.04369",
  },
  {
    title: "Networks, Crowds, and Markets",
    author: "Cornell University",
    description: "A book exploring networks, crowds, and markets.",
    tags: ["Economics", "Site"],
    readTime: 23.5,
    releaseDate: "Not specified",
    isRead: false,
    downloadLink:
      "https://www.cs.cornell.edu/home/kleinber/networks-book/networks-book.pdf",
  },
  {
    title: "Towards Practical Second Order Optimization for Deep Learning",
    author: "Anonymous",
    description:
      "Presents a scalable 2nd-order preconditioner with significant convergence and wall-clock time improvements compared to 1st-order methods.",
    tags: ["Optimization", "Deep Learning", "Site"],
    readTime: 0.6,
    releaseDate: "2021-01-01",
    isRead: false,
    downloadLink: "https://openreview.net/references/pdf?id=80B6V-eoFP",
  },
  {
    title: "Deep Bellman Hedging",
    author: "Buehler et al.",
    description: "A paper on reinforcement learning and hedging.",
    tags: ["Reinforcement Learning", "Arxiv"],
    readTime: 0.6,
    releaseDate: "Not specified",
    isRead: false,
    downloadLink: "https://arxiv.org/pdf/2207.00932",
  },
  {
    title:
      "A Large Batch Optimizer Reality Check: Traditional, Generic Optimizers Suffice Across Batch Sizes",
    author: "Google",
    description:
      "Refutes performance claims of optimizers built around large batch sizes.",
    tags: ["Optimization", "Arxiv"],
    readTime: 0.8,
    releaseDate: "2021-06-09",
    isRead: false,
    downloadLink: "https://arxiv.org/pdf/2102.06356",
  },
  {
    title: "Information Theory, Inference, and Learning Algorithms",
    author: "Cambridge University",
    description:
      "A comprehensive book on information theory, inference, and learning algorithms.",
    tags: ["Machine Learning", "Algorithms", "Site"],
    readTime: 19.6,
    releaseDate: "Not specified",
    isRead: false,
    downloadLink: "https://www.inference.org.uk/itprnn/book.pdf",
  },
  {
    title: "Vector Quantized Models for Planning",
    author: "Not specified",
    description:
      "Presents using discrete autoencoders to capture the multiple effects of an action in a stochastic environment, using MCTS to plan over both actions and discrete latent variables. Significantly outperforming MuZero on a stochastic interpretation of chess.",
    tags: ["Reinforcement Learning", "Autoencoders", "Arxiv"],
    readTime: 0.6,
    releaseDate: "2021-08-06",
    isRead: false,
    downloadLink: "https://arxiv.org/pdf/2106.04615",
  },
  {
    title: "Programming Massively Parallel Applications",
    author: "David B. Kirk",
    description: "A book on programming massively parallel applications.",
    tags: ["Parallel Computing", "Site"],
    readTime: 18.8,
    releaseDate: "Not specified",
    isRead: false,
    downloadLink:
      "https://github.com/h3ct0rjs/HighPerformanceComputing/blob/master/BookRef/Programming%20Massively%20Parallel%20Processors.pdf",
  },
  {
    title: "Hyperparameter Optimization Is Deceiving Us, and How to Stop It",
    author: "Cornell University",
    description:
      "Provides a theoretical grounding for process epistemic hyperparameter optimization (EHPO) to avoid deception by hyperparams.",
    tags: ["Hyperparameter Optimization", "Machine Learning", "Arxiv"],
    readTime: 1.3,
    releaseDate: "2021-10-26",
    isRead: false,
    downloadLink: "https://arxiv.org/pdf/2102.03034",
  },
  {
    title:
      "Torch.FX: a Practical Program Capture and Transformation for DL in Python",
    author: "Horace He",
    description:
      "Studies designs for program capture in the typical deep learning use case to propose a library optimizing for developer productivity.",
    tags: ["Deep Learning", "Libraries", "Arxiv"],
    readTime: 0.7,
    releaseDate: "2022-03-04",
    isRead: false,
    downloadLink: "https://arxiv.org/pdf/2112.08429",
  },
  {
    title: "Set Theory",
    author: "Not specified",
    description: "A book on set theory.",
    tags: ["Mathematics", "Site"],
    readTime: 1,
    releaseDate: "Not specified",
    isRead: false,
    downloadLink: "http://www.alefenu.com/libri/topologymunkres.pdf",
  },
  {
    title: "Omnigrok: Grokking Beyond Algorithmic Data",
    author: "MIT",
    description:
      "Understands grokking by analyzing NN loss landscapes, identifying the mismatch between training and test loss as the cause for grokking.",
    tags: ["Neural Networks", "Optimization", "Grokking", "Arxiv"],
    readTime: 0.6,
    releaseDate: "2023-03-23",
    isRead: false,
    downloadLink: "https://arxiv.org/pdf/2210.01117",
  },
  {
    title: "Lie Groups",
    author: "University of Ottowa",
    description: "A book on Lie groups.",
    tags: ["Mathematics", "Lie Groups", "Site"],
    readTime: 1,
    releaseDate: "Not specified",
    isRead: false,
    downloadLink:
      "https://alistairsavage.ca/mat4144/notes/MAT4144-5158-LieGroups.pdf",
  },
  {
    title: "Finding Neurons in a Haystack",
    author: "MIT",
    description:
      "Shows the progression of, violation of, and features embedded in neurons at varying depths of LLM.",
    tags: ["Interpretability", "Neural Networks", "LLMs", "Arxiv"],
    readTime: 1.3,
    releaseDate: "2023-06-02",
    isRead: false,
    downloadLink: "https://arxiv.org/pdf/2305.01610",
  },
  {
    title: "Meta-Learning",
    author: "Lilian Weng",
    description: "A post on meta-learning.",
    tags: ["Meta-Learning", "Machine Learning", "Site"],
    readTime: 2.6,
    releaseDate: "Not specified",
    isRead: false,
    downloadLink:
      "https://lilianweng.github.io/posts/2018-11-30-meta-learning/",
  },
  {
    title: "Uncovering Mesa-optimization algorithms in Transformers",
    author: "Google",
    description:
      "Reverse engineers Transformers to determine that performance comes from an architectural bias towards mesa-optimization.",
    tags: ["Transformers", "Optimization", "LLMs", "Arxiv"],
    readTime: 1.9,
    releaseDate: "2023-09-11",
    isRead: false,
    downloadLink: "https://arxiv.org/pdf/2309.05858",
  },
  {
    title: "Why do we need Weight Decay in modern Deep Learning?",
    author: "EPFL",
    description:
      "Present a unifying perspective from to say that weight decay changes the training dynamics in a desirable way.",
    tags: ["Deep Learning", "Optimization", "Arxiv"],
    readTime: 1.3,
    releaseDate: "2023-10-06",
    isRead: false,
    downloadLink: "https://arxiv.org/pdf/2310.04415",
  },
  {
    title:
      "When, Why and How Much? Adaptive Learning Rate Scheduling by Refinement",
    author: "Meta",
    description:
      "Develops theory supporting the linear decay schedules and refinement techniques, establishing SOTA performance in theory and practice.",
    tags: ["Optimization", "Arxiv"],
    readTime: 1.1,
    releaseDate: "2023-10-11",
    isRead: false,
    downloadLink: "https://arxiv.org/pdf/2310.07831",
  },
  {
    title: "One Wide Feedforward Network is All You Need",
    author: "Apple",
    description:
      "Observes a high redundancy in the Feed-Forward layers of Transformers to unlock substantial gains in accuracy & latency.",
    tags: ["LLMs", "Optimization", "Arxiv"],
    readTime: 0.6,
    releaseDate: "2023-10-21",
    isRead: false,
    downloadLink: "https://arxiv.org/pdf/2309.01826",
  },
  {
    title: "DiLoCo: Distributed Low-Communication Training of Language Models",
    author: "Google",
    description:
      "Proposes a distributed optimization algorithm to train LLMs on islands of poorly connected devices.",
    tags: ["LLMs", "Optimization", "Arxiv"],
    readTime: 0.5,
    releaseDate: "2023-12-02",
    isRead: false,
    downloadLink: "https://arxiv.org/pdf/2311.08105",
  },
  {
    title:
      "Reinforcement Learning With Sparse-executing Action via Sparsity Regularization",
    author: "Nanjing University",
    description:
      "Proposes a spinoff of Markov Decision Processes to account for need to sparsify actions.",
    tags: ["Reinforcement Learning", "Arxiv"],
    readTime: 0.8,
    releaseDate: "2024-07-22",
    isRead: false,
    downloadLink: "https://arxiv.org/pdf/2105.08666",
  },
  {
    title: "Literature Review of Sampling Techniques",
    author: "njkumar",
    description:
      "Explains the many types of Sampling techniques for ML Models and their differing strengths.",
    tags: ["Machine Learning", "Site"],
    readTime: 0.3,
    releaseDate: "2024-08-10",
    isRead: true,
    downloadLink: "https://njkumar.com/literature-review-sampling-techniques/",
  },
  {
    title:
      "Learning to (Learn at Test Time): RNNs with Expressive Hidden States",
    author: "Sun et al.",
    description:
      "Proposes a new sequence modeling layers with O(n) complexity and an expressive ML model hidden state.",
    tags: ["RNNs", "Machine Learning", "Arxiv"],
    readTime: 1.1,
    releaseDate: "2024-08-11",
    isRead: false,
    downloadLink: "https://arxiv.org/pdf/2407.04620",
  },
  {
    title:
      "Tree Attention: Topology-Aware Decoding for Long-Context Attention on GPU Clusters",
    author: "EleutherAI",
    description:
      "Reveals a self-attention computation parallelizable across multiple GPUs.",
    tags: ["Attention Mechanisms", "Parallel Computing", "Arxiv"],
    readTime: 0.5,
    releaseDate: "2024-08-14",
    isRead: false,
    downloadLink: "https://arxiv.org/pdf/2408.04093",
  },
  {
    title:
      "DeepSeek-Prover-V1.5: Harnessing Proof Assistant Feedback for Reinforcement Learning and Monte-Carlo Tree Search",
    author: "DeepSeek",
    description:
      "Introduces a dataset & RL with proof-solving feedback for fine-tuning on top of MCTS for generating more lush proof paths.",
    tags: ["Reinforcement Learning", "Arxiv"],
    readTime: 0.9,
    releaseDate: "2024-08-15",
    isRead: false,
    downloadLink: "https://arxiv.org/pdf/2408.08152",
  },
  {
    title: "The LLama3 herd of models",
    author: "Meta",
    description:
      "Presents the results of experiments which integrate image, video, and speech capabilities into Llama 3.",
    tags: ["LLMs", "Arxiv"],
    readTime: 3.7,
    releaseDate: "2024-08-15",
    isRead: false,
    downloadLink: "https://arxiv.org/pdf/2407.21783",
  },
  {
    title: "The AdeMAMix optimizer: Better, Faster, Older",
    author: "Apple",
    description:
      "Halves tokens required to train LLM while slowing down forgetting through leveraging the need to remember far back gradients.",
    tags: ["Optimization", "LLMs", "Arxiv"],
    readTime: 1.5,
    releaseDate: "2024-09-05",
    isRead: false,
    downloadLink: "https://arxiv.org/pdf/2409.03137",
  },
  {
    title:
      "Compute Better Spent: Replacing Dense Layers with Structured Matrices",
    author: "Qiu et al.",
    description:
      "Explores structured matrices as replacements for dense matrices as models scale.",
    tags: ["Optimization", "Arxiv"],
    readTime: 0.9,
    releaseDate: "2024-10-06",
    isRead: false,
    downloadLink: "https://arxiv.org/pdf/2406.06248",
  },
  {
    title: "Financial Statement Analysis with Large Language Models",
    author: "Kim et al.",
    description:
      "Investigates whether LLMs can successfully perform financial statement analysis similarly to professional human analysts.",
    tags: ["LLMs", "Finance", "Arxiv"],
    readTime: 1.6,
    releaseDate: "2024-10-11",
    isRead: false,
    downloadLink: "https://arxiv.org/pdf/2407.17866",
  },
  {
    title:
      "The Surprising Effectiveness of Test-Time Training for Abstract Reasoning",
    author: "MIT",
    description:
      "Investigates the effectiveness of test-time training (TTT) as a mechanism for improving reasoning capabilities, using ARC as a benchmark.",
    tags: ["LLMs", "Arxiv"],
    readTime: 0.7,
    releaseDate: "2024-11-11",
    isRead: false,
    downloadLink: "https://arxiv.org/pdf/2411.07279",
  },
  {
    title: "Transformers meet Neural Algorithmic Reasoners",
    author: "Google",
    description:
      "Proposes a novel combination of Transformers with GNN-based neural algorithmic reasoners (NARs) as a hybrid architecture demonstrating significant gains over Transformer-only models for algorithmic reasoning.",
    tags: ["LLMs", "GNNs", "Arxiv"],
    readTime: 0.4,
    releaseDate: "2024-06-13",
    isRead: false,
    downloadLink: "https://arxiv.org/pdf/2406.09308",
  },
  {
    title: "On Empirical Comparison of Optimizers",
    author: "Choi et al.",
    description:
      "Gives tips around tuning often ignored hyperparameters of adaptive gradient methods and raise concerns about fairly benchmarking optimizers for NN training.",
    tags: ["Optimizers", "Deep Learning", "Arxiv"],
    readTime: 0.8,
    releaseDate: "2020-06-16",
    isRead: false,
    downloadLink: "https://arxiv.org/pdf/1910.05446",
  },
  {
    title:
      "DeepSeek-Coder-V2: Breaking the Barrier of Closed-Source Models in Code Intelligence",
    author: "DeepSeek",
    description:
      "DeepSeek-V2 is pre-trained with 6 trillion additional tokens achieving superior coding performance to closed-source models.",
    tags: ["LLMs", "Arxiv"],
    readTime: 0.6,
    releaseDate: "2024-06-17",
    isRead: false,
    downloadLink: "https://arxiv.org/pdf/2406.11931",
  },
  {
    title:
      "DeepSeek-V2: A Strong, Economical, and Efficient Mixture-of-Experts Language Model",
    author: "DeepSeek",
    description:
      "Presents DeepSeek-V2, a strong MoE language model characterized by economical training and efficient inference.",
    tags: ["MoEs", "LLMs", "Arxiv"],
    readTime: 1.3,
    releaseDate: "2024-06-19",
    isRead: false,
    downloadLink: "https://arxiv.org/pdf/2405.04434",
  },
  {
    title: "Why Transformers need Adam: A Hessian Perspective",
    author: "University of Hong Kong",
    description:
      "Provides an explanation through the lens of Hessian of why Adam outperforms SGD on Transformer models.",
    tags: ["Optimizations", "Arxiv"],
    readTime: 1.4,
    releaseDate: "2024-10-21",
    isRead: false,
    downloadLink: "https://arxiv.org/pdf/2402.16788",
  },
  {
    title: "Sparse Crosscoders for Cross-Layer Features and Model Diffing",
    author: "Anthropic",
    description:
      "Introduces sparse crosscoders, a variant of sparse autoencoders or transcoders for understanding models in superposition.",
    tags: ["Interpretability", "Site"],
    readTime: 0.6,
    releaseDate: "2024-10-25",
    isRead: false,
    downloadLink:
      "https://transformer-circuits.pub/2024/crosscoders/index.html",
  },
  {
    title: "Beyond A*",
    author: "Meta",
    description:
      "Shows a Transformer model to optimally solve unseen Sokoban puzzles 93.7% of the time with up to 26.8% fewer steps than the A*.",
    tags: ["Transformers", "Arxiv"],
    readTime: 0.8,
    releaseDate: "2024-04-26",
    isRead: false,
    downloadLink: "https://arxiv.org/pdf/2402.14083",
  },
  {
    title: "Beating SPACE EXPLORATION | The 300 Hour Factorio Mod",
    author: "DoshDoshington",
    description:
      "Playthrough of the Space Exploration Modpack for the base-building logistics management game, Factorio.",
    tags: ["Factorio", "YT"],
    readTime: 3.5,
    releaseDate: "2022-08-09",
    isRead: true,
    downloadLink: "https://www.youtube.com/watch?v=8hRJ-CcwvrI&t=3668s",
  },
  {
    title: "LPUs, TPUs & GPUs w/ Jonathan Ross, Founder Groq",
    author: "Lumida Wealth",
    description:
      "Interview with the founder of breakout AI Accelerator lab Groq on the state of the art in LLM Hardware.",
    tags: ["Parallel Computing", "Hardware", "YT"],
    readTime: 1.5,
    releaseDate: "2023-12-03",
    isRead: true,
    downloadLink: "https://www.youtube.com/watch?v=gE8SvBqMf8o&t=989s",
  },
  {
    title:
      "o3 - Tradeoffs of Heuristics, Tree Search, External Memory, In-built Bias",
    author: "John Tan Chong Min",
    description:
      "Slideshow lecture from John about the SOTA and limitations in LLM Reasoning.",
    tags: ["LLMs", "Reinforcement Learning", "Meta-Learning", "YT"],
    readTime: 4.0,
    releaseDate: "2024-12-30",
    isRead: true,
    downloadLink: "https://www.youtube.com/watch?v=f5obaHiOog4&t=5986s",
  },
  {
    title: "The State of Reasoning",
    author: "Nathan Lambert",
    description: "NeurIPS 2024 talk on the attempts to teach LLMs to Reason",
    tags: ["LLMs", "YT"],
    readTime: 0.5,
    releaseDate: "2025-01-03",
    isRead: false,
    downloadLink: "https://www.youtube.com/watch?v=skT89EvIjrc",
  },
  {
    title: "CUDA Programming Course",
    author: "freeCodeCamp.org",
    description:
      "Tutorial on the implementation details of coding in the CUDA programming language.",
    tags: ["Programming", "Parallel Computing", "YT"],
    readTime: 12,
    releaseDate: "2024-09-24",
    isRead: false,
    downloadLink: "https://www.youtube.com/watch?v=86FAWCzIe_4&t=1s",
  },
  {
    title:
      "Deep Symbolic Regression: Recovering Math Expressions from Data via Risk-Seeking Policy Gradients",
    author: "Lawrence Livermore Laboratory",
    description:
      "Brenden Petersen explains how symbolic regression transforms data-fitting into a problem of Reinforcement Learning over language space.",
    tags: ["Symbolic Systems", "YT"],
    readTime: 1.0,
    releaseDate: "2021-06-08",
    isRead: true,
    downloadLink: "https://www.youtube.com/watch?v=o43X6Hni6tU&t=2715s",
  },
  {
    title: "AI for physics & physics for AI",
    author: "MIT",
    description:
      "Description of the AI Feynman project for Symbolic Regression on Physics Data.",
    tags: ["Symbolic Systems", "YT"],
    readTime: 1.0,
    releaseDate: "2020-06-25",
    isRead: true,
    downloadLink: "https://www.youtube.com/watch?v=pkJkHB_c3nA&t=46s",
  },
  {
    title: "AI for physics & physics for AI",
    author: "MIT",
    description:
      "Description of the AI Feynman project for Symbolic Regression on Physics Data.",
    tags: ["Symbolic Systems", "YT"],
    readTime: 1.0,
    releaseDate: "2020-06-25",
    isRead: true,
    downloadLink: "https://www.youtube.com/watch?v=pkJkHB_c3nA&t=46s",
  },
  {
    title: "Parables on the Power of Planning in AI: From Poker to Diplomacy",
    author: "Noam Brown",
    description:
      "OpenAI's Noam Brown explains the story of the power of applying planning to AI in Games.",
    tags: ["LLMs", "Reinforcement Learning", "YT"],
    readTime: 1.0,
    releaseDate: "2024-09-17",
    isRead: true,
    downloadLink: "https://www.youtube.com/watch?v=eaAonE58sLU",
  },
  {
    title:
      "The Wisdom (and Madness) of Crowds: Political Markets as Election Predictors",
    author: "Aswath Damodaran",
    description:
      "Examines the history of thought around the conditions under which the crowd or market's judgment becomes wise.",
    tags: ["Markets", "Finance", "YT"],
    readTime: 0.5,
    releaseDate: "2024-09-07",
    isRead: true,
    downloadLink: "https://www.youtube.com/watch?v=LejPvcakKpE&t=284s",
  },
  {
    title:
      "@Asianometry & Dylan Patel – How the Semiconductor Industry Actually Works",
    author: "Dwarkesh Patel",
    description:
      "Conversation between two Industry watchdogs on the state of play in US-China AI Race.",
    tags: ["Distributed Computing", "Hardware", "YT"],
    readTime: 2.5,
    releaseDate: "2024-10-04",
    isRead: true,
    downloadLink: "https://www.youtube.com/watch?v=pE3KKUKXcTM",
  },
  {
    title: "The Insane Engineering of Minecraft's Most Powerful Mobfarm",
    author: "cubicmetre",
    description:
      "exploring the End of Light mobfarm and how it pushes mobfarming in Minecraft to the game's absolute limits.",
    tags: ["Minecraft", "YT"],
    readTime: 2.0,
    releaseDate: "2024-08-07",
    isRead: true,
    downloadLink: "https://www.youtube.com/watch?v=v1eouiqVfZY",
  },
  {
    title: "Sun Valley Writers' Conference with Ezra Klein",
    author: "Ezra Klein",
    description:
      "Discussion on AI, the tie between zoning and homelessness, polarizing politics, and the intersection of government and technology.",
    tags: ["Policy", "YT"],
    readTime: 1.0,
    releaseDate: "2023-08-17",
    isRead: true,
    downloadLink: "https://www.youtube.com/watch?v=nRYFyH8-0oc",
  },
  {
    title: "A Conversation with Ezra Klein about Liberalism",
    author: "Ezra Klein",
    description:
      "Reflecting on Democratic governments inability to build real things in the real world quickly and affordably.",
    tags: ["Policy", "YT"],
    readTime: 1.5,
    releaseDate: "2023-12-08",
    isRead: true,
    downloadLink: "https://www.youtube.com/watch?v=7OyLHeJB15c&t=671s",
  },
  {
    title: "Arguments for Atheism",
    author: "Alex O'Connor",
    description:
      "Two Doctoral Students in the Philosophy of Theology construct a tier list of arguments for Atheism.",
    tags: ["Philosophy", "YT"],
    readTime: 2.5,
    releaseDate: "2024-06-23",
    isRead: true,
    downloadLink: "https://www.youtube.com/watch?v=s_5vfQE6_yE",
  },
  {
    title: "How massive Cerebras chips rival Nvidia GPUs for AI",
    author: "Dr Waku",
    description:
      "Discussion with key engineer at Cerebras AI Accelerator on their unique memory architectures unique use-case in LLMs.",
    tags: ["Parallel Computing", "LLMs", "Hardware", "YT"],
    readTime: 1.0,
    releaseDate: "2024-12-25",
    isRead: true,
    downloadLink: "https://www.youtube.com/watch?v=qC_lCFTOJU0&t=740s",
  },
  {
    title: "Populism, Media Revolutions, and Our Terrible Moment",
    author: "Hank Green",
    description:
      "Rant from Hank Green on the destruction of trust & reality in society by the Internet's revolutionary Algorithmic Realities.",
    tags: ["Politics", "YT"],
    readTime: 0.5,
    releaseDate: "2024-11-22",
    isRead: true,
    downloadLink: "https://www.youtube.com/watch?v=d8PndpFPL8g",
  },
  {
    title: "o-models, beyond classical DL",
    author: "Francois Chollet",
    description:
      "Description of the ARG-AGI model evaluation test set and how current Deep Learning Architectures fail to encapsulate Symbolic reasoning",
    tags: ["Deep Learning", "Symbolic Systems", "YT"],
    readTime: 1.5,
    releaseDate: "2025-01-08",
    isRead: true,
    downloadLink: "https://www.youtube.com/watch?v=w9WE1aOPjHc",
  },
  {
    title: "Let this method tune hyper-parameters for you!",
    author: "Tunadorable",
    description:
      "Stepping through, analyzing, and explaining the muP method for controlling optimal hyperparameter divergence with model scaling.",
    tags: ["Hyperparameter Optimization", "YT"],
    readTime: 0.5,
    releaseDate: "2025-01-06",
    isRead: true,
    downloadLink: "https://www.youtube.com/watch?v=-T9pBZ2nBkc",
  },
  {
    title: "Let this method tune hyper-parameters for you!",
    author: "Tunadorable",
    description:
      "Stepping through, analyzing, and explaining the muP method for controlling optimal hyperparameter divergence with model scaling.",
    tags: ["Hyperparameter Optimization", "YT"],
    readTime: 0.5,
    releaseDate: "2025-01-06",
    isRead: true,
    downloadLink: "https://www.youtube.com/watch?v=-T9pBZ2nBkc",
  },
  {
    title: "The Practitioner's Guide to the Maximal Update Parameterization",
    author: "Eleuther.AI",
    description:
      "Explores the implementation details of mutransfer & basis it's in statistical properties as well as empirically tests to verify the technique.",
    tags: ["Hyperparameter Optimization", "Deep Learning", "Site"],
    readTime: 0.5,
    releaseDate: "2024-09-19",
    isRead: true,
    downloadLink: "https://blog.eleuther.ai/mutransfer/",
  },
  {
    title: "Git Version Control-- CS61",
    author: "Harvard",
    description:
      "Harvard CS61 Introductory Guide to Git Version Control, read this for CS30 Course at Brown University",
    tags: ["Git", "Site"],
    readTime: 1.0,
    releaseDate: "2023-11-0",
    isRead: true,
    downloadLink: "https://cs61.seas.harvard.edu/site/ref/git/#gsc.tab=0",
  },
  {
    title: "git - the simple guide",
    author: "",
    description:
      "beautifully designed scroll-based description of git which specializes in simple descriptions of complex commands",
    tags: ["Roger Dudler"],
    readTime: 0.5,
    releaseDate: "2020-1-1",
    isRead: true,
    downloadLink: "https://rogerdudler.github.io/git-guide/",
  },
  {
    title: "Treadmill: Attributing the Source of Tail Latency",
    author: "Meta",
    description:
      "decomposes features of request tail latency into an evaluation methodology to reduce the 99th-percentile latency by 43% and its variance by 93%",
    tags: ["Distributed Systems", "Arxiv"],
    readTime: 0.5,
    releaseDate: "2016-01-01",
    isRead: true,
    downloadLink:
      "https://www.jasonmars.org/wp-content/uploads/2020/04/ISCA.2016.47.pdf",
  },
  {
    title: "Open Versus Closed: A Cautionary Tale",
    author: "CMU",
    description:
      "Illustrates the behavior differences b/w closed & open sourced models in real-world settings to motivate a proposed partly open system model for diagnostic workload generation",
    tags: ["Distributed Systems", "Arxiv"],
    readTime: 0.5,
    releaseDate: "2006-01-01",
    isRead: true,
    downloadLink:
      "https://www.usenix.org/legacy/event/nsdi06/tech/full_papers/schroeder/schroeder.pdf",
  },
  {
    title: "Quantile Regression",
    author: "sklearn",
    description:
      "Quick description of the math behind & motivation behind Quantile Regression (as opposed to OLS Linear Regression, and how to use sklearn to implement it.",
    tags: ["Machine Learning", "Site"],
    readTime: 0.5,
    releaseDate: "2023-01-01",
    isRead: true,
    downloadLink:
      "https://scikit-learn.org/dev/auto_examples/linear_model/plot_quantile_regression.html",
  },
  {
    title: "Interpretability in Parameter Space",
    author: "Apollo",
    description: "Introduced method to decompose a NN params into components",
    tags: ["Interpretability", "Arxiv"],
    readTime: 1.0,
    releaseDate: "2025-01-24",
    isRead: true,
    downloadLink: "https://arxiv.org/pdf/2501.14926",
  },
  {
    title: "The Mythos of Model Interpretability",
    author: "Zachary C. Lipton",
    description:
      "Old paper we went over for CS2222 outlining reasons to want, and properties you would expect from, Interpretable models",
    tags: ["Interpretability", "Arxiv"],
    readTime: 0.0,
    releaseDate: "2017-03-06",
    isRead: true,
    downloadLink: "https://arxiv.org/pdf/1606.03490",
  },
  {
    title: "The Leaky Bucket Theory of Network Effects",
    author: "Dan Hockenmaier",
    description:
      "A framework for understanding the strength of a marketplace’s network effect",
    tags: ["Economics", "Site"],
    readTime: 0.5,
    releaseDate: "2024-12-09",
    isRead: true,
    downloadLink:
      "https://www.danhock.co/p/the-leaky-bucket-theory-of-network-effects?utm_source=profile&utm_medium=reader2",
  },
  {
    title: "Why Did DoorDash Win?",
    author: "Dan Hockenmaier",
    description:
      "A rough description of the process by which Doordash rose to dominate the food delivery market",
    tags: ["Economics", "Site"],
    readTime: 0.5,
    releaseDate: "2025-01-22",
    isRead: true,
    downloadLink:
      "https://www.danhock.co/p/why-did-doordash-win?utm_source=tldrproduct",
  },
  {
    title: "Good Lord",
    author: "Benn",
    description:
      "essay from the supposed perspective of a tech insider about the internal experience of a newly empowered debaucherous trump-fueled tech vibe",
    tags: ["Politics", "Technology", "Site"],
    readTime: 0.5,
    releaseDate: "2025-01-24",
    isRead: true,
    downloadLink:
      "https://benn.substack.com/p/good-lord?utm_source=tldrproduct#footnote-5-155630639",
  },
  {
    title: "Probing Classifiers: Promises, Shortcomings, and Advances",
    author: "Israel Institute of Technology",
    description:
      "Critically reviews probing classifiers as a framework for understanding learned information in models, highlighting their promises, shortcomings, and advances. [CS2222]",
    tags: ["Interpretability", "Arxiv"],
    readTime: 0.5,
    releaseDate: "2024-02-21",
    isRead: true,
    downloadLink: "https://aclanthology.org/2022.cl-1.7.pdf",
  },
  {
    title: "Mechanistic?",
    author: "Harvard / Allen Institute",
    description:
      "Explains the many meanings behind *mechinterp* as a product of a critical confluence of communities of varying degrees of credentials [CS2222]",
    tags: ["AI Safety", "Interpretability", "Arxiv"],
    readTime: 0.5,
    releaseDate: "2024-10-07",
    isRead: true,
    downloadLink: "https://arxiv.org/pdf/2410.09087",
  },
  {
    title: "escaping flatland: career advice for CS undergrads",
    author: "Euan Ong",
    description:
      "A message to CS undergrads about the unmentioned mimetic vortex of prestige and narrow set of allowed passions which university can distract you with.",
    tags: ["Essay", "Site"],
    readTime: 0.5,
    releaseDate: "2024-12-26",
    isRead: true,
    downloadLink: "https://space.ong.ac/escaping-flatland",
  },
  {
    title:
      "Violence and the Sacred: College as an incubator of Girardian terror",
    author: "Dan Wang",
    description:
      "Commentary on the social pressures of college through the lens of René Girard's concept of mimetic desire",
    tags: ["Politics", "Site"],
    readTime: 0.5,
    releaseDate: "2017-06-25",
    isRead: true,
    downloadLink: "https://danwang.co/college-girardian-terror/",
  },
  {
    title: "The Linear Representation Hypothesis and the Geometry of LLMs",
    author: "Park et al.",
    description:
      "Attempts to formalize the concept of a linear representation and associated geometric notions of relation in that linear subspace [CS2222]",
    tags: ["Interpretability", "LLMs", "Arxiv"],
    readTime: 0.0,
    releaseDate: "2024-06-17",
    isRead: true,
    downloadLink: "https://arxiv.org/pdf/2311.03658",
  },
  {
    title: "interpreting GPT: the logit lens",
    author: "nostalgebraist",
    description:
      "observations about how intermediate representations adapt as you track them from input to output of GPT2&3",
    tags: ["Interpretability", "Transformers", "Site"],
    readTime: 0.5,
    releaseDate: "2020-08-30",
    isRead: true,
    downloadLink:
      "https://www.lesswrong.com/posts/AcKRB8wDpdaN6v6ru/interpreting-gpt-the-logit-lens [CS2222]",
  },
  {
    title: "Axiomatic Attribution for Deep Networks",
    author: "Sundararajan et al.",
    description:
      "Proposes the Integrated Gradients technique for model-ambiguously attributing input features to model output [CS2222]",
    tags: ["Interpretability", "LLMs", "Arxiv"],
    readTime: 0.5,
    releaseDate: "2017-06-13",
    isRead: true,
    downloadLink: "https://arxiv.org/pdf/1703.01365",
  },
  {
    title: "Rethinking the Role of Demonstrations",
    author: "University of Washington",
    description:
      "Digs into testing why in-context learning works in LLMs [CS2222]",
    tags: ["Interpretability", "LLMs", "Arxiv"],
    readTime: 0.5,
    releaseDate: "2020-08-20",
    isRead: true,
    downloadLink: "https://arxiv.org/pdf/2202.12837",
  },
  {
    title: "Transformer FFNs build predictions in Vocab Space",
    author: "Geva et al.",
    description:
      "Decomposes FFN updates into sub-updates corresponding to single vectors corresponding to human intepretable features",
    tags: ["Interpretability", "Transformers", "Arxiv"],
    readTime: 0.5,
    releaseDate: "2022-10-12",
    isRead: true,
    downloadLink: "https://arxiv.org/pdf/2203.14680",
  },
  {
    title: "Explainable AI: Saliency Maps",
    author: "Bijil Subhash",
    description:
      "blog page implementing and briefly explaining saliency maps for understanding which features of a input most contributed to the output",
    tags: ["Interpretability", "Site"],
    readTime: 0.5,
    releaseDate: "2022-03-05",
    isRead: true,
    downloadLink:
      "https://medium.com/@bijil.subhash/explainable-ai-saliency-maps-89098e230100",
  },
  {
    title: "Privileged vs non-privileged bases in ML",
    author: "Harrison Pim",
    description:
      "Provides a geometric intuition for how architectural choices restrain & nudge models towards aligning features internally aligned in forseeable & interpretable ways.",
    tags: ["Architecture", "Interpretability", "Site"],
    readTime: 0.5,
    releaseDate: "2023-05-05",
    isRead: true,
    downloadLink:
      "https://harrisonpim.com/blog/privileged-vs-non-privileged-bases-in-machine-learning",
  },
  {
    title: "What is self-supervised learning?",
    author: "IBM",
    description:
      "Describes briefly a few classes of self-supervised learning from encoders to autoregressive models to contrastic & non-constrastive learning.",
    tags: ["Machine Learning", "Site"],
    readTime: 0.5,
    releaseDate: "2023-12-05",
    isRead: true,
    downloadLink: "https://www.ibm.com/think/topics/self-supervised-learning",
  },
  {
    title: "Exploring Neural Networks with Activation Atlases",
    author: "Google Brain",
    description:
      "provides very high quality analysis of navigating across a CNN activation atlas to understand how different layers visualize different classes of output.",
    tags: ["Interpretability", "Site"],
    readTime: 1.0,
    releaseDate: "2019-03-09",
    isRead: true,
    downloadLink: "https://distill.pub/2019/activation-atlas/",
  },
  {
    title: "GPipe",
    author: "Google",
    description:
      "Outlines a scheduling routine for distributing computation of NN pipelines across multiple devices using micro-batches of data",
    tags: ["Distributed Computing", "Arxiv"],
    readTime: 0.0,
    releaseDate: "XXXX-XX-XX",
    isRead: true,
    downloadLink: "https://arxiv.org/pdf/1811.06965",
  },
  {
    title: "PyTorch FSDP",
    author: "Meta",
    description:
      "Outlines Meta's Fully-Sharded Data Parallel for achieving nearly-linear TFLOP scaling with worker count",
    tags: ["Distributed Computing", "Arxiv"],
    readTime: 1.0,
    releaseDate: "2023-09-12",
    isRead: true,
    downloadLink: "https://arxiv.org/pdf/2304.11277",
  },
  {
    title: "ZeRO",
    author: "Microsoft",
    description:
      "A Fundamental paper for me and the field of Distributed Model Parallelism techniques, ZeRO outlines how to shard parameters, gradients, and optimizer states across devices to minimize memory usage.",
    tags: ["Distributed Computing", "Arxiv"],
    readTime: 1.0,
    releaseDate: "2020-05-13",
    isRead: true,
    downloadLink: "https://arxiv.org/pdf/1910.02054",
  },
  {
    title: "ZeRO++",
    author: "Micorsoft",
    description:
      "A Follow up to ZeRO, this paper introduces additional information about ways to i. offload more memory usage onto local CPU or node-level memory and ii. optimize the communication which is leaned on heavily by these ZeRO techniques.",
    tags: ["Distributed Computing", "Arxiv"],
    readTime: 1.0,
    releaseDate: "2023-06-16",
    isRead: true,
    downloadLink: "https://arxiv.org/pdf/2306.10209",
  },
  {
    title: "PipeDream: Generalized Pipeline Parallelism for DNN Training",
    author: "Microsoft",
    description:
      "Describes a method for automatically partitioning NN layers among workers to balance work & minimize communication, stashing weights to achieve 100% hardware utilization, yielding 5.3X clocktime speedup over naive data-batch parallelism",
    tags: ["Distributed Computing", "Arxiv"],
    readTime: 1.0,
    releaseDate: "2019-10-30",
    isRead: true,
    downloadLink:
      "https://people.eecs.berkeley.edu/~matei/papers/2019/sosp_pipedream.pdf",
  },
  {
    title: "Autonomous GUidance for Multi-Body Orbital Transfers using RL",
    author: "Nicolas LaFarge",
    description: "Explains a technique for teaching RL models to enter desired periodic orbits using comparison to a learned reference variable.",
    tags: ["Reinforcement Learning", "Arxiv"],
    readTime: 1.0,
    releaseDate: "2020-05-01",
    isRead: true,
    downloadLink:
      "https://engineering.purdue.edu/people/kathleen.howell.1/Publications/Masters/2020_Lafarge.pdf",
  },
];  


/*  
  \\\\\\\\\\\\\\\\\\\\\ TEMPLATE & RUNNING LIST OF TAGS \\\\\\\\\\\\\\\\\\\\\
  Site, Arxiv, YT

  Tags = Activation Functions, AI Safety, Architecture, Arxiv, Autoencoders, 
  Deep Learning, Diffusion Models, Distributed Computing, Distributed Systems, 
  Economics, Essay, Factorio, Finance, Git, GNNs, Grokking, Hardware, 
  Hyperparameter Optimization, Information Theory, Interpretability, 
  Libraries, Lie Groups, LLMs, Machine Learning, Markets, Mathematics, 
  Meta-Learning, Minecraft, MoEs, Neural Networks, Optimization, Optimizers, 
  Parallel Computing, Philosophy, Policy, Politics, Programming, 
  Reinforcement Learning, Site, Symbolic Systems, Technology, 
  Transformers, Tutorial


  {
    title: "",
    author: "",
    description:
      "",
    tags: [""],
    readTime: 0.0,
    releaseDate: "XXXX-XX-XX",
    isRead: false,
    downloadLink: "",
  }, 
*/
