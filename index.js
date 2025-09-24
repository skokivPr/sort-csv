// Global state
let appState = {
    rawData: "",
    allData: [],
    categorizedData: { ib: [], ob: [], atseu: [], other: [] },
    buffers: [],
    theme: localStorage.getItem("theme") || "dark",
    currentChart: null,
    currentModalData: null,
    currentView: "dashboard", // 'dashboard' or 'categorized'
    chartType: "pie", // 'pie' or 'bar'
    navControlsVisible: localStorage.getItem("navControlsVisible") !== "false", // Default to visible
    csvEditor: null, // CodeMirror instance
    inputViewMode: "editor", // 'editor' or 'table'
    driversEnabled: localStorage.getItem("driversEnabled") === "true", // Driver columns activation
};

// Driver columns management
function toggleDriverColumns(enable) {
    appState.driversEnabled = enable;
    localStorage.setItem("driversEnabled", enable.toString());

    // Update body class to control CSS visibility
    document.body.classList.toggle("drivers-enabled", enable);
    document.body.classList.toggle("drivers-disabled", !enable);

    // Update modal if it exists
    const modal = document.getElementById("modal");
    if (modal) {
        modal.classList.toggle("drivers-enabled", enable);
        modal.classList.toggle("drivers-disabled", !enable);
    }

    // Update CSV editor header if it exists
    if (appState.csvEditor && appState.inputViewMode === "editor") {
        updateCSVEditorHeader(enable);
    }

    // Re-populate table to ensure proper rendering
    if (typeof populateInputTable === 'function') {
        populateInputTable();
    }

    return enable;
}

// Update CSV editor header based on driver columns state
function updateCSVEditorHeader(driversEnabled) {
    if (!appState.csvEditor) return;

    const currentValue = appState.csvEditor.getValue();
    const lines = currentValue.split('\n');

    if (lines.length > 0) {
        let headerLine = lines[0];
        const hasDriverColumns = headerLine.includes('driverName') || headerLine.includes('Driver Name');

        if (driversEnabled && !hasDriverColumns) {
            // Add driver columns to header
            if (headerLine.endsWith(',')) {
                headerLine += 'driverName,driverLicense';
            } else if (headerLine.trim()) {
                headerLine += ',driverName,driverLicense';
            } else {
                headerLine = 'timestamp,user,vrid,scac,traktor,trailer,driverName,driverLicense';
            }

            lines[0] = headerLine;
            appState.csvEditor.setValue(lines.join('\n'));
        } else if (!driversEnabled && hasDriverColumns) {
            // Remove driver columns from header
            headerLine = headerLine.replace(/,?driverName,?driverLicense,?/g, '');
            headerLine = headerLine.replace(/,Driver Name,?Driver License,?/g, '');
            headerLine = headerLine.replace(/,$/, ''); // Remove trailing comma

            lines[0] = headerLine;
            appState.csvEditor.setValue(lines.join('\n'));
        }
    }
}

// Utility functions
function generateId() {
    return "id-" + Math.random().toString(36).substr(2, 9);
}

// Color utilities
function getColorPalette() {
    const rootStyles = getComputedStyle(document.documentElement);
    return {
        orange: rootStyles.getPropertyValue("--rgb-orange").trim(),
        yellow: rootStyles.getPropertyValue("--rgb-yellow").trim(),
        blue: rootStyles.getPropertyValue("--rgb-blue").trim(),
        red: rootStyles.getPropertyValue("--rgb-red").trim(),
        green: rootStyles.getPropertyValue("--rgb-green").trim(),
        purple: rootStyles.getPropertyValue("--rgb-purple").trim(),
        pink: rootStyles.getPropertyValue("--rgb-pink").trim(),
        cyan: rootStyles.getPropertyValue("--rgb-cyan").trim(),
        teal: rootStyles.getPropertyValue("--rgb-teal").trim(),
        indigo: rootStyles.getPropertyValue("--rgb-indigo").trim(),
        lime: rootStyles.getPropertyValue("--rgb-lime").trim(),
        amber: rootStyles.getPropertyValue("--rgb-amber").trim(),
        deepOrange: rootStyles.getPropertyValue("--rgb-deep-orange").trim(),
        brown: rootStyles.getPropertyValue("--rgb-brown").trim(),
        grey: rootStyles.getPropertyValue("--rgb-grey").trim(),
    };
}

function getRandomColor() {
    const colors = getColorPalette();
    const colorKeys = Object.keys(colors);
    const randomKey = colorKeys[Math.floor(Math.random() * colorKeys.length)];
    return colors[randomKey];
}

function showToast(message, type = "info") {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    setTimeout(() => {
        toast.classList.remove("show");
    }, 5000);
}

// CSV Parsing
function parseCSV(text) {
    if (!text.trim()) return [];
    const lines = text.trim().split(/\r?\n/);
    return lines.map((line) => {
        const values = line.split(/[,\t;]/).map((v) => v.trim());
        return {
            id: generateId(),
            timestamp: values[0] || "",
            user: values[1] || "",
            vrid: values[2] || "",
            scac: values[3] || "",
            traktor: values[4] || "",
            trailer: values[5] || "",
        };
    });
}

// Data Categorization
function categorizeData(data) {
    const categorized = { ib: [], ob: [], atseu: [], other: [] };
    data.forEach((row) => {
        const vrid = (row.vrid || "").trim();
        const trailer = (row.trailer || "").trim().toUpperCase();
        if (trailer.includes("VS") || trailer.includes("VI")) {
            categorized.atseu.push(row);
        } else if (!vrid) {
            categorized.other.push(row);
        } else if (vrid.includes("0994")) {
            categorized.ib.push(row);
        } else {
            categorized.ob.push(row);
        }
    });
    return categorized;
}

// CSV Download functionality
function downloadCSV(data, filename) {
    let headers = ["timestamp", "user", "vrid", "scac", "traktor", "trailer"];

    // Add driver columns only if enabled
    if (appState.driversEnabled) {
        headers.push("driverName", "driverLicense");
    }

    const csvContent = [
        headers.join(","),
        ...data.map((row) => headers.map((header) => row[header] || "").join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", filename);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
}

// Buffer Management
function getBuffers() {
    try {
        const buffersJson = localStorage.getItem("csv_data_buffers");
        return buffersJson ? JSON.parse(buffersJson) : [];
    } catch (e) {
        console.error("Failed to read buffers from localStorage", e);
        return [];
    }
}

function saveBuffers(buffers) {
    try {
        localStorage.setItem("csv_data_buffers", JSON.stringify(buffers));
    } catch (e) {
        console.error("Failed to save buffers to localStorage", e);
    }
}

function formatBytes(bytes) {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function createBuffer(name, originalData, transformedData = null) {
    const buffers = getBuffers();
    const size = formatBytes(
        new TextEncoder().encode(JSON.stringify(originalData)).length
    );
    const newBuffer = {
        id: generateId(),
        name,
        created: new Date().toISOString(),
        lastAccessed: new Date().toISOString(),
        recordCount: originalData.length,
        size,
        hasTransformed: !!transformedData,
        originalData,
        transformedData,
    };
    saveBuffers([...buffers, newBuffer]);
    return newBuffer.id;
}

function getBuffer(id) {
    const buffers = getBuffers();
    const buffer = buffers.find((b) => b.id === id);
    if (buffer) {
        buffer.lastAccessed = new Date().toISOString();
        saveBuffers(buffers);
    }
    return buffer;
}

function deleteBuffer(id) {
    let buffers = getBuffers();
    const initialLength = buffers.length;
    buffers = buffers.filter((b) => b.id !== id);
    if (buffers.length < initialLength) {
        saveBuffers(buffers);
        return true;
    }
    return false;
}

function clearAllBuffers() {
    saveBuffers([]);
}

function compareBuffers(id1, id2) {
    const buffer1 = getBuffer(id1);
    const buffer2 = getBuffer(id2);

    if (!buffer1 || !buffer2) return null;

    const data1 = buffer1.originalData;
    const data2 = buffer2.originalData;

    const createKey = (row) =>
        `${row.timestamp}-${row.user}-${row.vrid}-${row.scac}-${row.traktor}-${row.trailer}`;

    const set1 = new Set(data1.map(createKey));
    const set2 = new Set(data2.map(createKey));
    const map1 = new Map(data1.map((row) => [createKey(row), row]));
    const map2 = new Map(data2.map((row) => [createKey(row), row]));

    const common = [];
    set1.forEach((key) => {
        if (set2.has(key)) {
            common.push(map1.get(key));
        }
    });

    const unique1 = [];
    set1.forEach((key) => {
        if (!set2.has(key)) {
            unique1.push(map1.get(key));
        }
    });

    const unique2 = [];
    set2.forEach((key) => {
        if (!set1.has(key)) {
            unique2.push(map2.get(key));
        }
    });

    const totalUnique = common.length + unique1.length + unique2.length;
    const similarity =
        totalUnique > 0 ? ((common.length / totalUnique) * 100).toFixed(1) : "0.0";

    return {
        stats: {
            total1: data1.length,
            total2: data2.length,
            commonCount: common.length,
            unique1Count: unique1.length,
            unique2Count: unique2.length,
            similarity,
        },
        common,
        unique1,
        unique2,
        buffer1Data: data1,
        buffer2Data: data2,
        buffer1Name: buffer1.name,
        buffer2Name: buffer2.name,
    };
}

// Data Statistics
function getTransformStats(data) {
    const users = [...new Set(data.map((r) => r.user).filter(Boolean))];
    const userCounts = {};
    data.forEach((r) => {
        if (r.user) userCounts[r.user] = (userCounts[r.user] || 0) + 1;
    });
    const topUserEntry = Object.entries(userCounts).sort(
        (a, b) => b[1] - a[1]
    )[0];

    return {
        uniqueUsers: users.length,
        topUser: topUserEntry
            ? { user: topUserEntry[0], count: topUserEntry[1] }
            : null,
        vehicleStats: {
            tractors: new Set(data.map((r) => r.traktor).filter(Boolean)).size,
            trailers: new Set(data.map((r) => r.trailer).filter(Boolean)).size,
            vsTrailers: data.filter((r) => r.trailer?.toUpperCase().includes("VS") || r.trailer?.toUpperCase().includes("VI"))
                .length,
        },
        dataQuality: { valid: 98.5 },
        validation: { errors: [], warnings: [] },
    };
}

// User Activity Analysis
function getUserActivityData(data) {
    const userCounts = {};
    data.forEach((row) => {
        if (row.user && row.user.trim()) {
            const user = row.user.trim();
            userCounts[user] = (userCounts[user] || 0) + 1;
        }
    });

    // Sort by count descending and take top 10
    return Object.entries(userCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([user, count]) => ({ user, count }));
}

// Counter animation function
function animateCounter(element, targetValue, duration = 3000) {
    const startValue = 0;
    const startTime = performance.now();

    function updateCounter(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Easing function for smooth animation
        const easeOutCubic = 1 - Math.pow(1 - progress, 1);
        const currentValue = Math.floor(startValue + (targetValue - startValue) * easeOutCubic);

        element.textContent = currentValue;

        if (progress < 1) {
            requestAnimationFrame(updateCounter);
        } else {
            element.textContent = targetValue; // Ensure final value is exact
        }
    }

    requestAnimationFrame(updateCounter);
}

// UI Updates
function updateCategoriesTiles() {
    const panel = document.getElementById("categories-panel");
    const { ib, ob, atseu, other } = appState.categorizedData;

    // Clear panel and set it back to grid layout
    panel.className = "panel-content panel-content-grid panel-content-categories";

    panel.innerHTML = `
                <div class="category-tile" onclick="showModal('IB (0994)', ${JSON.stringify(
        ib
    ).replace(/"/g, "&quot;")})">
                    <div>
                        <div class="tile-icon-wrapper tile-icon-wrapper-orange">
                            <i class="fas fa-arrow-left"></i>
                        </div>
                        <h3 class="tile-main-title">IB</h3>
                        <p class="tile-subtitle">Inbound</p>
                        <p class="tile-description">Rekordy z VRID 0994 - wizyty wjeżdżające na teren terminala</p>
                    </div>
                    <div class="category-tile-bottom">
                        <span class="tile-details-link tile-details-link-orange"><i class="fas fa-eye"></i> View Details</span>
                        <span class="tile-count tile-count-orange" data-target="${ib.length}">0</span>
                    </div>
                </div>
                <div class="category-tile" onclick="showModal('OB (Other VRID)', ${JSON.stringify(
        ob
    ).replace(/"/g, "&quot;")})">
                    <div>
                        <div class="tile-icon-wrapper tile-icon-wrapper-green">
                            <i class="fas fa-arrow-right"></i>
                        </div>
                        <h3 class="tile-main-title">OB</h3>
                        <p class="tile-subtitle">Outbound</p>
                        <p class="tile-description">Rekordy z innymi VRID - wizyty wyjeżdżające z terminala</p>
                    </div>
                    <div class="category-tile-bottom">
                        <span class="tile-details-link tile-details-link-green"><i class="fas fa-eye"></i> View Details</span>
                        <span class="tile-count tile-count-green" data-target="${ob.length}">0</span>
                    </div>
                </div>
                <div class="category-tile" onclick="showModal('ATSEU (VS/VI-ES)', ${JSON.stringify(
        atseu
    ).replace(/"/g, "&quot;")})">
                    <div>
                        <div class="tile-icon-wrapper tile-icon-wrapper-blue">
                            <i class="fas fa-truck"></i>
                        </div>
                        <h3 class="tile-main-title">VS/<span style="color: red;">VI-ES</span> (ATS)</h3>
                        <p class="tile-subtitle">Prime Trailer (VS/VI-ES)</p>
                        <p class="tile-description">Rekordy z trailerami VS i VI-ES - główne naczepy w systemie ATS</p>
                    </div>
                    <div class="category-tile-bottom">
                        <span class="tile-details-link tile-details-link-blue"><i class="fas fa-eye"></i> View Details</span>
                        <span class="tile-count tile-count-blue" data-target="${atseu.length}">0</span>
                    </div>
                </div>
                <div class="category-tile" onclick="showModal('OTHER (No VRID)', ${JSON.stringify(
        other
    ).replace(/"/g, "&quot;")})">
                    <div>
                        <div class="tile-icon-wrapper tile-icon-wrapper-red">
                            <i class="fas fa-box"></i>
                        </div>
                        <h3 class="tile-main-title">Other</h3>
                        <p class="tile-subtitle">For all no vrid</p>
                        <p class="tile-description">Rekordy bez przypisanego VRID - wymagają dodatkowej weryfikacji</p>
                    </div>
                    <div class="category-tile-bottom">
                        <span class="tile-details-link tile-details-link-red"><i class="fas fa-eye"></i> View Details</span>
                        <span class="tile-count tile-count-red" data-target="${other.length}">0</span>
                    </div>
                </div>
            `;

    // Animate counters after DOM is updated
    setTimeout(() => {
        const counters = panel.querySelectorAll('.tile-count');
        counters.forEach((counter, index) => {
            const targetValue = parseInt(counter.dataset.target);
            // Stagger animations slightly for visual effect
            setTimeout(() => {
                animateCounter(counter, targetValue, 3800);
            }, index * 100);
        });
    }, 50);
}

function updateBuffersTable() {
    const tbody = document.getElementById("buffers-tbody");
    const buffers = getBuffers();

    if (buffers.length === 0) {
        tbody.innerHTML =
            '<tr><td colspan="4" class="table-empty-message">No buffers saved.</td></tr>';
    } else {
        tbody.innerHTML = buffers
            .map(
                (buffer) => `
                     <tr>
                         <td>${(buffer.name || "").toUpperCase()}</td>
                         <td>${(buffer.recordCount || "").toString().toUpperCase()}</td>
                         <td>${(buffer.size || "").toString().toUpperCase()}</td>
                         <td>
                             <button onclick="loadBuffer('${buffer.id
                    }')" class="buffer-btn-load"><i class="fas fa-download"></i> Load</button>
                             <button onclick="exportBuffer('${buffer.id
                    }')" class="buffer-btn-export"><i class="fas fa-file-export"></i> Export</button>
                             <button onclick="removeBuffer('${buffer.id
                    }')" class="buffer-btn-delete"><i class="fas fa-trash-alt"></i> Delete</button>
                         </td>
                     </tr>
                 `
            )
            .join("");
    }

    // Update buffer statistics
    updateBufferStats();
}


function updateChart() {
    const ctx = document.getElementById("main-chart").getContext("2d");

    if (appState.currentChart) {
        appState.currentChart.destroy();
    }

    if (appState.chartType === "pie") {
        updatePieChart(ctx);
    } else {
        updateBarChart(ctx);
    }
}

function updatePieChart(ctx) {
    const { ib, ob, atseu, other } = appState.categorizedData;

    // Get color palette
    const colors = getColorPalette();
    const panelBg = getComputedStyle(document.documentElement)
        .getPropertyValue("--panel-bg")
        .trim();

    appState.currentChart = new Chart(ctx, {
        type: "doughnut",
        data: {
            labels: ["IB (0994)", "OB (Other)", "ATSEU (VS)", "OTHER"],
            datasets: [
                {
                    data: [ib.length, ob.length, atseu.length, other.length],
                    backgroundColor: [
                        `rgb(${colors.orange})`,
                        `rgb(${colors.green})`,
                        `rgb(${colors.blue})`,
                        `rgb(${colors.red})`,
                    ],
                    hoverBackgroundColor: [
                        `rgba(${colors.orange}, 0.8)`,
                        `rgba(${colors.green}, 0.8)`,
                        `rgba(${colors.blue}, 0.8)`,
                        `rgba(${colors.red}, 0.8)`,
                    ],
                    borderWidth: 3,
                    borderColor: panelBg,
                    hoverBorderWidth: 4,
                    hoverBorderColor: panelBg,
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: "bottom",
                    labels: {
                        color: "#8b8b8b",
                        font: {
                            family: "JetBrains Mono",
                        },
                        whiteSpace: "nowrap",
                    },
                },
                title: {
                    display: true,
                    text: "Data Categories",
                    color: "#8b8b8b",
                    font: {
                        family: "JetBrains Mono",
                        size: 14,
                        weight: "bold",
                    },
                },
            },
        },
    });
}

function updateBarChart(ctx) {
    const userActivity = getUserActivityData(appState.allData);

    // Get color palette
    const colors = getColorPalette();
    const textMuted = getComputedStyle(document.documentElement)
        .getPropertyValue("--text-muted")
        .trim();

    if (userActivity.length === 0) {
        // Show empty state
        appState.currentChart = new Chart(ctx, {
            type: "bar",
            data: {
                labels: ["No Data"],
                datasets: [
                    {
                        label: "Activity Count",
                        data: [0],
                        backgroundColor: textMuted,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: "y",
                plugins: {
                    legend: { display: false },
                    title: {
                        display: true,
                        text: "Top User Activity",
                        color: "#8b8b8b",
                        font: {
                            family: "JetBrains Mono",
                            size: 14,
                            weight: "bold",
                            whiteSpace: "nowrap",
                        },
                    },
                },
            },
        });
        return;
    }

    appState.currentChart = new Chart(ctx, {
        type: "bar",
        data: {
            labels: userActivity.map((u) => u.user),
            datasets: [
                {
                    label: "Activity Count",
                    data: userActivity.map((u) => u.count),
                    backgroundColor: userActivity.map((_, index) => {
                        const colorArray = [
                            colors.blue,
                            colors.green,
                            colors.purple,
                            colors.cyan,
                            colors.teal,
                            colors.pink,
                            colors.amber,
                            colors.indigo,
                        ];
                        const colorIndex = index % colorArray.length;
                        return `rgba(${colorArray[colorIndex]}, 0.8)`;
                    }),
                    borderColor: userActivity.map((_, index) => {
                        const colorArray = [
                            colors.blue,
                            colors.green,
                            colors.purple,
                            colors.cyan,
                            colors.teal,
                            colors.pink,
                            colors.amber,
                            colors.indigo,
                        ];
                        const colorIndex = index % colorArray.length;
                        return `rgb(${colorArray[colorIndex]})`;
                    }),
                    borderWidth: 2,
                    borderRadius: 4,
                    borderSkipped: false,
                    hoverBackgroundColor: userActivity.map((_, index) => {
                        const colorArray = [
                            colors.blue,
                            colors.green,
                            colors.purple,
                            colors.cyan,
                            colors.teal,
                            colors.pink,
                            colors.amber,
                            colors.indigo,
                        ];
                        const colorIndex = index % colorArray.length;
                        return `rgb(${colorArray[colorIndex]})`;
                    }),
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: "y", // Horizontal bars
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: {
                        color: "#8b8b8b",
                        font: {
                            family: "JetBrains Mono",
                            whiteSpace: "nowrap",
                        },
                    },
                    grid: {
                        color: "#72727223",
                        drawBorder: false,
                    },
                },
                y: {
                    ticks: {
                        color: "#4e4e4e",
                        font: {
                            family: "JetBrains Mono",
                            size: 10,
                        },
                        maxRotation: 0,
                    },
                    grid: {
                        display: false,
                    },
                },
            },
            plugins: {
                legend: {
                    display: false,
                },
                title: {
                    display: true,
                    text: "Top User Activity",
                    color: "#8b8b8b",
                    font: {
                        family: "JetBrains Mono",
                        size: 14,
                        weight: "bold",
                    },
                },
                tooltip: {
                    backgroundColor: "#000000",
                    titleColor: "#ffffff",
                    bodyColor: "#ffffff",
                    borderColor: "#72727223",
                    borderWidth: 1,
                    titleFont: {
                        family: "JetBrains Mono",
                    },
                    bodyFont: {
                        family: "JetBrains Mono",
                    },
                },
            },
        },
    });
}

// Event handlers
function handleDataParsed(text) {
    appState.rawData = text;
    appState.allData = parseCSV(text);
    appState.categorizedData = categorizeData(appState.allData);

    updateCategoriesTiles();
    updateChart();

    const saveBtn = document.getElementById("save-btn");
    if (saveBtn) saveBtn.disabled = appState.allData.length === 0;
}

function saveToBuffer() {
    if (appState.allData.length === 0) {
        showToast("No data to save!", "error");
        if (typeof sendErrorNotification === 'function') {
            sendErrorNotification("Attempted to save empty data to buffer");
        }
        return;
    }
    const timestamp = new Date().toLocaleString("en-US", { hour12: false });
    const bufferName = `CSV Data ${timestamp}`;
    createBuffer(bufferName, appState.allData, appState.categorizedData);
    showToast(`Saved to buffer: ${bufferName}`, "success");
    if (typeof sendSuccessNotification === 'function') {
        sendSuccessNotification(`Buffer created: ${bufferName} (${appState.allData.length} records)`);
    }
    updateBuffersTable();
}

function exportBuffer(id) {
    const buffer = getBuffer(id);
    if (buffer) {
        const filename = `${buffer.name.replace(/[^a-z0-9]/gi, "_")}.csv`;
        downloadCSV(buffer.originalData, filename);
        showToast(`Exported ${buffer.name}`, "success");
    }
}


function showComparisonResults(result) {
    const panel = document.getElementById("categories-panel");

    // Change panel to single column layout for comparison
    panel.className = "panel-content panel-content-comparison";

    panel.innerHTML = `
                 <div class="comparison-container">
                     <h3 class="comparison-title">Buffer Comparison Results</h3>
                     <div class="comparison-stats">
                         <div><strong>${result.buffer1Name}:</strong> ${result.stats.total1} records</div>
                         <div><strong>${result.buffer2Name}:</strong> ${result.stats.total2} records</div>
                         <div><strong>Common:</strong> ${result.stats.commonCount} records</div>
                         <div><strong>Similarity:</strong> ${result.stats.similarity}%</div>
                     </div>
                     <div class="comparison-buttons">
                         <button onclick="showModal('Common Records (${result.stats.commonCount})', JSON.stringify(result.common))" class="primary comparison-btn-small">
                             Common (${result.stats.commonCount})
                         </button>
                         <button onclick="showModal('Unique to ${result.buffer1Name} (${result.stats.unique1Count})', JSON.stringify(result.unique1))" class="comparison-btn-small">
                             Buffer 1 (${result.stats.unique1Count})
                         </button>
                         <button onclick="showModal('Unique to ${result.buffer2Name} (${result.stats.unique2Count})', JSON.stringify(result.unique2))" class="comparison-btn-small">
                             Buffer 2 (${result.stats.unique2Count})
                         </button>
                         <button onclick="resetCategoriesView()" class="comparison-btn-reset">
                             ← Back to Categories
                         </button>
                     </div>
                 </div>
             `;
}

function resetCategoriesView() {
    updateCategoriesTiles();
}

// Input view mode switching
function toggleInputViewMode() {
    // Save current data
    if (appState.csvEditor && appState.inputViewMode === "editor") {
        appState.rawData = appState.csvEditor.getValue();
        // Properly destroy CodeMirror
        destroyCodeMirrorEditor();
    }

    // Toggle mode
    appState.inputViewMode = appState.inputViewMode === "editor" ? "table" : "editor";

    // Re-render the input panel
    renderInputPanel();

    showToast(`Switched to ${appState.inputViewMode === "editor" ? "Editor" : "Table"} view`, "info");
}

function renderInputPanel() {
    const inputPanel = document.querySelector('.panel-grid-1-1 .panel-content');
    if (!inputPanel) return;

    if (appState.inputViewMode === "editor") {
        inputPanel.innerHTML = `
                        <div class="file-upload-container">
                            <p>Supports .csv and .txt files with comma, semicolon, or tab separators.</p>
                            <input type="file" id="file-input" accept=".csv,.txt" class="file-input-hidden">
                            <div style="display: flex; gap: 0.5rem; align-items: center;">
                                <button class=" f-input" onclick="document.getElementById('file-input').click()">
                                    Select File
                                </button>
                                <button class="editor-btn" onclick="copyEditorDataToClipboard()" title="Copy CSV to clipboard">
                                    <i class="fas fa-copy"></i>
                                </button>
                                <button class="editor-btn" onclick="toggleInputViewMode()" title="Switch to Table view">
                                    <i class="fas fa-table"></i>
                                </button>
                            </div>
                        </div>
            <div class="panel-content-flex-grow">
                <div id="csv-editor" style="height: 100%; "></div>
            </div>
        `;

        // Re-initialize CodeMirror
        setTimeout(() => {
            console.log("Initializing CodeMirror for editor view...");
            initializeCodeMirrorEditor();
        }, 100);

    } else {
        inputPanel.innerHTML = `
            <div class="file-upload-container">
                <p>Supports .csv and .txt files with comma, semicolon, or tab separators.</p>
                <input type="file" id="file-input" accept=".csv,.txt" class="file-input-hidden">
                            <div style="display: flex; gap: 0.5rem; align-items: center;">
                                <button class=" f-input" onclick="document.getElementById('file-input').click()">
                                    Select File
                                </button>
                                <button class="editor-btn" onclick="copyEditorDataToClipboard()" title="Copy CSV to clipboard">
                                    <i class="fas fa-copy"></i>
                                </button>
                                <button class="editor-btn" onclick="toggleInputViewMode()" title="Switch to Editor view">
                                    <i class="fas fa-code"></i>
                                </button>
                            </div>
            </div>
            <div class="panel-content-flex-grow">
                <div class="data-table-wrapper">
                    <div class="data-table-header">
                        <h6>CSV Data <span class="count-badge" id="input-table-count">${appState.allData.length}</span></h6>
                        <div class="panel-content-data-header-controls">
                            <input type="text" placeholder="Filter..." id="input-table-filter" onkeyup="filterInputTable()">
                            <button onclick="addNewRow()" class="editor-btn" title="Add new row">
                                <i class="fas fa-plus"></i>
                            </button>
                        </div>
                    </div>
                    <div class="table-container" style="position: relative;">
                        <table class="editable-table" id="input-table">
                            <thead>
                                <tr>
                                    <th style="position: sticky; top: 0; z-index: 9;">Timestamp</th>
                                    <th style="position: sticky; top: 0; z-index: 9;">User</th>
                                    <th style="position: sticky; top: 0; z-index: 9;">VRID</th>
                                    <th style="position: sticky; top: 0; z-index: 9;">SCAC</th>
                                    <th style="position: sticky; top: 0; z-index: 9;">Traktor</th>
                                    <th style="position: sticky; top: 0; z-index: 9;">Trailer</th>
                                    <th style="position: sticky; top: 0; z-index: 9;" class="driver-column">Driver Name</th>
                                    <th style="position: sticky; top: 0; z-index: 9;" class="driver-column">Driver License</th>
                                    <th style="position: sticky; top: 0; z-index: 9;">Actions</th>
                                </tr>
                            </thead>
                            <tbody id="input-table-tbody">
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;

        // Populate the table
        populateInputTable();
    }

    // Re-setup event listeners
    setupEventListeners();
}

function populateInputTable() {
    const tbody = document.getElementById("input-table-tbody");
    if (!tbody) return;

    tbody.innerHTML = appState.allData.map((row, index) => `
        <tr data-row-index="${index}">
            <td><input type="text" class="editable-cell" value="${row.timestamp || ''}" onchange="updateRowData(${index}, 'timestamp', this.value)" onfocus="this.select()"></td>
            <td><input type="text" class="editable-cell" value="${row.user || ''}" onchange="updateRowData(${index}, 'user', this.value)" onfocus="this.select()"></td>
            <td><input type="text" class="editable-cell vrid-input" value="${row.vrid || ''}" onchange="updateRowData(${index}, 'vrid', this.value)" onfocus="this.select()"></td>
            <td><input type="text" class="editable-cell" value="${row.scac || ''}" onchange="updateRowData(${index}, 'scac', this.value)" onfocus="this.select()"></td>
            <td><input type="text" class="editable-cell" value="${row.traktor || ''}" onchange="updateRowData(${index}, 'traktor', this.value)" onfocus="this.select()"></td>
            <td><input type="text" class="editable-cell trailer-input" value="${row.trailer || ''}" onchange="updateRowData(${index}, 'trailer', this.value)" onfocus="this.select()"></td>
            <td class="driver-column"><input type="text" class="editable-cell driver-name-input" value="${row.driverName || ''}" onchange="updateRowData(${index}, 'driverName', this.value)" onfocus="this.select()" placeholder="Select driver..."></td>
            <td class="driver-column"><input type="text" class="editable-cell driver-license-input" value="${row.driverLicense || ''}" onchange="updateRowData(${index}, 'driverLicense', this.value)" onfocus="this.select()" readonly title="License is auto-filled when driver is selected"></td>
            <td>
                <div class="row-actions">
                    <button class="row-action-btn duplicate" onclick="duplicateRow(${index})" title="Duplicate row">
                        <i class="fas fa-copy"></i>
                    </button>
                    <button class="row-action-btn delete" onclick="deleteRow(${index})" title="Delete row">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join("");

    // Update count badge
    const countBadge = document.getElementById("input-table-count");
    if (countBadge) {
        countBadge.textContent = appState.allData.length;
    }
}

function updateRowData(index, field, value) {
    if (appState.allData[index]) {
        appState.allData[index][field] = value;

        // Auto-fill driver license when driver name is selected
        if (field === 'driverName' && value) {
            const drivers = csvTerminal.getDrivers();
            const selectedDriver = drivers.find(d => d.name.toLowerCase() === value.toLowerCase());
            if (selectedDriver) {
                appState.allData[index]['driverLicense'] = selectedDriver.license;
                // Update the UI immediately
                const licenseInput = document.querySelector(`tr[data-row-index="${index}"] .driver-license-input`);
                if (licenseInput) {
                    licenseInput.value = selectedDriver.license;
                }
                showToast(`Auto-filled license: ${selectedDriver.license}`, "info");
            }
        }

        // Update raw data
        updateRawDataFromTable();

        // Re-categorize data
        appState.categorizedData = categorizeData(appState.allData);

        // Update other views
        updateCategoriesTiles();
        updateChart();
    }
}

function addNewRow() {
    const newRow = {
        id: generateId(),
        timestamp: "",
        user: "",
        vrid: "",
        scac: "",
        traktor: "",
        trailer: "",
        driverName: "",
        driverLicense: ""
    };

    appState.allData.push(newRow);
    populateInputTable();
    updateRawDataFromTable();

    // Re-categorize data
    appState.categorizedData = categorizeData(appState.allData);
    updateCategoriesTiles();
    updateChart();

    showToast("New row added", "success");
}

function duplicateRow(index) {
    if (appState.allData[index]) {
        const originalRow = appState.allData[index];
        const duplicatedRow = {
            id: generateId(),
            timestamp: originalRow.timestamp,
            user: originalRow.user,
            vrid: originalRow.vrid,
            scac: originalRow.scac,
            traktor: originalRow.traktor,
            trailer: originalRow.trailer,
            driverName: originalRow.driverName,
            driverLicense: originalRow.driverLicense
        };

        appState.allData.splice(index + 1, 0, duplicatedRow);
        populateInputTable();
        updateRawDataFromTable();

        // Re-categorize data
        appState.categorizedData = categorizeData(appState.allData);
        updateCategoriesTiles();
        updateChart();

        showToast("Row duplicated", "success");
    }
}

function deleteRow(index) {
    if (appState.allData[index]) {
        appState.allData.splice(index, 1);
        populateInputTable();
        updateRawDataFromTable();

        // Re-categorize data
        appState.categorizedData = categorizeData(appState.allData);
        updateCategoriesTiles();
        updateChart();

        showToast("Row deleted", "info");
    }
}

function updateRawDataFromTable() {
    appState.rawData = appState.allData.map(row =>
        [row.timestamp, row.user, row.vrid, row.scac, row.traktor, row.trailer].join(",")
    ).join("\n");

    // Update CodeMirror if it exists
    if (appState.csvEditor && appState.inputViewMode === "editor") {
        appState.csvEditor.setValue(appState.rawData);
    }
}

function filterInputTable() {
    const filter = document.getElementById("input-table-filter");
    if (!filter) return;

    const filterValue = filter.value.toLowerCase();
    const rows = document.querySelectorAll("#input-table-tbody tr");

    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(filterValue) ? "" : "none";
    });
}

function setupEventListeners() {
    // File input handler
    const fileInput = document.getElementById("file-input");
    if (fileInput) {
        fileInput.addEventListener("change", function (e) {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = function (e) {
                const content = e.target.result;
                if (appState.csvEditor) {
                    appState.csvEditor.setValue(content);
                }
                handleDataParsed(content);

                // Update clear button state after loading file
                updateClearButtonState();

                showToast(`Loaded file: ${file.name}`, "success");
                if (typeof sendSuccessNotification === 'function') {
                    sendSuccessNotification(`File loaded: ${file.name} (${content.split('\n').length} lines)`);
                }
            };
            reader.onerror = function () {
                showToast(`Error loading file: ${reader.error?.message}`, "error");
                if (typeof sendErrorNotification === 'function') {
                    sendErrorNotification(`Failed to load file: ${file.name} - ${reader.error?.message}`);
                }
            };
            reader.readAsText(file);

            // Clear the input
            e.target.value = "";
        });
    }

    // Control action buttons
    const saveBtn = document.getElementById("save-btn");
    if (saveBtn) {
        saveBtn.addEventListener("click", saveToBuffer);
    }

    const clearBtn = document.getElementById("clear-btn");
    if (clearBtn) {
        clearBtn.addEventListener("click", clearAll);
    }

    const themeBtn = document.getElementById("theme-btn");
    if (themeBtn) {
        themeBtn.addEventListener("click", toggleTheme);
    }

    const controlThemeBtn = document.getElementById("control-theme-btn");
    if (controlThemeBtn) {
        controlThemeBtn.addEventListener("click", toggleTheme);
    }

    const viewBtn = document.getElementById("view-btn");
    if (viewBtn) {
        viewBtn.addEventListener("click", toggleView);
    }

    const controlViewBtn = document.getElementById("control-view-btn");
    if (controlViewBtn) {
        controlViewBtn.addEventListener("click", toggleView);
    }

    // Control panel reset button (different from nav-controls reset button)
    const controlResetBtn = document.getElementById("control-reset-btn");
    if (controlResetBtn) {
        controlResetBtn.addEventListener("click", function () {
            // Add spin animation to control reset button
            controlResetBtn.classList.add("spin");
            setTimeout(() => {
                controlResetBtn.classList.remove("spin");
            }, 800);

            // Reset layout
            const grid = document.getElementById("grid-container");
            grid.style.gridTemplateColumns = "1fr 8px 1fr";
            grid.style.gridTemplateRows = "1fr 8px 1fr";

            // Update reset button states after reset
            updateResetButtonStates();

            showToast("Layout reset to default", "info");
        });
    }

}

// View switching functionality
function toggleView() {
    // Save current state before switching views
    destroyCodeMirrorEditor();

    // Save buffer selections
    const buffer1Select = document.getElementById("buffer1-select");
    const buffer2Select = document.getElementById("buffer2-select");
    if (buffer1Select && buffer2Select) {
        appState.selectedBuffer1 = buffer1Select.value;
        appState.selectedBuffer2 = buffer2Select.value;
    }

    appState.currentView =
        appState.currentView === "dashboard" ? "categorized" : "dashboard";
    renderCurrentView();

    const viewBtn = document.getElementById("view-btn");
    const controlViewBtn = document.getElementById("control-view-btn");

    const navContent = appState.currentView === "dashboard"
        ? '<i class="fas fa-th-large"></i>'
        : '<i class="fas fa-tachometer-alt"></i>';

    const controlContent = appState.currentView === "dashboard"
        ? '<i class="fas fa-th-large"></i><span>Categories</span>'
        : '<i class="fas fa-tachometer-alt"></i><span>Dashboard</span>';

    if (viewBtn) viewBtn.innerHTML = navContent;
    if (controlViewBtn) controlViewBtn.innerHTML = controlContent;
}

function renderCurrentView() {
    const gridContainer = document.getElementById("grid-container");

    if (appState.currentView === "categorized") {
        renderCategorizedView();
    } else {
        renderDashboardView();
    }
}

function renderDashboardView() {
    const gridContainer = document.getElementById("grid-container");
    gridContainer.innerHTML = `
                <!-- Input Panel -->
                <div class="panel panel-grid-1-1">
                    <div class="panel-header">CSV ANALYZER // INPUT</div>
                    <div class="panel-content panel-content-flex-col">
                        <!-- Content will be rendered by renderInputPanel() -->
                    </div>
                </div>

                <!-- Charts Panel -->
                <div class="panel panel-grid-3-1">
                    <div class="panel-header">VISUAL ANALYSIS</div>
                    <div class="panel-content panel-content-flex-col">
                        <div class="panel-content-chart-controls">
                            <button id="pie-chart-btn" class="chart-toggle-btn primary" onclick="toggleChart('pie')">
                                <i class="fas fa-chart-pie"></i> Categories
                            </button>
                            <button id="bar-chart-btn" class="chart-toggle-btn" onclick="toggleChart('bar')">
                                <i class="fas fa-chart-bar"></i> User Activity
                            </button>
                        </div>
                        <div class="chart-container panel-content-flex-grow">
                            <canvas id="main-chart"></canvas>
                        </div>
                    </div>
                </div>

                <!-- Buffers & Management Panel -->
                <div class="panel panel-grid-1-3">
                    <div class="panel-header">DATA BUFFERS // MANAGEMENT</div>
                    <div class="panel-content">
                        <div id="buffers-content">
                            <!-- Control Panel -->
                            <div class="buffer-control-panel">
                                <div class="control-panel-header">
                                    <h4><i class="fas fa-cogs"></i> Control Panel</h4>
                                </div>
                                <div class="control-panel-content">
                                    <!-- Quick Actions -->
                                    <div class="control-actions">
            <button class="control-btn save-btn" id="save-btn" disabled title="Save current data to a buffer">
                <i class="fas fa-save"></i><span>Save</span>
            </button>
            <button class="control-btn clear-btn" id="clear-btn" title="Clear all current data">
                <i class="fas fa-trash"></i><span>Clear</span>
            </button>
            <button class="control-btn refresh-btn" id="control-reset-btn" title="Reset Layout">
                <i class="fas fa-undo"></i><span>Reset</span>
            </button>
            <button class="control-btn" id="control-theme-btn" title="Toggle dark/light theme">
                <i class="fas fa-moon"></i><span>Theme</span>
            </button>
            <button class="control-btn export-btn" id="control-view-btn" title="Switch between dashboard and categorized view">
                <i class="fas fa-th-large"></i><span>Categories</span>
            </button>
            <button class="control-btn terminal-btn" id="terminal-toggle-btn" onclick="toggleTerminalPanel()" title="Toggle Terminal Panel">
                <i class="fas fa-terminal"></i><span>Terminal</span>
            </button>
                                    </div>
                                </div>
                            </div>
                            <!-- Saved Buffers Panel -->
                            <div class="buffer-list-panel">
                                <div class="data-table-wrapper">
                                    <div class="data-table-header">
                                        <h6>Saved Buffers <span class="count-badge" id="buffers-count-badge">0</span></h6>
                                        <div class="panel-content-data-header-controls">
                                            <input type="text" id="buffer-search" placeholder="Search buffers..." class="buffer-search-input">
                                            <button id="refresh-buffers-btn" class="small-btn" onclick="updateBuffersTable()" title="Refresh buffer list">
                                                <i class="fas fa-sync-alt"></i>
                                            </button>
                                        </div>
                                    </div>
                                    <div class="table-container">
                                        <table id="buffers-table">
                                            <thead>
                                                <tr>
                                                    <th onclick="sortBuffers('name')" class="sortable">
                                                        Name <i class="fas fa-sort"></i>
                                                    </th>
                                                    <th onclick="sortBuffers('recordCount')" class="sortable">
                                                        Records <i class="fas fa-sort"></i>
                                                    </th>
                                                    <th onclick="sortBuffers('size')" class="sortable">
                                                        Size <i class="fas fa-sort"></i>
                                                    </th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody id="buffers-tbody">
                                                <tr>
                                                    <td colspan="4" class="table-empty-message">No buffers saved.</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Categories Panel -->
                <div class="panel panel-grid-3-3-relative">
                    <div class="panel-header">
                        <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                            <span>CATEGORIZED DATA</span>
                            <button id="terminal-toggle-btn" class="small-btn-terminal" onclick="toggleTerminalPanel()" title="Toggle Terminal">
                                <i class="fas fa-terminal"></i>
                            </button>
                        </div>
                    </div>
                    <div class="panel-content panel-content-grid panel-content-categories" id="categories-panel">
                        <!-- Category tiles will be populated here -->
                    </div>
                    
                    <!-- Hidden Terminal Panel -->
                    <div id="hidden-terminal-panel" class="hidden-terminal-panel" style="display: none;">
                        <div class="terminal-container">
                            <div class="terminal-header">
                                <div class="terminal-controls">
                                    <div class="terminal-control-dot green"></div>
                                </div>
                                <div class="logo">$</div>
                                <span class="terminal-title">CSV Analyzer Terminal</span>
                                <div class="terminal-header-controls">
                                    <button onclick="clearTerminal()" class="small-btn-terminal-clear" title="Clear terminal">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                    <button onclick="toggleTerminalPanel()" class="small-btn-terminal-clear" title="Hide terminal">
                                        <i class="fas fa-times"></i>
                                    </button>
                                </div>
                            </div>
                            <div id="terminal-output" class="terminal-output">
                                <div class="terminal-line">
                                    <span class="terminal-prompt">csv-analyzer:~$ </span>
                                    <span class="terminal-text">Welcome to CSV Analyzer Terminal</span>
                                </div>
                                <div class="terminal-line">
                                    <span class="terminal-prompt">csv-analyzer:~$ </span>
                                    <span class="terminal-text">Type 'help' for available commands</span>
                                </div>
                            </div>
                            <div class="terminal-input-container">
                                <div class="terminal-input-row">
                                    <span class="terminal-prompt">csv-analyzer:~<span class="logo">$ </span></span>
                                    <input type="text" id="terminal-input" class="terminal-input" placeholder="Enter command..." 
                                           onkeydown="handleTerminalInput(event)">
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Resizers -->
                <div class="resizer-v resizer-v-main"></div>
                <div class="resizer-h resizer-h-main"></div>
                <div class="resizer-center resizer-center-main"></div>
            `;

    // Re-initialize after rendering
    setupEventListeners();
    setupResizers();
    updateCategoriesTiles();
    updateChart();
    updateBuffersTable();
    setupBufferSearch();

    // Render input panel
    renderInputPanel();

    // Update navigation controls visibility
    updateNavControlsVisibility();

    // Update reset button states
    updateResetButtonStates();

    // Update clear button state
    updateClearButtonState();

}

function renderCategorizedView() {
    const gridContainer = document.getElementById("grid-container");
    gridContainer.innerHTML = `
                <!-- IB Panel -->
                <div class="panel panel-grid-1-1">
                    <div class="panel-header">CATEGORIZED DATA // <span style="color: rgb(var(--rgb-orange));">IB (0994)</span></div>
                    <div class="panel-content">
                        <div class="data-table-wrapper">
                            <div class="data-table-header">
                                <h6>IB (0994) <span class="count-badge">${appState.categorizedData.ib.length}</span></h6>
                                <div class="panel-content-data-header-controls">
                                    <input type="text" placeholder="Filter..." id="ib-filter">
                                    <button class="small-btn" onclick="exportCategoryData('ib', 'IB_0994')" title="Export to CSV"><i class="fas fa-file-csv"></i></button>
                                </div>
                            </div>
                            <div class="table-container">
                                <table>
                                    <thead>
                                        <tr>
                                            <th onclick="sortCategoryTable('ib', 'timestamp')" class="sortable">Data UTC <i class="fas fa-sort"></i></th>
                                            <th onclick="sortCategoryTable('ib', 'user')" class="sortable">User ID <i class="fas fa-sort"></i></th>
                                            <th onclick="sortCategoryTable('ib', 'vrid')" class="sortable">VRID <i class="fas fa-sort"></i></th>
                                            <th onclick="sortCategoryTable('ib', 'scac')" class="sortable">SCAC <i class="fas fa-sort"></i></th>
                                            <th onclick="sortCategoryTable('ib', 'traktor')" class="sortable">Traktor <i class="fas fa-sort"></i></th>
                                            <th onclick="sortCategoryTable('ib', 'trailer')" class="sortable">Trailer <i class="fas fa-sort"></i></th>
                                        </tr>
                                    </thead>
                                    <tbody id="ib-tbody">
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- OB Panel -->
                <div class="panel panel-grid-3-1">
                    <div class="panel-header">CATEGORIZED DATA // <span style="color: rgb(var(--rgb-green));">OB (Other VRID)</span></div>
                    <div class="panel-content">
                        <div class="data-table-wrapper">
                            <div class="data-table-header">
                                <h6>OB (Other VRID) <span class="count-badge">${appState.categorizedData.ob.length}</span></h6>
                                <div class="panel-content-data-header-controls">
                                    <input type="text" placeholder="Filter..." id="ob-filter">
                                    <button class="small-btn" onclick="exportCategoryData('ob', 'OB_Other_VRID')" title="Export to CSV"><i class="fas fa-file-csv"></i></button>
                                </div>
                            </div>
                            <div class="table-container">
                                <table>
                                    <thead>
                                        <tr>
                                            <th onclick="sortCategoryTable('ob', 'timestamp')" class="sortable">Data UTC <i class="fas fa-sort"></i></th>
                                            <th onclick="sortCategoryTable('ob', 'user')" class="sortable">User ID <i class="fas fa-sort"></i></th>
                                            <th onclick="sortCategoryTable('ob', 'vrid')" class="sortable">VRID <i class="fas fa-sort"></i></th>
                                            <th onclick="sortCategoryTable('ob', 'scac')" class="sortable">SCAC <i class="fas fa-sort"></i></th>
                                            <th onclick="sortCategoryTable('ob', 'traktor')" class="sortable">Traktor <i class="fas fa-sort"></i></th>
                                            <th onclick="sortCategoryTable('ob', 'trailer')" class="sortable">Trailer <i class="fas fa-sort"></i></th>
                                        </tr>
                                    </thead>
                                    <tbody id="ob-tbody">
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- ATSEU Panel -->
                <div class="panel panel-grid-1-3">
                    <div class="panel-header">CATEGORIZED DATA // <span style="color: rgb(var(--rgb-blue));">ATSEU (VS/VI-ES)</span></div>
                    <div class="panel-content">
                        <div class="data-table-wrapper">
                            <div class="data-table-header">
                                <h6>ATSEU (VS/VI) <span class="count-badge">${appState.categorizedData.atseu.length}</span></h6>
                                <div class="panel-content-data-header-controls">
                                    <input type="text" placeholder="Filter..." id="atseu-filter">
                                    <button class="small-btn" onclick="exportCategoryData('atseu', 'ATSEU_VS_VI')" title="Export to CSV"><i class="fas fa-file-csv"></i></button>
                                </div>
                            </div>
                            <div class="table-container">
                                <table>
                                    <thead>
                                        <tr>
                                            <th onclick="sortCategoryTable('atseu', 'timestamp')" class="sortable">Data UTC <i class="fas fa-sort"></i></th>
                                            <th onclick="sortCategoryTable('atseu', 'user')" class="sortable">User ID <i class="fas fa-sort"></i></th>
                                            <th onclick="sortCategoryTable('atseu', 'vrid')" class="sortable">VRID <i class="fas fa-sort"></i></th>
                                            <th onclick="sortCategoryTable('atseu', 'scac')" class="sortable">SCAC <i class="fas fa-sort"></i></th>
                                            <th onclick="sortCategoryTable('atseu', 'traktor')" class="sortable">Traktor <i class="fas fa-sort"></i></th>
                                            <th onclick="sortCategoryTable('atseu', 'trailer')" class="sortable">Trailer <i class="fas fa-sort"></i></th>
                                        </tr>
                                    </thead>
                                    <tbody id="atseu-tbody">
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Other Panel -->
                <div class="panel panel-grid-3-3">
                    <div class="panel-header">CATEGORIZED DATA // <span style="color: rgb(var(--rgb-red));">OTHER (No VRID)</span></div>
                    <div class="panel-content">
                        <div class="data-table-wrapper">
                            <div class="data-table-header">
                                <h6>OTHER (No VRID) <span class="count-badge">${appState.categorizedData.other.length}</span></h6>
                                <div class="panel-content-data-header-controls">
                                    <input type="text" placeholder="Filter..." id="other-filter">
                                    <button class="small-btn" onclick="exportCategoryData('other', 'OTHER_No_VRID')" title="Export to CSV"><i class="fas fa-file-csv"></i></button>
                                </div>
                            </div>
                            <div class="table-container">
                                <table>
                                    <thead>
                                        <tr>
                                            <th onclick="sortCategoryTable('other', 'timestamp')" class="sortable">Data UTC <i class="fas fa-sort"></i></th>
                                            <th onclick="sortCategoryTable('other', 'user')" class="sortable">User ID <i class="fas fa-sort"></i></th>
                                            <th onclick="sortCategoryTable('other', 'vrid')" class="sortable">VRID <i class="fas fa-sort"></i></th>
                                            <th onclick="sortCategoryTable('other', 'scac')" class="sortable">SCAC <i class="fas fa-sort"></i></th>
                                            <th onclick="sortCategoryTable('other', 'traktor')" class="sortable">Traktor <i class="fas fa-sort"></i></th>
                                            <th onclick="sortCategoryTable('other', 'trailer')" class="sortable">Trailer <i class="fas fa-sort"></i></th>
                                        </tr>
                                    </thead>
                                    <tbody id="other-tbody">
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Resizers -->
                <div class="resizer-v resizer-v-main"></div>
                <div class="resizer-h resizer-h-main"></div>
                <div class="resizer-center resizer-center-main"></div>
            `;

    // Populate tables
    populateCategoryTables();
    setupResizers();

    // Setup event listeners for nav controls
    setupEventListeners();

    // Update navigation controls visibility
    updateNavControlsVisibility();
}

function populateCategoryTables() {
    const categories = ["ib", "ob", "atseu", "other"];

    categories.forEach((category) => {
        const tbody = document.getElementById(`${category}-tbody`);
        const data = appState.categorizedData[category];

        tbody.innerHTML = data
            .map(
                (row) => `
                    <tr>
                        <td class="data-timestamp">${(row.timestamp || "").toUpperCase()}</td>
                        <td class="data-user">${(row.user || "").toUpperCase()}</td>
                        <td class="data-vrid ${row.vrid && row.vrid.includes("0994")
                        ? "vrid-inbound"
                        : "vrid-outbound"
                    }">${(row.vrid || "").toUpperCase()}</td>
                        <td class="data-scac">${(row.scac || "").toUpperCase()}</td>
                        <td class="data-traktor">${(row.traktor || "").toUpperCase()}</td>
                        <td class="data-trailer ${row.trailer &&
                        (row.trailer.toUpperCase().includes("VS") || row.trailer.toUpperCase().includes("VI"))
                        ? "trailer-vs"
                        : ""
                    }">${(row.trailer || "").toUpperCase()}</td>
                    </tr>
                `
            )
            .join("");
    });
}

function exportCategoryData(category, filename) {
    const data = appState.categorizedData[category];
    downloadCSV(data, `${filename}.csv`);
    showToast(`Exported ${category.toUpperCase()} data`, "success");
}

function toggleChart(type) {
    if (appState.chartType === type) return;

    appState.chartType = type;
    updateChart();

    // Update button states
    const pieBtn = document.getElementById("pie-chart-btn");
    const barBtn = document.getElementById("bar-chart-btn");

    if (pieBtn && barBtn) {
        if (type === "pie") {
            pieBtn.classList.add("primary");
            barBtn.classList.remove("primary");
        } else {
            barBtn.classList.add("primary");
            pieBtn.classList.remove("primary");
        }
    }

    showToast(
        `Switched to ${type === "pie" ? "category" : "user activity"} chart`,
        "info"
    );
}

function clearAll() {
    const recordCount = appState.allData.length;

    appState.rawData = "";
    appState.allData = [];
    appState.categorizedData = { ib: [], ob: [], atseu: [], other: [] };

    if (appState.csvEditor) {
        appState.csvEditor.setValue("");
    }
    updateCategoriesTiles();
    updateChart();

    if (typeof sendInfoNotification === 'function') {
        sendInfoNotification(`Data cleared: ${recordCount} records removed`);
    }

    const saveBtn = document.getElementById("save-btn");
    if (saveBtn) saveBtn.disabled = true;

    // Update clear button state after clearing
    updateClearButtonState();

    showToast("All data cleared");
}

function toggleTheme() {
    const oldTheme = appState.theme;
    appState.theme = appState.theme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("theme", appState.theme);
    localStorage.setItem("theme", appState.theme);

    // Update CodeMirror theme
    updateCodeMirrorTheme();

    if (typeof sendInfoNotification === 'function') {
        sendInfoNotification(`Theme changed: ${oldTheme} → ${appState.theme}`);
    }

    const themeBtn = document.getElementById("theme-btn");
    const controlThemeBtn = document.getElementById("control-theme-btn");

    const navThemeContent = appState.theme === "dark"
        ? '<i class="fas fa-sun"></i>'
        : '<i class="fas fa-moon"></i>';

    const controlThemeContent = appState.theme === "dark"
        ? '<i class="fas fa-sun"></i><span>Theme</span>'
        : '<i class="fas fa-moon"></i><span>Theme</span>';

    if (themeBtn) themeBtn.innerHTML = navThemeContent;
    if (controlThemeBtn) controlThemeBtn.innerHTML = controlThemeContent;
}

function toggleNavControls() {
    appState.navControlsVisible = !appState.navControlsVisible;
    localStorage.setItem("navControlsVisible", appState.navControlsVisible.toString());
    updateNavControlsVisibility();
    showToast(
        appState.navControlsVisible ? "Navigation controls shown" : "Navigation controls hidden",
        "info"
    );
}

function updateNavControlsVisibility() {
    const navControls = document.getElementById("nav-controls");
    const navShowBtn = document.getElementById("nav-show-btn");

    // Show nav-controls only in Categories view and when user wants them visible
    if (appState.currentView === "categorized" && appState.navControlsVisible) {
        navControls.style.display = "flex";
        navControls.classList.remove("hidden");
        if (navShowBtn) navShowBtn.style.display = "none";
    } else if (appState.currentView === "categorized" && !appState.navControlsVisible) {
        navControls.style.display = "flex";
        navControls.classList.add("hidden");
        if (navShowBtn) navShowBtn.style.display = "flex";
    } else {
        // Hide in Dashboard view
        navControls.style.display = "none";
        if (navShowBtn) navShowBtn.style.display = "none";
    }
}

function loadBuffer(id) {
    const buffers = getBuffers();
    const buffer = buffers.find((b) => b.id === id);
    if (buffer) {
        const csvData = buffer.originalData
            .map((row) =>
                [
                    row.timestamp,
                    row.user,
                    row.vrid,
                    row.scac,
                    row.traktor,
                    row.trailer,
                ].join(",")
            )
            .join("\n");

        if (appState.csvEditor) {
            appState.csvEditor.setValue(csvData);
        }
        handleDataParsed(csvData);
        showToast(`Loaded ${buffer.name}`, "info");
        if (typeof sendInfoNotification === 'function') {
            sendInfoNotification(`Buffer loaded: ${buffer.name} (${buffer.recordCount} records)`);
        }
    }
}

function removeBuffer(id) {
    const buffers = getBuffers();
    const buffer = buffers.find((b) => b.id === id);
    const bufferName = buffer ? buffer.name : 'Unknown';

    if (deleteBuffer(id)) {
        updateBuffersTable();
        showToast("Buffer deleted", "info");
        if (typeof sendInfoNotification === 'function') {
            sendInfoNotification(`Buffer deleted: ${bufferName}`);
        }
    }
}

function showModal(title, data) {
    const modal = document.getElementById("modal");
    const modalTitle = document.getElementById("modal-title");
    const modalTbody = document.getElementById("modal-tbody");

    // Set title with appropriate color styling
    if (title.includes("IB")) {
        modalTitle.innerHTML = `<span class="modal-title-ib">${title}</span>`;
    } else if (title.includes("OB")) {
        modalTitle.innerHTML = `<span class="modal-title-ob">${title}</span>`;
    } else if (title.includes("ATSEU") || title.includes("VS") || title.includes("VI")) {
        modalTitle.innerHTML = `<span class="modal-title-atseu">${title}</span>`;
    } else if (title.includes("OTHER")) {
        modalTitle.innerHTML = `<span class="modal-title-other">${title}</span>`;
    } else if (title.includes("Common")) {
        modalTitle.innerHTML = `<span class="modal-title-common">${title}</span>`;
    } else if (title.includes("Unique")) {
        modalTitle.innerHTML = `<span class="modal-title-unique">${title}</span>`;
    } else {
        modalTitle.textContent = title;
    }

    if (typeof data === "string") {
        data = JSON.parse(data);
    }

    // Store current modal data for export
    appState.currentModalData = { title, data };

    modalTbody.innerHTML = data
        .map(
            (row) => `
                 <tr>
                     <td class="data-timestamp">${(row.timestamp || "").toUpperCase()}</td>
                     <td class="data-user">${(row.user || "").toUpperCase()}</td>
                     <td class="data-vrid ${row.vrid && row.vrid.includes("0994")
                    ? "vrid-inbound"
                    : "vrid-outbound"
                }">${(row.vrid || "").toUpperCase()}</td>
                     <td class="data-scac">${(row.scac || "").toUpperCase()}</td>
                     <td class="data-traktor">${(row.traktor || "").toUpperCase()}</td>
                     <td class="data-trailer ${row.trailer && (row.trailer.toUpperCase().includes("VS") || row.trailer.toUpperCase().includes("VI"))
                    ? "trailer-vs"
                    : ""
                }">${(row.trailer || "").toUpperCase()}</td>
                     <td class="data-driver-name driver-column">${(row.driverName || "").toUpperCase()}</td>
                     <td class="data-driver-license driver-column">${(row.driverLicense || "").toUpperCase()}</td>
                 </tr>
             `
        )
        .join("");

    modal.classList.add("show");
}

function exportModalData() {
    if (appState.currentModalData) {
        const filename = `${appState.currentModalData.title.replace(
            /[^a-z0-9]/gi,
            "_"
        )}.csv`;
        downloadCSV(appState.currentModalData.data, filename);
        showToast(`Exported ${appState.currentModalData.title}`, "success");
    }
}

async function copyModalDataToClipboard() {
    if (appState.currentModalData && appState.currentModalData.data) {
        try {
            // Create CSV content
            let headers = ["timestamp", "user", "vrid", "scac", "traktor", "trailer"];

            // Add driver columns only if enabled
            if (appState.driversEnabled) {
                headers.push("driverName", "driverLicense");
            }

            const csvContent = [
                headers.join(","),
                ...appState.currentModalData.data.map(row =>
                    headers.map(header => {
                        const value = row[header] || "";
                        // Escape commas and quotes in CSV
                        if (value.includes(",") || value.includes('"') || value.includes("\n")) {
                            return `"${value.replace(/"/g, '""')}"`;
                        }
                        return value;
                    }).join(",")
                )
            ].join("\n");

            // Copy to clipboard using modern API
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(csvContent);
                showToast(`Copied ${appState.currentModalData.data.length} rows to clipboard`, "success");
            } else {
                // Fallback for older browsers
                const textArea = document.createElement("textarea");
                textArea.value = csvContent;
                textArea.style.position = "fixed";
                textArea.style.left = "-999999px";
                textArea.style.top = "-999999px";
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();

                try {
                    document.execCommand('copy');
                    showToast(`Copied ${appState.currentModalData.data.length} rows to clipboard`, "success");
                } catch (err) {
                    showToast("Failed to copy to clipboard", "error");
                }

                document.body.removeChild(textArea);
            }
        } catch (err) {
            console.error('Failed to copy to clipboard:', err);
            showToast("Failed to copy to clipboard", "error");
        }
    } else {
        showToast("No data to copy", "warning");
    }
}

async function copyEditorDataToClipboard() {
    try {
        let csvContent = "";

        if (appState.csvEditor && appState.inputViewMode === "editor") {
            // Get content from CodeMirror
            csvContent = appState.csvEditor.getValue();
        } else if (appState.rawData) {
            // Get content from raw data
            csvContent = appState.rawData;
        }

        if (!csvContent.trim()) {
            showToast("No data to copy", "warning");
            return;
        }

        // Copy to clipboard using modern API
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(csvContent);
            const lineCount = csvContent.split('\n').length;
            showToast(`Copied ${lineCount} lines to clipboard`, "success");
        } else {
            // Fallback for older browsers
            const textArea = document.createElement("textarea");
            textArea.value = csvContent;
            textArea.style.position = "fixed";
            textArea.style.left = "-999999px";
            textArea.style.top = "-999999px";
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();

            try {
                document.execCommand('copy');
                const lineCount = csvContent.split('\n').length;
                showToast(`Copied ${lineCount} lines to clipboard`, "success");
            } catch (err) {
                showToast("Failed to copy to clipboard", "error");
            }

            document.body.removeChild(textArea);
        }
    } catch (err) {
        console.error('Failed to copy editor data to clipboard:', err);
        showToast("Failed to copy to clipboard", "error");
    }
}

function closeModal() {
    const modal = document.getElementById("modal");
    modal.classList.remove("show");
    // Reset modal data
    appState.currentModalData = null;
}

// CSV Autocomplete hints
function defineCSVHints() {
    // Get dynamic driver data from localStorage
    const getDriversFromStorage = () => {
        try {
            const drivers = JSON.parse(localStorage.getItem('csv_drivers') || '[]');
            return drivers;
        } catch (e) {
            return [];
        }
    };

    const drivers = getDriversFromStorage();

    const csvHints = {
        // Common SCAC codes
        scacCodes: ['UACU', 'MSKU', 'OOLU', 'HLCU', 'COSCO', 'EVERGREEN', 'MAEU', 'HAPAG'],
        // Common trailer types
        trailerTypes: ['VS001', 'VS002', 'VS003', 'VS004', 'VS005', 'VS006', 'VS007', 'VS008', 'VS009', 'VS010', 'VI001', 'VI002', 'VI003', 'VI004', 'VI005', 'VI006', 'VI007', 'VI008', 'VI009', 'VI010'],
        // Common tractor numbers
        tractorNumbers: ['T001', 'T002', 'T003', 'T004', 'T005', 'T100', 'T200', 'T300'],
        // Common user IDs
        userIds: ['USER001', 'USER002', 'USER003', 'ADMIN', 'OPERATOR', 'DRIVER'],
        // VRID patterns
        vridPatterns: ['0994001', '0994002', '0994003', 'OTH001', 'OTH002', 'OTH003'],
        // Driver names - dynamically loaded from localStorage
        driverNames: drivers.map(d => d.name),
        // Driver licenses - dynamically loaded from localStorage
        driverLicenses: drivers.map(d => d.license)
    };

    CodeMirror.registerHelper("hint", "csv-hint", function (editor, options) {
        const cursor = editor.getCursor();
        const line = editor.getLine(cursor.line);
        const start = cursor.ch;
        let end = start;

        // Find word boundaries
        while (end < line.length && /[\w\d]/.test(line.charAt(end))) end++;
        let wordStart = start;
        while (wordStart > 0 && /[\w\d]/.test(line.charAt(wordStart - 1))) wordStart--;

        const word = line.slice(wordStart, end);
        const column = (line.substring(0, cursor.ch).match(/[,;]/g) || []).length;

        let hints = [];

        // Column-specific hints
        switch (column) {
            case 1: // User column
                hints = csvHints.userIds.filter(hint => hint.toLowerCase().includes(word.toLowerCase()));
                break;
            case 2: // VRID column
                hints = csvHints.vridPatterns.filter(hint => hint.toLowerCase().includes(word.toLowerCase()));
                break;
            case 3: // SCAC column
                hints = csvHints.scacCodes.filter(hint => hint.toLowerCase().includes(word.toLowerCase()));
                break;
            case 4: // Tractor column
                hints = csvHints.tractorNumbers.filter(hint => hint.toLowerCase().includes(word.toLowerCase()));
                break;
            case 5: // Trailer column
                hints = csvHints.trailerTypes.filter(hint => hint.toLowerCase().includes(word.toLowerCase()));
                break;
            case 6: // Driver Name column (only if drivers enabled)
                if (appState.driversEnabled) {
                    hints = csvHints.driverNames.filter(hint => hint.toLowerCase().includes(word.toLowerCase()));
                } else {
                    hints = CodeMirror.hint.anyword(editor, options)?.list || [];
                }
                break;
            case 7: // Driver License column (only if drivers enabled)
                if (appState.driversEnabled) {
                    hints = csvHints.driverLicenses.filter(hint => hint.toLowerCase().includes(word.toLowerCase()));
                } else {
                    hints = CodeMirror.hint.anyword(editor, options)?.list || [];
                }
                break;
            default:
                // General word hints from document
                hints = CodeMirror.hint.anyword(editor, options)?.list || [];
        }

        // Add timestamp suggestions for first column
        if (column === 0 && word.length === 0) {
            const now = new Date();
            hints = [
                now.toISOString(),
                now.toLocaleDateString() + ' ' + now.toLocaleTimeString(),
                now.toISOString().split('T')[0] + ' ' + now.toTimeString().split(' ')[0]
            ];
        }

        return {
            list: hints,
            from: CodeMirror.Pos(cursor.line, wordStart),
            to: CodeMirror.Pos(cursor.line, end)
        };
    });
}

// Custom CSV Mode for CodeMirror with column coloring
function defineCustomCSVMode() {
    CodeMirror.defineMode("csv-colored", function (config, parserConfig) {
        return {
            startState: function () {
                return {
                    column: 0,
                    inQuotes: false
                };
            },
            token: function (stream, state) {
                // Reset column at start of line
                if (stream.sol()) {
                    state.column = 0;
                    state.inQuotes = false;
                }

                var ch = stream.next();

                // Handle quotes
                if (ch === '"') {
                    state.inQuotes = !state.inQuotes;
                    return "string";
                }

                // If inside quotes, everything is a string
                if (state.inQuotes) {
                    return "string";
                }

                // Handle delimiters
                if (ch === ',' || ch === ';' || ch === '\t') {
                    state.column++;
                    return "csv-delimiter";
                }

                // Handle newlines
                if (ch === '\n' || ch === '\r') {
                    return null;
                }

                // Read the complete field value
                var fieldValue = ch;
                while (!stream.eol() && stream.peek() !== ',' && stream.peek() !== ';' && stream.peek() !== '\t' && stream.peek() !== '"' && stream.peek() !== '\n') {
                    fieldValue += stream.next();
                }

                // Color based on column position (1-indexed for CSS classes)
                var columnClass = "csv-column-" + (state.column + 1);
                var fullToken = fieldValue.trim().toUpperCase();

                // Special cases for VRID column (column 3, index 2)
                if (state.column === 2) {
                    if (fullToken.includes("0994")) {
                        return columnClass + " csv-inbound-vrid";
                    } else if (fullToken && fullToken !== "") {
                        return columnClass + " csv-outbound-vrid";
                    }
                }

                // Special cases for Trailer column (column 6, index 5)
                if (state.column === 5 && (fullToken.includes("VS") || fullToken.includes("VI"))) {
                    return columnClass + " csv-vs-trailer";
                }

                return columnClass;
            }
        };
    });
}

// CodeMirror Editor Functions
function initializeCodeMirrorEditor() {
    console.log("initializeCodeMirrorEditor called");
    const editorElement = document.getElementById("csv-editor");
    console.log("Editor element found:", !!editorElement);
    if (editorElement) {
        // Always destroy existing editor first
        if (appState.csvEditor) {
            destroyCodeMirrorEditor(false); // Don't save data when reinitializing
        }

        // Define custom CSV mode and hints first
        defineCustomCSVMode();
        defineCSVHints();

        // Clear the element first
        editorElement.innerHTML = '';

        appState.csvEditor = CodeMirror(editorElement, {
            mode: "csv-colored",
            theme: appState.theme === "dark" ? "material-darker" : "default",
            lineNumbers: true,
            lineWrapping: true,
            placeholder: "Paste CSV data here...\nTip: Use Ctrl+Space for autocomplete, Ctrl+F for search, Ctrl+H for replace",
            tabSize: 4,
            indentWithTabs: false,
            styleActiveLine: true,
            matchBrackets: true,
            autoCloseBrackets: true,
            foldGutter: true,
            gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
            hintOptions: {
                hint: CodeMirror.hint["csv-hint"],
                completeSingle: false
            },
            extraKeys: {
                "Ctrl-Space": "autocomplete",
                "Ctrl-/": "toggleComment",
                "Cmd-/": "toggleComment",
                "Ctrl-F": "findPersistent",
                "Cmd-F": "findPersistent",
                "Ctrl-H": "replace",
                "Cmd-Alt-F": "replace",
                "F3": "findNext",
                "Shift-F3": "findPrev",
                "Ctrl-G": "jumpToLine",
                "Ctrl-D": function (cm) {
                    // Duplicate current line
                    const cursor = cm.getCursor();
                    const line = cm.getLine(cursor.line);
                    cm.replaceRange('\n' + line, { line: cursor.line, ch: line.length });
                },
                "Ctrl-Shift-D": function (cm) {
                    // Delete current line
                    const cursor = cm.getCursor();
                    cm.replaceRange('', { line: cursor.line, ch: 0 }, { line: cursor.line + 1, ch: 0 });
                },
                "Alt-Up": function (cm) {
                    // Move line up
                    const cursor = cm.getCursor();
                    if (cursor.line > 0) {
                        const line = cm.getLine(cursor.line);
                        cm.replaceRange('', { line: cursor.line, ch: 0 }, { line: cursor.line + 1, ch: 0 });
                        cm.replaceRange(line + '\n', { line: cursor.line - 1, ch: 0 });
                        cm.setCursor(cursor.line - 1, cursor.ch);
                    }
                },
                "Alt-Down": function (cm) {
                    // Move line down
                    const cursor = cm.getCursor();
                    if (cursor.line < cm.lineCount() - 1) {
                        const line = cm.getLine(cursor.line);
                        cm.replaceRange('', { line: cursor.line, ch: 0 }, { line: cursor.line + 1, ch: 0 });
                        cm.replaceRange(line + '\n', { line: cursor.line + 1, ch: 0 });
                        cm.setCursor(cursor.line + 1, cursor.ch);
                    }
                }
            }
        });

        // Set up change listener
        appState.csvEditor.on("change", function (cm) {
            const content = cm.getValue();
            handleDataParsed(content);
            appState.rawData = content;

            // Update clear button state when content changes
            updateClearButtonState();
        });

        // Restore content if available
        if (appState.rawData) {
            appState.csvEditor.setValue(appState.rawData);
        }

        console.log("CodeMirror initialized successfully:", !!appState.csvEditor);

        // Force refresh to ensure proper display
        setTimeout(() => {
            if (appState.csvEditor) {
                appState.csvEditor.refresh();
                console.log("CodeMirror refreshed");
            }

            // Update clear button state after initialization
            updateClearButtonState();
        }, 50);
    }
}

function updateCodeMirrorTheme() {
    if (appState.csvEditor) {
        const theme = appState.theme === "dark" ? "material-darker" : "default";
        appState.csvEditor.setOption("theme", theme);
    }
}

function destroyCodeMirrorEditor(saveData = true) {
    if (appState.csvEditor) {
        try {
            // Save current content only if requested
            if (saveData) {
                appState.rawData = appState.csvEditor.getValue();
            }
            // Remove the editor instance properly
            const editorElement = appState.csvEditor.getWrapperElement();
            if (editorElement && editorElement.parentNode) {
                editorElement.parentNode.removeChild(editorElement);
            }
        } catch (e) {
            console.log("Error destroying CodeMirror:", e);
        }
        appState.csvEditor = null;
    }
}

// Initialize the application
function init() {
    try {
        // Check if required libraries are loaded
        if (typeof CodeMirror === 'undefined') {
            console.error('CodeMirror is not loaded');
            return;
        }

        // Check React and related libraries
        if (typeof React !== 'undefined' && typeof PropTypes === 'undefined') {
            console.warn('PropTypes is not loaded - this may cause React warnings');
        }

        // Define custom CSV mode and hints for CodeMirror
        defineCustomCSVMode();
        defineCSVHints();

        // Set theme
        document.documentElement.setAttribute("theme", appState.theme);
        const themeBtn = document.getElementById("theme-btn");
        const controlThemeBtn = document.getElementById("control-theme-btn");

        const navThemeContent = appState.theme === "dark"
            ? '<i class="fas fa-sun"></i>'
            : '<i class="fas fa-moon"></i>';

        const controlThemeContent = appState.theme === "dark"
            ? '<i class="fas fa-sun"></i><span>Theme</span>'
            : '<i class="fas fa-moon"></i><span>Theme</span>';

        if (themeBtn) themeBtn.innerHTML = navThemeContent;
        if (controlThemeBtn) controlThemeBtn.innerHTML = controlThemeContent;

        // Navigation control handlers (these are in the fixed nav bar, not in dynamic content)
        const navResetBtn = document.getElementById("reset-btn");
        if (navResetBtn) {
            navResetBtn.addEventListener("click", function () {
                // Add spin animation
                navResetBtn.classList.add("spin");

                // Reset layout
                const grid = document.getElementById("grid-container");
                grid.style.gridTemplateColumns = "1fr 8px 1fr";
                grid.style.gridTemplateRows = "1fr 8px 1fr";

                // Update reset button states after reset
                updateResetButtonStates();

                showToast("Layout reset to default", "info");

                // Remove animation class after animation completes
                setTimeout(() => {
                    navResetBtn.classList.remove("spin");
                }, 800);
            });
        }

        const navThemeBtn = document.getElementById("theme-btn");
        if (navThemeBtn) {
            navThemeBtn.addEventListener("click", toggleTheme);
        }

        const navShowBtn = document.getElementById("nav-show-btn");
        if (navShowBtn) {
            navShowBtn.addEventListener("click", toggleNavControls);
        }

        // Modal click outside to close
        const modal = document.getElementById("modal");
        if (modal) {
            modal.addEventListener("click", function (e) {
                if (e.target === this) {
                    closeModal();
                }
            });
        }

        // Close modal on Escape key
        document.addEventListener("keydown", function (e) {
            if (e.key === "Escape") {
                const modal = document.getElementById("modal");
                if (modal.classList.contains("show")) {
                    closeModal();
                }
            }
        });

        // Setup event listeners
        setupEventListeners();

        // Initialize UI and render current view
        renderCurrentView();

        // Initialize navigation controls visibility
        updateNavControlsVisibility();

        // Initialize driver columns state
        toggleDriverColumns(appState.driversEnabled);

        // Initialize CodeMirror editor if not already initialized
        setTimeout(() => {
            initializeCodeMirrorEditor();
            // Initialize reset button states (disabled by default)
            updateResetButtonStates();
        }, 100);

    } catch (error) {
        console.error('Error initializing application:', error);
        // Show user-friendly error message
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = 'position: fixed; top: 20px; left: 50%; transform: translateX(-50%); background: #ff4444; color: white; padding: 10px; border-radius: 5px; z-index: 9999;';
        errorDiv.textContent = 'Application initialization failed. Please refresh the page.';
        document.body.appendChild(errorDiv);
        setTimeout(() => errorDiv.remove(), 5000);
    }
}

// Layout state tracking
let layoutState = {
    isDefault: true,
    defaultColumns: "1fr 8px 1fr",
    defaultRows: "1fr 8px 1fr"
};

// Function to check if layout is at default state
function isLayoutDefault() {
    const grid = document.getElementById("grid-container");
    if (!grid) return true;

    const currentCols = grid.style.gridTemplateColumns || layoutState.defaultColumns;
    const currentRows = grid.style.gridTemplateRows || layoutState.defaultRows;

    return currentCols === layoutState.defaultColumns &&
        currentRows === layoutState.defaultRows;
}

// Function to update reset button states
function updateResetButtonStates() {
    const isDefault = isLayoutDefault();
    layoutState.isDefault = isDefault;

    // Update both nav-controls reset button and control panel reset button
    const navResetBtn = document.getElementById('reset-btn');
    const controlResetBtn = document.getElementById('control-reset-btn');

    [navResetBtn, controlResetBtn].forEach(btn => {
        if (btn) {
            if (isDefault) {
                btn.disabled = true;
                btn.classList.add('disabled');
            } else {
                btn.disabled = false;
                btn.classList.remove('disabled');
            }
        }
    });
}

// Function to update clear button state
function updateClearButtonState() {
    const clearBtn = document.getElementById('clear-btn');
    if (!clearBtn) return;

    // Check if editor has content or if there's data in appState
    const hasEditorContent = appState.csvEditor && appState.csvEditor.getValue().trim().length > 0;
    const hasData = appState.rawData && appState.rawData.trim().length > 0;
    const hasAllData = appState.allData && appState.allData.length > 0;

    const hasAnyContent = hasEditorContent || hasData || hasAllData;

    if (hasAnyContent) {
        clearBtn.disabled = false;
        clearBtn.classList.remove('disabled');
    } else {
        clearBtn.disabled = true;
        clearBtn.classList.add('disabled');
    }
}

// Resizer setup
function setupResizers() {
    const gridContainer = document.getElementById("grid-container");
    const resizerV = document.querySelector(".resizer-v");
    const resizerH = document.querySelector(".resizer-h");
    const resizerCenter = document.querySelector(".resizer-center");

    console.log("Setting up resizers:", { resizerV, resizerH, resizerCenter });

    if (resizerV) {
        // Remove existing listeners to prevent duplicates
        resizerV.replaceWith(resizerV.cloneNode(true));
        const newResizerV = document.querySelector(".resizer-v");
        newResizerV.addEventListener("mousedown", (e) =>
            handleResizerMouseDown(e, "vertical")
        );
    }

    if (resizerH) {
        resizerH.replaceWith(resizerH.cloneNode(true));
        const newResizerH = document.querySelector(".resizer-h");
        newResizerH.addEventListener("mousedown", (e) =>
            handleResizerMouseDown(e, "horizontal")
        );
    }

    if (resizerCenter) {
        resizerCenter.replaceWith(resizerCenter.cloneNode(true));
        const newResizerCenter = document.querySelector(".resizer-center");
        newResizerCenter.addEventListener("mousedown", (e) =>
            handleResizerMouseDown(e, "both")
        );
    }
}

function handleResizerMouseDown(e, direction) {
    e.preventDefault();
    const gridContainer = document.getElementById("grid-container");
    const startX = e.clientX;
    const startY = e.clientY;

    const startCols = gridContainer.style.gridTemplateColumns || "1fr 8px 1fr";
    const startRows = gridContainer.style.gridTemplateRows || "1fr 8px 1fr";

    // Parse current sizes
    const colParts = startCols.split(" ");
    const rowParts = startRows.split(" ");

    const startCol1 = parseFloat(colParts[0]) || 1;
    const startCol2 = parseFloat(colParts[2]) || 1;
    const startRow1 = parseFloat(rowParts[0]) || 1;
    const startRow2 = parseFloat(rowParts[2]) || 1;

    function handleMouseMove(moveEvent) {
        const deltaX = moveEvent.clientX - startX;
        const deltaY = moveEvent.clientY - startY;

        // Speed multiplier for faster resizing - increase this value for faster movement
        const speedMultiplier = 2.5;

        if (direction === "vertical" || direction === "both") {
            const containerWidth = gridContainer.offsetWidth;
            const deltaRatio = (deltaX / containerWidth) * speedMultiplier;

            let newCol1 = Math.max(0.2, startCol1 + deltaRatio);
            let newCol2 = Math.max(0.2, startCol2 - deltaRatio);

            gridContainer.style.gridTemplateColumns = `${newCol1}fr 8px ${newCol2}fr`;
        }

        if (direction === "horizontal" || direction === "both") {
            const containerHeight = gridContainer.offsetHeight;
            const deltaRatio = (deltaY / containerHeight) * speedMultiplier;

            let newRow1 = Math.max(0.2, startRow1 + deltaRatio);
            let newRow2 = Math.max(0.2, startRow2 - deltaRatio);

            gridContainer.style.gridTemplateRows = `${newRow1}fr 8px ${newRow2}fr`;
        }

        // Update reset button states after layout change
        updateResetButtonStates();
    }

    function handleMouseUp() {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
    }

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    // Set cursor
    if (direction === "vertical") document.body.style.cursor = "col-resize";
    else if (direction === "horizontal")
        document.body.style.cursor = "row-resize";
    else document.body.style.cursor = "move";

    document.body.style.userSelect = "none";
}

// Sorting functionality
let sortState = {
    buffers: { column: null, direction: 'asc' },
    ib: { column: null, direction: 'asc' },
    ob: { column: null, direction: 'asc' },
    atseu: { column: null, direction: 'asc' },
    other: { column: null, direction: 'asc' },
    modal: { column: null, direction: 'asc' }
};

function sortBuffers(column) {
    const buffers = getBuffers();
    if (buffers.length === 0) return;

    // Toggle sort direction
    if (sortState.buffers.column === column) {
        sortState.buffers.direction = sortState.buffers.direction === 'asc' ? 'desc' : 'asc';
    } else {
        sortState.buffers.column = column;
        sortState.buffers.direction = 'asc';
    }

    // Sort the data
    buffers.sort((a, b) => {
        let valueA = a[column] || '';
        let valueB = b[column] || '';

        // Handle numeric values
        if (column === 'recordCount') {
            valueA = parseInt(valueA) || 0;
            valueB = parseInt(valueB) || 0;
        } else {
            valueA = valueA.toString().toLowerCase();
            valueB = valueB.toString().toLowerCase();
        }

        if (sortState.buffers.direction === 'asc') {
            return valueA > valueB ? 1 : valueA < valueB ? -1 : 0;
        } else {
            return valueA < valueB ? 1 : valueA > valueB ? -1 : 0;
        }
    });

    // Save sorted buffers and update display
    saveBuffers(buffers);
    updateBuffersTable();
    updateSortIndicators('buffers', column, sortState.buffers.direction);
}

function sortCategoryTable(category, column) {
    if (!appState.categorizedData[category] || appState.categorizedData[category].length === 0) return;

    // Toggle sort direction
    if (sortState[category].column === column) {
        sortState[category].direction = sortState[category].direction === 'asc' ? 'desc' : 'asc';
    } else {
        sortState[category].column = column;
        sortState[category].direction = 'asc';
    }

    // Sort the data
    appState.categorizedData[category].sort((a, b) => {
        let valueA = a[column] || '';
        let valueB = b[column] || '';

        // Convert to strings for comparison
        valueA = valueA.toString().toLowerCase();
        valueB = valueB.toString().toLowerCase();

        if (sortState[category].direction === 'asc') {
            return valueA > valueB ? 1 : valueA < valueB ? -1 : 0;
        } else {
            return valueA < valueB ? 1 : valueA > valueB ? -1 : 0;
        }
    });

    // Update display
    populateCategoryTables();
    updateSortIndicators(category, column, sortState[category].direction);
}

function sortModalTable(column) {
    if (!appState.currentModalData || !appState.currentModalData.data || appState.currentModalData.data.length === 0) return;

    // Toggle sort direction
    if (sortState.modal.column === column) {
        sortState.modal.direction = sortState.modal.direction === 'asc' ? 'desc' : 'asc';
    } else {
        sortState.modal.column = column;
        sortState.modal.direction = 'asc';
    }

    // Sort the data
    appState.currentModalData.data.sort((a, b) => {
        let valueA = a[column] || '';
        let valueB = b[column] || '';

        // Convert to strings for comparison
        valueA = valueA.toString().toLowerCase();
        valueB = valueB.toString().toLowerCase();

        if (sortState.modal.direction === 'asc') {
            return valueA > valueB ? 1 : valueA < valueB ? -1 : 0;
        } else {
            return valueA < valueB ? 1 : valueA > valueB ? -1 : 0;
        }
    });

    // Update modal display
    const modalTbody = document.getElementById("modal-tbody");
    modalTbody.innerHTML = appState.currentModalData.data
        .map(
            (row) => `
                 <tr>
                     <td class="data-timestamp">${(row.timestamp || "").toUpperCase()}</td>
                     <td class="data-user">${(row.user || "").toUpperCase()}</td>
                     <td class="data-vrid ${row.vrid && row.vrid.includes("0994")
                    ? "vrid-inbound"
                    : "vrid-outbound"
                }">${(row.vrid || "").toUpperCase()}</td>
                     <td class="data-scac">${(row.scac || "").toUpperCase()}</td>
                     <td class="data-traktor">${(row.traktor || "").toUpperCase()}</td>
                     <td class="data-trailer ${row.trailer && (row.trailer.toUpperCase().includes("VS") || row.trailer.toUpperCase().includes("VI"))
                    ? "trailer-vs"
                    : ""
                }">${(row.trailer || "").toUpperCase()}</td>
                 </tr>
             `
        )
        .join("");

    updateSortIndicators('modal', column, sortState.modal.direction);
}

function updateSortIndicators(tableType, column, direction) {
    // Remove existing indicators
    const tables = document.querySelectorAll('table');
    tables.forEach(table => {
        const headers = table.querySelectorAll('th');
        headers.forEach(header => {
            const indicator = header.querySelector('.sort-indicator');
            if (indicator) {
                indicator.remove();
            }
        });
    });

    // Add new indicator
    let targetTable;
    if (tableType === 'buffers') {
        targetTable = document.getElementById('buffers-table');
    } else if (tableType === 'modal') {
        targetTable = document.getElementById('modal-table');
    } else {
        // For category tables
        targetTable = document.querySelector(`#${tableType}-tbody`);
        if (targetTable) {
            targetTable = targetTable.closest('table');
        }
    }

    if (targetTable) {
        const headers = targetTable.querySelectorAll('th');
        headers.forEach(header => {
            if (header.onclick && header.onclick.toString().includes(column)) {
                const indicator = document.createElement('span');
                indicator.className = 'sort-indicator';
                indicator.innerHTML = direction === 'asc' ? ' ▲' : ' ▼';
                header.appendChild(indicator);
            }
        });
    }
}

// Buffer management functions
function updateBufferStats() {
    const buffers = getBuffers();
    const totalBuffersElement = document.getElementById("total-buffers-count");
    const totalRecordsElement = document.getElementById("total-records-count");
    const storageUsedElement = document.getElementById("storage-used");

    if (totalBuffersElement) {
        totalBuffersElement.textContent = buffers.length;
    }

    if (totalRecordsElement) {
        const totalRecords = buffers.reduce((sum, buffer) => sum + (buffer.recordCount || 0), 0);
        totalRecordsElement.textContent = totalRecords.toLocaleString();
    }

    if (storageUsedElement) {
        const totalSize = buffers.reduce((sum, buffer) => sum + (buffer.size || 0), 0);
        const sizeInKB = Math.round(totalSize / 1024);
        storageUsedElement.textContent = `${sizeInKB.toLocaleString()} KB`;
    }

    // Update header badge
    const buffersBadge = document.getElementById("buffers-count-badge");
    if (buffersBadge) {
        buffersBadge.textContent = buffers.length;
    }
}

function clearAllBuffersConfirm() {
    const buffers = getBuffers();
    if (buffers.length === 0) {
        showToast("No buffers to clear", "info");
        if (typeof sendInfoNotification === 'function') {
            sendInfoNotification("No buffers to clear");
        }
        return;
    }

    if (confirm(`Are you sure you want to delete all ${buffers.length} buffers? This action cannot be undone.`)) {
        clearAllBuffers();
        updateBuffersTable();
        showToast(`Cleared ${buffers.length} buffers`, "success");
        if (typeof sendSuccessNotification === 'function') {
            sendSuccessNotification(`All buffers cleared (${buffers.length} buffers deleted)`);
        }
    }
}

function exportAllBuffers() {
    const buffers = getBuffers();
    if (buffers.length === 0) {
        showToast("No buffers to export", "info");
        if (typeof sendWarningNotification === 'function') {
            sendWarningNotification("No buffers available for export");
        }
        return;
    }

    try {
        // Create a combined CSV with all buffers
        let headers = "Buffer_Name,Timestamp,User,VRID,SCAC,Traktor,Trailer";
        if (appState.driversEnabled) {
            headers += ",Driver_Name,Driver_License";
        }
        let combinedCSV = headers + "\n";

        buffers.forEach(buffer => {
            if (buffer.originalData && buffer.originalData.length > 0) {
                buffer.originalData.forEach(row => {
                    let rowData = `"${buffer.name}",${row.timestamp || ''},${row.user || ''},${row.vrid || ''},${row.scac || ''},${row.traktor || ''},${row.trailer || ''}`;
                    if (appState.driversEnabled) {
                        rowData += `,${row.driverName || ''},${row.driverLicense || ''}`;
                    }
                    combinedCSV += rowData + "\n";
                });
            }
        });

        const blob = new Blob([combinedCSV], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", `all_buffers_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }

        showToast(`Exported ${buffers.length} buffers to CSV`, "success");
        if (typeof sendSuccessNotification === 'function') {
            sendSuccessNotification(`All buffers exported: ${buffers.length} buffers combined into single CSV`);
        }
    } catch (error) {
        showToast("Error exporting buffers", "error");
        if (typeof sendErrorNotification === 'function') {
            sendErrorNotification(`Failed to export buffers: ${error.message}`);
        }
    }
}

function setupBufferSearch() {
    const searchInput = document.getElementById("buffer-search");
    if (searchInput) {
        searchInput.addEventListener("input", function (e) {
            const searchTerm = e.target.value.toLowerCase();
            const tableRows = document.querySelectorAll("#buffers-table tbody tr");

            tableRows.forEach(row => {
                if (row.cells.length > 1) { // Skip empty message row
                    const name = row.cells[0].textContent.toLowerCase();
                    const records = row.cells[1].textContent.toLowerCase();
                    const size = row.cells[2].textContent.toLowerCase();

                    const matches = name.includes(searchTerm) ||
                        records.includes(searchTerm) ||
                        size.includes(searchTerm);

                    row.style.display = matches ? "" : "none";
                }
            });
        });
    }
}

// Terminal functionality moved to terminal.js

// Start the application
function toggleTerminalPanel() {
    const terminalPanel = document.getElementById("hidden-terminal-panel");
    const categoriesPanel = document.getElementById("categories-panel");
    const toggleBtn = document.getElementById("terminal-toggle-btn");

    if (terminalPanel && categoriesPanel && toggleBtn) {
        if (terminalPanel.style.display === "none" || !terminalPanel.style.display) {
            // Show terminal - covers full panel
            terminalPanel.style.display = "block";
            categoriesPanel.style.visibility = "hidden";
            toggleBtn.innerHTML = '<i class="fas fa-times" style="color: rgb(var(--rgb-red));"></i><span>Hide</span>';
            toggleBtn.title = "Hide Terminal";

            // Send notification
            if (typeof sendInfoNotification === 'function') {
                sendInfoNotification("Terminal panel opened - full screen");
            }
        } else {
            // Hide terminal - show categories
            terminalPanel.style.display = "none";
            categoriesPanel.style.visibility = "visible";
            toggleBtn.innerHTML = '<i class="fas fa-terminal"></i><span>Terminal</span>';
            toggleBtn.title = "Show Terminal";

            // Send notification
            if (typeof sendInfoNotification === 'function') {
                sendInfoNotification("Terminal panel closed");
            }
        }
    }
}

document.addEventListener("DOMContentLoaded", init);
