import { useState, useEffect, useRef, useCallback } from 'react';
import * as Blockly from 'blockly';

// Block definition with search metadata
interface BlockInfo {
  type: string;
  label: string;
  category: string;
  categoryColor: string;
  hasInputs: boolean;
  inputs?: { name: string; type: 'value' | 'statement' }[];
}

// All available blocks for search
const ALL_BLOCKS: BlockInfo[] = [
  // Events
  { type: 'event_game_start', label: 'When I start', category: 'Events', categoryColor: '#FFAB19', hasInputs: false },
  { type: 'event_key_pressed', label: 'when key pressed', category: 'Events', categoryColor: '#FFAB19', hasInputs: false },
  { type: 'event_clicked', label: 'when this clicked', category: 'Events', categoryColor: '#FFAB19', hasInputs: false },
  { type: 'event_forever', label: 'forever', category: 'Events', categoryColor: '#FFAB19', hasInputs: false },
  { type: 'event_when_receive', label: 'when I receive', category: 'Events', categoryColor: '#FFAB19', hasInputs: false },
  { type: 'event_when_touching', label: 'when touching', category: 'Events', categoryColor: '#FFAB19', hasInputs: false },

  // Motion
  { type: 'motion_move_steps', label: 'move steps', category: 'Motion', categoryColor: '#4C97FF', hasInputs: true },
  { type: 'motion_go_to', label: 'go to x y', category: 'Motion', categoryColor: '#4C97FF', hasInputs: true },
  { type: 'motion_set_x', label: 'set x to', category: 'Motion', categoryColor: '#4C97FF', hasInputs: true },
  { type: 'motion_set_y', label: 'set y to', category: 'Motion', categoryColor: '#4C97FF', hasInputs: true },
  { type: 'motion_change_x', label: 'change x by', category: 'Motion', categoryColor: '#4C97FF', hasInputs: true },
  { type: 'motion_change_y', label: 'change y by', category: 'Motion', categoryColor: '#4C97FF', hasInputs: true },
  { type: 'motion_point_direction', label: 'point in direction', category: 'Motion', categoryColor: '#4C97FF', hasInputs: true },
  { type: 'motion_point_towards', label: 'point towards', category: 'Motion', categoryColor: '#4C97FF', hasInputs: false },
  { type: 'motion_my_x', label: 'my x', category: 'Motion', categoryColor: '#4C97FF', hasInputs: false },
  { type: 'motion_my_y', label: 'my y', category: 'Motion', categoryColor: '#4C97FF', hasInputs: false },

  // Looks
  { type: 'looks_show', label: 'show', category: 'Looks', categoryColor: '#9966FF', hasInputs: false },
  { type: 'looks_hide', label: 'hide', category: 'Looks', categoryColor: '#9966FF', hasInputs: false },
  { type: 'looks_set_size', label: 'set size to', category: 'Looks', categoryColor: '#9966FF', hasInputs: true },
  { type: 'looks_change_size', label: 'change size by', category: 'Looks', categoryColor: '#9966FF', hasInputs: true },
  { type: 'looks_set_opacity', label: 'set opacity to', category: 'Looks', categoryColor: '#9966FF', hasInputs: true },
  { type: 'looks_go_to_front', label: 'go to front', category: 'Looks', categoryColor: '#9966FF', hasInputs: false },
  { type: 'looks_go_to_back', label: 'go to back', category: 'Looks', categoryColor: '#9966FF', hasInputs: false },
  { type: 'looks_next_costume', label: 'next costume', category: 'Looks', categoryColor: '#9966FF', hasInputs: false },
  { type: 'looks_switch_costume', label: 'switch costume to', category: 'Looks', categoryColor: '#9966FF', hasInputs: true },
  { type: 'looks_costume_number', label: 'costume number', category: 'Looks', categoryColor: '#9966FF', hasInputs: false },

  // Physics
  { type: 'physics_enable', label: 'enable physics', category: 'Physics', categoryColor: '#40BF4A', hasInputs: false },
  { type: 'physics_disable', label: 'disable physics', category: 'Physics', categoryColor: '#40BF4A', hasInputs: false },
  { type: 'physics_enabled', label: 'physics enabled?', category: 'Physics', categoryColor: '#40BF4A', hasInputs: false },
  { type: 'physics_set_velocity', label: 'set velocity x y', category: 'Physics', categoryColor: '#40BF4A', hasInputs: true },
  { type: 'physics_set_velocity_x', label: 'set velocity x to', category: 'Physics', categoryColor: '#40BF4A', hasInputs: true },
  { type: 'physics_set_velocity_y', label: 'set velocity y to', category: 'Physics', categoryColor: '#40BF4A', hasInputs: true },
  { type: 'physics_set_gravity', label: 'set gravity to', category: 'Physics', categoryColor: '#40BF4A', hasInputs: true },
  { type: 'physics_set_bounce', label: 'set bounce to', category: 'Physics', categoryColor: '#40BF4A', hasInputs: true },
  { type: 'physics_set_friction', label: 'set friction to', category: 'Physics', categoryColor: '#40BF4A', hasInputs: true },
  { type: 'physics_immovable', label: 'make immovable', category: 'Physics', categoryColor: '#40BF4A', hasInputs: false },

  // Control
  { type: 'control_wait', label: 'wait seconds', category: 'Control', categoryColor: '#FFBF00', hasInputs: true },
  { type: 'control_repeat', label: 'repeat times', category: 'Control', categoryColor: '#FFBF00', hasInputs: true },
  { type: 'control_repeat_until', label: 'repeat until', category: 'Control', categoryColor: '#FFBF00', hasInputs: true },
  { type: 'control_wait_until', label: 'wait until', category: 'Control', categoryColor: '#FFBF00', hasInputs: true },
  { type: 'controls_if', label: 'if then', category: 'Control', categoryColor: '#FFBF00', hasInputs: true },
  { type: 'control_stop', label: 'stop', category: 'Control', categoryColor: '#FFBF00', hasInputs: false },
  { type: 'control_clone', label: 'clone myself', category: 'Control', categoryColor: '#FFBF00', hasInputs: false },
  { type: 'control_clone_object', label: 'clone object', category: 'Control', categoryColor: '#FFBF00', hasInputs: false },
  { type: 'control_delete_clone', label: 'delete this clone', category: 'Control', categoryColor: '#FFBF00', hasInputs: false },
  { type: 'control_broadcast', label: 'broadcast', category: 'Control', categoryColor: '#FFBF00', hasInputs: false },
  { type: 'control_broadcast_wait', label: 'broadcast and wait', category: 'Control', categoryColor: '#FFBF00', hasInputs: false },

  // Sensing
  { type: 'sensing_key_pressed', label: 'key pressed?', category: 'Sensing', categoryColor: '#5CB1D6', hasInputs: false },
  { type: 'sensing_mouse_down', label: 'mouse down?', category: 'Sensing', categoryColor: '#5CB1D6', hasInputs: false },
  { type: 'sensing_mouse_x', label: 'mouse x', category: 'Sensing', categoryColor: '#5CB1D6', hasInputs: false },
  { type: 'sensing_mouse_y', label: 'mouse y', category: 'Sensing', categoryColor: '#5CB1D6', hasInputs: false },
  { type: 'sensing_touching', label: 'touching?', category: 'Sensing', categoryColor: '#5CB1D6', hasInputs: false },
  { type: 'sensing_touching_ground', label: 'touching ground?', category: 'Sensing', categoryColor: '#5CB1D6', hasInputs: false },
  { type: 'sensing_touching_object', label: 'touching object', category: 'Sensing', categoryColor: '#5CB1D6', hasInputs: false },
  { type: 'sensing_distance_to', label: 'distance to', category: 'Sensing', categoryColor: '#5CB1D6', hasInputs: false },
  { type: 'sensing_object_x', label: "object's x", category: 'Sensing', categoryColor: '#5CB1D6', hasInputs: true },
  { type: 'sensing_object_y', label: "object's y", category: 'Sensing', categoryColor: '#5CB1D6', hasInputs: true },
  { type: 'sensing_object_costume', label: "object's costume #", category: 'Sensing', categoryColor: '#5CB1D6', hasInputs: true },

  // Camera
  { type: 'camera_follow_me', label: 'camera follow me', category: 'Camera', categoryColor: '#0fBDA8', hasInputs: false },
  { type: 'camera_follow_object', label: 'camera follow object', category: 'Camera', categoryColor: '#0fBDA8', hasInputs: false },
  { type: 'camera_stop_follow', label: 'camera stop following', category: 'Camera', categoryColor: '#0fBDA8', hasInputs: false },

  // Operators
  { type: 'math_arithmetic', label: 'math + - * /', category: 'Operators', categoryColor: '#59C059', hasInputs: true },
  { type: 'math_number', label: 'number', category: 'Operators', categoryColor: '#59C059', hasInputs: false },
  { type: 'logic_compare', label: 'compare = < >', category: 'Operators', categoryColor: '#59C059', hasInputs: true },
  { type: 'logic_operation', label: 'and or', category: 'Operators', categoryColor: '#59C059', hasInputs: true },
  { type: 'logic_negate', label: 'not', category: 'Operators', categoryColor: '#59C059', hasInputs: true },
  { type: 'logic_boolean', label: 'true false', category: 'Operators', categoryColor: '#59C059', hasInputs: false },
  { type: 'math_random_int', label: 'random number', category: 'Operators', categoryColor: '#59C059', hasInputs: true },

  // Variables
  { type: 'typed_variable_get', label: 'get variable', category: 'Variables', categoryColor: '#FF8C1A', hasInputs: false },
  { type: 'typed_variable_set', label: 'set variable to', category: 'Variables', categoryColor: '#FF8C1A', hasInputs: true },
  { type: 'typed_variable_change', label: 'change variable by', category: 'Variables', categoryColor: '#FF8C1A', hasInputs: true },

  // Debug
  { type: 'debug_console_log', label: 'console log', category: 'Debug', categoryColor: '#888888', hasInputs: true },
];

interface BlockSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspace: Blockly.WorkspaceSvg | null;
}

export function BlockSearchModal({ isOpen, onClose, workspace }: BlockSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedBlocks, setSelectedBlocks] = useState<BlockInfo[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Filter blocks based on search query
  const filteredBlocks = searchQuery.trim()
    ? ALL_BLOCKS.filter(block =>
        block.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        block.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        block.type.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : ALL_BLOCKS;

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setSelectedIndex(0);
      setSelectedBlocks([]);
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Keep selected index in bounds
  useEffect(() => {
    if (selectedIndex >= filteredBlocks.length) {
      setSelectedIndex(Math.max(0, filteredBlocks.length - 1));
    }
  }, [filteredBlocks.length, selectedIndex]);

  // Scroll selected item into view
  useEffect(() => {
    if (resultsRef.current) {
      const selectedEl = resultsRef.current.children[selectedIndex] as HTMLElement;
      if (selectedEl) {
        selectedEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  const addBlocksToWorkspace = useCallback(() => {
    if (!workspace || selectedBlocks.length === 0) return;

    let previousBlock: Blockly.Block | null = null;

    for (const blockInfo of selectedBlocks) {
      try {
        const block = workspace.newBlock(blockInfo.type);
        block.initSvg();
        block.render();

        // Position block
        if (previousBlock) {
          // Connect to previous block if possible
          const previousConnection = previousBlock.nextConnection;
          const currentConnection = block.previousConnection;
          if (previousConnection && currentConnection) {
            previousConnection.connect(currentConnection);
          }
        } else {
          // Position first block in visible area
          const metrics = workspace.getMetrics();
          const viewLeft = metrics.viewLeft || 0;
          const viewTop = metrics.viewTop || 0;
          block.moveBy(viewLeft + 50, viewTop + 50);
        }

        previousBlock = block;
      } catch (e) {
        console.error('Failed to create block:', blockInfo.type, e);
      }
    }

    // Clear selection and close
    setSelectedBlocks([]);
    onClose();
  }, [workspace, selectedBlocks, onClose]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(i => Math.min(i + 1, filteredBlocks.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(i => Math.max(i - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (searchQuery.trim() === '' && selectedBlocks.length > 0) {
          // Empty search + blocks selected = add to workspace
          addBlocksToWorkspace();
        } else if (filteredBlocks[selectedIndex]) {
          // Add selected block to queue
          setSelectedBlocks(prev => [...prev, filteredBlocks[selectedIndex]]);
          setSearchQuery('');
          setSelectedIndex(0);
        }
        break;
      case 'Backspace':
        if (searchQuery === '' && selectedBlocks.length > 0) {
          // Remove last block from queue
          setSelectedBlocks(prev => prev.slice(0, -1));
        }
        break;
      case 'Escape':
        onClose();
        break;
    }
  }, [filteredBlocks, selectedIndex, searchQuery, selectedBlocks, addBlocksToWorkspace, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-xl shadow-2xl w-[800px] max-h-[600px] flex overflow-hidden m-8">
        {/* Left side - Search and results */}
        <div className="flex-1 flex flex-col border-r border-gray-200">
          {/* Search input */}
          <div className="p-4 border-b border-gray-200">
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSelectedIndex(0);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Search blocks... (Enter to add, Enter on empty to confirm)"
              className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>

          {/* Results list */}
          <div ref={resultsRef} className="flex-1 overflow-y-auto p-2">
            {filteredBlocks.map((block, index) => (
              <div
                key={block.type}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer ${
                  index === selectedIndex ? 'bg-blue-100' : 'hover:bg-gray-100'
                }`}
                onClick={() => {
                  setSelectedBlocks(prev => [...prev, block]);
                  setSearchQuery('');
                  setSelectedIndex(0);
                  searchInputRef.current?.focus();
                }}
              >
                <div
                  className="w-3 h-3 rounded-sm flex-shrink-0"
                  style={{ backgroundColor: block.categoryColor }}
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{block.label}</div>
                  <div className="text-xs text-gray-500">{block.category}</div>
                </div>
                {block.hasInputs && (
                  <div className="text-xs text-gray-400 px-2 py-1 bg-gray-100 rounded">
                    has inputs
                  </div>
                )}
              </div>
            ))}
            {filteredBlocks.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                No blocks found
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
            <span className="font-medium">↑↓</span> Navigate
            <span className="mx-2">|</span>
            <span className="font-medium">Enter</span> Add block
            <span className="mx-2">|</span>
            <span className="font-medium">Enter</span> (empty) Confirm
            <span className="mx-2">|</span>
            <span className="font-medium">Esc</span> Close
          </div>
        </div>

        {/* Right side - Selected blocks preview */}
        <div className="w-64 bg-gray-50 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <div className="font-medium text-gray-700">Block Queue</div>
            <div className="text-xs text-gray-500 mt-1">
              {selectedBlocks.length} block{selectedBlocks.length !== 1 ? 's' : ''} selected
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {selectedBlocks.length === 0 ? (
              <div className="text-center text-gray-400 py-8 text-sm">
                Select blocks to add
              </div>
            ) : (
              <div className="space-y-1">
                {selectedBlocks.map((block, index) => (
                  <div
                    key={`${block.type}-${index}`}
                    className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-gray-200"
                  >
                    <div
                      className="w-2 h-2 rounded-sm flex-shrink-0"
                      style={{ backgroundColor: block.categoryColor }}
                    />
                    <div className="flex-1 text-sm text-gray-700 truncate">
                      {block.label}
                    </div>
                    <button
                      onClick={() => setSelectedBlocks(prev => prev.filter((_, i) => i !== index))}
                      className="text-gray-400 hover:text-red-500"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add button */}
          {selectedBlocks.length > 0 && (
            <div className="p-4 border-t border-gray-200">
              <button
                onClick={addBlocksToWorkspace}
                className="w-full py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium"
              >
                Add to Code
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
