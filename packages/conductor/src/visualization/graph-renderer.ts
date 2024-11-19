import * as d3 from "d3";
import {
  GraphNode,
  GraphEdge,
  Graph,
  VisualizationConfig,
  Layout,
} from "@/types/interfaces/visualization";

export class GraphRenderer {
  private readonly container: HTMLElement;
  private svg!: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  private mainGroup!: d3.Selection<SVGGElement, unknown, null, undefined>;
  private simulation!: d3.Simulation<GraphNode, GraphEdge>;
  private nodes!: d3.Selection<SVGGElement, GraphNode, SVGGElement, unknown>;
  private edges!: d3.Selection<SVGGElement, GraphEdge, SVGGElement, unknown>;
  private readonly config: Required<VisualizationConfig>;
  private currentLayout?: Layout;

  constructor(containerId: string, config: Required<VisualizationConfig>) {
    const container = document.getElementById(containerId);
    if (!container) throw new Error("Container not found");
    this.container = container;
    this.config = config;
    this.initialize();
  }

  private initialize(): void {
    this.setupSVG();
    this.setupSimulation();
    this.setupEventListeners();
  }

  private setupSVG(): void {
    const { width, height } = this.container.getBoundingClientRect();

    this.svg = d3
      .select(this.container)
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("class", `theme-${this.config.theme}`);

    // Create defs for markers and filters
    const defs = this.svg.append("defs");
    this.createMarkers(defs);
    this.createFilters(defs);

    this.mainGroup = this.svg.append("g").attr("class", "main-group");

    if (this.config.interactive) {
      this.setupZoom();
    }
  }

  private createMarkers(
    defs: d3.Selection<SVGDefsElement, unknown, null, undefined>
  ): void {
    const types = ["flow", "data", "control"];
    types.forEach((type) => {
      defs
        .append("marker")
        .attr("id", `arrow-${type}`)
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 20)
        .attr("refY", 0)
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("orient", "auto")
        .append("path")
        .attr("d", "M0,-5L10,0L0,5")
        .attr("class", `arrow-${type}`);
    });
  }

  private createFilters(
    defs: d3.Selection<SVGDefsElement, unknown, null, undefined>
  ): void {
    const filter = defs
      .append("filter")
      .attr("id", "glow")
      .attr("x", "-50%")
      .attr("y", "-50%")
      .attr("width", "200%")
      .attr("height", "200%");

    filter
      .append("feGaussianBlur")
      .attr("stdDeviation", "3")
      .attr("result", "coloredBlur");

    const feMerge = filter.append("feMerge");
    feMerge.append("feMergeNode").attr("in", "coloredBlur");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");
  }

  private setupSimulation(): void {
    const { width, height } = this.container.getBoundingClientRect();

    this.simulation = d3
      .forceSimulation<GraphNode>()
      .force(
        "link",
        d3.forceLink<GraphNode, GraphEdge>().id((d) => d.id)
      )
      .force("charge", d3.forceManyBody().strength(-1000))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .on("tick", () => this.handleTick());
  }

  private setupZoom(): void {
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        this.mainGroup.attr("transform", event.transform.toString());
      });

    this.svg.call(zoom);
  }

  private setupEventListeners(): void {
    window.addEventListener("resize", this.handleResize.bind(this));
  }

  private handleResize(): void {
    const { width, height } = this.container.getBoundingClientRect();
    this.svg.attr("width", width).attr("height", height);

    if (this.config.fitView) {
      this.fitViewToContent();
    }
  }

  private handleTick(): void {
    // Update edge positions
    this.edges
      .select("path")
      .attr("d", (d: GraphEdge) => this.calculateEdgePath(d));

    // Update node positions
    this.nodes.attr(
      "transform",
      (d: GraphNode) => `translate(${d.x || 0},${d.y || 0})`
    );

    // Update edge labels
    this.edges.select("text").attr("transform", (d: GraphEdge) => {
      const source = d.source as GraphNode;
      const target = d.target as GraphNode;
      return `translate(${(source.x! + target.x!) / 2},${(source.y! + target.y!) / 2})`;
    });
  }

  private calculateEdgePath(edge: GraphEdge): string {
    const source = edge.source as GraphNode;
    const target = edge.target as GraphNode;

    const dx = target.x! - source.x!;
    const dy = target.y! - source.y!;
    const dr = Math.sqrt(dx * dx + dy * dy);

    return `M${source.x},${source.y}A${dr},${dr} 0 0,1 ${target.x},${target.y}`;
  }

  public render(graph: Graph): void {
    // Clear existing elements
    this.mainGroup.selectAll("*").remove();

    const edgeGroup = this.mainGroup.append("g").attr("class", "edges");
    const nodeGroup = this.mainGroup.append("g").attr("class", "nodes");

    this.renderEdges(graph.edges, edgeGroup);
    this.renderNodes(graph.nodes, nodeGroup);

    // Update simulation with new data
    this.simulation.nodes(graph.nodes).force(
      "link",
      d3
        .forceLink<GraphNode, GraphEdge>(graph.edges)
        .id((d) => d.id)
        .distance(100)
        .strength(0.5)
    );

    if (this.config.autoLayout) {
      this.simulation.alpha(1).restart();
    }

    // Fit view after initial render
    if (this.config.fitView) {
      setTimeout(() => this.fitViewToContent(), 100);
    }
  }

  private renderNodes(
    nodes: GraphNode[],
    container: d3.Selection<SVGGElement, unknown, null, undefined>
  ): void {
    this.nodes = container
      .selectAll<SVGGElement, GraphNode>(".node")
      .data(nodes, (d) => d.id)
      .join(
        (enter) => this.createNodes(enter),
        (update) => this.updateNodes(update),
        (exit) => this.removeNodes(exit)
      );
  }

  private createNodes(
    enter: d3.Selection<d3.EnterElement, GraphNode, SVGGElement, unknown>
  ): d3.Selection<SVGGElement, GraphNode, SVGGElement, unknown> {
    const nodeGroups = enter
      .append("g")
      .attr("class", (d) => `node node-type-${d.type}`)
      .call(this.setupDragBehavior());

    // Add circle
    nodeGroups.append("circle").attr("r", 20).attr("class", "node-circle");

    // Add label
    nodeGroups
      .append("text")
      .attr("dy", 30)
      .attr("text-anchor", "middle")
      .attr("class", "node-label")
      .text((d) => d.label);

    // Add status indicator
    nodeGroups
      .append("circle")
      .attr("class", "status-indicator")
      .attr("r", 5)
      .attr("cy", -20);

    return nodeGroups;
  }

  private updateNodes(
    update: d3.Selection<SVGGElement, GraphNode, SVGGElement, unknown>
  ): d3.Selection<SVGGElement, GraphNode, SVGGElement, unknown> {
    update.attr("class", (d) => `node node-type-${d.type}`);

    update.select(".node-label").text((d) => d.label);

    update
      .select(".status-indicator")
      .attr("class", (d) => `status-indicator status-${d.status}`);

    return update;
  }

  private removeNodes(
    exit: d3.Selection<SVGGElement, GraphNode, SVGGElement, unknown>
  ): void {
    exit.transition().duration(300).style("opacity", 0).remove();
  }

  private setupDragBehavior() {
    return d3
      .drag<SVGGElement, GraphNode>()
      .on("start", (event, d) => {
        if (!event.active) this.simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on("drag", (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on("end", (event, d) => {
        if (!event.active) this.simulation.alphaTarget(0);
      });
  }

  private renderEdges(
    edges: GraphEdge[],
    container: d3.Selection<SVGGElement, unknown, null, undefined>
  ): void {
    this.edges = container
      .selectAll<SVGGElement, GraphEdge>(".edge")
      .data(edges, (d) => d.id)
      .join(
        (enter) => this.createEdges(enter),
        (update) => this.updateEdges(update),
        (exit) => this.removeEdges(exit)
      );
  }

  private createEdges(
    enter: d3.Selection<d3.EnterElement, GraphEdge, SVGGElement, unknown>
  ): d3.Selection<SVGGElement, GraphEdge, SVGGElement, unknown> {
    const edgeGroups = enter
      .append("g")
      .attr("class", (d) => `edge edge-type-${d.type}`);

    edgeGroups
      .append("path")
      .attr("class", "edge-path")
      .attr("marker-end", (d) => `url(#arrow-${d.type})`);

    edgeGroups
      .append("text")
      .attr("class", "edge-label")
      .attr("text-anchor", "middle")
      .text((d) => d.label || "");

    return edgeGroups;
  }

  private updateEdges(
    update: d3.Selection<SVGGElement, GraphEdge, SVGGElement, unknown>
  ): d3.Selection<SVGGElement, GraphEdge, SVGGElement, unknown> {
    update.attr("class", (d) => `edge edge-type-${d.type}`);

    update.select(".edge-label").text((d) => d.label || "");

    return update;
  }

  private removeEdges(
    exit: d3.Selection<SVGGElement, GraphEdge, SVGGElement, unknown>
  ): void {
    exit.transition().duration(300).style("opacity", 0).remove();
  }

  public fitViewToContent(): void {
    const bounds = this.mainGroup.node()?.getBBox();
    if (!bounds) return;

    const { width, height } = this.container.getBoundingClientRect();
    const scale = Math.min(width / bounds.width, height / bounds.height) * 0.9;

    const transform = d3.zoomIdentity
      .translate(
        width / 2 - (bounds.x + bounds.width / 2) * scale,
        height / 2 - (bounds.y + bounds.height / 2) * scale
      )
      .scale(scale);

    this.svg
      .transition()
      .duration(750)
      .call(d3.zoom<SVGSVGElement, unknown>().transform as any, transform);
  }

  public dispose(): void {
    this.simulation.stop();
    this.svg.remove();
    window.removeEventListener("resize", this.handleResize);
  }
}
