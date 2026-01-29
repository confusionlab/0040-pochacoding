import { useState, useEffect } from 'react';
import { useProjectStore } from '../../store/projectStore';
import { useEditorStore } from '../../store/editorStore';
import type { GameObject, Scene, GroundConfig } from '../../types';

type TabType = 'object' | 'scene';

export function ObjectInspector() {
  const { project, updateObject, updateScene } = useProjectStore();
  const { selectedSceneId, selectedObjectId } = useEditorStore();
  const [activeTab, setActiveTab] = useState<TabType>('object');

  const scene = project?.scenes.find(s => s.id === selectedSceneId);
  const object = scene?.objects.find(o => o.id === selectedObjectId);

  // Switch to object tab when an object is selected
  useEffect(() => {
    if (selectedObjectId) {
      setActiveTab('object');
    }
  }, [selectedObjectId]);

  return (
    <div className="bg-gray-50 border-t border-gray-200">
      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('object')}
          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'object'
              ? 'text-[var(--color-primary)] border-b-2 border-[var(--color-primary)] bg-white'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Object
        </button>
        <button
          onClick={() => setActiveTab('scene')}
          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'scene'
              ? 'text-[var(--color-primary)] border-b-2 border-[var(--color-primary)] bg-white'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Scene
        </button>
      </div>

      {/* Tab Content */}
      <div className="px-4 py-3">
        {activeTab === 'object' ? (
          <ObjectProperties
            object={object}
            sceneId={selectedSceneId}
            updateObject={updateObject}
          />
        ) : (
          <SceneProperties
            scene={scene}
            updateScene={updateScene}
          />
        )}
      </div>
    </div>
  );
}

interface ObjectPropertiesProps {
  object: GameObject | undefined;
  sceneId: string | null;
  updateObject: (sceneId: string, objectId: string, updates: Partial<GameObject>) => void;
}

function ObjectProperties({ object, sceneId, updateObject }: ObjectPropertiesProps) {
  if (!object || !sceneId) {
    return (
      <div className="text-center text-gray-500 text-sm py-4">
        Select an object to view its properties
      </div>
    );
  }

  return (
    <>
      <div className="text-sm font-medium text-gray-700 mb-3">
        Properties: {object.name}
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <PositionField object={object} sceneId={sceneId} updateObject={updateObject} />
        <ScaleField object={object} sceneId={sceneId} updateObject={updateObject} />
        <RotationField object={object} sceneId={sceneId} updateObject={updateObject} />
        <VisibilityField object={object} sceneId={sceneId} updateObject={updateObject} />
        <PhysicsToggle object={object} sceneId={sceneId} updateObject={updateObject} />
      </div>
    </>
  );
}

interface ScenePropertiesProps {
  scene: Scene | undefined;
  updateScene: (sceneId: string, updates: Partial<Scene>) => void;
}

function SceneProperties({ scene, updateScene }: ScenePropertiesProps) {
  if (!scene) {
    return (
      <div className="text-center text-gray-500 text-sm py-4">
        No scene selected
      </div>
    );
  }

  const ground = scene.ground || { enabled: false, y: 500, color: '#8B4513' };

  const updateGround = (updates: Partial<GroundConfig>) => {
    updateScene(scene.id, {
      ground: { ...ground, ...updates }
    });
  };

  return (
    <>
      <div className="text-sm font-medium text-gray-700 mb-3">
        Scene: {scene.name}
      </div>

      {/* Background Color */}
      <div className="mb-4">
        <label className="block text-sm text-gray-600 mb-1">Background Color</label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={scene.background?.value || '#87CEEB'}
            onChange={(e) => updateScene(scene.id, {
              background: { type: 'color', value: e.target.value }
            })}
            className="w-10 h-8 rounded border border-gray-300 cursor-pointer"
          />
          <input
            type="text"
            value={scene.background?.value || '#87CEEB'}
            onChange={(e) => updateScene(scene.id, {
              background: { type: 'color', value: e.target.value }
            })}
            className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
          />
        </div>
      </div>

      {/* Ground Settings */}
      <div className="border-t border-gray-200 pt-3">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-gray-700">Ground</span>
          <button
            onClick={() => updateGround({ enabled: !ground.enabled })}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              ground.enabled
                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            }`}
          >
            {ground.enabled ? 'Enabled' : 'Disabled'}
          </button>
        </div>

        {ground.enabled && (
          <div className="space-y-3">
            {/* Ground Y Position */}
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600 w-20">Y Position:</label>
              <input
                type="number"
                value={ground.y}
                onChange={(e) => updateGround({ y: parseFloat(e.target.value) || 500 })}
                className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
              />
            </div>

            {/* Ground Color */}
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600 w-20">Color:</label>
              <input
                type="color"
                value={ground.color}
                onChange={(e) => updateGround({ color: e.target.value })}
                className="w-10 h-8 rounded border border-gray-300 cursor-pointer"
              />
              <input
                type="text"
                value={ground.color}
                onChange={(e) => updateGround({ color: e.target.value })}
                className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
              />
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// Object property field components

interface FieldProps {
  object: GameObject;
  sceneId: string;
  updateObject: (sceneId: string, objectId: string, updates: Partial<GameObject>) => void;
}

function PositionField({ object, sceneId, updateObject }: FieldProps) {
  const [x, setX] = useState(object.x.toString());
  const [y, setY] = useState(object.y.toString());

  useEffect(() => {
    setX(object.x.toString());
    setY(object.y.toString());
  }, [object.x, object.y]);

  const handleBlur = () => {
    const newX = parseFloat(x) || 0;
    const newY = parseFloat(y) || 0;
    updateObject(sceneId, object.id, { x: newX, y: newY });
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <label className="text-gray-600 w-6">X:</label>
        <input
          type="number"
          value={x}
          onChange={(e) => setX(e.target.value)}
          onBlur={handleBlur}
          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
        />
      </div>
      <div className="flex items-center gap-2">
        <label className="text-gray-600 w-6">Y:</label>
        <input
          type="number"
          value={y}
          onChange={(e) => setY(e.target.value)}
          onBlur={handleBlur}
          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
        />
      </div>
    </>
  );
}

function ScaleField({ object, sceneId, updateObject }: FieldProps) {
  const [scaleX, setScaleX] = useState((object.scaleX * 100).toString());
  const [scaleY, setScaleY] = useState((object.scaleY * 100).toString());

  useEffect(() => {
    setScaleX((object.scaleX * 100).toString());
    setScaleY((object.scaleY * 100).toString());
  }, [object.scaleX, object.scaleY]);

  const handleBlur = () => {
    const newScaleX = (parseFloat(scaleX) || 100) / 100;
    const newScaleY = (parseFloat(scaleY) || 100) / 100;
    updateObject(sceneId, object.id, { scaleX: newScaleX, scaleY: newScaleY });
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <label className="text-gray-600 w-16">Scale X:</label>
        <input
          type="number"
          value={scaleX}
          onChange={(e) => setScaleX(e.target.value)}
          onBlur={handleBlur}
          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
        />
        <span className="text-gray-500">%</span>
      </div>
      <div className="flex items-center gap-2">
        <label className="text-gray-600 w-16">Scale Y:</label>
        <input
          type="number"
          value={scaleY}
          onChange={(e) => setScaleY(e.target.value)}
          onBlur={handleBlur}
          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
        />
        <span className="text-gray-500">%</span>
      </div>
    </>
  );
}

function RotationField({ object, sceneId, updateObject }: FieldProps) {
  const [rotation, setRotation] = useState(object.rotation.toString());

  useEffect(() => {
    setRotation(object.rotation.toString());
  }, [object.rotation]);

  const handleBlur = () => {
    const newRotation = parseFloat(rotation) || 0;
    updateObject(sceneId, object.id, { rotation: newRotation });
  };

  return (
    <div className="flex items-center gap-2 col-span-2">
      <label className="text-gray-600 w-16">Rotation:</label>
      <input
        type="number"
        value={rotation}
        onChange={(e) => setRotation(e.target.value)}
        onBlur={handleBlur}
        className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
        min="0"
        max="360"
      />
      <span className="text-gray-500">degrees</span>
    </div>
  );
}

function VisibilityField({ object, sceneId, updateObject }: FieldProps) {
  return (
    <div className="flex items-center gap-2 col-span-2">
      <label className="text-gray-600">Visible:</label>
      <input
        type="checkbox"
        checked={object.visible}
        onChange={(e) => updateObject(sceneId, object.id, { visible: e.target.checked })}
        className="w-4 h-4 rounded border-gray-300"
      />
    </div>
  );
}

function PhysicsToggle({ object, sceneId, updateObject }: FieldProps) {
  const hasPhysics = object.physics?.enabled ?? false;

  const togglePhysics = () => {
    if (hasPhysics) {
      updateObject(sceneId, object.id, { physics: null });
    } else {
      updateObject(sceneId, object.id, {
        physics: {
          enabled: true,
          bodyType: 'dynamic',
          gravityY: 300,
          velocityX: 0,
          velocityY: 0,
          bounceX: 0,
          bounceY: 0.2,
          collideWorldBounds: true,
          immovable: false,
        },
      });
    }
  };

  return (
    <div className="flex items-center gap-2 col-span-2 pt-2 border-t border-gray-200">
      <label className="text-gray-600">Physics:</label>
      <button
        onClick={togglePhysics}
        className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
          hasPhysics
            ? 'bg-green-100 text-green-700 hover:bg-green-200'
            : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
        }`}
      >
        {hasPhysics ? 'Enabled' : 'Disabled'}
      </button>
    </div>
  );
}
