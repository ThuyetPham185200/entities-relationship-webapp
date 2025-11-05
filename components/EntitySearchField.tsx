"use client";

import { useState, useEffect } from "react";
import { TextField, CircularProgress, Paper, List, ListItem, ListItemButton } from "@mui/material";
import { searchEntities } from "@/lib/api";

export default function EntitySearchField({
  label,
  onSelect,
}: {
  label: string;
  onSelect: (value: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPopup, setShowPopup] = useState(false);

  const borderColor = "#28ccd4ff";
  const textColor = "#e6e9ef";

  // debounce the query so it doesn't spam backend
  useEffect(() => {
    const timeout = setTimeout(async () => {
      if (query.trim().length > 1) {
        try {
          setLoading(true);
          const data = await searchEntities(query);
          setResults(data.results || []);
          setShowPopup(true);
        } catch (err) {
          setResults([]);
        } finally {
          setLoading(false);
        }
      } else {
        setResults([]);
        setShowPopup(false);
      }
    }, 400); // 400ms delay
    return () => clearTimeout(timeout);
  }, [query]);

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <TextField
        label={label}
        variant="outlined"
        fullWidth
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => query && setShowPopup(true)}
        onBlur={() => setTimeout(() => setShowPopup(false), 150)} // small delay to allow click
        sx={{
          "& .MuiOutlinedInput-root": {
            height: 50,
            color: textColor,
            fontFamily: "inherit",
            "& fieldset": { borderColor: borderColor },
            "&:hover fieldset": { borderColor: borderColor },
            "&.Mui-focused fieldset": { borderColor: borderColor },
          },
          "& .MuiInputLabel-root": { color: textColor, fontFamily: "inherit" },
          "& .MuiInputLabel-root.Mui-focused": { color: textColor, fontFamily: "inherit" },
        }}
        InputProps={{
          endAdornment: loading ? <CircularProgress size={20} sx={{ color: textColor }} /> : null,
        }}
      />

      {/* Popup results */}
      {showPopup && results.length > 0 && (
        <Paper
          elevation={6}
          style={{
            position: "absolute",
            top: "58px",
            left: 0,
            width: "100%",
            backgroundColor: "#1e1e1e",
            border: `1px solid ${borderColor}`,
            borderRadius: 8,
            zIndex: 1000,
          }}
        >
          <List dense>
            {results.map((r) => (
              <ListItem key={r} disablePadding>
                <ListItemButton
                  onClick={() => {
                    setQuery(r);
                    setShowPopup(false);
                    onSelect(r);
                  }}
                  sx={{
                    color: textColor,
                    fontFamily: "inherit",
                    "&:hover": { backgroundColor: "#333" },
                  }}
                >
                  {r}
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Paper>
      )}
    </div>
  );
}
