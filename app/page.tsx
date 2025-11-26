"use client";

import { useEffect, useState, useCallback, useRef, Suspense } from "react";
import dynamic from 'next/dynamic';
import Rectangle from "@/components/Rectangle";
import LineBorder from "@/components/LineBorder";
import { Button, TextField, Card, Popper, Paper, List, ListItem, ListItemText, ClickAwayListener } from "@mui/material";
import { searchEntities, searchRelationship} from "@/lib/api";

// Create a client-side only component for the graph
const GraphComponent = dynamic(
  () => import('react-force-graph-2d').then(mod => {
    const Graph = mod.default;
    return function GraphWrapper(props: any) {
      return <Graph {...props} />;
    };
  }),
  {
    ssr: false,
    loading: () => (
      <div style={{ 
        width: "100%", 
        height: "100%", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center",
        color: "#ffffff"
      }}>
        Loading graph visualization...
      </div>
    )
  }
);

interface GraphNode {
  id: string;
  name: string;
  ref_link: string;
  entity_type: string;
  description: string;
  color?: string;
  // Force-graph specific properties
  val?: number;         // Node value (affects size)
  x?: number;          // Current x position
  y?: number;          // Current y position
  vx?: number;         // Velocity x
  vy?: number;         // Velocity y
  fx?: number | null;  // Fixed x position
  fy?: number | null;  // Fixed y position
}

interface GraphLink {
  source: GraphNode | string;  // Can be node object or ID string
  target: GraphNode | string;  // Can be node object or ID string
  type: string;
  description: string;
  ref_link: string;
  value?: number;
}

interface Entity {
  id: string;         // Required unique identifier
  name: string;       // Display name
  ref_link: string;
  entity_type: string;
  short_description: string;
}

interface Relationship {
  entity_src: string;  // Should match Entity.id
  entity_dst: string;  // Should match Entity.id
  relationship_type: string;
  short_description: string;
  ref_link: string;
}

interface WebSocketResponse {
  request_id: string;
  type: string;
  Entities: Entity[];
  Relationships: Relationship[];
}

interface SearchItem {
  id: string;         // Unique identifier
  title: string;      // Display name
  description?: string;
}

interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

interface SearchResult {
  id: string;
  title: string;
  description?: string;
}

interface Relationship {
  entity_src: string;
  entity_dst: string;
  relationship_type: string;
  short_description: string;
  ref_link: string;
}

interface WebSocketResponse {
  request_id: string;
  type: string;
  Entities: Entity[];
  Relationships: Relationship[];
}

export default function Home() {
  const headerHeight = 120;
  const borderColor = "#28ccd4ff";
  const textColor = "#ffffff";

  // WebSocket connection constants
  const PING_INTERVAL = 30000; // Send ping every 30 seconds
  const RECONNECT_ATTEMPTS = 5;
  const INITIAL_RECONNECT_DELAY = 1000; // Start with 1 second delay

  const [startEntity, setStartEntity] = useState("");
  const [endEntity, setEndEntity] = useState("");
  const [startResults, setStartResults] = useState<SearchResult[]>([]);
  const [endResults, setEndResults] = useState<SearchResult[]>([]);
  const [startAnchorEl, setStartAnchorEl] = useState<null | HTMLElement>(null);
  const [endAnchorEl, setEndAnchorEl] = useState<null | HTMLElement>(null);
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
  const [hoveredLink, setHoveredLink] = useState<GraphLink | null>(null);
  const [selectedLink, setSelectedLink] = useState<GraphLink | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [isCreatingLink, setIsCreatingLink] = useState(false);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [searchLog, setSearchLog] = useState<Array<string>>([]);
  const [relationshipInfo, setRelationshipInfo] = useState<any>(null);
  const [wsClient, setWsClient] = useState<WebSocket | null>(null);
  const [wsConnecting, setWsConnecting] = useState(false);
  const [wsReconnectAttempt, setWsReconnectAttempt] = useState(0);
  const pingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastPongRef = useRef<number>(Date.now());
  const graphRef = useRef<any>(null);
  const graphContainerRef = useRef<HTMLDivElement>(null);
  const [graphSize, setGraphSize] = useState({ width: 600, height: 600 });

  // Resize observer to make the graph fit the container
  useEffect(() => {
    function updateSize() {
      if (graphContainerRef.current) {
        const rect = graphContainerRef.current.getBoundingClientRect();
        setGraphSize({ width: rect.width, height: rect.height });
      }
    }
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // const handleSearch = () => {
  //   if (!startEntity || !endEntity) return;
    
  //   // Generate 100 random nodes
  //   const newNodes: GraphNode[] = [];
  //   const newLinks: GraphLink[] = [];

  //   // Add start and end nodes
  //   newNodes.push(
  //     { id: '1', name: startEntity, color: '#3bd671' },
  //     { id: '2', name: endEntity, color: '#ff5c6c' }
  //   );

  //   // Generate random nodes in a circular pattern
  //   const radius = 200;
  //   const angleStep = (2 * Math.PI) / 98; // For remaining 98 nodes

  //   for (let i = 3; i <= 100; i++) {
  //     const angle = angleStep * (i - 3);
  //     const x = radius * Math.cos(angle);
  //     const y = radius * Math.sin(angle);
      
  //     newNodes.push({
  //       id: i.toString(),
  //       name: `${Math.floor(Math.random() * 1000)}`,
  //       color: '#6b5cff',
  //       x, // Initial position
  //       y,
  //       fx: undefined, // Allow node to move
  //       fy: undefined
  //     });
  //   }

  //   // Generate random connections, but limit the number to reduce clutter
  //   newNodes.forEach((node) => {
  //     const numConnections = Math.floor(Math.random() * 2) + 1; // 1 to 2 connections
  //     const connectedNodes = new Set(); // Track already connected nodes

  //     for (let i = 0; i < numConnections; i++) {
  //       const targetId = Math.floor(Math.random() * 98) + 3; // Only connect to random nodes (3-100)
  //       if (targetId.toString() !== node.id && !connectedNodes.has(targetId)) {
  //         connectedNodes.add(targetId);
  //         newLinks.push({
  //           source: node.id,
  //           target: targetId.toString(),
  //           value: 1
  //         });
  //       }
  //     }
  //   });

  //   // Ensure start and end nodes are connected through some path
  //   let intermediateNodes = [
  //     Math.floor(Math.random() * 98) + 3,
  //     Math.floor(Math.random() * 98) + 3
  //   ].map(n => n.toString());

  //   newLinks.push(
  //     { source: '1', target: intermediateNodes[0] },
  //     { source: intermediateNodes[0], target: intermediateNodes[1] },
  //     { source: intermediateNodes[1], target: '2' }
  //   );

  //   setGraphData({ nodes: newNodes, links: newLinks });
  // };

  // Cleanup WebSocket on unmount
  useEffect(() => {
    return () => {
      if (wsClient) {
        wsClient.close();
        setWsClient(null);
      }
    };
  }, [wsClient]);

const handleSearch = async () => {
  if (!startEntity || !endEntity) return;

  // Close any existing WebSocket connection
  if (wsClient) {
    wsClient.close();
    setWsClient(null);
  }

  setLoadingSearch(true);
  setGraphData({ nodes: [], links: [] }); // Clear existing graph

  try {
    // Try to find selected items in existing results lists
    let startItem = startResults.find((r) => r.title === startEntity);
    let endItem = endResults.find((r) => r.title === endEntity);

    // If both items found, attempt WebSocket connection
    if (startItem && endItem) {
      try {
        // Call the backend to start relationship search using ids
        const info = await searchRelationship(startItem.id, endItem.id);
        console.log('searchRelationship result:', info);
        setRelationshipInfo(info);
        setSearchLog((s) => [
          `${new Date().toLocaleTimeString()}: Attempting WebSocket connection for real data...`,
          ...s,
        ]);

        // Create WebSocket connection using server info from the response
        if (info.websocket_server_info?.ip && info.websocket_server_info?.port) {
          const wsUrl = `ws://${info.websocket_server_info.ip}:${info.websocket_server_info.port}/ws?request_id=${info.request_id}`;
          const ws = new WebSocket(wsUrl);

          // Add connection timeout
          const connectionTimeout = setTimeout(() => {
            if (ws.readyState === WebSocket.CONNECTING) {
              console.log('WebSocket connection timeout');
              setSearchLog((s) => [
                `${new Date().toLocaleTimeString()}: WebSocket connection timeout - keeping random graph`,
                ...s,
              ]);
              ws.close();
            }
          }, 5000); // 5 second timeout

          // Set up WebSocket event handlers
          ws.onopen = () => {
            clearTimeout(connectionTimeout);
            console.log('WebSocket connected, requesting real data...');
            setSearchLog((s) => [
              `${new Date().toLocaleTimeString()}: WebSocket connected - fetching real relationship data`,
              ...s,
            ]);
            setWsConnecting(false);
            setWsReconnectAttempt(0);
            lastPongRef.current = Date.now();

            // Send initial message to verify connection
            try {
              ws.send(JSON.stringify({ type: 'init', request_id: info.request_id }));
            } catch (err) {
              console.error('Error sending init message:', err);
            }
          };

          ws.onmessage = (event) => {
            try {
              const data = JSON.parse(event.data);
              console.log('WebSocket data received:', data);
              console.log('Data JSON:', JSON.stringify(data, null, 2));

              // Log to search log as well
              setSearchLog((s) => [
                `${new Date().toLocaleTimeString()}: WebSocket data: ${JSON.stringify(data)}`,
                ...s,
              ]);

              // Handle pong messages
              if (data.type === 'pong') {
                lastPongRef.current = Date.now();
                return;
              }

              // Handle result type messages - replace random graph with real data
              if (data.type === 'result' && data.Entities && data.Relationships) {
                try {
                  const response = data as WebSocketResponse;
                  console.log('Received relationship data:', response);

                  // Transform entities into nodes
                  const graphNodes = response.Entities.map((entity: Entity) => ({
                    id: entity.id,
                    name: entity.name,
                    ref_link: entity.ref_link,
                    entity_type: entity.entity_type,
                    description: entity.short_description,
                    val: 1,
                    x: undefined,
                    y: undefined,
                    vx: 0,
                    vy: 0,
                    fx: undefined,
                    fy: undefined,
                  }));

                  const nodesById = Object.fromEntries(graphNodes.map((node) => [node.id, node]));
                  console.log('Nodes by ID:', nodesById);

                  // Build relationships by matching entity_src and entity_dst IDs with node IDs
                  console.log('Building relationships from:', response.Relationships);
                  const graphLinks = response.Relationships
                    .filter((rel: Relationship) => {
                      const srcExists = rel.entity_src in nodesById;
                      const dstExists = rel.entity_dst in nodesById;
                      console.log(`Relationship ${rel.entity_src} -> ${rel.entity_dst}: src=${srcExists}, dst=${dstExists}`);
                      return srcExists && dstExists;
                    })
                    .map((rel: Relationship) => ({
                      source: rel.entity_src,  // Use ID string, not node object
                      target: rel.entity_dst,  // Use ID string, not node object
                      type: rel.relationship_type || 'connection',
                      description: rel.short_description || `${nodesById[rel.entity_src].name} → ${nodesById[rel.entity_dst].name}`,
                      ref_link: rel.ref_link,
                      value: 1,
                    }));

                  console.log('Graph nodes:', graphNodes);
                  console.log('Graph links count:', graphLinks.length);
                  console.log('Graph links:', graphLinks);

                  if (graphLinks.length === 0) {
                    setSearchLog((s) => [
                      `${new Date().toLocaleTimeString()}: WARNING - No valid relationships found! Check IDs matching`,
                      ...s,
                    ]);
                  }

                  // Color the nodes: start entity green, end entity red, others purple
                  // Determine which nodes are in the path by tracing relationships
                  const startEntity = graphNodes[0];
                  const endEntity = graphNodes[graphNodes.length - 1];
                  
                  // Build a map to trace the path from start to end
                  const pathNodeIds = new Set<string>();
                  pathNodeIds.add(startEntity.id);
                  pathNodeIds.add(endEntity.id);

                  // Trace forward from start node through relationships
                  let currentId = startEntity.id;
                  const visited = new Set<string>();
                  
                  while (currentId !== endEntity.id && !visited.has(currentId)) {
                    visited.add(currentId);
                    // Find the next node in the path
                    const nextRel = response.Relationships.find(
                      (rel: Relationship) => rel.entity_src === currentId
                    );
                    if (nextRel) {
                      pathNodeIds.add(nextRel.entity_dst);
                      currentId = nextRel.entity_dst;
                    } else {
                      break;
                    }
                  }

                  const visualNodes = graphNodes.map((node) => ({
                    ...node,
                    color: pathNodeIds.has(node.id) ? 
                      (node.id === startEntity.id ? '#3bd671' : node.id === endEntity.id ? '#ff5c6c' : '#6b5cff')
                      : '#666666', // Nodes not in path get gray color
                  }));

                  console.log('Path node IDs:', pathNodeIds);
                  console.log('Visual nodes with colors:', visualNodes);

                  setGraphData({
                    nodes: visualNodes,
                    links: graphLinks,
                  });

                  setSearchLog((s) => [
                    `${new Date().toLocaleTimeString()}: Graph replaced with real data - ${graphNodes.length} entities and ${graphLinks.length} relationships`,
                    `Link details: ${graphLinks.map(l => `${(l.source as any).name || (l.source as any).id} -> ${(l.target as any).name || (l.target as any).id}`).join(', ')}`,
                    ...s,
                  ]);

                  // Zoom to fit the new graph
                  if (graphRef.current) {
                    setTimeout(() => {
                      graphRef.current.zoomToFit(400);
                    }, 250);
                  }
                } catch (err) {
                  console.error('Error building graph from WebSocket data:', err);
                  setSearchLog((s) => [
                    `${new Date().toLocaleTimeString()}: ERROR building graph - ${String(err)}`,
                    ...s,
                  ]);
                }
              }
            } catch (err) {
              console.error('Error processing WebSocket message:', err);
            }
          };

          ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            setSearchLog((s) => [
              `${new Date().toLocaleTimeString()}: WebSocket error - keeping random graph`,
              ...s,
            ]);
          };

          ws.onclose = () => {
            console.log('WebSocket connection closed');
            setWsClient(null);
            setWsConnecting(false);
          };

          setWsClient(ws);
        }
      } catch (err: any) {
        console.error('Error attempting WebSocket connection:', err);
        setSearchLog((s) => [
          `${new Date().toLocaleTimeString()}: WebSocket connection failed - ${String(err)}`,
          ...s,
        ]);
      }
    } else {
      setSearchLog((s) => [
        `${new Date().toLocaleTimeString()}: Please select valid entities from search results`,
        ...s,
      ]);
    }
  } catch (err: any) {
    console.error('Error during handleSearch:', err);
    setSearchLog((s) => [
      `${new Date().toLocaleTimeString()}: Error: ${err?.message || String(err)}`,
      ...s,
    ]);
  } finally {
    setLoadingSearch(false);
  }
};


  useEffect(() => {
    const searchStart = async () => {
      if (startEntity.trim().length >= 2) {
        const results = await searchEntities(startEntity);
        setStartResults(results);
      } else {
        setStartResults([]);
      }
    };
    const timeoutId = setTimeout(searchStart, 300);
    return () => clearTimeout(timeoutId);
  }, [startEntity]);

  useEffect(() => {
    const searchEnd = async () => {
      if (endEntity.trim().length >= 2) {
        const results = await searchEntities(endEntity);
        setEndResults(results);
      } else {
        setEndResults([]);
      }
    };
    const timeoutId = setTimeout(searchEnd, 300);
    return () => clearTimeout(timeoutId);
  }, [endEntity]);

  // useEffect(() => {
  //   if (!id1 || !id2) return;

  //   const fetchRelationship = async () => {
  //     try {
  //       const data = await searchRelationship(id1, id2);
  //       console.log("Relationship data:", data);
  //     } catch (err: any) {
  //       console.error("Error fetching relationship:", err);
  //     }
  //   };

  //   fetchRelationship();
  // }, [id1, id2]);

  return (
    <main style={{ minHeight: "100vh", width: "100%" }}>
      {/* Fixed Top header */}
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: headerHeight, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 30 }}>
        <div style={{ width: "100%", maxWidth: 1500, padding: "16px 24px", boxSizing: "border-box", textAlign: "center" }}>
          <h1 style={{ margin: 0, color: textColor, fontSize: 36, letterSpacing: 0.5 }}>Relationship of Entities</h1>
          <div style={{ height: 6 }} />
          <p style={{ margin: 0, color: textColor }}>Visualize Wikipedia relationships</p>
          <div style={{ height: 8 }} />
          <div style={{ width: 80, height: 4, background: borderColor, margin: "8px auto", borderRadius: 4 }} />
        </div>
      </div>

      {/* Scrollable content area below header */}
      <div style={{ position: "fixed", top: headerHeight, left: 0, right: 0, bottom: 0, overflowY: "auto", padding: 24, boxSizing: "border-box" }}>
        <div style={{ width: "100%", maxWidth: 1200, margin: "0 auto", display: "flex", gap: 24, alignItems: "flex-start" }}>
          {/* Left column */}
          <div style={{ width: "34%", minWidth: 220, display: "flex", flexDirection: "column", gap: 20 }}>
            <Rectangle
              width="100%"
              height={300}
              color="#0e1116"
              radius={12}
              position="relative"
              opacity={0.9}
              borderColor={borderColor}
              borderWidth={1}
            >
            <div style={{ width: "92%", height: "92%", color: borderColor, display: "flex", flexDirection: "column", alignItems: "flex-start", padding: 5, boxSizing: "border-box" }}>
                <h3 style={{ margin: 0, fontSize: 18 , color: textColor}}>Enter Two People</h3>
                <div style={{ height: 12 }} />
                  <label style={{ fontSize: 12, color: textColor }}>Start Entity</label>
                <div style={{ height: 8 }} />
                  <div style={{ position: 'relative', width: '100%' }}>
                    <TextField
                      id="start-entity"
                      label="Wiki Entity"
                      variant="outlined"
                      fullWidth
                      value={startEntity}
                      onChange={(e) => {
                        setStartEntity(e.target.value);
                        setStartAnchorEl(e.currentTarget);
                      }}
                      InputProps={{
                        style: { color: textColor }
                      }}
                      sx={{ 
                        "& .MuiOutlinedInput-root": { 
                            height: 50,
                            color: textColor,
                            fontFamily: 'inherit',
                            backgroundColor: '#181a20',
                            "& input": {
                              color: `${textColor} !important`,
                              backgroundColor: '#181a20',
                            },
                            "& fieldset": { borderColor: borderColor },
                            "&:hover fieldset": { borderColor: borderColor },
                            "&.Mui-focused fieldset": { borderColor: borderColor },
                            "&.Mui-focused": {
                              "& input": {
                                color: `${textColor} !important`,
                                backgroundColor: '#181a20',
                              }
                            }
                        },
                        "& .MuiInputLabel-root": { 
                          color: textColor, 
                          fontFamily: 'inherit'
                        }, 
                        "& .MuiInputLabel-root.Mui-focused": { 
                          color: textColor, 
                          fontFamily: 'inherit'
                        }
                      }}
                    />
                    <Popper
                      open={Boolean(startAnchorEl) && startResults.length > 0}
                      anchorEl={startAnchorEl}
                      placement="bottom-start"
                      style={{ width: startAnchorEl?.clientWidth, zIndex: 1000 }}
                    >
                      <ClickAwayListener onClickAway={() => setStartAnchorEl(null)}>
                        <Paper
                          style={{
                            background: '#0e1116',
                            border: `1px solid ${borderColor}`,
                            maxHeight: 200,
                            overflow: 'auto'
                          }}
                        >
                          <List>
                            {startResults.map((result) => (
                              <ListItem
                                key={result.id}
                                onClick={() => {
                                  setStartEntity(result.title);
                                  setStartAnchorEl(null);
                                }}
                                style={{
                                  cursor: 'pointer',
                                  color: textColor,
                                }}
                                sx={{
                                    '&:hover': {
                                      backgroundColor: '#222831',
                                      color: textColor,
                                      '& .MuiListItemText-primary': {
                                        color: textColor
                                      }
                                    }
                                }}
                              >
                                <ListItemText
                                  primary={result.title}
                                  secondaryTypographyProps={{ style: { color: 'rgba(255, 255, 255, 0.7)' } }}
                                />
                              </ListItem>
                            ))}
                          </List>
                        </Paper>
                      </ClickAwayListener>
                    </Popper>
                  </div>
                <div style={{ height: 12 }} />
                  <label style={{ fontSize: 12, color: textColor }}>End Entity</label>
                <div style={{ height: 8 }} />
                  <div style={{ position: 'relative', width: '100%' }}>
                    <TextField
                      id="end-entity"
                      label="Wiki Entity"
                      variant="outlined"
                      fullWidth
                      value={endEntity}
                      onChange={(e) => {
                        setEndEntity(e.target.value);
                        setEndAnchorEl(e.currentTarget);
                      }}
                      InputProps={{
                        style: { color: textColor }
                      }}
                      sx={{ 
                        "& .MuiOutlinedInput-root": { 
                          height: 50, 
                          color: textColor, 
                          fontFamily: 'inherit',
                          "& input": {
                            color: `${textColor} !important`,
                          },
                          "& fieldset": { borderColor: borderColor }, 
                          "&:hover fieldset": { borderColor: borderColor }, 
                          "&.Mui-focused fieldset": { borderColor: borderColor },
                          "&.Mui-focused": {
                            "& input": {
                              color: `${textColor} !important`,
                            }
                          }
                        },
                        "& .MuiInputLabel-root": { 
                          color: textColor, 
                          fontFamily: 'inherit'
                        }, 
                        "& .MuiInputLabel-root.Mui-focused": { 
                          color: textColor, 
                          fontFamily: 'inherit'
                        }
                      }}
                    />
                    <Popper
                      open={Boolean(endAnchorEl) && endResults.length > 0}
                      anchorEl={endAnchorEl}
                      placement="bottom-start"
                      style={{ width: endAnchorEl?.clientWidth, zIndex: 1000 }}
                    >
                      <ClickAwayListener onClickAway={() => setEndAnchorEl(null)}>
                        <Paper
                          style={{
                            background: '#0e1116',
                            border: `1px solid ${borderColor}`,
                            maxHeight: 200,
                            overflow: 'auto'
                          }}
                        >
                          <List>
                            {endResults.map((result) => (
                              <ListItem
                                key={result.id}
                                onClick={() => {
                                  setEndEntity(result.title);
                                  setEndAnchorEl(null);
                                }}
                                style={{
                                  cursor: 'pointer',
                                  color: textColor,
                                }}
                                sx={{
                                  '&:hover': {
                                    backgroundColor: 'rgba(40, 204, 212, 0.1)'
                                  }
                                }}
                              >
                                <ListItemText
                                  primary={result.title}
                                  secondaryTypographyProps={{ style: { color: 'rgba(255, 255, 255, 0.7)' } }}
                                />
                              </ListItem>
                            ))}
                          </List>
                        </Paper>
                      </ClickAwayListener>
                    </Popper>
                  </div>
                <div style={{ flex: 1 }} />
                  <Button 
                    type="button"
                    onClick={handleSearch}
                    disabled={loadingSearch}
                    style={{ 
                      width: "100%", 
                      height: 40, 
                      background: loadingSearch ? 'rgba(40, 204, 212, 0.5)' : borderColor, 
                      borderRadius: 8, 
                      border: `1px solid ${borderColor}`, 
                      color: textColor, 
                      cursor: loadingSearch ? "not-allowed" : "pointer", 
                      fontSize: 14, 
                      fontWeight: 500, 
                      transition: "all 0.2s ease",
                      opacity: loadingSearch ? 0.7 : 1
                    }}
                  >
                    {loadingSearch ? 'Searching...' : 'Search'}
                  </Button>
              </div>
            </Rectangle>

            <Rectangle
              width="100%"
              height={420}
              color="#0e1116"
              radius={12}
              position="relative"
              opacity={0.9}
              borderColor={borderColor}
              borderWidth={1}
            >
              <div style={{ width: "100%", height: "100%", color: borderColor, display: "flex", flexDirection: "column", alignItems: "flex-start", padding: 18, boxSizing: "border-box" }}>
                <h3 style={{ margin: 0, fontSize: 18 , color: textColor}}>Search Log</h3>
                <div style={{ height: 12 }} />
                <div style={{ width: "100%", height: "92%", borderRadius: 8, border: `1px solid ${borderColor}`, display: "flex", alignItems: "flex-start", justifyContent: "flex-start", color: textColor, padding: 12, boxSizing: 'border-box', overflow: 'auto' }}>
                  {searchLog.length === 0 ? (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>No search activity yet</div>
                  ) : (
                    <div style={{ width: '100%' }}>
                      <ul style={{ margin: 0, paddingLeft: 14 }}>
                        {searchLog.map((entry, idx) => (
                          <li key={idx} style={{ marginBottom: 6, fontSize: 13, color: 'rgba(255,255,255,0.9)' }}>{entry}</li>
                        ))}
                      </ul>

                      {relationshipInfo && (
                        <div style={{ marginTop: 8, fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>
                          <div><strong>Request ID:</strong> {relationshipInfo.request_id}</div>
                          <div><strong>Websocket:</strong> {relationshipInfo.websocket_server_info?.ip}:{relationshipInfo.websocket_server_info?.port}</div>
                          <div><strong>Status:</strong> {relationshipInfo.status}</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </Rectangle>
          </div>

          {/* Right column */}
          <div style={{ flex: 1 }}>
            <Rectangle width="100%" height={740} color="#0d1116" radius={12} position="relative" borderColor={borderColor} borderWidth={1}>
              <div style={{ width: "96%", height: "96%", padding: 14, boxSizing: "border-box", color: textColor }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <h3 style={{ margin: 0, fontSize: 18 }}>Network Visualization</h3>
                  <div style={{ fontSize: 12, background: "#0c1016", padding: "6px 8px", borderRadius: 6, color: textColor }}>Nodes explored: 0</div>
                </div>
                <div style={{ height: 12 }} />
                <div 
                  className="force-graph-container"
                  ref={graphContainerRef}
                  style={{ 
                    width: "100%", 
                    height: "600px",
                    background: "linear-gradient(180deg,#0b0d11,#0f1116)", 
                    borderRadius: 8, 
                    border: `1px solid ${borderColor}`,
                    overflow: 'hidden',
                    position: 'relative'
                  }}
                >
                  <Suspense fallback={
                    <div style={{ 
                      width: "100%", 
                      height: "100%", 
                      display: "flex", 
                      alignItems: "center", 
                      justifyContent: "center",
                      color: "#ffffff"
                    }}>
                      Loading graph visualization...
                    </div>
                  }>
                    <GraphComponent
                      ref={graphRef}
                      graphData={graphData}
                      nodeLabel="name"
                      nodeVal={(node: GraphNode) => node.val || 1}
                      nodeColor={(node: GraphNode) => node.color || '#fff'}
                      linkColor={(link: GraphLink) => {
                        // Make custom-created links highly visible
                        if ((link as any).type === 'custom') return '#ffeb3b';
                        // Make all relationship links visible
                        if (link.type === 'connection' || link.type === '') return 'rgba(40, 204, 212, 0.8)';
                        if (
                          selectedLink &&
                          ((selectedLink.source === link.source && selectedLink.target === link.target) ||
                           (selectedLink.source === link.target && selectedLink.target === link.source))
                        ) {
                          return 'red';
                        }
                        if (
                          hoveredLink &&
                          ((hoveredLink.source === link.source && hoveredLink.target === link.target) ||
                           (hoveredLink.source === link.target && hoveredLink.target === link.source))
                        ) {
                          return '#fff';
                        }
                        return 'rgba(40, 204, 212, 0.5)';
                      }}
                      nodeRelSize={7}
                      linkWidth={(link: GraphLink) => {
                        // Make custom-created links thicker for visibility
                        if ((link as any).type === 'custom') return 6;
                        // Make all relationship links visible with good thickness
                        if (link.type === 'connection' || link.type === '') return 4;
                        if (
                          selectedLink &&
                          ((selectedLink.source === link.source && selectedLink.target === link.target) ||
                           (selectedLink.source === link.target && selectedLink.target === link.source))
                        ) {
                          return 6;
                        }
                        if (
                          hoveredLink &&
                          ((hoveredLink.source === link.source && hoveredLink.target === link.target) ||
                           (hoveredLink.source === link.target && hoveredLink.target === link.source))
                        ) {
                          return 6;
                        }
                        return 3;
                      }}
                      backgroundColor="transparent"
                      width={graphSize.width}
                      height={graphSize.height}
                      onEngineStop={() => {
                        console.log("Engine stopped, nodes:", graphData.nodes.length, "links:", graphData.links.length);
                        console.log("Current graph links:", graphData.links);
                        if (graphRef.current) {
                          graphRef.current.zoomToFit(400);
                        }
                      }}
                      onEngineStart={() => {
                        console.log("Engine started with data:", graphData);
                        console.log("Engine started - nodes:", graphData.nodes.length, "links:", graphData.links.length);
                        if (graphData.links.length > 0) {
                          console.log("First link:", graphData.links[0]);
                        }
                      }}
                      cooldownTicks={100}
                      warmupTicks={50}
                      onNodeClick={(node: GraphNode) => {
                        console.log('Clicked node:', node);
                        if (!isCreatingLink) {
                          // begin link creation
                          setSelectedNode(node);
                          setIsCreatingLink(true);
                          setSearchLog((s) => [
                            `${new Date().toLocaleTimeString()}: Selected ${node.name}. Click another node to create a connection.`,
                            ...s,
                          ]);
                        } else {
                          // finish link creation if clicked different node
                          if (selectedNode && selectedNode.id !== node.id) {
                            const newLink: GraphLink = {
                              source: selectedNode,
                              target: node,
                              type: 'custom',
                              description: `Connection from ${selectedNode.name} to ${node.name}`,
                              ref_link: '',
                              value: 1
                            };
                            setGraphData(prev => {
                              const updated = { nodes: prev.nodes, links: [...prev.links, newLink] };
                              console.log('Graph updated (after adding link):', updated);
                              return updated;
                            });
                            setSearchLog((s) => [
                              `${new Date().toLocaleTimeString()}: Created connection from ${selectedNode.name} to ${node.name}`,
                              ...s,
                            ]);
                            // Re-heat and refresh the simulation so the new link is rendered immediately
                            setTimeout(() => {
                              try {
                                graphRef.current?.d3ReheatSimulation?.();
                                graphRef.current?.refresh?.();
                                // optional: zoomToFit to show the new connection
                                // graphRef.current?.zoomToFit?.(400);
                              } catch (e) {
                                // ignore if methods aren't available
                              }
                            }, 50);
                          }
                          setSelectedNode(null);
                          setIsCreatingLink(false);
                        }
                      }}
                      onNodeRightClick={(node: GraphNode) => {
                        // cancel link creation on right click
                        if (isCreatingLink) {
                          setSelectedNode(null);
                          setIsCreatingLink(false);
                          setSearchLog((s) => [
                            `${new Date().toLocaleTimeString()}: Cancelled link creation`,
                            ...s,
                          ]);
                        }
                        return false;
                      }}
                      nodeCanvasObject={(node: GraphNode, ctx: CanvasRenderingContext2D, globalScale: number) => {
                        const label = node.name;
                        const fontSize = 12 / Math.max(globalScale, 0.1);
                        ctx.font = `${fontSize}px Sans-Serif`;

                        // draw node circle
                        ctx.beginPath();
                        ctx.arc(node.x || 0, node.y || 0, 5, 0, 2 * Math.PI);
                        ctx.fillStyle = node.color || '#fff';
                        ctx.fill();

                        // highlight selected node during creation
                        if (isCreatingLink && selectedNode?.id === node.id) {
                          ctx.beginPath();
                          ctx.arc(node.x || 0, node.y || 0, 9, 0, 2 * Math.PI);
                          ctx.strokeStyle = '#00ff00';
                          ctx.lineWidth = 2 / Math.max(globalScale, 0.1);
                          ctx.stroke();
                        }

                        // draw label
                        ctx.fillStyle = '#fff';
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'top';
                        ctx.fillText(label, node.x || 0, (node.y || 0) + 6);
                      }}
                      
                      onLinkHover={(link: GraphLink | null) => {
                        setHoveredLink(link);
                        if (!link) setSelectedLink(null);
                        const container = document.querySelector('.force-graph-container') as HTMLElement;
                        if (container) {
                          container.style.cursor = link ? 'pointer' : 'default';
                        }
                      }}
                      onLinkClick={(link: GraphLink) => {
                        setSelectedLink(link);
                        console.log('clicked to relationship');
                      }}
                    />
                  </Suspense>
                </div>
                <div style={{ height: 12 }} />
                <div style={{ display: "flex", gap: 12, alignItems: "center", color: textColor }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <div style={{ width: 10, height: 10, borderRadius: 10, background: "#3bd671" }} /> <span>Start Node</span>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <div style={{ width: 10, height: 10, borderRadius: 10, background: "#ff5c6c" }} /> <span>End Node</span>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <div style={{ width: 10, height: 10, borderRadius: 10, background: "#6b5cff" }} /> <span>Path</span>
                  </div>
                </div>
              </div>
            </Rectangle>
          </div>
        </div>
      </div>
    </main>
  );
}
