/// <reference path="../../types/controller-panel.d.ts" />

import { registerStateChangeListener, useState } from "../state.js";
import { ControllerPanelHtmlBuilder } from "./html-builder.js";
import { InputController } from "./input-controller.js";

/**
 * @param {DraftNode} node
 */
function renderDraftNodePanel(node) {
  const panel = document.getElementById("controller-panel-body");
  if (!panel) {
    return;
  }

  const [graph, setGraph] = useState("diagram");

  /** @type {(value: string) => void} */
  const onChangeType = (value) => {
    let newNode = null;

    if (value === "LOAD_FILE") {
      /** @type {LoadFileNode} */
      const loadFileNode = {
        id: node.id,
        name: node.name,
        type: "DATA",
        dataType: "LOAD_FILE",
        file: null,
      };
      newNode = loadFileNode;
    } else if (value === "FILL_MISSING_WITH_ZERO") {
      /** @type {FillMissingValueWithZeroTransformerNode} */
      const fillMissingValueWithZeroTransformerNode = {
        id: node.id,
        name: node.name,
        type: "TRANSFORMER",
        action: "FILL_WITH_ZERO",
        from: null,
      };
      newNode = fillMissingValueWithZeroTransformerNode;
    } else if (value === "SAVE_TO_FILE") {
      /** @type {SaveToFileNode} */
      const saveToFileNode = {
        id: node.id,
        name: node.name,
        type: "PRESENTATION",
        action: "SAVE_TO_FILE",
        from: null,
        filePath: null,
      };
      newNode = saveToFileNode;
    }

    setGraph({
      nodes: [...graph.nodes.filter((v) => v.id !== node.id), newNode],
    });
    renderControllerPanel(newNode);
  };

  ControllerPanelHtmlBuilder.builder()
    .title("Draft node")
    .text("Node ID", node.id)
    .text("Node name", node.name)
    .select(
      "Change type",
      ["DRAFT", "LOAD_FILE", "FILL_MISSING_WITH_ZERO", "SAVE_TO_FILE"],
      onChangeType
    )
    .build(panel);
}

/**
 * @param {DataNode} node
 */
function renderDataNodePanel(node) {
  switch (node.dataType) {
    case "LOAD_FILE":
      const loadFileNode = /** @type {LoadFileNode} */ (node);
      renderLoadFileNodePanel(loadFileNode);
      break;
  }
}

/**
 * @param {LoadFileNode} node
 */
function renderLoadFileNodePanel(node) {
  const panel = document.getElementById("controller-panel-body");
  if (!panel) {
    return;
  }

  const [graph, setGraph] = useState("diagram");
  const fileController = new InputController();

  ControllerPanelHtmlBuilder.builder()
    .title("Load file node")
    .text("Node ID", node.id)
    .text("Node name", node.name)
    .file("File", node.file, fileController)
    .build(panel);

  fileController.get().addEventListener("change", (ev) => {
    const target = /** @type {HTMLInputElement} */ (ev.target);
    if (target.files && target.files[0]) {
      /** @type {LoadFileNode} */
      const newNode = {
        id: node.id,
        name: node.name,
        type: "DATA",
        dataType: "LOAD_FILE",
        file: target.files[0],
      };

      setGraph({
        nodes: [...graph.nodes.filter((v) => v.id !== node.id), newNode],
      });
      renderControllerPanel(newNode);
    }
  });
}

/**
 * @param {DataTransformerNode} node
 */
function renderTransformerNodePanel(node) {
  switch (node.action) {
    case "FILL_WITH_ZERO":
      const fillWithZeroNode =
        /** @type {FillMissingValueWithZeroTransformerNode} */ (node);
      renderFillWithZeroNodePanel(fillWithZeroNode);
      break;
  }
}

/**
 * @param {FillMissingValueWithZeroTransformerNode} node
 */
function renderFillWithZeroNodePanel(node) {
  const panel = document.getElementById("controller-panel-body");
  if (!panel) {
    return;
  }

  const [graph, setGraph] = useState("diagram");
  const fromNodeInputController = new InputController();

  /** @type {(fromNodeId: string) => void } */
  const onConfirmFromNode = (fromNodeId) => {
    if (node.id === fromNodeId) {
      alert("Cannot connect to itself");
      return;
    }

    const fromNode = graph.nodes.find((v) => v.id === fromNodeId);
    if (!fromNode) {
      alert("Node not found");
      return;
    }

    if (!["DATA", "TRANSFORMER"].includes(fromNode.type)) {
      alert("Invalid type for connection");
      return;
    }

    /** @type {FillMissingValueWithZeroTransformerNode} */
    const newNode = {
      id: node.id,
      name: node.name,
      type: "TRANSFORMER",
      action: "FILL_WITH_ZERO",
      from: fromNodeId,
    };

    setGraph({
      nodes: [...graph.nodes.filter((v) => v.id !== node.id), newNode],
    });
    renderControllerPanel(newNode);
  };

  ControllerPanelHtmlBuilder.builder()
    .title("Fill with zero node")
    .text("Node ID", node.id)
    .text("Node name", node.name)
    .textField(
      "From (Node ID)",
      node.from ?? "",
      fromNodeInputController,
      onConfirmFromNode
    )
    .build(panel);
}

/**
 * @param {PresentationNode} node
 */
function renderPresentationNodePanel(node) {
  switch (node.action) {
    case "SAVE_TO_FILE":
      const saveToFileNode = /** @type {SaveToFileNode} */ (node);
      renderSaveToFileNodePanel(saveToFileNode);
      break;
  }
}

/**
 * @param {SaveToFileNode} node
 */
function renderSaveToFileNodePanel(node) {
  const panel = document.getElementById("controller-panel-body");
  if (!panel) {
    return;
  }

  const [graph, setGraph] = useState("diagram");

  /** @type {<K extends keyof SaveToFileNode>(key: K, value: SaveToFileNode[K]) => void} */
  const applyChange = (key, value) => {
    /** @type {SaveToFileNode} */
    const newNode = {
      ...node,
      [key]: value,
    };

    setGraph({
      nodes: [...graph.nodes.filter((v) => v.id !== node.id), newNode],
    });
    renderControllerPanel(newNode);
  };

  /** @type {(fromNodeId: string) => void } */
  const onConfirmFromNode = (fromNodeId) => {
    if (node.id === fromNodeId) {
      alert("Cannot connect to itself");
      return;
    }

    const fromNode = graph.nodes.find((v) => v.id === fromNodeId);
    if (!fromNode) {
      alert("Node not found");
      return;
    }

    if (!["DATA", "TRANSFORMER"].includes(fromNode.type)) {
      alert("Invalid type for connection");
      return;
    }

    applyChange("from", fromNodeId);
  };

  /** @type {(filePath: string) => void } */
  const onConfirmFilePath = (filePath) => {
    applyChange("filePath", filePath);
  };

  ControllerPanelHtmlBuilder.builder()
    .title("Save to file node")
    .text("Node ID", node.id)
    .text("Node name", node.name)
    .textField("From (Node ID)", node.from ?? "", null, onConfirmFromNode)
    .textField("File path", node.filePath ?? "", null, onConfirmFilePath)
    .build(panel);
}

/** @type {RenderControllerPanelFn} */
export function renderControllerPanel(node) {
  if (!node) {
    return;
  }

  switch (node.type) {
    case "DRAFT":
      const draftNode = /** @type {DraftNode} */ (node);
      renderDraftNodePanel(draftNode);
      break;
    case "DATA":
      const dataNode = /** @type {DataNode} */ (node);
      renderDataNodePanel(dataNode);
      break;
    case "TRANSFORMER":
      const transformerNode = /** @type {DataTransformerNode} */ (node);
      renderTransformerNodePanel(transformerNode);
      break;
    case "PRESENTATION":
      const presentationNode = /** @type {PresentationNode} */ (node);
      renderPresentationNodePanel(presentationNode);
      break;
  }
}

registerStateChangeListener("selectedNode", renderControllerPanel);
