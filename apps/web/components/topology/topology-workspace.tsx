"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import { fetchJson } from "../../lib/api";
import { ReplayPanel, ReplayScenario } from "./replay-panel";
import { TopologyCanvas } from "./topology-canvas";
import { TopologyView } from "./view-switcher";

type GraphNode = {
  id: string;
  type: string;
  label: string;
  risk?: string;
  flow_type?: string;
  protocol?: string;
  port?: number;
  source_asset_label?: string;
  destination_asset_label?: string;
};

type GraphEdge = {
  id: string;
  from: string;
  to: string;
  type: string;
  label: string;
};

type Graph = {
  nodes: GraphNode[];
  edges: GraphEdge[];
};

const emptyGraph: Graph = {
  nodes: [],
  edges: []
};

type FocusTarget = {
  type?: "asset" | "flow";
  label?: string;
  protocol?: string;
  port?: number;
  destinationLabel?: string;
  nodeId?: string;
  edgeId?: string;
};

export function TopologyWorkspace() {
  const searchParams = useSearchParams();
  const requestedView = parseTopologyView(searchParams.get("view"));
  const requestedSearch = searchParams.get("search") ?? "";
  const focusTarget = parseFocusTarget(searchParams);
  const [graph, setGraph] = useState<Graph>(emptyGraph);
  const [view, setView] = useState<TopologyView>(requestedView);
  const [replay, setReplay] = useState<ReplayScenario | null>(null);

  useEffect(() => {
    setView(requestedView);
  }, [requestedView]);

  useEffect(() => {
    let active = true;

    async function loadGraph() {
      const nextGraph = await fetchJson<Graph>(`/topology/${view}`);

      if (!active || !nextGraph) {
        return;
      }

      setGraph(nextGraph);
    }

    void loadGraph();

    return () => {
      active = false;
    };
  }, [view]);

  useEffect(() => {
    let active = true;

    async function loadReplay() {
      const nextReplay = await fetchJson<ReplayScenario>("/simulation/replay/smb-445");

      if (!active || !nextReplay) {
        return;
      }

      setReplay(nextReplay);
    }

    void loadReplay();

    return () => {
      active = false;
    };
  }, []);

  return (
    <>
      <TopologyCanvas
        graph={graph}
        activeView={view}
        onViewChange={setView}
        initialSearchValue={requestedSearch}
        focusTarget={focusTarget}
      />
      <ReplayPanel replay={replay} />
    </>
  );
}

function parseTopologyView(value: string | null): TopologyView {
  if (value === "asset-view" || value === "flow-view" || value === "domain-view") {
    return value;
  }

  return "domain-view";
}

function parseFocusTarget(searchParams: ReturnType<typeof useSearchParams>): FocusTarget {
  const typeValue = searchParams.get("targetType");
  const portValue = searchParams.get("targetPort");

  return {
    type: typeValue === "asset" || typeValue === "flow" ? typeValue : undefined,
    label: searchParams.get("targetLabel") ?? undefined,
    protocol: searchParams.get("targetProtocol") ?? undefined,
    port: portValue ? Number(portValue) : undefined,
    destinationLabel: searchParams.get("targetDestination") ?? undefined,
    nodeId: searchParams.get("targetNodeId") ?? undefined,
    edgeId: searchParams.get("targetEdgeId") ?? undefined
  };
}
