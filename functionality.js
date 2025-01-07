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

function copyCode(event) {
  // Prevent any default button behavior
  event.preventDefault();

  // Get the clicked button
  const button = event.currentTarget;

  // Find the closest code container and get its code element
  const container = button.closest(".code-container");
  if (!container) return;

  const codeEl = container.querySelector("code");
  if (!codeEl) return;

  // Copy the code text
  navigator.clipboard
    .writeText(codeEl.innerText || "")
    .then(() => {
      // Add the copied class
      button.classList.add("copied");

      // Remove the copied class after animation
      setTimeout(() => {
        button.classList.remove("copied");
      }, 600);

      // Find and toggle the icons
      const copyIcon = button.querySelector("#copy-icon");
      const checkIcon = button.querySelector("#check-icon");

      if (copyIcon && checkIcon) {
        copyIcon.style.display = "none";
        checkIcon.style.display = "block";

        // Revert back after the timeout
        setTimeout(() => {
          copyIcon.style.display = "block";
          checkIcon.style.display = "none";
        }, 600);
      }
    })
    .catch((err) => {
      console.error("Failed to copy code:", err);
    });
}

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
  const container = button.closest(".code-container");
  if (!container) return;

  const codeEl = container.querySelector("code");
  if (!codeEl) return;

  navigator.clipboard
    .writeText(codeEl.innerText || "")
    .then(() => {
      button.classList.add("copied");

      const copyIcon = button.querySelector("#citation-copy-icon");
      const checkIcon = button.querySelector("#citation-check-icon");

      if (copyIcon && checkIcon) {
        copyIcon.style.display = "none";
        checkIcon.style.display = "block";

        setTimeout(() => {
          button.classList.remove("copied");
          copyIcon.style.display = "block";
          checkIcon.style.display = "none";
        }, 600);
      }
    })
    .catch((err) => {
      console.error("Failed to copy citation:", err);
    });
}


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
    // initializeGame(true, 12345); // Use any number as seed
  }
});
