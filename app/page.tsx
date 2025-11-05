"use client";

import { useEffect, useState } from "react";
import Rectangle from "@/components/Rectangle";
import LineBorder from "@/components/LineBorder";
import { Button, TextField, Card, Popper, Paper, List, ListItem, ListItemText, ClickAwayListener } from "@mui/material";
import { searchEntities } from "@/lib/api";

interface SearchResult {
  id: string;
  title: string;
}

export default function Home() {
  const headerHeight = 120;
  const borderColor = "#28ccd4ff";
  const textColor = "#ffffff";

  const [startEntity, setStartEntity] = useState("");
  const [endEntity, setEndEntity] = useState("");
  const [startResults, setStartResults] = useState<SearchResult[]>([]);
  const [endResults, setEndResults] = useState<SearchResult[]>([]);
  const [startAnchorEl, setStartAnchorEl] = useState<null | HTMLElement>(null);
  const [endAnchorEl, setEndAnchorEl] = useState<null | HTMLElement>(null);

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
                      sx={{ 
                        "& .MuiOutlinedInput-root": { 
                          height: 50, 
                          color: textColor, 
                          fontFamily: 'inherit',
                          "& fieldset": { borderColor: borderColor }, 
                          "&:hover fieldset": { borderColor: borderColor }, 
                          "&.Mui-focused fieldset": { borderColor: borderColor } 
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
                      sx={{ 
                        "& .MuiOutlinedInput-root": { 
                          height: 50, 
                          color: textColor, 
                          fontFamily: 'inherit',
                          "& fieldset": { borderColor: borderColor }, 
                          "&:hover fieldset": { borderColor: borderColor }, 
                          "&.Mui-focused fieldset": { borderColor: borderColor } 
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
                  <Button   style={{ width: "100%", height: 40, background: borderColor, borderRadius: 8, border: `1px solid ${borderColor}`, color: textColor, cursor: "pointer", fontSize: 14, fontWeight: 500, transition: "all 0.2s ease" }}>
                    Search
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
                <div style={{ width: "100%", height: "92%", borderRadius: 8, border: `1px solid ${borderColor}`, display: "flex", alignItems: "center", justifyContent: "center", color: textColor }}>
                  No search activity yet
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
                <div style={{ width: "100%", height: "calc(100% - 64px)", background: "linear-gradient(180deg,#0b0d11,#0f1116)", borderRadius: 8, border: `1px solid ${borderColor}` }} />
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
