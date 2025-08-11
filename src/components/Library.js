import React from "react";
import {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
  startTransition,
} from "react";
import deepEqual from "fast-deep-equal";
import { Link } from "react-router-dom";
import * as d3 from "d3";
import {
  runGameOfLife,
  getTagColor,
  getTextColor,
  formatDate,
} from "../functionality.js";
import sourcesRawData from "../input.json";
import similaritiesRawData from "../document_similarities.json";
import "../css/library.css";

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

// ===================== Library Component =====================
function Library() {
  console.log("Library Component RENDER");

  // --- Hyperparameters for DocumentGraph ---
  const graphHyperparameters = {
    zoomScaleExtent: [0.2, 5],
    initialZoomScale: 0.2,
    initialZoomTranslateFactor: 1.2,
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
    graphSizePadding: 780, // Used for bounding box calculations in graph forces
  };

  // --- State Declarations ---

  const [theme, setTheme] = useState(
    () => localStorage.getItem("theme") || "light"
  );
  const scrollToTopButtonRef = useRef(null);
  const [readingListData, setReadingListData] = useState([]);
  const [graphData, setGraphData] = useState([]); // Keep graphData state
  const [displayedReadingListData, setDisplayedReadingListData] = useState([]); // New state for list display
  const originalSourcesRawData = useRef(null); // Ref to store initial data
  const [activeTagFilters, setActiveTagFilters] = useState([]);
  const [readFilterState, setReadFilterState] = useState(0);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
  };

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    runGameOfLife("gameOfLife");
  }, []);

  // --- 1st useEffect: Load raw data only ---
  useEffect(() => {
    try {
      const initialReadingListData = sourcesRawData.map((item, index) => {
        const cachedItem = {
          ...item,
          embedding: item.embedding || [],
          originalIndex: index,
        };
        return cachedItem;
      });
      originalSourcesRawData.current = initialReadingListData;
      console.log("1st useEffect - sourcesRawData loaded:", sourcesRawData);
    } catch (error) {
      console.error(
        "Library useEffect (data load) - Error importing reading list data:",
        error
      );
    }
  }, []); // Empty dependency array - runs only once on mount

  // --- 2nd useEffect: Apply initial filters and set states based on loaded data ---
  const filteredData = useMemo(() => {
    if (!originalSourcesRawData.current) return [];

    let data = [...originalSourcesRawData.current];

    if (activeTagFilters.length > 0) {
      data = data.filter((item) =>
        activeTagFilters.every((tag) => item.tags.includes(tag))
      );
    }

    if (readFilterState === 1) {
      data = data.filter((item) => item.isRead);
    } else if (readFilterState === 2) {
      data = data.filter((item) => !item.isRead);
    }

    return data;
  }, [originalSourcesRawData.current, activeTagFilters, readFilterState]);

  useEffect(() => {
    updateGraphDataIfNeeded(filteredData);
    setDisplayedReadingListData(filteredData);
  }, [filteredData]);

  const debounceFunc = (func, wait) => {
    let timeout;
    return function (...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  };

  const updateGraphDataIfNeeded = useCallback(
    (newData) => {
      if (!deepEqual(newData, graphData)) {
        setGraphData(newData);
      }
    },
    [graphData]
  );

  const updateDisplayedReadingListIfNeeded = useCallback(
    (newData) => {
      if (!deepEqual(newData, displayedReadingListData)) {
        setDisplayedReadingListData(newData);
      }
    },
    [displayedReadingListData]
  );

  const performSearch = (query, data) => {
    if (!query) return data;
    return data.filter((item) =>
      item.title.toLowerCase().includes(query.toLowerCase())
    );
  };

  const handleSearchInput = (e) => {
    const query = e.target.value;
    const filteredData = performSearch(query, originalSourcesRawData.current);
    console.log(
      "handleSearchInput - Before setReadingListData, readingListData:",
      readingListData
    );
    console.log(
      "handleSearchInput - Before setGraphData, graphData:",
      graphData
    );
    console.log(
      "graphData state before setGraphData in handleSearchInput:",
      graphData
    ); // DEBUG LOG
    setReadingListData(filteredData);
    if (!deepEqual(filteredData, graphData)) {
      updateGraphDataIfNeeded(filteredData);
    }
    updateDisplayedReadingListIfNeeded(filteredData); // Update displayed list as a copy
    console.log(
      "graphData state after setGraphData in handleSearchInput:",
      graphData
    ); // DEBUG LOG
    console.log(
      "handleSearchInput - After setReadingListData, readingListData:",
      readingListData
    );
    console.log(
      "handleSearchInput - After setGraphData, graphData:",
      graphData
    );
  };

  const sortReadingList = (sortBy, sortOrder) => {
    let sortedData = [...displayedReadingListData]; // Sort based on displayed list
    sortedData.sort((a, b) => {
      let comparison = 0;
      if (sortBy === "release") {
        const dateA = new Date(a.releaseDate);
        const dateB = new Date(b.releaseDate);
        comparison = dateA - dateB;
      } else if (sortBy === "time") {
        comparison = a.readTime - b.readTime;
      }
      return sortOrder === "asc" ? comparison : comparison * -1;
    });
    console.log(
      "sortReadingList - Before setDisplayedReadingListData, displayedReadingListData:",
      displayedReadingListData
    );
    console.log("graphData state in sortReadingList:", graphData); // DEBUG LOG
    setDisplayedReadingListData(sortedData); // Update ONLY displayed list
    console.log(
      "sortReadingList - After setDisplayedReadingListData, displayedReadingListData:",
      sortedData
    );
    // DO NOT UPDATE graphData or readingListData
  };

  const filterByType = (filterType, currentData) => {
    // Modified: Accepts currentData
    const dataToFilter = currentData || originalSourcesRawData.current; // Use currentData or original
    let filteredData;
    if (filterType === "all") {
      filteredData = dataToFilter;
    } else {
      filteredData = dataToFilter.filter((item) =>
        item.tags.includes(filterType)
      );
    }
    console.log(
      "filterByType - Before setReadingListData, readingListData:",
      readingListData
    );
    console.log("filterByType - Before setGraphData, graphData:", graphData);
    console.log(
      "graphData state before setGraphData in filterByType:",
      graphData
    ); // DEBUG LOG
    setReadingListData(filteredData);
    if (!deepEqual(filteredData, graphData)) {
      updateGraphDataIfNeeded(filteredData);
    }
    updateDisplayedReadingListIfNeeded(filteredData); // Update displayed list as a copy
    console.log(
      "graphData state after setGraphData in filterByType:",
      graphData
    ); // DEBUG LOG
    console.log(
      "filterByType - After setReadingListData, readingListData:",
      filteredData
    );
    console.log("filterByType - After setGraphData, graphData:", graphData);
    return filteredData; // Modified: Return filteredData
  };

  const filterReadStatus = (onlyUnread, currentData) => {
    // Modified: Accepts currentData
    const dataToFilter = currentData || originalSourcesRawData.current; // Use currentData or original
    let filteredData;
    if (onlyUnread === true) {
      filteredData = dataToFilter.filter((item) => !item.isRead);
    } else if (onlyUnread === false) {
      filteredData = dataToFilter.filter((item) => item.isRead);
    } else {
      filteredData = dataToFilter;
    }
    console.log(
      "filterReadStatus - Before setReadingListData, readingListData:",
      readingListData
    );
    console.log(
      "filterReadStatus - Before setGraphData, graphData:",
      graphData
    );
    console.log(
      "graphData state before setGraphData in filterReadStatus:",
      graphData
    ); // DEBUG LOG
    setReadingListData(filteredData);
    if (!deepEqual(filteredData, graphData)) {
      updateGraphDataIfNeeded(filteredData);
    }
    updateDisplayedReadingListIfNeeded(filteredData); // Update displayed list as a copy
    console.log(
      "graphData state after setGraphData in filterReadStatus:",
      graphData
    ); // DEBUG LOG
    console.log(
      "filterReadStatus - After setReadingListData, readingListData:",
      filteredData
    );
    console.log("filterReadStatus - After setGraphData, graphData:", graphData);
    return filteredData; // Modified: Return filteredData
  };

  const handleTagFilter = (tag) => {
    let newActiveTagFilters = [...activeTagFilters];
    if (newActiveTagFilters.includes(tag)) {
      newActiveTagFilters = newActiveTagFilters.filter(
        (activeTag) => activeTag !== tag
      );
    } else {
      newActiveTagFilters = [...newActiveTagFilters, tag];
    }
    setActiveTagFilters(newActiveTagFilters);
  };

  useEffect(() => {
    if (originalSourcesRawData.current) {
      // Ensure data is loaded before applying tag filters
      applyTagFilters(originalSourcesRawData.current);
    }
  }, [activeTagFilters, originalSourcesRawData]); // Added originalSourcesRawData dependency

  const applyTagFilters = () => {
    // Modified: No arguments needed - always uses original data
    const dataToFilter = originalSourcesRawData.current; // Always filter against original data
    if (!dataToFilter) return []; // Handle no data case

    let filteredData = dataToFilter;
    if (activeTagFilters.length > 0) {
      filteredData = filteredData.filter((item) => {
        return activeTagFilters.every((filterTag) =>
          item.tags.includes(filterTag)
        );
      });
    }
    console.log(
      "applyTagFilters - Before setReadingListData, readingListData:",
      readingListData
    );
    console.log("applyTagFilters - Before setGraphData, graphData:", graphData);
    console.log(
      "graphData state before setGraphData in applyTagFilters:",
      graphData
    ); // DEBUG LOG
    setReadingListData(filteredData);
    if (!deepEqual(filteredData, graphData)) {
      updateGraphDataIfNeeded(filteredData);
    }
    updateDisplayedReadingListIfNeeded(filteredData); // Update displayed list as a copy
    console.log(
      "graphData state after setGraphData in applyTagFilters:",
      graphData
    ); // DEBUG LOG
    console.log(
      "applyTagFilters - After setReadingListData, readingListData:",
      filteredData
    );
    console.log("applyTagFilters - After setGraphData, graphData:", graphData);
    return filteredData;
  };

  const toggleReadFilter = (button) => {
    setReadFilterState((prevState) => (prevState + 1) % 3);
  };

  useEffect(() => {
    if (originalSourcesRawData.current) {
      // Ensure data is loaded before applying read filter
      let filteredData = applyTagFilters(originalSourcesRawData.current); // Start with tag-filtered data
      if (readFilterState === 1) {
        filteredData = filterReadStatus(false, filteredData); // Pass tag-filtered data
      } else if (readFilterState === 2) {
        filteredData = filterReadStatus(true, filteredData); // Pass tag-filtered data
      } else {
        filteredData = filterByType("all", filteredData); // Get data from filterByType, pass tag-filtered data
      }
      if (!deepEqual(filteredData, graphData)) {
        startTransition(() => {
          updateGraphDataIfNeeded(filteredData);
        });
      }
      updateDisplayedReadingListIfNeeded(filteredData); // Update displayed list as a copy
    }
  }, [readFilterState, originalSourcesRawData, activeTagFilters]); // Added originalSourcesRawData and activeTagFilters dependencies

  const toggleSort = (button, criteria) => {
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
      if (arrowSpan) {
        arrowSpan.textContent = newOrder === "asc" ? "↑" : "↓";
      }
      sortReadingList(criteria, newOrder);
    } else {
      button.dataset.order = "unsorted";
      setDisplayedReadingListData([...readingListData]); // Reset displayed list using copy from readingListData
    }
  };

  const toggleFilterType = (button, type) => {
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
          button.style.setProperty("--active-color", "#DA8FFF");
          button.style.setProperty("--active-text-color", "#FFFFFF");
          break;
        case "Essay":
          button.style.setProperty("--active-color", "#F5F5DC");
          button.style.setProperty("--active-text-color", "#000000");
          break;
        default:
          break;
      }
      filterByType(type);
    } else {
      button.style.removeProperty("--active-color");
      button.style.removeProperty("--active-text-color");
      filterByType("all");
      setActiveTagFilters([]);
    }
  };

  // Memoize graphData to prevent unnecessary re-renders of DocumentGraph
  const memoizedGraphData = useMemo(() => {
    console.log("memoizedGraphData useMemo called, graphData:", graphData); // DEBUG LOG
    return graphData;
  }, [graphData]);

  // ===================== DocumentGraph Component =====================
  const DocumentGraph = React.memo(
    ({
      width,
      height,
      graphDisplayData,
      documentSimilaritiesData,
      graphParams,
    }) => {
      // Pass graphParams
      console.count("DocumentGraph RENDER"); // <--- Add render counter
      console.log(
        "DocumentGraph RENDER - graphDisplayData prop received:",
        graphDisplayData
      );
      const containerRef = useRef(null);
      const [error, setError] = useState(null);
      const [isSmallScreen, setIsSmallScreen] = useState(false);
      const svgRef = useRef(null);
      const simulationRef = useRef(null);
      const nodeTitleGroupRef = useRef(null);
      const prevGraphDataRef = useRef(graphDisplayData); // Ref to store previous prop
      const graphSize = graphParams.graphSizePadding; // Use hyperparameter

      useEffect(() => {
        if (
          JSON.stringify(graphDisplayData) !==
          JSON.stringify(prevGraphDataRef.current)
        ) {
          console.log(
            "DocumentGraph useEffect - graphDisplayData prop CHANGED:",
            graphDisplayData
          );
          prevGraphDataRef.current = graphDisplayData; // Update previous prop
        } else {
          console.log(
            "DocumentGraph useEffect - graphDisplayData prop UNCHANGED (shallowly equal):",
            graphDisplayData
          );
        }
      }, [graphDisplayData]);

      const checkScreenSize = () => {
        setIsSmallScreen(window.innerWidth <= 768);
      };
      const debouncedCheckScreenSize = debounceFunc(checkScreenSize, 1000);

      useEffect(() => {
        checkScreenSize();
        window.addEventListener("resize", debouncedCheckScreenSize);
        return () => {
          window.removeEventListener("resize", debouncedCheckScreenSize);
        };
      }, []);

      useEffect(() => {
        console.log(
          "DocumentGraph useEffect - graphDisplayData prop in useEffect:",
          graphDisplayData
        ); // Log renamed prop
        if (!documentSimilaritiesData) {
          console.log(
            "DocumentGraph useEffect - No documentSimilaritiesData, returning early."
          );
          return;
        }

        if (!isSmallScreen && graphDisplayData && graphDisplayData.length > 0) {
          console.log(
            "DocumentGraph useEffect - Initializing graph with graphDisplayData:",
            graphDisplayData
          );
          initializeGraph(graphDisplayData);
        } else if (
          !isSmallScreen &&
          (!graphDisplayData || graphDisplayData.length === 0)
        ) {
          console.log(
            "DocumentGraph useEffect - Cleaning up graph - No data or small screen."
          );
          cleanupGraph();
          if (svgRef.current) {
            const svg = d3.select(svgRef.current);
            svg.selectAll("*").remove();
            svg
              .append("rect")
              .attr("width", "400px")
              .attr("height", "400px")
              .attr("fill", "var(--graph-background)");
            const textGroup = svg
              .append("g")
              .attr("transform", `translate(${width / 2}, ${height / 2})`);
            textGroup
              .append("text")
              .attr("text-anchor", "middle")
              .attr("fill", "var(--text-color)")
              .text("No documents to display");
          } else if (containerRef.current) {
            const container = d3.select(containerRef.current);
            container.selectAll("*").remove();
            const svg = container
              .append("svg")
              .attr("width", "400px")
              .attr("height", "400px")
              .attr("className", "rounded-lg");
            svg
              .append("rect")
              .attr("width", "400px")
              .attr("height", "400px")
              .attr("fill", "var(--graph-background)");
            const textGroup = svg
              .append("g")
              .attr("transform", `translate(${width / 2}, ${height / 2})`);
            textGroup
              .append("text")
              .attr("text-anchor", "middle")
              .attr("fill", "var(--text-color)")
              .text("No documents to display");
          }
        } else {
          console.log(
            "DocumentGraph useEffect - Condition not met - No graph update."
          );
        }
      }, [
        isSmallScreen,
        width,
        height,
        documentSimilaritiesData,
        memoizedGraphData,
        graphParams, // Add graphParams dependency
      ]);

      const cleanupGraph = useCallback(() => {
        if (simulationRef.current) {
          simulationRef.current.stop();
          simulationRef.current = null;
        }
        if (containerRef.current) {
          const container = d3.select(containerRef.current);
          container.selectAll("*").remove();
        }
      }, []);

      const initializeGraph = async (visibleDocsForGraph) => {
        if (!containerRef.current) return;
        if (!documentSimilaritiesData) return;
        cleanupGraph();

        try {
          const container = d3.select(containerRef.current);
          // Create the SVG element
          const svg = container
            .append("svg")
            .attr("width", width)
            .attr("height", height)
            .attr("className", "rounded-lg");
          svgRef.current = svg;

          // Add background rect
          svg
            .append("rect")
            .attr("width", "100%")
            .attr("height", "100%")
            .attr("fill", "var(--graph-background)");

          if (!visibleDocsForGraph.length) {
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

          // Group to be transformed by zoom & pan
          const g = svg.append("g");

          // Create zoom behavior and attach it to the SVG.
          // Note: We use broader scaleExtent and translateExtent values so users
          // can pan the entire graph and zoom fully in/out.
          const baseExtent = [
            [-width, -height],
            [2 * width, 2 * height],
          ];
          const zoomBehavior = d3
            .zoom()
            .scaleExtent(graphParams.zoomScaleExtent) // Use hyperparameter
            .on("zoom", (event) => {
              // Update g transform as usual
              g.attr("transform", event.transform);

              // Calculate dynamic extent based on scale
              const scale = event.transform.k;
              const scaleFactor = 1 / graphParams.zoomScaleExtent[0]; // Use hyperparameter
              const multiplier = scale * scaleFactor;

              const txExtent = [
                [baseExtent[0][0] * multiplier, baseExtent[0][1] * multiplier],
                [baseExtent[1][0] * multiplier, baseExtent[1][1] * multiplier],
              ];

              // Dynamically update the translateExtent
              zoomBehavior.translateExtent(txExtent);
            });

          // Apply the zoom behavior to the svg element
          svg.call(zoomBehavior);
          const initialScale = graphParams.initialZoomScale; // Use hyperparameter
          svg.call(
            zoomBehavior.transform,
            d3.zoomIdentity
              .translate(
                (width / 3) * graphParams.initialZoomTranslateFactor, // Use hyperparameter
                (height / 3) * graphParams.initialZoomTranslateFactor
              ) // Use hyperparameter
              .scale(initialScale)
          );

          const visibleDocIndicesMap = {};
          visibleDocsForGraph.forEach((doc, index) => {
            visibleDocIndicesMap[doc.originalIndex] = index;
          });

          const nodes = visibleDocsForGraph.map((doc, i) => ({
            id: String(i),
            title: doc.title,
            fullText: doc.description,
            tags: doc.tags,
            readTime: doc.readTime,
            releaseDate: doc.releaseDate,
            isRead: doc.isRead,
          }));

          let links = documentSimilaritiesData
            .filter((link) => {
              return (
                link.source in visibleDocIndicesMap &&
                link.target in visibleDocIndicesMap
              );
            })
            .map((link) => ({
              ...link,
              source: String(visibleDocIndicesMap[link.source]),
              target: String(visibleDocIndicesMap[link.target]),
            }));

          if (!links || links.length === 0) {
            links = [];
          }

          initializeSimulation(
            nodes,
            links,
            width,
            height,
            g,
            svg,
            visibleDocsForGraph.map((doc) => doc.readTime),
            graphParams // Pass graphParams
          );
        } catch (error) {
          setError("Error initializing graph. See console for details.");
        }
      };

      const initializeSimulation = (
        nodes,
        links,
        width,
        height,
        g,
        svg,
        readTimes,
        graphParams // Receive graphParams
      ) => {
        nodes.forEach((node) => {
          node.x = width / 2 + (Math.random() - 0.5) * 40;
          node.y = height / 2 + (Math.random() - 0.5) * 40;
        });

        simulationRef.current = d3
          .forceSimulation()
          .nodes(nodes)
          .force(
            "link",
            d3
              .forceLink(links)
              .id((d) => d.id)
              .distance(graphParams.linkDistance) // Use hyperparameter
              .strength(graphParams.linkStrength) // Use hyperparameter
          )
          .force(
            "charge",
            d3.forceManyBody().strength(graphParams.chargeStrength)
          ) // Use hyperparameter
          .force(
            "center",
            d3
              .forceCenter(width / 2, height / 2)
              .strength(graphParams.centerStrength)
          ) // Use hyperparameter
          .force("x", d3.forceX(width / 2).strength(graphParams.xForceStrength)) // Use hyperparameter
          .force(
            "y",
            d3.forceY(height / 2).strength(graphParams.yForceStrength)
          ) // Use hyperparameter
          .force(
            "collision",
            d3
              .forceCollide()
              .strength(graphParams.collideStrength) // Use hyperparameter
              .radius(
                (d) =>
                  normalizeReadTime(
                    d.readTime,
                    Math.min(...readTimes),
                    Math.max(...readTimes),
                    graphParams // Pass graphParams
                  ) + graphParams.collideRadiusPadding // Use hyperparameter
              )
          )
          .force("boundary", forceBoundary(width, height, nodes, graphParams)) // Pass graphParams
          .alpha(graphParams.simulationAlpha) // Use hyperparameter
          .velocityDecay(graphParams.velocityDecay) // Use hyperparameter
          .alphaDecay(graphParams.alphaDecay) // Use hyperparameter
          .alphaMin(graphParams.alphaMin); // Use hyperparameter

        const link = g
          .append("g")
          .selectAll("line")
          .data(links)
          .join("line")
          .attr("stroke", "var(--edge-color)")
          .attr("stroke-width", (d) => d.width)
          .attr("stroke-opacity", "var(--edge-opacity)");

        const nodeGroup = g.append("g").attr("className", "nodes");
        const node = nodeGroup
          .selectAll("g")
          .data(nodes)
          .join("g")
          .attr("transform", (d) => `translate(${d.x},${d.y})`)
          .call(
            d3
              .drag()
              .on("start", dragstarted)
              .on("drag", dragged)
              .on("end", dragended)
          );

        node
          .append("circle")
          .attr("r", (d) =>
            normalizeReadTime(
              d.readTime,
              Math.min(...readTimes),
              Math.max(...readTimes),
              graphParams // Pass graphParams
            )
          )
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
              .attr("className", "node-title-group")
              .attr("transform", `translate(${d.x},${d.y})`);
            nodeTitleGroupRef.current = titleGroup;

            titleGroup
              .append("text")
              .attr("className", "node-title")
              .attr("x", 10)
              .attr("y", 5)
              .attr("fill", "var(--text-color)")
              .text(d.title);
          })
          .on("mouseout", function (event, d) {
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

        simulationRef.current.on("tick", () => {
          link
            .attr("x1", (d) =>
              boundPosition(d.source.x, width, -graphParams.graphSizePadding)
            ) // Use hyperparameter
            .attr("y1", (d) =>
              boundPosition(d.source.y, height, -graphParams.graphSizePadding)
            ) // Use hyperparameter
            .attr("x2", (d) =>
              boundPosition(d.target.x, width, -graphParams.graphSizePadding)
            ) // Use hyperparameter
            .attr("y2", (d) =>
              boundPosition(d.target.y, height, -graphParams.graphSizePadding)
            ); // Use hyperparameter
          node.attr("transform", (d) => {
            const x = boundPosition(d.x, width, -graphParams.graphSizePadding); // Use hyperparameter
            const y = boundPosition(d.y, height, -graphParams.graphSizePadding); // Use hyperparameter
            return `translate(${x},${y})`;
          });
        });
      };

      const dragstarted = (event, d) => {
        if (!event.active) simulationRef.current.alphaTarget(0.01).restart();
        d.fx = d.x;
        d.fy = d.y;
        simulationRef.current.force("link").strength(0.8);
        simulationRef.current.alphaTarget(0.3).restart();
      };

      const dragged = (event, d) => {
        simulationRef.current.alphaTarget(0.01);
        d.fx = boundPosition(event.x, width, -graphParams.graphSizePadding); // Use hyperparameter
        d.fy = boundPosition(event.y, height, -graphParams.graphSizePadding); // Use hyperparameter
      };

      const dragended = (event, d) => {
        if (!event.active) simulationRef.current.alphaTarget(0.01);
        d.fx = null;
        d.fy = null;
      };

      const forceBoundary = (width, height, nodes, graphParams) => {
        // Receive graphParams
        const padding = 4;
        const xMin = padding;
        const xMax = width - padding;
        const yMin = padding;
        const yMax = height - padding;
        const strength = graphParams.boundaryStrength; // Use hyperparameter

        function force(alpha) {
          nodes.forEach((node) => {
            if (node.x < xMin) node.vx += (xMin - node.x) * strength * alpha;
            if (node.x > xMax) node.vx += (xMax - node.x) * strength * alpha;
            if (node.y < yMin) node.vy += (yMin - node.y) * strength * alpha;
            if (node.y > yMax) node.vy += (yMax - node.y) * strength * alpha;
          });
        }
        return force;
      };

      const boundPosition = (position, dimension, padding) => {
        return Math.max(padding, Math.min(dimension - padding, position));
      };

      const normalizeReadTime = (
        readTime,
        minReadTime,
        maxReadTime,
        graphParams
      ) => {
        // Receive graphParams
        const minRadius = graphParams.nodeMinRadius; // Use hyperparameter
        const maxRadius = graphParams.nodeMaxRadius; // Use hyperparameter
        if (maxReadTime === minReadTime) return (minRadius + maxRadius) / 2;
        const logMin = Math.log(minReadTime + 1);
        const logMax = Math.log(maxReadTime + 1);
        const logReadTime = Math.log(readTime + 1);
        return (
          ((logReadTime - logMin) / (logMax - logMin)) *
            (maxRadius - minRadius) +
          minRadius
        );
      };

      if (isSmallScreen) return null;

      if (error) {
        return (
          <div
            className="flex items-center justify-center h-32 rounded-lg"
            style={{
              backgroundColor: "var(--graph-background)",
              color: "var(--text-color)",
            }}
          >
            <p className="text-red-600">{error}</p>
          </div>
        );
      }

      return <div ref={containerRef} className="w-full h-full" />;
    }
  );
  DocumentGraph.displayName = "DocumentGraph";

  // --- useEffect for Scroll to Top Button Visibility ---
  useEffect(() => {
    const button = scrollToTopButtonRef.current;

    const handleScroll = () => {
      if (window.scrollY > 300) {
        // Adjust scroll threshold as needed
        button.classList.remove("opacity-0");
        button.classList.add("opacity-100");
      } else {
        button.classList.remove("opacity-100");
        button.classList.add("opacity-0");
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // Initial check on mount

    return () => window.removeEventListener("scroll", handleScroll); // Cleanup on unmount
  }, []);

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
      ></canvas>

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
              onInput={handleSearchInput}
            />
          </div>
          <div className="sort-bar">
            <div className="sort-bar-buttons">
              <button
                id="sort-release"
                onClick={(event) =>
                  debounceFunc(toggleSort(event.target, "release"), 1000)
                }
              >
                Sort by Release Date <span className="sort-arrow"></span>
              </button>
              <button
                id="sort-time"
                onClick={(event) =>
                  debounceFunc(toggleSort(event.target, "time"), 1000)
                }
              >
                Sort by Time to Read <span className="sort-arrow"></span>
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
                onClick={(event) =>
                  debounceFunc(toggleFilterType(event.target, "YT"), 1000)
                }
              >
                YT
              </button>
              <button
                id="filter-Arxiv"
                onClick={(event) =>
                  debounceFunc(toggleFilterType(event.target, "Arxiv"), 1000)
                }
              >
                Arxiv
              </button>
              <button
                id="filter-Site"
                onClick={(event) =>
                  debounceFunc(toggleFilterType(event.target, "Site"), 1000)
                }
              >
                Site
              </button>
              <button
                id="filter-Essay"
                onClick={(event) =>
                  debounceFunc(toggleFilterType(event.target, "Essay"), 1000)
                }
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
            {console.log(
              "displayedReadingListData before render:",
              displayedReadingListData
            )}
            {displayedReadingListData.map(
              (
                item // Use displayedReadingListData here
              ) => (
                <ReadingListItem
                  key={item.originalIndex}
                  item={item}
                  onTagFilter={handleTagFilter}
                />
              )
            )}
          </ul>
        </div>

        <div className="graph-container">
          <div id="root" className="graph-inner">
            <div className="space-y-6">
              <DocumentGraph
                width={400}
                height={400}
                graphDisplayData={memoizedGraphData} // Use memoizedGraphData
                documentSimilaritiesData={similaritiesRawData}
                graphParams={graphHyperparameters} // Pass hyperparameters
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
