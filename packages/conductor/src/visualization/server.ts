import { WebSocket, WebSocketServer } from "ws";
import { createServer, Server } from "http";
import { EventEmitter } from "events";
import { getClientTemplate } from "./templates/client";
import { DEFAULT_CONFIG } from "./constants";
import {
  Graph,
  GraphNode,
  GraphEdge,
  VisualizationConfig,
} from "@/types/interfaces/visualization";

export class VizServer extends EventEmitter {
  private readonly wss: WebSocketServer;
  private readonly httpServer: Server;
  private readonly clients: Set<WebSocket> = new Set();
  private currentGraph: Graph = { nodes: [], edges: [] };
  private readonly config: Required<VisualizationConfig>;

  constructor(port: number = 3000, config: Partial<VisualizationConfig> = {}) {
    super();
    this.config = {
      theme: "light",
      fitView: true,
      ...DEFAULT_CONFIG,
      ...config,
    };

    this.httpServer = createServer((req, res) => {
      if (req.url === "/") {
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(this.getClientHtml());
      }
    });

    this.wss = new WebSocketServer({ server: this.httpServer });
    this.setupWebSocket();
    this.httpServer.listen(port);
  }

  private setupWebSocket(): void {
    this.wss.on("connection", (ws: WebSocket) => {
      this.clients.add(ws);

      this.sendToClient(ws, {
        type: "init",
        payload: {
          graph: this.currentGraph,
          metadata: this.getGraphMetadata(),
        },
      });

      ws.on("message", (message: string) => {
        try {
          const data = JSON.parse(message);
          this.handleClientMessage(data, ws);
        } catch (error) {
          console.error("Error handling message:", error);
        }
      });

      ws.on("close", () => {
        this.clients.delete(ws);
      });
    });
  }

  private handleClientMessage(message: any, client: WebSocket): void {
    switch (message.type) {
      case "nodeClick":
        this.emit("nodeClick", message.payload);
        break;
      case "edgeClick":
        this.emit("edgeClick", message.payload);
        break;
    }
  }

  private getGraphMetadata() {
    return {
      timestamp: Date.now(),
      totalNodes: this.currentGraph.nodes.length,
      nodesByType: this.getNodesByType(),
      nodesByStatus: this.getNodesByStatus(),
    };
  }

  private getNodesByType(): Record<string, number> {
    return this.currentGraph.nodes.reduce(
      (acc, node) => {
        acc[node.type] = (acc[node.type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
  }

  private getNodesByStatus(): Record<string, number> {
    return this.currentGraph.nodes.reduce(
      (acc, node) => {
        const status = node.status || "pending";
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
  }

  private sendToClient(client: WebSocket, message: any): void {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  }

  private broadcast(message: any): void {
    const messageStr = JSON.stringify(message);
    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(messageStr);
      }
    });
  }

  private getClientHtml(): string {
    const address = this.httpServer.address() as {
      address: string;
      port: number;
    } | null;
    if (!address) throw new Error("Server address is not available.");
    const host = address.address === "::" ? "localhost" : address.address;
    return getClientTemplate(`${host}:${address.port}`, this.config);
  }

  private processGraph(graph: Graph): Graph {
    const processedGraph = JSON.parse(JSON.stringify(graph));

    processedGraph.nodes = processedGraph.nodes.map((node: GraphNode) => ({
      ...node,
      // Only set initial positions if not already set
      x: node.x ?? Math.random() * 800, // Random initial position
      y: node.y ?? Math.random() * 600,
      // Maintain fixed positions for pinned nodes
      fx: node.fixed ? (node.x ?? 400) : undefined,
      fy: node.fixed ? (node.y ?? 300) : undefined,
      data: {
        ...node.data,
        createdAt: node.data?.createdAt || new Date().toISOString(),
      },
    }));

    // Process edges - ensure proper source/target references
    processedGraph.edges = processedGraph.edges.map((edge: GraphEdge) => ({
      ...edge,
      id: edge.id,
      source: typeof edge.source === "string" ? edge.source : edge.source.id,
      target: typeof edge.target === "string" ? edge.target : edge.target.id,
      data: {
        ...edge.data,
        createdAt: edge.data?.createdAt || new Date().toISOString(),
        type: edge.type,
      },
    }));

    return processedGraph;
  }

  public pinNode(nodeId: string, position?: { x: number; y: number }): void {
    const node = this.currentGraph.nodes.find((n) => n.id === nodeId);
    if (node) {
      node.fixed = true;
      if (position) {
        node.x = node.fx = position.x;
        node.y = node.fy = position.y;
      } else {
        node.fx = node.x;
        node.fy = node.y;
      }
      this.broadcast({
        type: "node-update",
        payload: { nodeId, updates: node },
      });
    }
  }

  public unpinNode(nodeId: string): void {
    const node = this.currentGraph.nodes.find((n) => n.id === nodeId);
    if (node) {
      node.fixed = false;
      node.fx = node.fy = undefined;
      this.broadcast({
        type: "node-update",
        payload: { nodeId, updates: node },
      });
    }
  }

  private mergeGraphs(currentGraph: Graph, updates: Partial<Graph>): Graph {
    const merged: Graph = {
      nodes: [...currentGraph.nodes],
      edges: [...currentGraph.edges],
    };

    if (updates.nodes) {
      updates.nodes.forEach((newNode) => {
        const existingIndex = merged.nodes.findIndex(
          (n) => n.id === newNode.id
        );
        if (existingIndex >= 0) {
          // Update existing node while preserving position if already set
          merged.nodes[existingIndex] = {
            ...merged.nodes[existingIndex],
            ...newNode,
            x: merged.nodes[existingIndex].x ?? newNode.x,
            y: merged.nodes[existingIndex].y ?? newNode.y,
          };
        } else {
          merged.nodes.push(newNode);
        }
      });
    }

    if (updates.edges) {
      updates.edges.forEach((newEdge) => {
        const existingIndex = merged.edges.findIndex(
          (e) => e.id === newEdge.id
        );
        if (existingIndex >= 0) {
          merged.edges[existingIndex] = newEdge;
        } else {
          merged.edges.push(newEdge);
        }
      });
    }

    return this.processGraph(merged);
  }

  public updateGraph(updates: Partial<Graph>): void {
    this.currentGraph = this.mergeGraphs(this.currentGraph, updates);

    this.broadcast({
      type: "graph-update",
      payload: {
        graph: this.currentGraph,
        metadata: this.getGraphMetadata(),
      },
    });
  }

  public updateNode(nodeId: string, updates: Partial<GraphNode>): void {
    const nodeIndex = this.currentGraph.nodes.findIndex((n) => n.id === nodeId);
    if (nodeIndex !== -1) {
      this.currentGraph.nodes[nodeIndex] = {
        ...this.currentGraph.nodes[nodeIndex],
        ...updates,
      };
      this.broadcast({
        type: "node-update",
        payload: {
          nodeId,
          updates,
          metadata: this.getGraphMetadata(),
        },
      });
    }
  }

  public close(): void {
    this.wss.close();
    this.httpServer.close();
  }
}
