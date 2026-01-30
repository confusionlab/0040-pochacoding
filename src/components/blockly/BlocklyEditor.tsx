import { useEffect, useRef, useState } from 'react';
import * as Blockly from 'blockly';
import { registerContinuousToolbox } from '@blockly/continuous-toolbox';
import { useProjectStore } from '@/store/projectStore';
import { useEditorStore } from '@/store/editorStore';
import { getToolboxConfig, registerTypedVariablesCategory, setAddVariableCallback } from './toolbox';
import { AddVariableDialog } from '@/components/dialogs/AddVariableDialog';
import type { UndoRedoHandler } from '@/store/editorStore';
import type { Variable } from '@/types';

// Register continuous toolbox plugin once at module load
registerContinuousToolbox();

export function BlocklyEditor() {
  const containerRef = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<Blockly.WorkspaceSvg | null>(null);
  const currentSceneIdRef = useRef<string | null>(null);
  const currentObjectIdRef = useRef<string | null>(null);
  const isLoadingRef = useRef(false);
  const [showAddVariableDialog, setShowAddVariableDialog] = useState(false);

  const { selectedSceneId, selectedObjectId, registerCodeUndo } = useEditorStore();
  const { project, addGlobalVariable, addLocalVariable } = useProjectStore();

  // Register undo/redo handler for keyboard shortcuts
  useEffect(() => {
    const handler: UndoRedoHandler = {
      undo: () => workspaceRef.current?.undo(false),
      redo: () => workspaceRef.current?.undo(true),
    };
    registerCodeUndo(handler);
    return () => registerCodeUndo(null);
  }, [registerCodeUndo]);

  // Keep refs in sync
  useEffect(() => {
    currentSceneIdRef.current = selectedSceneId;
    currentObjectIdRef.current = selectedObjectId;
  }, [selectedSceneId, selectedObjectId]);


  // Initialize Blockly workspace
  useEffect(() => {
    if (!containerRef.current) return;

    if (workspaceRef.current) {
      workspaceRef.current.dispose();
    }

    // Blockly config with Zelos renderer and continuous toolbox
    workspaceRef.current = Blockly.inject(containerRef.current, {
      toolbox: getToolboxConfig(),
      renderer: 'zelos',
      plugins: {
        toolbox: 'ContinuousToolbox',
        flyoutsVerticalToolbox: 'ContinuousFlyout',
        metricsManager: 'ContinuousMetrics',
      },
      trashcan: false,
      zoom: {
        controls: false,
        wheel: true,
        startScale: 0.8,
      },
      move: {
        scrollbars: true,
        drag: true,
        wheel: true,
      },
    });

    // Register typed variables category callback
    registerTypedVariablesCategory(workspaceRef.current);

    // Set up callback for "Add Variable" button
    setAddVariableCallback(() => setShowAddVariableDialog(true));

    // Save on changes
    workspaceRef.current.addChangeListener((event) => {
      if (isLoadingRef.current) return;
      if (event.type === Blockly.Events.BLOCK_CHANGE ||
          event.type === Blockly.Events.BLOCK_CREATE ||
          event.type === Blockly.Events.BLOCK_DELETE ||
          event.type === Blockly.Events.BLOCK_MOVE) {
        const sceneId = currentSceneIdRef.current;
        const objectId = currentObjectIdRef.current;
        if (!workspaceRef.current || !sceneId || !objectId) return;

        const state = useProjectStore.getState();
        const scene = state.project?.scenes.find(s => s.id === sceneId);
        const obj = scene?.objects.find(o => o.id === objectId);
        if (!obj) return;

        // Check if workspace has any blocks
        const topBlocks = workspaceRef.current.getTopBlocks(false);
        const xmlText = topBlocks.length === 0
          ? ''
          : Blockly.Xml.domToText(Blockly.Xml.workspaceToDom(workspaceRef.current));

        // If this is a component instance, update the component definition
        if (obj.componentId) {
          state.updateComponent(obj.componentId, { blocklyXml: xmlText });
        } else {
          state.updateObject(sceneId, objectId, { blocklyXml: xmlText });
        }
      }
    });

    // Handle resize
    const resizeObserver = new ResizeObserver(() => {
      if (workspaceRef.current) {
        Blockly.svgResize(workspaceRef.current);
      }
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      if (workspaceRef.current) {
        workspaceRef.current.dispose();
        workspaceRef.current = null;
      }
    };
  }, []);

  // Load workspace when object ID changes (not when XML changes - we're the ones changing it)
  useEffect(() => {
    if (!workspaceRef.current) return;
    isLoadingRef.current = true;
    workspaceRef.current.clear();

    // Get fresh object data from store
    const state = useProjectStore.getState();
    const scene = state.project?.scenes.find(s => s.id === selectedSceneId);
    const obj = scene?.objects.find(o => o.id === selectedObjectId);

    // Get effective blocklyXml (from component if it's an instance)
    let blocklyXml = obj?.blocklyXml || '';
    if (obj?.componentId) {
      const component = (state.project?.components || []).find(c => c.id === obj.componentId);
      if (component) {
        blocklyXml = component.blocklyXml;
      }
    }

    if (blocklyXml) {
      try {
        const xml = Blockly.utils.xml.textToDom(blocklyXml);
        Blockly.Xml.domToWorkspace(xml, workspaceRef.current);
      } catch (e) {
        console.error('Failed to load Blockly XML:', e);
      }
    }

    setTimeout(() => {
      isLoadingRef.current = false;
    }, 50);
  }, [selectedObjectId, selectedSceneId]);

  // Get current object name for local variable option
  const currentObjectName = (() => {
    if (!project || !selectedSceneId || !selectedObjectId) return undefined;
    const scene = project.scenes.find(s => s.id === selectedSceneId);
    return scene?.objects.find(o => o.id === selectedObjectId)?.name;
  })();

  const handleAddVariable = (variable: Variable) => {
    if (variable.scope === 'global') {
      addGlobalVariable(variable);
    } else if (selectedSceneId && selectedObjectId) {
      addLocalVariable(selectedSceneId, selectedObjectId, variable);
    }
    // Refresh the toolbox to show the new variable
    if (workspaceRef.current) {
      workspaceRef.current.refreshToolboxSelection();
    }
  };

  return (
    <>
      <div ref={containerRef} className="h-full w-full" />
      <AddVariableDialog
        open={showAddVariableDialog}
        onOpenChange={setShowAddVariableDialog}
        onAdd={handleAddVariable}
        objectName={currentObjectName}
      />
    </>
  );
}
