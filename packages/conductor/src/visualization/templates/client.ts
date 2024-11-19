import { VisualizationConfig } from "@/types/interfaces/visualization";

export function getClientTemplate(
  host: string,
  config: Required<VisualizationConfig>
): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Graph Visualization</title>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/d3/7.8.5/d3.min.js"></script>
        <style>
          ${getStyles()}
        </style>
      </head>
      <body>
        <div id="info-panel" class="info-panel">
          <h3>Graph Information</h3>
          <div id="graph-stats"></div>
        </div>
        <div id="visualization-container"></div>
        <div id="tooltip" class="tooltip"></div>
        <script>
          ${getGraphRendererCode()}
          ${getClientScript(host, config)}
        </script>
      </body>
    </html>
  `;
}

function getStyles(): string {
  return `
    :root {
      --primary: #2563eb;
      --success: #059669;
      --error: #dc2626;
      --warning: #d97706;
      --background: #ffffff;
      --text: #374151;
      --border: #e5e7eb;
    }

    body {
      margin: 0;
      padding: 0;
      font-family: system-ui, -apple-system, sans-serif;
      overflow: hidden;
    }

    #visualization-container {
      position: fixed;
      width: 100vw;
      height: 100vh;
      overflow: hidden;
    }

    .info-panel {
      position: fixed;
      top: 20px;
      left: 20px;
      background: rgba(255, 255, 255, 0.9);
      padding: 15px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      z-index: 1000;
      max-width: 300px;
    }

    .info-panel h3 {
      margin: 0 0 10px 0;
      color: var(--text);
    }

    .node circle {
      stroke: var(--border);
      stroke-width: 2px;
      transition: all 0.3s ease;
    }

    .node text {
      fill: var(--text);
      font-size: 12px;
      transition: all 0.3s ease;
    }

    .node-type-agent circle { fill: #4338ca; }
    .node-type-tool circle { fill: #0891b2; }
    .node-type-llm circle { fill: #7c3aed; }
    .node-type-data circle { fill: #0d9488; }
    .node-type-system circle { fill: #6366f1; }

    .edge path {
      stroke: var(--border);
      stroke-width: 2px;
      fill: none;
      transition: all 0.3s ease;
    }

    .edge-type-flow path { stroke: #6366f1; }
    .edge-type-data path { stroke: #0d9488; }
    .edge-type-control path { stroke: #7c3aed; }

    .tooltip {
      position: absolute;
      padding: 12px;
      background: rgba(17, 24, 39, 0.95);
      color: white;
      border-radius: 6px;
      font-size: 12px;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.2s ease;
      z-index: 1000;
      max-width: 300px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .tooltip-content {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .tooltip-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      padding-bottom: 6px;
      margin-bottom: 6px;
    }

    .tooltip-type {
      font-size: 11px;
      padding: 2px 6px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 4px;
      margin-left: 8px;
    }

    .tooltip-status {
      font-size: 11px;
      margin-bottom: 4px;
    }

    .tooltip-data, .tooltip-metadata {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .tooltip-data-item, .tooltip-metadata-item {
      display: flex;
      justify-content: space-between;
      gap: 8px;
      font-size: 11px;
    }

    .tooltip-label {
      color: rgba(255, 255, 255, 0.7);
      white-space: nowrap;
    }

    .tooltip-value {
      color: white;
      text-align: right;
      word-break: break-word;
    }

    /* Status colors */
    .status-running { color: var(--primary); }
    .status-completed { color: var(--success); }
    .status-error { color: var(--error); }
    .status-pending { color: var(--warning); }

    .node:hover circle {
      filter: brightness(1.2);
      stroke-width: 3px;
    }

    .edge:hover path {
      stroke-width: 3px;
      filter: brightness(1.2);
    }

    .status-running { fill: var(--primary); }
    .status-completed { fill: var(--success); }
    .status-error { fill: var(--error); }
    .stats-section {
      margin-bottom: 15px;
    }

    .stats-header {
      font-weight: bold;
      margin-bottom: 5px;
      color: var(--text);
      border-bottom: 1px solid var(--border);
      padding-bottom: 3px;
    }

    .stat-item {
      display: flex;
      justify-content: space-between;
      margin: 3px 0;
    }

    .stat-label {
      color: var(--text);
      opacity: 0.8;
    }

    .stat-value {
      font-weight: 500;
    }

    .stats-timestamp {
      font-size: 0.8em;
      color: var(--text);
      opacity: 0.6;
      margin-top: 10px;
      text-align: right;
    }
  `;
}

function getGraphRendererCode(): string {
  return `
    class GraphRenderer {
      constructor(container, config) {
        this.container = container;
        this.config = config;
        this.simulation = null;
        this.zoom = null;
        this.transform = null;
        this.currentGraph = { nodes: [], edges: [] };
        this.nodeElements = null;
        this.edgeElements = null;
        this.isDragging = false;
        this.initialize();
      }

      initialize() {
        const { width, height } = this.container.getBoundingClientRect();
        
        // Initialize SVG with better defaults
        this.svg = d3.select(this.container)
          .append('svg')
          .attr('width', width)
          .attr('height', height)
          .attr('class', 'graph-visualization')
          .style('background-color', '#fafafa');

        // Create main group for zooming
        this.mainGroup = this.svg.append('g')
          .attr('class', 'main-group');

        // Create groups for edges and nodes
        this.edgeGroup = this.mainGroup.append('g').attr('class', 'edge-group');
        this.nodeGroup = this.mainGroup.append('g').attr('class', 'node-group');

        // Enhanced zoom behavior
        this.zoom = d3.zoom()
          .scaleExtent([0.1, 4])
          .on('zoom', (event) => {
            this.transform = event.transform;
            this.mainGroup.attr('transform', event.transform);
          });

        this.svg.call(this.zoom);

        // Initialize markers and simulation
        this.initializeMarkers();
        this.initializeSimulation();

        // Setup resize handler
        window.addEventListener('resize', this.handleResize.bind(this));
      }

      initializeMarkers() {
        const defs = this.svg.append('defs');
        
        // Create markers for different edge types
        ['flow', 'data', 'control'].forEach(type => {
          defs.append('marker')
            .attr('id', \`arrow-\${type}\`)
            .attr('viewBox', '-10 -5 10 10')
            .attr('refX', 25) // Adjusted to better position arrow
            .attr('refY', 0)
            .attr('markerWidth', 6)
            .attr('markerHeight', 6)
            .attr('orient', 'auto')
            .append('path')
            .attr('d', 'M -10 -5 L 0 0 L -10 5 Z')
            .attr('class', \`marker-\${type}\`);
        });
      }

      initializeSimulation() {
        // Enhanced force simulation with better defaults
        this.simulation = d3.forceSimulation()
          .force('link', d3.forceLink().id(d => d.id)
            .distance(150)
            .strength(1))
          .force('charge', d3.forceManyBody()
            .strength(-1000)
            .distanceMax(500))
          .force('center', d3.forceCenter())
          .force('collision', d3.forceCollide().radius(60))
          .force('x', d3.forceX())
          .force('y', d3.forceY())
          .alphaDecay(0.05)
          .velocityDecay(0.4)
          .on('tick', () => this.tick());

        this.isSimulationActive = true;
      }

      render(graph) {
        const { width, height } = this.container.getBoundingClientRect();
        
        // Update force center
        this.simulation.force('center')
          .x(width / 2)
          .y(height / 2);

        // Process edges first
        this.edgeElements = this.edgeGroup
          .selectAll('.edge')
          .data(graph.edges, d => d.id)
          .join(
            enter => this.createEdges(enter),
            update => this.updateEdges(update),
            exit => this.removeEdges(exit)
          );

        // Process nodes
        this.nodeElements = this.nodeGroup
          .selectAll('.node')
          .data(graph.nodes, d => d.id)
          .join(
            enter => this.createNodes(enter),
            update => this.updateNodes(update),
            exit => this.removeNodes(exit)
          );

        // Update simulation
        this.simulation.nodes(graph.nodes);
        this.simulation.force('link').links(graph.edges);

        // Reheat simulation
        if (this.isSimulationActive) {
          this.simulation.alpha(1).restart();
        }

        this.currentGraph = graph;
      }

      createEdges(enter) {
        const edges = enter.append('g')
          .attr('class', d => \`edge edge-type-\${d.type}\`)
          .style('opacity', 0);

        // Edge path with marker
        edges.append('path')
          .attr('marker-end', d => \`url(#arrow-\${d.type})\`)
          .attr('class', 'edge-path');

        // Edge label
        edges.append('text')
          .attr('class', 'edge-label')
          .text(d => d.label || '')
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'text-after-edge');

        // Setup edge interactions
        edges.on('mouseover', (event, d) => {
          d3.select(event.currentTarget)
            .select('path')
            .style('stroke-width', '3px')
            .style('filter', 'brightness(1.2)');

          const tooltip = d3.select('#tooltip');
          tooltip
            .html(this.formatEdgeTooltip(d))
            .style('left', (event.pageX + 10) + 'px')
            .style('top', (event.pageY - 10) + 'px')
            .style('opacity', 1);
        })
        .on('mousemove', (event) => {
          d3.select('#tooltip')
            .style('left', (event.pageX + 10) + 'px')
            .style('top', (event.pageY - 10) + 'px');
        })
        .on('mouseout', (event) => {
          d3.select(event.currentTarget)
            .select('path')
            .style('stroke-width', null)
            .style('filter', null);
          
          d3.select('#tooltip').style('opacity', 0);
        });

        edges.transition()
          .duration(500)
          .style('opacity', 1);

        return edges;
      }

      createNodes(enter) {
        const nodes = enter.append('g')
          .attr('class', d => \`node node-type-\${d.type}\`)
          .style('opacity', 0)
          .call(this.dragBehavior());

        // Node circle
        nodes.append('circle')
          .attr('r', 0)
          .attr('class', d => \`status-\${d.status || 'pending'}\`);

        // Node label
        nodes.append('text')
          .attr('dy', 25)
          .attr('text-anchor', 'middle')
          .text(d => d.label || d.id);

        // Node icon
        nodes.each(function(d) {
          if (d.icon) {
            d3.select(this)
              .append('text')
              .attr('class', 'node-icon')
              .attr('dy', 5)
              .attr('text-anchor', 'middle')
              .text(d.icon);
          }
        });

        // Setup node interactions
        nodes
          .on('mouseover', (event, d) => {
            // Highlight node
            d3.select(event.currentTarget)
              .select('circle')
              .style('stroke-width', '3px')
              .style('filter', 'brightness(1.2)');

            // Highlight connected edges
            this.edgeElements
              .style('opacity', e => 
                e.source.id === d.id || e.target.id === d.id ? 1 : 0.2);

            // Show tooltip
            const tooltip = d3.select('#tooltip');
            tooltip
              .html(this.formatNodeTooltip(d))
              .style('left', (event.pageX + 10) + 'px')
              .style('top', (event.pageY - 10) + 'px')
              .style('opacity', 1);
          })
          .on('mousemove', (event) => {
            d3.select('#tooltip')
              .style('left', (event.pageX + 10) + 'px')
              .style('top', (event.pageY - 10) + 'px');
          })
          .on('mouseout', (event) => {
            d3.select(event.currentTarget)
              .select('circle')
              .style('stroke-width', null)
              .style('filter', null);

            this.edgeElements.style('opacity', 1);
            d3.select('#tooltip').style('opacity', 0);
          })
          .on('click', (event, d) => {
            this.emit('nodeClick', d);
          });

        // Animate node entrance
        nodes.select('circle')
          .transition()
          .duration(500)
          .attr('r', d => d.size || 20);

        nodes.transition()
          .duration(500)
          .style('opacity', 1);

        return nodes;
      }

      formatNodeTooltip(data) {
        let content = \`<div class="tooltip-content">
          <div class="tooltip-header">
            <strong>\${data.label || data.id}</strong>
            <span class="tooltip-type">\${data.type}</span>
          </div>\`;

        if (data.status) {
          content += \`
            <div class="tooltip-status">
              Status: <span class="status-\${data.status}">\${data.status}</span>
            </div>\`;
        }

        if (data.data && Object.keys(data.data).length > 0) {
          content += \`<div class="tooltip-data">\`;
          for (const [key, value] of Object.entries(data.data)) {
            if (key === 'createdAt') continue;
            const displayValue = typeof value === 'object' 
              ? JSON.stringify(value)
              : value;
            content += \`
              <div class="tooltip-data-item">
                <span class="tooltip-label">\${key}:</span>
                <span class="tooltip-value">\${displayValue}</span>
              </div>\`;
          }
          content += \`</div>\`;
        }

        content += \`</div>\`;
        return content;
      }

      formatEdgeTooltip(data) {
        let content = \`<div class="tooltip-content">
          <div class="tooltip-header">
            <strong>\${data.label || 'Edge'}</strong>
            <span class="tooltip-type">\${data.type}</span>
          </div>
          <div class="tooltip-data">
            <div class="tooltip-data-item">
              <span class="tooltip-label">From:</span>
              <span class="tooltip-value">\${data.source.label || data.source.id}</span>
            </div>
            <div class="tooltip-data-item">
              <span class="tooltip-label">To:</span>
              <span class="tooltip-value">\${data.target.label || data.target.id}</span>
            </div>
          </div>\`;

        if (data.data && Object.keys(data.data).length > 0) {
          content += \`<div class="tooltip-data">\`;
          for (const [key, value] of Object.entries(data.data)) {
            if (key === 'createdAt') continue;
            content += \`
              <div class="tooltip-data-item">
                <span class="tooltip-label">\${key}:</span>
                <span class="tooltip-value">\${value}</span>
              </div>\`;
          }
          content += \`</div>\`;
        }

        content += \`</div>\`;
        return content;
      }

      updateEdges(update) {
        update.select('path')
          .attr('marker-end', d => \`url(#arrow-\${d.type})\`);

        update.select('text')
          .text(d => d.label || '');

        return update;
      }

      updateNodes(update) {
        update.attr('class', d => \`node node-type-\${d.type}\`);
        
        update.select('circle')
          .attr('class', d => \`status-\${d.status || 'pending'}\`)
          .transition()
          .duration(300)
          .attr('r', d => d.size || 20);

        update.select('text')
          .text(d => d.label || d.id);

        return update;
      }

      removeEdges(exit) {
        return exit.transition()
          .duration(300)
          .style('opacity', 0)
          .remove();
      }

      removeNodes(exit) {
        return exit.transition()
          .duration(300)
          .style('opacity', 0)
          .remove();
      }

      tick() {
        // Update edge positions with curved paths
        this.edgeElements?.select('path')
          .attr('d', d => {
            const sourceX = d.source.x;
            const sourceY = d.source.y;
            const targetX = d.target.x;
            const targetY = d.target.y;

            // Calculate control points for a smooth curve
            const dx = targetX - sourceX;
            const dy = targetY - sourceY;
            const dr = Math.sqrt(dx * dx + dy * dy);

            return \`M \${sourceX},\${sourceY} 
                    A \${dr},\${dr} 0 0,1 \${targetX},\${targetY}\`;
          });

        // Update edge label positions
        this.edgeElements?.select('text')
          .attr('transform', d => {
            const midX = (d.source.x + d.target.x) / 2;
            const midY = (d.source.y + d.target.y) / 2;
            return \`translate(\${midX},\${midY})\`;
          });

        // Update node positions
        this.nodeElements?.attr('transform', d => \`translate(\${d.x},\${d.y})\`);
      }

      dragBehavior() {
        return d3.drag()
          .on('start', (event, d) => {
            if (!event.active) this.simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
            this.isDragging = true;
          })
          .on('drag', (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on('end', (event, d) => {
            if (!event.active) this.simulation.alphaTarget(0);
            if (!d.fixed) {
              d.fx = null;
              d.fy = null;
            }
            this.isDragging = false;
          });
      }

      handleResize() {
        const { width, height } = this.container.getBoundingClientRect();
        
        this.svg
          .attr('width', width)
          .attr('height', height);

        this.simulation.force('center')
          .x(width / 2)
          .y(height / 2);

    if (this.isSimulationActive) {
          this.simulation.alpha(1).restart();
        }
      }
 zoomTo(scale = 1, duration = 500) {
        this.svg.transition()
          .duration(duration)
          .call(
            this.zoom.transform,
            d3.zoomIdentity.translate(0, 0).scale(scale)
          );
      }

      fitView(padding = 50) {
        const bounds = this.mainGroup.node().getBBox();
        const { width, height } = this.container.getBoundingClientRect();
        
        const scale = 0.9 * Math.min(
          width / (bounds.width + padding * 2),
          height / (bounds.height + padding * 2)
        );
        
        const tx = (-bounds.x * scale) + (width - bounds.width * scale) / 2;
        const ty = (-bounds.y * scale) + (height - bounds.height * scale) / 2;

        this.svg.transition()
          .duration(750)
          .call(
            this.zoom.transform,
            d3.zoomIdentity.translate(tx, ty).scale(scale)
          );
      }

      centerNode(nodeId) {
        const node = this.currentGraph.nodes.find(n => n.id === nodeId);
        if (!node) return;

        const { width, height } = this.container.getBoundingClientRect();
        const scale = this.transform ? this.transform.k : 1;

        const tx = width / 2 - node.x * scale;
        const ty = height / 2 - node.y * scale;

        this.svg.transition()
          .duration(750)
          .call(
            this.zoom.transform,
            d3.zoomIdentity.translate(tx, ty).scale(scale)
          );
      }

      toggleSimulation() {
        this.isSimulationActive = !this.isSimulationActive;
        if (this.isSimulationActive) {
          this.simulation.restart();
        } else {
          this.simulation.stop();
        }
      }

      highlightNode(nodeId, duration = 1000) {
        const node = this.nodeElements.filter(d => d.id === nodeId);
        
        node.select('circle')
          .transition()
          .duration(duration / 2)
          .attr('r', d => (d.size || 20) * 1.3)
          .transition()
          .duration(duration / 2)
          .attr('r', d => d.size || 20);
      }

      zoomIn(factor = 1.2) {
        this.svg.transition()
          .duration(300)
          .call(
            this.zoom.scaleBy,
            factor
          );
      }

      zoomOut(factor = 0.8) {
        this.svg.transition()
          .duration(300)
          .call(
            this.zoom.scaleBy,
            factor
          );
      }

      resetZoom() {
        this.svg.transition()
          .duration(300)
          .call(
            this.zoom.transform,
            d3.zoomIdentity
          );
      }

      pauseSimulation() {
        this.simulation.stop();
        this.isSimulationActive = false;
      }

      resumeSimulation() {
        this.simulation.restart();
        this.isSimulationActive = true;
      }

      emit(event, data) {
        if (window.visualization) {
          window.visualization.handleEvent(event, data);
        }
      }

      destroy() {
        if (this.simulation) {
          this.simulation.stop();
        }
        if (this.svg) {
          this.svg.remove();
        }
        window.removeEventListener('resize', this.handleResize);
      }
    }
  `;
}

function getClientScript(
  host: string,
  config: Required<VisualizationConfig>
): string {
  return `
    class ClientRenderer {
      constructor() {
        this.ws = new WebSocket('ws://' + '${host}');
        this.setupWebSocket();
        this.config = ${JSON.stringify(config)};
        this.initialized = false;
        this.pendingUpdates = [];
      }

      setupWebSocket() {
        this.ws.onopen = () => {
          console.log('Connected to visualization server');
        };

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('Error processing message:', error);
          }
        };

        this.ws.onclose = () => {
          console.log('Disconnected from server');
          // Try to reconnect after a delay
          setTimeout(() => {
            console.log('Attempting to reconnect...');
            window.location.reload();
          }, 5000);
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
        };
      }

      handleMessage(message) {
        switch (message.type) {
          case 'init':
            this.initializeVisualization(message.payload);
            break;
          case 'graph-update':
            this.handleGraphUpdate(message.payload);
            break;
          case 'node-update':
            this.handleNodeUpdate(message.payload);
            break;
          case 'command':
            this.handleCommand(message.payload);
            break;
          default:
            console.warn('Unknown message type:', message.type);
        }
      }

      initializeVisualization(payload) {
        if (this.initialized) return;
        
        const container = document.getElementById('visualization-container');
        this.renderer = new GraphRenderer(container, this.config);
        
        // Process any pending updates
        while (this.pendingUpdates.length > 0) {
          const update = this.pendingUpdates.shift();
          this.handleGraphUpdate(update);
        }
        
        if (payload.graph) {
          this.renderer.render(payload.graph);
        }
        
        this.setupKeyboardShortcuts();
        this.initialized = true;
      }

      handleGraphUpdate(payload) {
        if (!this.initialized) {
          this.pendingUpdates.push(payload);
          return;
        }

        requestAnimationFrame(() => {
          this.renderer.render(payload.graph);
          this.updateMetadata(payload.metadata);
        });
      }

      handleNodeUpdate(payload) {
        if (!this.initialized) return;

        requestAnimationFrame(() => {
          const node = this.renderer.currentGraph.nodes.find(n => n.id === payload.nodeId);
          if (node) {
            Object.assign(node, payload.updates);
            this.renderer.updatePositions();
            this.updateMetadata(payload.metadata);
          }
        });
      }

      handleCommand(payload) {
        if (!this.initialized) return;

        switch (payload.command) {
          case 'fit':
            this.renderer.fitView();
            break;
          case 'center':
            this.renderer.centerView();
            break;
          case 'clear':
            this.renderer.clear();
            break;
          default:
            console.warn('Unknown command:', payload.command);
        }
      }

      updateMetadata(metadata) {
        if (!metadata) return;

        const statsContainer = document.getElementById('graph-stats');
        if (!statsContainer) return;

        const formatCount = (type, counts) => {
          return Object.entries(counts)
            .map(([key, count]) => \`
              <div class="stat-item">
                <span class="stat-label">\${key}:</span>
                <span class="stat-value">\${count}</span>
              </div>
            \`)
            .join('');
        };

        statsContainer.innerHTML = \`
          <div class="stats-section">
            <div class="stats-header">Graph Overview</div>
            <div class="stat-item">
              <span class="stat-label">Total Nodes:</span>
              <span class="stat-value">\${metadata.totalNodes}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Total Edges:</span>
              <span class="stat-value">\${metadata.edges?.length || 0}</span>
            </div>
          </div>
          
          <div class="stats-section">
            <div class="stats-header">Node Types</div>
            \${formatCount('Type', metadata.nodesByType)}
          </div>
          
          <div class="stats-section">
            <div class="stats-header">Node Status</div>
            \${formatCount('Status', metadata.nodesByStatus)}
          </div>
          
          <div class="stats-timestamp">
            Last Updated: \${new Date().toLocaleTimeString()}
          </div>
        \`;
      }

      setupKeyboardShortcuts() {
        document.addEventListener('keydown', (event) => {
          if (event.ctrlKey || event.metaKey) {
            switch (event.key.toLowerCase()) {
              case 'f':
                event.preventDefault();
                this.renderer.fitView();
                break;
              case '0':
                event.preventDefault();
                this.renderer.resetZoom();
                break;
              case '+':
              case '=':
                event.preventDefault();
                this.renderer.zoomIn();
                break;
              case '-':
                event.preventDefault();
                this.renderer.zoomOut();
                break;
            }
          }
          
          // Space to pause/resume simulation
          if (event.code === 'Space') {
            event.preventDefault();
            this.renderer.toggleSimulation();
          }
        });
      }

      handleEvent(event, data) {
        if (this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({
            type: event,
            payload: data
          }));
        } else {
          console.warn('WebSocket is not connected. Event not sent:', event);
        }
      }

      destroy() {
        if (this.renderer) {
          this.renderer.destroy();
        }
        if (this.ws) {
          this.ws.close();
        }
      }
    }

    // Initialize visualization when document is ready
    let visualization;
    document.addEventListener('DOMContentLoaded', () => {
      visualization = new ClientRenderer();
      
      // Handle page unload
      window.addEventListener('beforeunload', () => {
        if (visualization) {
          visualization.destroy();
        }
      });
    });

    // Expose visualization instance globally
    window.visualization = visualization;
  `;
}
