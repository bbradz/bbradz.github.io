import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import deepEqual from "fast-deep-equal"; // kept, but barely needed now
import { Link } from "react-router-dom";
import * as d3 from "d3";
import {
  runGameOfLife,
  getTagColor,
  getTextColor,
  formatDate,
} from "../functionality.jsx";
import sourcesRawData from "../input.json";
import similaritiesRawData from "../document_similarities.json";
import "../css/library.css";

// ===================== Utility =====================
function useDebouncedCallback(fn, delay) {
  const fnRef = useRef(fn);
  fnRef.current = fn;
  const timeoutRef = useRef(null);

  return useCallback(
    (...args) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => fnRef.current(...args), delay);
    },
    [delay]
  );
}

// ===================== Tag Component =====================
const Tag = React.memo(({ tag, onTagFilter, isFirst }) => {
  return (
    <span
      key={tag}
      data-type={tag}
      onClick={() => onTagFilter(tag)}
      style={{
        backgroundColor: getTagColor(tag),
        color: getTextColor(tag),
        cursor: "pointer",
        marginRight: "4px",
        marginLeft: isFirst ? "0px" : undefined,
        padding: "2px 6px",
        borderRadius: "3px",
        fontSize: "0.85em",
      }}
    >
      {tag}
    </span>
  );
});
Tag.displayName = "Tag";

// ===================== ReadingListItem Component =====================
const ReadingListItem = React.memo(({ item, onTagFilter }) => {
  return (
    <li
      data-release={item.releaseDate}
      data-time={item.readTime}
      data-read={String(item.isRead)}
    >
      {item.isRead ? <span className="read-indicator">✓</span> : null}
      <div className="item-header">
        <div className="item-title">
          <strong className="title-text">
            “{item.title}” by {item.author}
          </strong>
          <span
            className="meta"
            style={{ whiteSpace: "nowrap", display: "inline-block" }}
          >
            {item.isRead ? "Released: " : null} {formatDate(item.releaseDate)} |
            <span className="no-break"> Est. Time {item.readTime} hours</span>
          </span>
        </div>
        <div className="tags">
          {item.tags.map((tag) => (
            <Tag
              key={tag}
              tag={tag}
              onTagFilter={onTagFilter}
              isFirst={false}
            />
          ))}
        </div>
      </div>
      <div className="description">{item.description}</div>
      {item.downloadLink ? (
        <a className="download-link" href={item.downloadLink} download>
          Source
        </a>
      ) : null}
    </li>
  );
});
ReadingListItem.displayName = "ReadingListItem";

// ===================== DocumentGraph Component =====================
const DocumentGraph = React.memo(function DocumentGraph({
  width,
  height,
  graphDisplayData,
  documentSimilaritiesData,
  graphParams,
}) {
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const simulationRef = useRef(null);
  const nodeTitleGroupRef = useRef(null);
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  // Resize listener (debounced)
  useEffect(() => {
    const check = () => setIsSmallScreen(window.innerWidth <= 768);
    check();
    const onResize = () => {
      if (onResize._t) cancelAnimationFrame(onResize._t);
      onResize._t = requestAnimationFrame(check);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const cleanupGraph = useCallback(() => {
    if (simulationRef.current) {
      simulationRef.current.stop();
      simulationRef.current = null;
    }
    if (containerRef.current) {
      d3.select(containerRef.current).selectAll("*").remove();
    }
  }, []);

  // Initialize (or re-init) graph when data or size change
  useEffect(() => {
    if (isSmallScreen) {
      cleanupGraph();
      return;
    }
    if (!containerRef.current) return;

    cleanupGraph();

    const data = graphDisplayData || [];
    const container = d3.select(containerRef.current);
    const svg = container
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("class", "rounded-lg")
      // prevents browser-native pinch-zoom fighting d3.zoom (esp. Safari/iOS)
      .style("touch-action", "none");
    svgRef.current = svg;

    // background
    svg
      .append("rect")
      .attr("width", "100%")
      .attr("height", "100%")
      .attr("fill", "var(--graph-background)");

    if (data.length === 0 || !documentSimilaritiesData) {
      const textGroup = svg
        .append("g")
        .attr("transform", `translate(${width / 2}, ${height / 2})`);
      textGroup
        .append("text")
        .attr("text-anchor", "middle")
        .attr("fill", "var(--text-color)")
        .text("No documents to display");
      return;
    }

    // Zoom & pan (SMOOTHER + proper roaming space)
    const g = svg.append("g");
    const pad = graphParams.graphSizePadding; // allows roaming beyond viewport

    const zoomBehavior = d3
      .zoom()
      .extent([
        [0, 0],
        [width, height],
      ])
      .translateExtent([
        [-pad, -pad],
        [width + pad, height + pad],
      ])
      .scaleExtent(graphParams.zoomScaleExtent)
      .wheelDelta((event) => {
        const dy = event.deltaY;
        return event.deltaMode === 1 ? -dy * 0.05 : -dy * 0.002;
      })
      .on("start", () => {
        if (simulationRef.current) simulationRef.current.alphaTarget(0);
      })
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      })
      .on("end", () => {
        if (simulationRef.current) simulationRef.current.alphaTarget(0);
      });

    svg.call(zoomBehavior);

    // Center the view nicely with your initial scale
    const initial = d3.zoomIdentity
      .translate(width / 2, height / 2)
      .scale(graphParams.initialZoomScale)
      .translate(-width / 2, -height / 2);
    svg.call(zoomBehavior.transform, initial);

    // Map originals to visible indices
    const visibleMap = {};
    data.forEach((doc, idx) => {
      visibleMap[doc.originalIndex] = idx;
    });

    // Build links
    let links = (documentSimilaritiesData || [])
      .filter(
        (l) =>
          l.source in visibleMap &&
          l.target in visibleMap &&
          visibleMap[l.source] !== visibleMap[l.target]
      )
      .map((l) => ({
        ...l,
        source: String(visibleMap[l.source]),
        target: String(visibleMap[l.target]),
      }));
    if (!links || links.length === 0) links = [];

    // ----- Size-aware radius mapping (log scale) -----
    const readTimes = data.map((d) => d.readTime);
    const minRT = Math.min(...readTimes);
    const maxRT = Math.max(...readTimes);

    const normalizeReadTime = (rt) => {
      const minR = graphParams.nodeMinRadius;
      const maxR = graphParams.nodeMaxRadius;
      if (maxRT === minRT) return (minR + maxR) / 2;
      const logMin = Math.log(minRT + 1);
      const logMax = Math.log(maxRT + 1);
      const lr = Math.log(rt + 1);
      return ((lr - logMin) / (logMax - logMin)) * (maxR - minR) + minR;
    };

    // Nodes (with precomputed radius)
    const nodes = data.map((doc, i) => ({
      id: String(i),
      title: doc.title,
      fullText: doc.description,
      tags: doc.tags,
      readTime: doc.readTime,
      releaseDate: doc.releaseDate,
      isRead: doc.isRead,
      r: normalizeReadTime(doc.readTime),
      x: width / 2 + (Math.random() - 0.5) * 40,
      y: height / 2 + (Math.random() - 0.5) * 40,
    }));

    const padClamp = (pos, dim) =>
      Math.max(
        -graphParams.graphSizePadding,
        Math.min(dim + graphParams.graphSizePadding, pos)
      );

    // --------- Custom Edge-Repulsion Force (soft push from box walls) ---------
    function edgeRepelForce() {
      const margin = graphParams.edgeRepelMargin;
      const falloff = graphParams.edgeRepelDistance; // px within which the push ramps up
      const exponent = graphParams.edgeRepelExponent; // curve shape
      const base = graphParams.edgeRepelStrength; // overall scale

      // helper: normalized push strength in [0,1]
      const pushScale = (d) => {
        // d is distance from node edge to box edge (>=0 means inside)
        const s = Math.max(0, (falloff - Math.max(0, d)) / falloff);
        return Math.pow(s, exponent);
      };

      return (alpha) => {
        const k = base * alpha;
        for (let i = 0; i < nodes.length; i++) {
          const n = nodes[i];

          // distances from node's edge to each boundary
          const left = n.x - n.r - margin; // distance to left wall
          const right = width - margin - (n.x + n.r); // to right wall
          const top = n.y - n.r - margin; // to top wall
          const bottom = height - margin - (n.y + n.r); // to bottom wall

          let fx = 0,
            fy = 0;

          if (left < falloff) fx += pushScale(left); // push right
          if (right < falloff) fx -= pushScale(right); // push left
          if (top < falloff) fy += pushScale(top); // push down
          if (bottom < falloff) fy -= pushScale(bottom); // push up

          n.vx = (n.vx || 0) + fx * k;
          n.vy = (n.vy || 0) + fy * k;
        }
      };
    }

    // Simulation
    const simulation = d3
      .forceSimulation()
      .nodes(nodes)
      .force(
        "link",
        d3
          .forceLink(links)
          .id((d) => d.id)
          .distance(graphParams.linkDistance)
          .strength(graphParams.linkStrength)
      )
      .force("charge", d3.forceManyBody().strength(graphParams.chargeStrength))
      .force(
        "center",
        d3
          .forceCenter(width / 2, height / 2)
          .strength(graphParams.centerStrength)
      )
      .force("x", d3.forceX(width / 2).strength(graphParams.xForceStrength))
      .force("y", d3.forceY(height / 2).strength(graphParams.yForceStrength))
      .force(
        "collision",
        d3
          .forceCollide()
          .strength(graphParams.collideStrength)
          .radius((d) => d.r + graphParams.collideRadiusPadding)
      )
      // Soft repulsion from edges (new)
      .force("edgeRepel", edgeRepelForce())
      // Hard containment if something flies outside
      .force("boundary", (alpha) => {
        nodes.forEach((node) => {
          const padding = 4;
          const xMin = padding,
            xMax = width - padding;
          const yMin = padding,
            yMax = height - padding;
          const s = graphParams.boundaryStrength * alpha;
          if (node.x < xMin) node.vx += (xMin - node.x) * s;
          if (node.x > xMax) node.vx += (xMax - node.x) * s;
          if (node.y < yMin) node.vy += (yMin - node.y) * s;
          if (node.y > yMax) node.vy += (yMax - node.y) * s;
        });
      })
      .alpha(graphParams.simulationAlpha)
      .velocityDecay(graphParams.velocityDecay)
      .alphaDecay(graphParams.alphaDecay)
      .alphaMin(graphParams.alphaMin);

    simulationRef.current = simulation;

    // Edges
    const link = g
      .append("g")
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke", "var(--edge-color)")
      .attr("stroke-width", (d) => d.width)
      .attr("stroke-opacity", "var(--edge-opacity)");

    // Nodes
    const nodeGroup = g.append("g").attr("class", "nodes");
    const node = nodeGroup
      .selectAll("g")
      .data(nodes)
      .join("g")
      .attr("transform", (d) => `translate(${d.x},${d.y})`)
      .call(
        d3
          .drag()
          .on("start", (event, d) => {
            if (!event.active) simulation.alphaTarget(0.1).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on("drag", (event, d) => {
            d.fx = padClamp(event.x, width);
            d.fy = padClamp(event.y, height);
          })
          .on("end", (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          })
      );

    node
      .append("circle")
      .attr("r", (d) => d.r)
      .attr("fill", (d) => (d.isRead ? "#4a9eff" : "var(--node-color)"))
      .attr("stroke", "var(--node-stroke-color)")
      .on("mouseover", function (event, d) {
        d3.select(this).attr("fill", "#8ACE00");
        link
          .attr("stroke", (l) =>
            l.source.id === d.id || l.target.id === d.id
              ? "#8ACE00"
              : "var(--edge-color)"
          )
          .attr("stroke-width", (l) =>
            l.source.id === d.id || l.target.id === d.id ? 3 : l.width
          );

        const titleGroup = nodeGroup
          .append("g")
          .attr("class", "node-title-group")
          .attr("transform", `translate(${d.x},${d.y})`);
        nodeTitleGroupRef.current = titleGroup;
        titleGroup
          .append("text")
          .attr("class", "node-title")
          .attr("x", 10)
          .attr("y", 5)
          .attr("fill", "var(--text-color)")
          .text(d.title);
      })
      .on("mouseout", function () {
        d3.select(this).attr("fill", (d) =>
          d.isRead ? "#4a9eff" : "var(--node-color)"
        );
        link
          .attr("stroke", "var(--edge-color)")
          .attr("stroke-width", (l) => l.width);
        if (nodeTitleGroupRef.current) {
          nodeTitleGroupRef.current.remove();
          nodeTitleGroupRef.current = null;
        }
      });

    simulation.on("tick", () => {
      link
        .attr("x1", (d) => padClamp(d.source.x, width))
        .attr("y1", (d) => padClamp(d.source.y, height))
        .attr("x2", (d) => padClamp(d.target.x, width))
        .attr("y2", (d) => padClamp(d.target.y, height));

      node.attr(
        "transform",
        (d) => `translate(${padClamp(d.x, width)},${padClamp(d.y, height)})`
      );
    });

    return cleanupGraph;
  }, [
    graphDisplayData, // re-init when FILTERED DATA changes (not sort)
    documentSimilaritiesData,
    width,
    height,
    isSmallScreen,
    cleanupGraph,
    graphParams, // stable via useMemo in parent
  ]);

  if (isSmallScreen) return null;
  return <div ref={containerRef} className="w-full h-full" />;
});
DocumentGraph.displayName = "DocumentGraph";

// ===================== Library Component =====================
function Library() {
  // --- Hyperparameters for DocumentGraph (memoized for stability) ---
  const graphHyperparameters = useMemo(
    () => ({
      zoomScaleExtent: [0.2, 5],
      initialZoomScale: 0.2,
      initialZoomTranslateFactor: 1.2, // no longer used for init; kept for compatibility
      linkDistance: 100,
      linkStrength: 0.8,
      chargeStrength: -300,
      centerStrength: 0.5,
      xForceStrength: 0.1,
      yForceStrength: 0.1,
      collideStrength: 0.1,
      collideRadiusPadding: 5,
      boundaryStrength: 0.05,
      simulationAlpha: 0.3,
      velocityDecay: 0.4,
      alphaDecay: 0.03,
      alphaMin: 0.001,
      nodeMinRadius: 5,
      nodeMaxRadius: 20,
      graphSizePadding: 780,
      edgeRepelMargin: 4, // treat this as the "hard" wall inside the svg
      edgeRepelDistance: 60, // px within which the push ramps up
      edgeRepelStrength: 1.0, // overall scale (tweak up/down)
      edgeRepelExponent: 1.5, // 1 = linear, >1 = more push near the wall
    }),
    []
  );

  // --- Theme ---
  const [theme, setTheme] = useState(
    () => localStorage.getItem("theme") || "light"
  );
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);
  const toggleTheme = useCallback(() => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("theme", next);
  }, [theme]);

  // --- Scroll to top ---
  const scrollToTopButtonRef = useRef(null);
  useEffect(() => {
    const button = scrollToTopButtonRef.current;
    const handleScroll = () => {
      if (window.scrollY > 300) {
        button.classList.remove("opacity-0");
        button.classList.add("opacity-100");
      } else {
        button.classList.remove("opacity-100");
        button.classList.add("opacity-0");
      }
    };
    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // --- Game of Life canvas ---
  useEffect(() => {
    runGameOfLife("gameOfLife");
  }, []);

  // --- Data prep (once) ---
  const originalData = useMemo(() => {
    return sourcesRawData.map((item, index) => ({
      ...item,
      embedding: item.embedding || [],
      originalIndex: index,
    }));
  }, []);

  // --- UI State ---
  const [activeTagFilters, setActiveTagFilters] = useState([]);
  const [readFilterState, setReadFilterState] = useState(0); // 0=all,1=read,2=unread
  const [typeFilter, setTypeFilter] = useState("all"); // "all", "YT", "Arxiv", "Site", "Essay"
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSetSearch = useDebouncedCallback(setSearchQuery, 180);

  // Sorting state
  const [sortBy, setSortBy] = useState(null); // "release" | "time" | null
  const [sortOrder, setSortOrder] = useState("asc"); // "asc" | "desc"

  // Tag toggle
  const handleTagFilter = useCallback(
    (tag) => {
      setActiveTagFilters((prev) =>
        prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
      );
    },
    [setActiveTagFilters]
  );

  // Read filter toggle
  const toggleReadFilter = useCallback(() => {
    setReadFilterState((prev) => (prev + 1) % 3);
  }, []);

  // Type filter toggle
  const toggleFilterType = useCallback(
    (newType) => {
      setTypeFilter((prev) => (prev === newType ? "all" : newType));
      // Clear tag filters when turning a type off (mirrors previous behavior)
      if (typeFilter === newType) {
        setActiveTagFilters([]);
      }
    },
    [typeFilter]
  );

  // Sort toggle helpers (cycles asc -> desc -> unsorted)
  const toggleSort = useCallback(
    (criteria) => {
      if (sortBy !== criteria) {
        setSortBy(criteria);
        setSortOrder("asc");
      } else if (sortOrder === "asc") {
        setSortOrder("desc");
      } else if (sortOrder === "desc") {
        setSortBy(null);
        setSortOrder("asc"); // reset default for next time
      }
    },
    [sortBy, sortOrder]
  );

  // ===== Derived lists =====
  // Base filtered list (NO SORT) -> drives the graph (won't change on sort)
  const baseFilteredList = useMemo(() => {
    let data = originalData;

    // type filter
    if (typeFilter !== "all") {
      data = data.filter((item) => item.tags.includes(typeFilter));
    }

    // tag AND filter
    if (activeTagFilters.length > 0) {
      data = data.filter((item) =>
        activeTagFilters.every((t) => item.tags.includes(t))
      );
    }

    // read filter
    if (readFilterState === 1) {
      data = data.filter((item) => item.isRead);
    } else if (readFilterState === 2) {
      data = data.filter((item) => !item.isRead);
    }

    // search by title
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      data = data.filter((item) => item.title.toLowerCase().includes(q));
    }

    // IMPORTANT: no sorting here
    return data;
  }, [
    originalData,
    typeFilter,
    activeTagFilters,
    readFilterState,
    searchQuery,
  ]);

  // Sorted list for UI only (graph not affected)
  const sortedList = useMemo(() => {
    if (!sortBy) return baseFilteredList;

    const data = [...baseFilteredList].sort((a, b) => {
      if (sortBy === "release") {
        const da = new Date(a.releaseDate).getTime();
        const db = new Date(b.releaseDate).getTime();
        return da - db;
      } else if (sortBy === "time") {
        return a.readTime - b.readTime;
      }
      return 0;
    });
    if (sortOrder === "desc") data.reverse();
    return data;
  }, [baseFilteredList, sortBy, sortOrder]);

  // Active style for type buttons
  const typeBtnStyle = (type) =>
    typeFilter === type
      ? {
          "--active-text-color": "#FFFFFF",
          "--active-color":
            type === "YT"
              ? "#FF0000"
              : type === "Arxiv"
              ? "#A51C30"
              : type === "Site"
              ? "#DA8FFF"
              : "#F5F5DC",
          color: "var(--active-text-color)",
          backgroundColor: "var(--active-color)",
        }
      : {};

  // --- JSX Markup ---
  return (
    <>
      <meta charSet="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>bb.radz</title>

      <canvas
        id="gameOfLife"
        className="game-of-life"
        width="200"
        height="400"
      />

      <header className="header">
        <div className="logo-section">
          <p className="logo">BBradz</p>
          <button
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            <svg
              className="sun-icon"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="12" cy="12" r="4"></circle>
              <path d="M12 2v2"></path>
              <path d="M12 20v2"></path>
              <path d="M4.93 4.93l1.41 1.41"></path>
              <path d="M17.66 17.66l1.41 1.41"></path>
              <path d="M2 12h2"></path>
              <path d="M20 12h2"></path>
              <path d="M6.34 17.66l-1.41 1.41"></path>
              <path d="M19.07 4.93l-1.41 1.41"></path>
            </svg>
            <svg
              className="moon-icon"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
            </svg>
          </button>
        </div>
        <nav className="nav-links">
          <Link to="/posts" className="nav-link">
            Posts
          </Link>
          <Link to="/library" className="nav-link">
            Library
          </Link>
          <Link to="/" className="nav-link">
            About Me
          </Link>
        </nav>
      </header>

      <div className="reading-list-layout">
        <div className="lib-container">
          <h1 className="name" style={{ marginBottom: "10px" }}>
            Library
          </h1>

          <div className="search-bar">
            <input
              type="text"
              id="search"
              placeholder="Search by term..."
              onInput={(e) => debouncedSetSearch(e.target.value)}
            />
          </div>

          <div className="sort-bar">
            <div className="sort-bar-buttons">
              <button
                id="sort-release"
                onClick={() => toggleSort("release")}
                className={sortBy === "release" ? "active" : ""}
                data-order={sortBy === "release" ? sortOrder : "unsorted"}
              >
                Sort by Release Date{" "}
                <span className="sort-arrow">
                  {sortBy === "release"
                    ? sortOrder === "asc"
                      ? "↑"
                      : "↓"
                    : ""}
                </span>
              </button>
              <button
                id="sort-time"
                onClick={() => toggleSort("time")}
                className={sortBy === "time" ? "active" : ""}
                data-order={sortBy === "time" ? sortOrder : "unsorted"}
              >
                Sort by Time to Read{" "}
                <span className="sort-arrow">
                  {sortBy === "time" ? (sortOrder === "asc" ? "↑" : "↓") : ""}
                </span>
              </button>
              <button
                id="filter-read"
                onClick={toggleReadFilter}
                className={readFilterState !== 0 ? "active" : ""}
              >
                Filter:{" "}
                {readFilterState === 0
                  ? "All"
                  : readFilterState === 1
                  ? "Read"
                  : "Unread"}
              </button>

              <button
                id="filter-YT"
                onClick={() => toggleFilterType("YT")}
                style={typeBtnStyle("YT")}
                className={typeFilter === "YT" ? "active" : ""}
              >
                YT
              </button>
              <button
                id="filter-Arxiv"
                onClick={() => toggleFilterType("Arxiv")}
                style={typeBtnStyle("Arxiv")}
                className={typeFilter === "Arxiv" ? "active" : ""}
              >
                Arxiv
              </button>
              <button
                id="filter-Site"
                onClick={() => toggleFilterType("Site")}
                style={typeBtnStyle("Site")}
                className={typeFilter === "Site" ? "active" : ""}
              >
                Site
              </button>
              <button
                id="filter-Essay"
                onClick={() => toggleFilterType("Essay")}
                style={typeBtnStyle("Essay")}
                className={typeFilter === "Essay" ? "active" : ""}
              >
                Essay
              </button>
            </div>

            <div id="active-tags" className="active-tag">
              {activeTagFilters.map((tag, index) => (
                <Tag
                  key={tag}
                  tag={tag}
                  onTagFilter={handleTagFilter}
                  isFirst={index === 0}
                />
              ))}
            </div>
          </div>

          <ul id="reading-list">
            {sortedList.map((item) => (
              <ReadingListItem
                key={item.originalIndex}
                item={item}
                onTagFilter={handleTagFilter}
              />
            ))}
          </ul>
        </div>

        <div className="graph-container">
          <div className="graph-inner">
            <div className="space-y-6">
              <DocumentGraph
                width={400}
                height={400}
                graphDisplayData={baseFilteredList} // <-- filters only; ignores sort
                documentSimilaritiesData={similaritiesRawData}
                graphParams={graphHyperparameters}
              />
            </div>
          </div>
        </div>
      </div>

      <button
        ref={scrollToTopButtonRef}
        onClick={scrollToTop}
        className="scroll-to-top fixed bottom-6 right-6 opacity-0 transition-opacity duration-200 cursor-pointer"
        aria-label="Scroll to top"
      >
        <div className="bg-white-800 hover:bg-white-700 rounded-full p-3 shadow-lg">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-white-200"
          >
            <path d="M18 15l-6-6-6 6" />
          </svg>
        </div>
      </button>
    </>
  );
}

export default Library;
