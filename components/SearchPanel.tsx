import EntitySearchField from "@/components/EntitySearchField";
import { useState } from "react";

export default function SearchPanel() {
  const [startEntity, setStartEntity] = useState("");
  const [endEntity, setEndEntity] = useState("");

  return (
    <div>
      <label>Start Entity</label>
      <EntitySearchField label="Start Entity" onSelect={setStartEntity} />
      <div style={{ height: 16 }} />
      <label>End Entity</label>
      <EntitySearchField label="End Entity" onSelect={setEndEntity} />
    </div>
  );
}
