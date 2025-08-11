// functionality.js
// ============================== REGULAR OPS ============================== //
//                                    xx                                     //
// ============================== REGULAR OPS ============================== //

// Update the toggleCollapse function
export function toggleCollapse(button) {
  // Keep export if you want to use this elsewhere, otherwise remove export
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
  // Keep this if used outside React, otherwise remove
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

// ======================
// Table of Contents toggle
// ======================
export function toggleTOC() {
  // Keep export if you want to use this elsewhere, otherwise remove export
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

export function handleMouseMove(event, buttonId = null) {
  // Keep export if you want to use this elsewhere, otherwise remove export
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

/*
  Purpose: Copies the content of a code block to the clipboard.
  Behavior: Finds the closest code block to the clicked button, copies its text,
  and temporarily adds a copied class to the button for visual feedback.
*/
export function copyCode(event) {
  // Keep export if you want to use this elsewhere, otherwise remove export
  event.preventDefault();
  const button = event.currentTarget;
  const codeContainer = button.closest(".collapsible-code-container");
  const codeEl = codeContainer ? codeContainer.querySelector("code") : null;

  if (!codeEl) return;

  navigator.clipboard
    .writeText(codeEl.innerText || "")
    .then(() => {
      button.classList.add("copied");
      setTimeout(() => {
        button.classList.remove("copied");
      }, 500);
    })
    .catch((err) => {
      console.error("Failed to copy code:", err);
    });
}

document.addEventListener("DOMContentLoaded", () => {
  // Keep this if used outside React, otherwise remove
  const copyButtons = document.querySelectorAll(".copy-button");
  copyButtons.forEach((button) => {
    button.addEventListener("click", copyCode);
  });
});

// ======================
// Scroll to top
// ======================
window.onscroll = function () {
  // Keep this if used outside React, otherwise remove
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

export function scrollToTop() {
  // Keep export if you want to use this elsewhere, otherwise remove export
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
}

// ======================
// Copy citation
// ======================
export function copyCitation(event) {
  // Keep export if you want to use this elsewhere, otherwise remove export
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
      button.classList.add("copied");
      setTimeout(() => {
        button.classList.remove("copied");
      }, 500);
    })
    .catch((err) => {
      console.error("Failed to copy citation:", err);
    });
}

document.addEventListener("DOMContentLoaded", () => {
  // Keep this if used outside React, otherwise remove
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
  // Keep this if used outside React, otherwise remove
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

  // FUNCTIONALITY.JS (modified handleScroll function)
  const handleScroll = () => {
    if (!mainToc || !sidebarToc) {
      return;
    }

    const mainTocRect = mainToc.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const headerHeight = document.querySelector(".header").offsetHeight; // Dynamically get header height
    const headerOffset = headerHeight + 20; // Add a little extra offset if needed
    const mainTocVisible = mainTocRect.bottom > headerOffset; // Simplified condition - sidebar shows when main TOC bottom is above the offset

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
    // Keep this if used outside React, otherwise remove
    console.log("Scroll event listener is firing!"); // <---- ADD THIS LINE
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
}); // Keep this if used outside React, otherwise remove

// ----- Game of Life logic -----

// 1. Random Number Generator
export class SeededRandom {
  // Exported
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

// 3. Initialize local storage logic (Exported - if needed for external initialization)
export function initializeGame(useSeed = false, providedSeed = null) {
  const seed = providedSeed || Date.now();
  console.log(seed);
  localStorage.setItem("gameOfLifeUseSeed", useSeed);
  if (useSeed) {
    localStorage.setItem("gameOfLifeSeed", seed.toString());
  }
  localStorage.removeItem("gameOfLifeGrid");
  localStorage.removeItem("gameOfLifeInitialTimestamp");
}

// 4. Get initial timestamp from local storage (Exported - if needed externally)
export function getInitialTimestamp() {
  const stored = localStorage.getItem("gameOfLifeInitialTimestamp");
  if (!stored) {
    const timestamp = Date.now();
    localStorage.setItem("gameOfLifeInitialTimestamp", timestamp.toString());
    return timestamp;
  }
  return parseInt(stored);
}

// 5. Calculate current generation (Exported - if needed externally)
export function calculateCurrentGeneration(initialTimestamp) {
  const timeElapsed = Date.now() - initialTimestamp;
  // ~60 generations per second
  return Math.floor(timeElapsed / (1000 / 60));
}

// 6. Building the grid (Exported)
export function buildGrid(cols, rows, useSeed, seed, SeededRandomClass) {
  const storedGrid = localStorage.getItem("gameOfLifeGrid");
  const initialTimestamp = getInitialTimestamp();

  if (!storedGrid) {
    let rng;

    if (useSeed) {
      rng = new SeededRandomClass(seed); // Use passed SeededRandomClass
    } else {
      rng = Math; // Use Math.random if not seeded.
    }

    // create new grid
    const newGrid = new Array(cols).fill(null).map(() =>
      new Array(rows).fill(null).map(
        () =>
          useSeed ? Math.floor(rng.next() * 2) : Math.floor(rng.random() * 2) // Use rng.random() when Math is used.
      )
    );

    // Add gliders - keep as is or parameterize glider pattern if needed
    addGlider(newGrid, 1, 1, cols, rows);
    addGlider(newGrid, 1, 10, cols, rows);
    addGlider(newGrid, 1, 20, cols, rows);
    addGlider(newGrid, 1, 30, cols, rows);

    localStorage.setItem("gameOfLifeGrid", JSON.stringify(newGrid));
    return newGrid;
  }

  // If stored grid exists, forward-simulate
  let grid = JSON.parse(storedGrid);
  const targetGeneration = calculateCurrentGeneration(initialTimestamp);

  for (let i = 0; i < targetGeneration; i++) {
    grid = nextGen(grid, cols, rows); // Pass cols and rows
  }

  return grid;
}

// 7. Drawing the grid (Exported)
export function drawGrid(ctx, grid, resolution, canvasWidth, canvasHeight) {
  ctx.clearRect(0, 0, canvasWidth, canvasHeight); // Use parameters for width/height
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

// 8. Counting Neighbors (Exported)
export function countNeighbors(grid, x, y, cols, rows) {
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

// 9. Next Generation Calculation (Exported)
export function nextGen(grid, cols, rows) {
  const nextGrid = grid.map((arr) => [...arr]);

  for (let col = 0; col < grid.length; col++) {
    for (let row = 0; row < grid[col].length; row++) {
      const cell = grid[col][row];
      const neighbors = countNeighbors(grid, col, row, cols, rows); // Pass cols and rows

      if (cell === 1 && (neighbors < 2 || neighbors > 3)) {
        nextGrid[col][row] = 0;
      } else if (cell === 0 && neighbors === 3) {
        nextGrid[col][row] = 1;
      }
    }
  }
  return nextGrid;
}

// 10. Add Glider Pattern (Exported - if you want to control glider addition from React)
export function addGlider(grid, x, y, cols, rows) {
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

// ======================
// Run Game of Life (encapsulated function)
// ======================
export function runGameOfLife(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) {
    console.error(`Canvas element with id "${canvasId}" not found.`);
    return; // Exit if canvas is not found
  }
  const ctx = canvas.getContext("2d");

  if (ctx) {
    const resolution = 10; // You can make resolution an argument if you want to configure it from React
    const cols = canvas.width / resolution;
    const rows = canvas.height / resolution;

    // Initialize Game of Life grid using imported functions from functionality.js
    let grid = buildGrid(cols, rows, false, null, SeededRandom); // Random initialization
    initializeGame(false); // Initialize local storage

    function update() {
      grid = nextGen(grid, cols, rows); // Calculate next generation using imported function
      drawGrid(ctx, grid, resolution, canvas.width, canvas.height); // Draw grid using imported function
      requestAnimationFrame(update); // Animation loop
    }

    update(); // Start the animation loop
  } else {
    console.error("Canvas context not supported!");
  }
}

// ============================== LIBRARY OPS ============================== //
//                                    xx                                     //
// ============================== LIBRARY OPS ============================== //

window.hashString = (str) => {
  // Keep hashString
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
};

/*
  Purpose: Returns a color for a given tag based on its type or a hash of the
  tag name.
  Behavior: Assigns specific colors for predefined tags (e.g., "YT", "Arxiv")
  and generates a unique color for other tags using HSL values derived from the
  tag's hash.
*/
export const getTagColor = function (tag) {
  // Changed to export const
  switch (tag) {
    case "YT":
      return "#FF0000";
    case "Arxiv":
      return "#A51C30";
    case "Site":
      return "#DA8FFF";
    case "Essay":
      return "#F5F5DC";
    default:
      const hash = hashString(tag);
      const hue = hash % 360;
      const saturation = 40 + (hash % 15);
      const lightness = 30 + (hash % 10);
      return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  }
};

export const getTextColor = function (tag) {
  // Changed to export const
  if (tag === "Essay") {
    return "#000000";
  }
  return "#FFFFFF";
};

/*
  Purpose: Limits how often a function is called during rapid events
  (e.g., typing in a search box).
  Behavior: Delays the execution of the provided function until a specified time
  (wait) has passed since the last call.
*/
export const debounce = function (func, wait) {
  // Changed to export const
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
};

export const formatDate = function (dateString) {
  // Changed to export const
  if (dateString === "Not specified") return dateString;
  const parsed = new Date(dateString);
  if (isNaN(parsed)) return dateString;
  return parsed.toLocaleString("en-US", {
    month: "short",
    year: "numeric",
  });
};
