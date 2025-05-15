import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Tab } from '@headlessui/react';
import { ArrowPathIcon, PlusIcon, TrashIcon, LockClosedIcon, LockOpenIcon, QuestionMarkCircleIcon, MapIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import * as math from 'mathjs';
import ScalingSummary from './ScalingSummary';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import ScalingGroupsPreview from '../process_economics/components/ScalingGroupsPreview';
import ClimateModule from './ClimateModule';
import CoordinateContainer from './CoordinateContainer';
import CoordinateComponent from './CoordinateComponent';
import CoordinateFactFinder from './CoordinateFactFinder';
import '../process_economics/styles/ScalingGroupsPreview.css';
import '../../styles/HomePage.CSS/HCSS.css';
import './styles/DeleteConfirmationModal.css';
import './styles/ExtendedScaling.css';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { motion, AnimatePresence } from 'framer-motion';
import PropTypes from 'prop-types';

// Tooltip component for operation explanations
const Tooltip = ({ content, children }) => {
  const [isVisible, setIsVisible] = useState(false);
  const tooltipRef = useRef(null);

  return (
      <div
          className="tooltip-container"
          onMouseEnter={() => setIsVisible(true)}
          onMouseLeave={() => setIsVisible(false)}
      >
        {children}
        <AnimatePresence>
          {isVisible && (
              <motion.div
                  ref={tooltipRef}
                  className="tooltip"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.2 }}
              >
                {content}
              </motion.div>
          )}
        </AnimatePresence>
      </div>
  );
};

// Documentation panel to explain cumulative calculations
const CumulativeDocumentation = ({ onClose }) => (
    <div className="scaling-documentation">
      <h4>Understanding Cumulative Calculations</h4>
      <p>In this scaling system, each tab (after the Default Scaling) builds upon the results of previous tabs:</p>

      <ol>
        <li><strong>Default Scaling</strong> - Uses original base values from your cost data</li>
        <li><strong>Subsequent Tabs</strong> - Each uses the results from the previous tab as its base values</li>
      </ol>

      <p>When you add, remove, or modify tabs, all subsequent tabs automatically update to maintain the mathematical flow.</p>

      <div className="scaling-documentation-example">
        <div className="example-flow">
          <div className="example-tab">
            <div>Default Tab</div>
            <div className="example-value">Base: 100</div>
            <div className="example-op">× 2</div>
            <div className="example-result">Result: 200</div>
          </div>
          <div className="example-arrow">→</div>
          <div className="example-tab">
            <div>Second Tab</div>
            <div className="example-value">Base: 200</div>
            <div className="example-op">+ 50</div>
            <div className="example-result">Result: 250</div>
          </div>
          <div className="example-arrow">→</div>
          <div className="example-tab">
            <div>Third Tab</div>
            <div className="example-value">Base: 250</div>
            <div className="example-op">× 1.2</div>
            <div className="example-result">Result: 300</div>
          </div>
        </div>
      </div>

      <button className="scaling-documentation-button" onClick={onClose}>
        Got it
      </button>
    </div>
);

// Draggable scaling item component
const DraggableScalingItem = ({ item, index, moveItem, V, R, toggleV, toggleR, ...props }) => {
  const ref = useRef(null);

  const [{ handlerId }, drop] = useDrop({
    accept: 'scaling-item',
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId(),
      };
    },
    hover(item, monitor) {
      if (!ref.current) return;
      const dragIndex = item.index;
      const hoverIndex = index;
      if (dragIndex === hoverIndex) return;

      const hoverBoundingRect = ref.current?.getBoundingClientRect();
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;

      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) return;
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) return;

      moveItem(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  const [{ isDragging }, drag] = useDrag({
    type: 'scaling-item',
    item: () => ({ id: item.id, index }),
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  drag(drop(ref));

  // Render V and R checkboxes if applicable
  const renderVRCheckboxes = () => {
    return (
        <div className="checkbox-section">
          {item.vKey && (
              <div className="checkbox-group">
                <span className="checkbox-label">{item.vKey}</span>
                <input
                    type="checkbox"
                    className="custom-checkbox"
                    checked={V && V[item.vKey] === 'on'}
                    onChange={() => toggleV && toggleV(item.vKey)}
                />
              </div>
          )}
          {item.rKey && (
              <div className="checkbox-group">
                <span className="checkbox-label">{item.rKey}</span>
                <input
                    type="checkbox"
                    className="custom-checkbox"
                    checked={R && R[item.rKey] === 'on'}
                    onChange={() => toggleR && toggleR(item.rKey)}
                />
              </div>
          )}
        </div>
    );
  };

  return (
      <motion.div
          ref={ref}
          layout
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
          style={{ opacity: isDragging ? 0.5 : 1 }}
          data-handler-id={handlerId}
          {...props}
      >
        {(item.vKey || item.rKey) && renderVRCheckboxes()}
        {props.children}
      </motion.div>
  );
};

// Main ExtendedScaling Component
const ExtendedScaling = ({
                           baseCosts = [],
                           onScaledValuesChange,
                           onSave,
                           initialScalingGroups = [],
                           onScalingGroupsChange,
                           filterKeyword = '',
                           V,
                           R,
                           toggleV,
                           toggleR,
                           activeGroupIndex = 0,
                           onActiveGroupChange = () => {},
                           onFinalResultsGenerated
                         }) => {
  // State for history and undo/redo
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [historyEntries, setHistoryEntries] = useState([]);

  // File handling for import
  const fileInputRef = useRef(null);

  // State for UI elements
  const [errors, setErrors] = useState({});
  const [protectedTabs, setProtectedTabs] = useState(new Set([]));
  const [tabConfigs, setTabConfigs] = useState([]);
  const [itemExpressions, setItemExpressions] = useState({});
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [showDocumentation, setShowDocumentation] = useState(false);

  // State for carbon footprint tracking
  const [carbonFootprints, setCarbonFootprints] = useState({});

  // State for delete confirmation modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState(null);
  const [groupIndexToDelete, setGroupIndexToDelete] = useState(null);

  // State for coordinate component
  const [showCoordinates, setShowCoordinates] = useState(false);
  const [selectedZone, setSelectedZone] = useState(null);
  const [zoneAssets, setZoneAssets] = useState([]);
  const [showFactFinder, setShowFactFinder] = useState(false);
  const [factFinderData, setFactFinderData] = useState({});

  // State for visualization panel
  const [showVisualization, setShowVisualization] = useState(false);
  const [visualizationType, setVisualizationType] = useState('summary');

  // Enhanced operations with descriptions
  const operations = [
    {
      id: 'multiply',
      label: 'Multiply',
      symbol: '×',
      description: 'Multiplies the base value by the scaling factor'
    },
    {
      id: 'power',
      label: 'Power',
      symbol: '^',
      description: 'Raises the base value to the power of the scaling factor'
    },
    {
      id: 'divide',
      label: 'Divide',
      symbol: '÷',
      description: 'Divides the base value by the scaling factor'
    },
    {
      id: 'log',
      label: 'Logarithmic',
      symbol: 'ln',
      description: 'Applies logarithmic scaling using the natural log'
    },
    {
      id: 'exponential',
      label: 'Exponential',
      symbol: 'eˣ',
      description: 'Applies exponential scaling'
    },
    {
      id: 'add',
      label: 'Add',
      symbol: '+',
      description: 'Adds the scaling factor to the base value'
    },
    {
      id: 'subtract',
      label: 'Subtract',
      symbol: '-',
      description: 'Subtracts the scaling factor from the base value'
    }
  ];

  // Enhanced error handling and validation
  const calculateScaledValue = useCallback((baseValue, operation, factor) => {
    try {
      if (baseValue === 0 && operation === 'divide') {
        throw new Error('Division by zero');
      }
      if (baseValue < 0 && operation === 'log') {
        throw new Error('Logarithm of negative number');
      }

      let result;
      switch (operation) {
        case 'multiply':
          result = math.multiply(baseValue, factor);
          break;
        case 'power':
          result = math.pow(baseValue, factor);
          break;
        case 'divide':
          result = math.divide(baseValue, factor);
          break;
        case 'log':
          result = math.multiply(math.log(baseValue), factor);
          break;
        case 'exponential':
          result = math.exp(math.multiply(math.log(baseValue), factor));
          break;
        case 'add':
          result = math.add(baseValue, factor);
          break;
        case 'subtract':
          result = math.subtract(baseValue, factor);
          break;
        default:
          result = baseValue;
      }

      if (!isFinite(result)) {
        throw new Error('Result is not a finite number');
      }

      return result;
    } catch (error) {
      setErrors(prev => ({
        ...prev,
        [baseValue]: error.message
      }));
      return 0;
    }
  }, []);

  // Main scaling groups state
  const [scalingGroups, setScalingGroups] = useState(() => {
    // Initialize with provided groups or create a default group
    const initialGroups = initialScalingGroups.length > 0
        ? initialScalingGroups
        : [{
          id: 'default',
          name: 'Default Scaling',
          isProtected: false,
          _scalingType: filterKeyword, // Store the scaling type
          items: baseCosts.map(cost => ({
            ...cost,
            originalBaseValue: parseFloat(cost.value) || cost.baseValue || 0,
            baseValue: parseFloat(cost.value) || cost.baseValue || 0,
            scalingFactor: 1,
            operation: 'multiply',
            enabled: true,
            notes: '',
            scaledValue: parseFloat(cost.value) || cost.baseValue || 0
          }))
        }];

    setHistory([initialGroups]);
    setHistoryIndex(0);

    // Create initial history entry
    setHistoryEntries([{
      id: `history_${Date.now()}_initial`,
      timestamp: Date.now(),
      action: 'initialize',
      description: 'Initial scaling configuration',
      snapshots: {
        scalingGroups: JSON.parse(JSON.stringify(initialGroups)),
        protectedTabs: []
      }
    }]);

    return initialGroups;
  });

  const [selectedGroup, setSelectedGroup] = useState(activeGroupIndex || 0);

  // Add a synchronization function for tab configurations
  const syncTabConfigs = useCallback(() => {
    const newTabConfigs = scalingGroups.map(group => ({
      id: group.id,
      label: group.name,
      isProtected: protectedTabs.has(group.id),
      _scalingType: group._scalingType || filterKeyword
    }));
    setTabConfigs(newTabConfigs);
  }, [scalingGroups, protectedTabs, filterKeyword]);

  // Call this whenever scalingGroups change
  useEffect(() => {
    syncTabConfigs();
  }, [scalingGroups, syncTabConfigs]);

  // Enhanced history tracking with tabConfigs
  const addToHistory = useCallback((newGroups, action, description, payload = {}) => {
    // Create a history entry with detailed metadata
    const historyEntry = {
      id: `history_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      timestamp: Date.now(),
      action: action,
      description: description,
      payload: payload,
      snapshots: {
        scalingGroups: JSON.parse(JSON.stringify(newGroups)),
        protectedTabs: Array.from(protectedTabs),
        tabConfigs: JSON.parse(JSON.stringify(tabConfigs))
      }
    };

    // Update the regular history state for undo/redo
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newGroups);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);

    // Add to detailed history entries
    const newHistoryEntries = historyEntries.slice(0, historyIndex + 1);
    newHistoryEntries.push(historyEntry);
    setHistoryEntries(newHistoryEntries);
  }, [history, historyIndex, protectedTabs, tabConfigs, historyEntries]);

  // Toggle protection for a scaling group
  const toggleProtection = useCallback((groupId) => {
    const isCurrentlyProtected = protectedTabs.has(groupId);

    setProtectedTabs(prev => {
      const newProtected = new Set(prev);
      if (newProtected.has(groupId)) {
        newProtected.delete(groupId);
      } else {
        newProtected.add(groupId);
      }
      return newProtected;
    });

    const action = isCurrentlyProtected ? 'unprotect_group' : 'protect_group';
    const description = isCurrentlyProtected
        ? `Removed protection from group "${scalingGroups.find(g => g.id === groupId)?.name || groupId}"`
        : `Protected group "${scalingGroups.find(g => g.id === groupId)?.name || groupId}"`;

    // We need to clone the current scaling groups to avoid reference issues
    const newGroups = JSON.parse(JSON.stringify(scalingGroups));

    // Update tab configs when protection status changes
    const newTabConfigs = tabConfigs.map(tab =>
        tab.id === groupId
            ? { ...tab, isProtected: !isCurrentlyProtected }
            : tab
    );
    setTabConfigs(newTabConfigs);

    // Add to history
    addToHistory(
        newGroups,
        action,
        description,
        {
          groupId,
          previousState: isCurrentlyProtected,
          newState: !isCurrentlyProtected,
          tabConfigs: newTabConfigs
        }
    );
  }, [protectedTabs, scalingGroups, addToHistory, tabConfigs]);

  // Undo/Redo functionality
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setScalingGroups(history[historyIndex - 1]);
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setScalingGroups(history[historyIndex + 1]);
    }
  }, [history, historyIndex]);

  // Function to propagate changes to all subsequent groups
  const propagateChanges = useCallback((groups, startIndex) => {
    const updatedGroups = [...groups];

    // Skip processing if we're at the last group or beyond
    if (startIndex >= updatedGroups.length - 1) {
      return updatedGroups;
    }

    // For each subsequent group, update base values from the previous group's results
    for (let i = startIndex + 1; i < updatedGroups.length; i++) {
      const previousGroup = updatedGroups[i - 1];
      const currentGroup = {...updatedGroups[i]};

      // Create a map of previous results
      const previousResults = previousGroup.items.reduce((acc, item) => {
        acc[item.id] = {
          scaledValue: item.enabled ? item.scaledValue : item.baseValue,
          enabled: item.enabled
        };
        return acc;
      }, {});

      // Update each item in the current group
      currentGroup.items = currentGroup.items.map(item => {
        const prevResult = previousResults[item.id];
        if (!prevResult) return item;

        // Calculate new scaled value based on updated base value
        const newBaseValue = prevResult.scaledValue;
        const newScaledValue = calculateScaledValue(
            newBaseValue,
            item.operation,
            item.scalingFactor
        );

        return {
          ...item,
          originalBaseValue: item.originalBaseValue || item.baseValue, // Preserve original
          baseValue: newBaseValue,
          scaledValue: item.enabled ? newScaledValue : newBaseValue
        };
      });

      updatedGroups[i] = currentGroup;
    }

    return updatedGroups;
  }, [calculateScaledValue]);

  // Helper function to determine the correct insertion index
  const determineInsertionIndex = useCallback((groupNumber, groups) => {
    // Look for the position where this group should be inserted based on numbering
    for (let i = 0; i < groups.length; i++) {
      const match = groups[i].name.match(/Scaling Group (\d+)/);
      if (match) {
        const currentNumber = parseInt(match[1], 10);
        if (currentNumber > groupNumber) {
          return i; // Insert before this group
        }
      }
    }
    return groups.length; // Append at the end if no suitable position found
  }, []);

  // Process imported configuration for cumulative calculations
  const processImportedConfiguration = useCallback((groups) => {
    if (!Array.isArray(groups) || groups.length === 0) {
      throw new Error("Invalid or empty groups array");
    }

    // First, validate all groups and ensure they have the required structure
    const validatedGroups = groups.map((group, index) => {
      // Ensure group has all required properties
      const processedGroup = {
        id: group.id || `group-${Date.now()}-${index}`,
        name: group.name || `Scaling Group ${index + 1}`,
        isProtected: !!group.isProtected,
        _scalingType: group._scalingType || filterKeyword || "mixed", // Ensure scaling type is preserved
        items: Array.isArray(group.items) ? [...group.items] : []
      };

      // Process all items in the group to ensure they have required properties
      processedGroup.items = processedGroup.items.map(item => {
        const processedItem = {
          id: item.id || `item-${Date.now()}-${Math.random()}`,
          label: item.label || item.id || 'Unknown Item',
          originalBaseValue: item.originalBaseValue || item.baseValue || 0,
          baseValue: item.baseValue || 0,
          scalingFactor: item.scalingFactor !== undefined ? item.scalingFactor : 1,
          operation: item.operation || 'multiply',
          enabled: item.enabled !== undefined ? !!item.enabled : true,
          notes: item.notes || '',
          vKey: item.vKey || null,
          rKey: item.rKey || null,
          scaledValue: item.scaledValue !== undefined ? item.scaledValue :
              calculateScaledValue(
                  item.baseValue || 0,
                  item.operation || 'multiply',
                  item.scalingFactor !== undefined ? item.scalingFactor : 1
              )
        };

        return processedItem;
      });

      return processedGroup;
    });

    // Now process cumulative relationships to ensure mathematical integrity
    if (validatedGroups.length > 1) {
      // For the first group, ensure base values are original values
      validatedGroups[0].items = validatedGroups[0].items.map(item => ({
        ...item,
        baseValue: item.originalBaseValue || item.baseValue,
        scaledValue: calculateScaledValue(
            item.originalBaseValue || item.baseValue,
            item.operation,
            item.scalingFactor
        )
      }));

      // Then process all subsequent groups
      for (let i = 1; i < validatedGroups.length; i++) {
        // Get results from the previous group to use as base values
        const previousGroup = validatedGroups[i - 1];
        const previousResults = previousGroup.items.reduce((acc, item) => {
          acc[item.id] = {
            scaledValue: item.enabled ? item.scaledValue : item.baseValue,
            enabled: item.enabled
          };
          return acc;
        }, {});

        // Update base values and recalculate scaled values
        validatedGroups[i].items = validatedGroups[i].items.map(item => {
          const prevResult = previousResults[item.id];

          // If no previous result exists, keep original values
          if (!prevResult) return item;

          // Update base value to previous group's result
          const newBaseValue = prevResult.scaledValue;

          // Calculate new scaled value
          const newScaledValue = item.enabled
              ? calculateScaledValue(newBaseValue, item.operation, item.scalingFactor)
              : newBaseValue;

          return {
            ...item,
            baseValue: newBaseValue,
            scaledValue: newScaledValue
          };
        });
      }
    }

    return validatedGroups;
  }, [calculateScaledValue, filterKeyword]);

  // Enhanced export with history and tabConfigs
  const exportConfiguration = useCallback(() => {
    setIsExporting(true);
    try {
      // Ensure tab configs are synced before export
      syncTabConfigs();

      // Enhanced format with cumulative calculation metadata
      const exportData = {
        version: "1.2.0", // Update version to indicate enhanced cumulative support
        metadata: {
          exportDate: new Date().toISOString(),
          exportedBy: "ScalingModule",
          description: "Complete scaling configuration with cumulative calculations",
          scalingType: filterKeyword || "mixed"
        },
        currentState: {
          selectedGroupIndex: selectedGroup,
          scalingGroups: scalingGroups.map((group, index) => ({
            ...group,
            isCumulative: index > 0, // Flag to indicate cumulative source
            sourceGroupIndex: index > 0 ? index - 1 : null // Source of base values
          })),
          protectedTabs: Array.from(protectedTabs),
          itemExpressions: itemExpressions || {},
          tabConfigs: tabConfigs, // Include tabConfigs in export
          zoneData: {
            selectedZone,
            zoneAssets
          },
          carbonFootprints
        },
        history: historyEntries
      };

      const config = JSON.stringify(exportData, null, 2);

      // Create download link
      const blob = new Blob([config], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `scaling-config-${filterKeyword || 'mixed'}-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      setErrors(prev => ({
        ...prev,
        export: error.message
      }));
    } finally {
      setIsExporting(false);
    }
  }, [
    scalingGroups,
    protectedTabs,
    selectedGroup,
    historyEntries,
    itemExpressions,
    filterKeyword,
    tabConfigs,
    syncTabConfigs,
    selectedZone,
    zoneAssets,
    carbonFootprints
  ]);

  // Enhanced import with backward compatibility and tabConfigs support
  const importConfiguration = useCallback((event) => {
    setIsImporting(true);
    try {
      const file = event.target.files[0];
      if (!file) {
        setIsImporting(false);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedData = JSON.parse(e.target.result);

          // Check if it's the legacy format (has groups property at the root)
          const isLegacyFormat = importedData.groups && Array.isArray(importedData.groups);
          const isV11Format = importedData.version === "1.1.0";
          const isV12Format = importedData.version === "1.2.0";

          // Extract scaling groups and protected tabs based on format
          let importedGroups, importedProtectedTabs, importedTabConfigs, importedZoneData, importedCarbonFootprints;

          if (isLegacyFormat) {
            // Handle legacy format
            importedGroups = importedData.groups;
            importedProtectedTabs = new Set(importedData.protectedTabs || []);
            importedTabConfigs = null; // Not available in legacy format
          } else if (isV11Format || isV12Format) {
            // Handle 1.1 or 1.2 format
            importedGroups = importedData.currentState.scalingGroups;
            importedProtectedTabs = new Set(importedData.currentState.protectedTabs || []);
            importedTabConfigs = importedData.currentState.tabConfigs || null;

            // Extract additional data in 1.2 format
            if (isV12Format) {
              importedZoneData = importedData.currentState.zoneData;
              importedCarbonFootprints = importedData.currentState.carbonFootprints;
            }
          } else {
            throw new Error("Invalid configuration format");
          }

          // If importing from 1.2 format, check scaling type compatibility
          if (isV12Format && importedData.metadata.scalingType) {
            const importedType = importedData.metadata.scalingType;
            if (filterKeyword && importedType !== filterKeyword && importedType !== "mixed") {
              const confirmImport = window.confirm(
                  `This configuration was created for "${importedType}" scaling, but you're currently in "${filterKeyword}" scaling. Import anyway?`
              );
              if (!confirmImport) {
                setIsImporting(false);
                return;
              }
            }
          }

          // Add scaling type to groups if from older format
          if (isLegacyFormat || isV11Format) {
            importedGroups = importedGroups.map(group => ({
              ...group,
              _scalingType: filterKeyword || "mixed"
            }));
          }

          // Process and validate groups
          const processedGroups = processImportedConfiguration(importedGroups);

          // Update state
          setScalingGroups(processedGroups);
          setProtectedTabs(importedProtectedTabs);
          setSelectedGroup(0);

          // Handle tab configurations
          if (importedTabConfigs && Array.isArray(importedTabConfigs)) {
            // Ensure tabConfigs match current groups
            const syncedTabConfigs = processedGroups.map(group => {
              const matchingTabConfig = importedTabConfigs.find(tab => tab.id === group.id);

              return {
                id: group.id,
                label: group.name,
                isProtected: importedProtectedTabs.has(group.id),
                _scalingType: group._scalingType || filterKeyword,
                ...(matchingTabConfig || {})
              };
            });

            setTabConfigs(syncedTabConfigs);
          } else {
            // Generate new tabConfigs
            syncTabConfigs();
          }

          // Import zone data if available
          if (importedZoneData) {
            if (importedZoneData.selectedZone) {
              setSelectedZone(importedZoneData.selectedZone);
            }
            if (importedZoneData.zoneAssets) {
              setZoneAssets(importedZoneData.zoneAssets);
            }
          }

          // Import carbon footprints if available
          if (importedCarbonFootprints) {
            setCarbonFootprints(importedCarbonFootprints);
          }

          // Create new history
          const newHistory = [processedGroups];
          setHistory(newHistory);
          setHistoryIndex(0);

          // Create initial history entry
          const initialHistoryEntry = {
            id: `history_${Date.now()}_import`,
            timestamp: Date.now(),
            action: 'import_configuration',
            description: `Imported ${processedGroups.length} scaling groups from ${file.name}`,
            snapshots: {
              scalingGroups: JSON.parse(JSON.stringify(processedGroups)),
              protectedTabs: Array.from(importedProtectedTabs),
              tabConfigs: JSON.parse(JSON.stringify(tabConfigs || []))
            }
          };
          setHistoryEntries([initialHistoryEntry]);

          // Update parent component
          if (onScalingGroupsChange) {
            onScalingGroupsChange(processedGroups);
          }

          // Update active group if callback provided
          if (onActiveGroupChange) {
            onActiveGroupChange(0, filterKeyword);
          }
        } catch (error) {
          setErrors(prev => ({
            ...prev,
            import: `Error processing import: ${error.message}`
          }));
        } finally {
          setIsImporting(false);
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
        }
      };

      reader.onerror = () => {
        setErrors(prev => ({
          ...prev,
          import: "Error reading file"
        }));
        setIsImporting(false);
      };

      reader.readAsText(file);
    } catch (error) {
      setErrors(prev => ({
        ...prev,
        import: error.message
      }));
      setIsImporting(false);
    }
  }, [
    onScalingGroupsChange,
    filterKeyword,
    processImportedConfiguration,
    syncTabConfigs,
    tabConfigs,
    onActiveGroupChange
  ]);

  // Enhanced group management with slot filling and tab config maintenance
  const addScalingGroup = useCallback(() => {
    // Look for gaps in the existing group sequence based on naming conventions
    const existingNumbers = scalingGroups
        .map(group => {
          const match = group.name.match(/Scaling Group (\d+)/);
          return match ? parseInt(match[1], 10) : null;
        })
        .filter(Boolean)
        .sort((a, b) => a - b);

    // Find the first available gap in the sequence
    let newGroupNumber = 1;
    for (let i = 0; i < existingNumbers.length; i++) {
      if (existingNumbers[i] !== i + 1) {
        newGroupNumber = i + 1;
        break;
      }
      newGroupNumber = i + 2; // If no gap found, use the next number
    }

    // Get the correct insertion index based on the numbering
    const insertionIndex = determineInsertionIndex(newGroupNumber, scalingGroups);

    // Get the appropriate previous results to use as base values
    const previousIndex = insertionIndex > 0 ? insertionIndex - 1 : null;
    const previousResults = previousIndex !== null
        ? scalingGroups[previousIndex].items.reduce((acc, item) => {
          acc[item.id] = {
            scaledValue: item.enabled ? item.scaledValue : item.baseValue,
            enabled: item.enabled
          };
          return acc;
        }, {})
        : null;

    const newGroup = {
      id: `group-${Date.now()}`,
      name: `Scaling Group ${newGroupNumber}`,
      isProtected: false,
      _scalingType: filterKeyword, // Store the scaling type
      items: baseCosts.map(cost => {
        // If we have previous results, use them as base values
        const baseValue = previousResults
            ? (previousResults[cost.id]?.scaledValue ?? cost.baseValue)
            : cost.baseValue || 0;

        return {
          ...cost,
          originalBaseValue: cost.baseValue || 0, // Preserve original
          baseValue: baseValue, // Dynamic base for cumulative calc
          scalingFactor: 1,
          operation: 'multiply',
          enabled: true,
          notes: '',
          scaledValue: baseValue
        };
      })
    };

    // Insert the new group at the appropriate position
    const newGroups = [...scalingGroups];
    newGroups.splice(insertionIndex, 0, newGroup);

    // Recalculate all groups that come after to maintain cumulative calculations
    const updatedGroups = propagateChanges(newGroups, insertionIndex);

    setScalingGroups(updatedGroups);

    // Update selected group and notify parent if callback provided
    setSelectedGroup(insertionIndex);
    if (onActiveGroupChange) {
      onActiveGroupChange(insertionIndex, filterKeyword);
    }

    // Update tab configs
    const newTabConfigs = updatedGroups.map(group => ({
      id: group.id,
      label: group.name,
      isProtected: protectedTabs.has(group.id),
      _scalingType: group._scalingType || filterKeyword
    }));
    setTabConfigs(newTabConfigs);

    addToHistory(
        updatedGroups,
        'add_group',
        `Added ${newGroup.name} at position ${insertionIndex + 1}`,
        {
          groupId: newGroup.id,
          groupIndex: insertionIndex,
          previousResults,
          tabConfigs: newTabConfigs
        }
    );

    if (onScalingGroupsChange) {
      onScalingGroupsChange(updatedGroups);
    }
  }, [
    scalingGroups,
    baseCosts,
    addToHistory,
    propagateChanges,
    onScalingGroupsChange,
    determineInsertionIndex,
    filterKeyword,
    protectedTabs,
    onActiveGroupChange
  ]);

  // Show delete confirmation modal before removing a group
  const removeScalingGroup = useCallback((index) => {
    const groupToRemove = scalingGroups[index];
    if (protectedTabs.has(groupToRemove.id)) {
      setErrors(prev => ({
        ...prev,
        removal: `Cannot remove protected group "${groupToRemove.name}"`
      }));
      return;
    }

    // Get affected groups (all groups after the one being deleted)
    const affectedGroups = scalingGroups.slice(index + 1);

    // Store the group and index to delete
    setGroupToDelete(groupToRemove);
    setGroupIndexToDelete(index);

    // Show the confirmation modal
    setShowDeleteModal(true);
  }, [scalingGroups, protectedTabs]);

  // Handle the actual deletion with the selected option
  const handleDeleteConfirm = useCallback((option) => {
    const index = groupIndexToDelete;
    const groupToRemove = groupToDelete;

    if (!groupToRemove) return;

    // Remove the group
    let newGroups = scalingGroups.filter((_, idx) => idx !== index);

    // Handle different deletion options
    if (newGroups.length > 0 && index < scalingGroups.length - 1) {
      switch (option) {
        case 'adjust':
          // Default behavior: propagate changes to maintain mathematical relationships
          if (index > 0) {
            // Propagate changes starting from the group before the one we just removed
            newGroups = propagateChanges(newGroups, index - 1);
          } else {
            // If we removed the first group, the new first group should use original base values
            const firstGroup = {...newGroups[0]};
            firstGroup.items = firstGroup.items.map(item => ({
              ...item,
              baseValue: item.originalBaseValue || item.baseValue,
              scaledValue: calculateScaledValue(
                  item.originalBaseValue || item.baseValue,
                  item.operation,
                  item.scalingFactor
              )
            }));
            newGroups[0] = firstGroup;

            // Then propagate changes from this group onward
            newGroups = propagateChanges(newGroups, 0);
          }
          break;

        case 'preserve':
          // Keep current values but break the chain
          // No propagation needed, just keep the current values
          break;

        case 'reset':
          // Reset all subsequent groups to use their original base values
          for (let i = index; i < newGroups.length; i++) {
            const group = {...newGroups[i]};
            group.items = group.items.map(item => ({
              ...item,
              baseValue: item.originalBaseValue || item.baseValue,
              scaledValue: calculateScaledValue(
                  item.originalBaseValue || item.baseValue,
                  item.operation,
                  item.scalingFactor
              )
            }));
            newGroups[i] = group;
          }
          break;

        default:
          // Default to adjust if option is not recognized
          if (index > 0) {
            newGroups = propagateChanges(newGroups, index - 1);
          } else {
            const firstGroup = {...newGroups[0]};
            firstGroup.items = firstGroup.items.map(item => ({
              ...item,
              baseValue: item.originalBaseValue || item.baseValue,
              scaledValue: calculateScaledValue(
                  item.originalBaseValue || item.baseValue,
                  item.operation,
                  item.scalingFactor
              )
            }));
            newGroups[0] = firstGroup;
            newGroups = propagateChanges(newGroups, 0);
          }
      }
    }

    setScalingGroups(newGroups);

    // Update selected group and notify parent if needed
    const newSelectedIndex = Math.max(0, selectedGroup - (selectedGroup >= index ? 1 : 0));
    setSelectedGroup(newSelectedIndex);
    if (onActiveGroupChange) {
      onActiveGroupChange(newSelectedIndex, filterKeyword);
    }

    // Update tab configs
    const newTabConfigs = newGroups.map(group => ({
      id: group.id,
      label: group.name,
      isProtected: protectedTabs.has(group.id),
      _scalingType: group._scalingType || filterKeyword
    }));
    setTabConfigs(newTabConfigs);

    // Add to history with the option used
    addToHistory(
        newGroups,
        'remove_group',
        `Removed scaling group "${groupToRemove.name}" with option "${option}"`,
        {
          groupId: groupToRemove.id,
          groupIndex: index,
          removedGroup: groupToRemove,
          deletionOption: option,
          tabConfigs: newTabConfigs
        }
    );

    if (onScalingGroupsChange) {
      onScalingGroupsChange(newGroups);
    }

    // Reset state
    setGroupToDelete(null);
    setGroupIndexToDelete(null);
    setShowDeleteModal(false);
  }, [
    groupToDelete,
    groupIndexToDelete,
    scalingGroups,
    selectedGroup,
    addToHistory,
    protectedTabs,
    propagateChanges,
    calculateScaledValue,
    onScalingGroupsChange,
    filterKeyword,
    onActiveGroupChange
  ]);

  // Drag and drop functionality
  const moveItem = useCallback((dragIndex, hoverIndex) => {
    const dragItem = scalingGroups[selectedGroup].items[dragIndex];
    const newItems = [...scalingGroups[selectedGroup].items];
    newItems.splice(dragIndex, 1);
    newItems.splice(hoverIndex, 0, dragItem);

    const newGroups = [...scalingGroups];
    newGroups[selectedGroup] = {
      ...newGroups[selectedGroup],
      items: newItems
    };

    setScalingGroups(newGroups);

    addToHistory(
        newGroups,
        'reorder_items',
        `Reordered items in "${newGroups[selectedGroup].name}"`,
        {
          groupId: newGroups[selectedGroup].id,
          dragIndex,
          hoverIndex
        }
    );

    if (onScalingGroupsChange) {
      onScalingGroupsChange(newGroups);
    }
  }, [scalingGroups, selectedGroup, addToHistory, onScalingGroupsChange]);

  // Enhanced item updates with propagation
  const updateGroupItem = useCallback((groupIndex, itemIndex, updates) => {
    const newGroups = [...scalingGroups];
    const group = {...newGroups[groupIndex]};
    const items = [...group.items];
    const originalItem = {...items[itemIndex]};
    items[itemIndex] = {...items[itemIndex], ...updates};

    // Calculate new scaled value if operation or factor changed
    if ('scalingFactor' in updates || 'operation' in updates || 'enabled' in updates) {
      const baseValue = items[itemIndex].baseValue;
      const isEnabled = 'enabled' in updates ? updates.enabled : items[itemIndex].enabled;

      if (isEnabled) {
        const scaledValue = calculateScaledValue(
            baseValue,
            items[itemIndex].operation,
            items[itemIndex].scalingFactor
        );
        items[itemIndex].scaledValue = scaledValue;
      } else {
        // If disabled, scaled value equals base value
        items[itemIndex].scaledValue = baseValue;
      }
    }

    group.items = items;
    newGroups[groupIndex] = group;

    // Propagate changes to subsequent groups if needed
    const updatedGroups = propagateChanges(newGroups, groupIndex);

    setScalingGroups(updatedGroups);

    // Generate description for history
    let description = `Updated ${items[itemIndex].label} in "${group.name}"`;
    const updatedFields = Object.keys(updates);
    if (updatedFields.length === 1) {
      const field = updatedFields[0];
      if (field === 'operation') {
        description = `Changed operation to ${updates[field]} for ${items[itemIndex].label}`;
      } else if (field === 'scalingFactor') {
        description = `Changed scaling factor to ${updates[field]} for ${items[itemIndex].label}`;
      } else if (field === 'notes') {
        description = `Updated notes for ${items[itemIndex].label}`;
      } else if (field === 'enabled') {
        description = updates[field]
            ? `Enabled ${items[itemIndex].label}`
            : `Disabled ${items[itemIndex].label}`;
      }
    }

    // Add to history
    addToHistory(
        updatedGroups,
        'update_item',
        description,
        {
          groupId: group.id,
          groupIndex,
          itemId: items[itemIndex].id,
          itemIndex,
          updates,
          previousValues: Object.keys(updates).reduce((acc, key) => {
            acc[key] = originalItem[key];
            return acc;
          }, {})
        }
    );

    if (onScalingGroupsChange) {
      onScalingGroupsChange(updatedGroups);
    }
  }, [scalingGroups, addToHistory, calculateScaledValue, propagateChanges, onScalingGroupsChange]);

  // Generate summary items for ScalingSummary component
  const generateSummaryItems = useCallback(() => {
    if (!scalingGroups.length) return [];

    // Start with the first group's items as base
    const baseItems = scalingGroups[0].items.map(item => ({
      id: item.id,
      label: item.label,
      originalValue: item.originalBaseValue || item.baseValue,
      vKey: item.vKey,
      rKey: item.rKey
    }));

    // Build scaled values map for each item across all groups
    return baseItems.map(baseItem => {
      const scaledValues = {};

      // Add scaled value from each group
      scalingGroups.forEach(group => {
        const groupItem = group.items.find(i => i.id === baseItem.id);
        if (groupItem && groupItem.enabled) {
          scaledValues[group.id] = groupItem.scaledValue;
        }
      });

      return {
        ...baseItem,
        scaledValues,
        // Calculate final result based on the last group's value
        finalResult: scalingGroups.length > 0
            ? scalingGroups[scalingGroups.length - 1].items.find(i => i.id === baseItem.id)?.scaledValue
            : baseItem.originalValue
      };
    });
  }, [scalingGroups]);

  // Handle coordinate/zone updates
  const handleCoordinateChange = useCallback((newCoordinates) => {
    if (selectedZone) {
      // Update the selected zone with new coordinates
      const updatedZone = {
        ...selectedZone,
        coordinates: newCoordinates
      };
      setSelectedZone(updatedZone);
    }
  }, [selectedZone]);

  // Handle asset changes for the zone
  const handleAssetChange = useCallback((updatedAssets) => {
    setZoneAssets(updatedAssets);

    // If we have a selected zone, update it with the new assets
    if (selectedZone) {
      const updatedZone = {
        ...selectedZone,
        assets: updatedAssets
      };
      setSelectedZone(updatedZone);
    }
  }, [selectedZone]);

  // Handle fact finder data
  const handleFactFound = useCallback((type, data) => {
    setFactFinderData(prev => ({
      ...prev,
      [type]: data
    }));
  }, []);

  // Toggle fact finder visibility
  const toggleFactFinder = useCallback(() => {
    setShowFactFinder(prev => !prev);
  }, []);

  // Handle map view action
  const handleMapView = useCallback((coordinates) => {
    // This would typically open a map with the specified coordinates
    // For this implementation, we'll just log the coordinates
    console.log('Map view requested for coordinates:', coordinates);

    // You could open a modal with a map here
    alert(`Map view requested for coordinates: ${coordinates.longitude}, ${coordinates.latitude}`);
  }, []);

  // Toggle visualization panel
  const toggleVisualization = useCallback(() => {
    setShowVisualization(prev => !prev);
  }, []);

  // Ensure selectedGroup stays within bounds
  useEffect(() => {
    if (selectedGroup >= scalingGroups.length) {
      setSelectedGroup(Math.max(0, scalingGroups.length - 1));
      onActiveGroupChange(Math.max(0, scalingGroups.length - 1), filterKeyword);
    }
  }, [scalingGroups, selectedGroup, filterKeyword, onActiveGroupChange]);

  // Effect to notify parent of changes
  useEffect(() => {
    if (onScaledValuesChange) {
      const allScaledValues = scalingGroups.map((group, groupIndex) => ({
        groupId: group.id,
        groupName: group.name,
        groupIndex: groupIndex,
        isProtected: protectedTabs.has(group.id),
        isCumulative: groupIndex > 0,
        _scalingType: group._scalingType || filterKeyword,
        items: group.items.map(item => ({
          id: item.id,
          originalBaseValue: item.originalBaseValue || item.baseValue,
          baseValue: item.baseValue,
          scaledValue: item.enabled ? calculateScaledValue(
              item.baseValue,
              item.operation,
              item.scalingFactor
          ) : item.baseValue,
          operation: item.operation,
          scalingFactor: item.scalingFactor,
          enabled: item.enabled,
          notes: item.notes,
          vKey: item.vKey,
          rKey: item.rKey
        }))
      }));

      onScaledValuesChange(allScaledValues);
    }
  }, [scalingGroups, protectedTabs, calculateScaledValue, onScaledValuesChange, filterKeyword]);

  // Handle expression changes from summary
  const handleExpressionChange = useCallback((itemId, expression) => {
    setItemExpressions(prev => ({
      ...prev,
      [itemId]: expression
    }));
  }, []);

  // Sync selectedGroup with activeGroupIndex prop when it changes
  useEffect(() => {
    if (activeGroupIndex !== undefined && activeGroupIndex !== null) {
      const validIndex = Math.max(0, Math.min(activeGroupIndex, scalingGroups.length - 1));
      if (validIndex !== selectedGroup) {
        setSelectedGroup(validIndex);
      }
    }
  }, [activeGroupIndex, scalingGroups.length, selectedGroup]);

  // Notify parent component about final results when they change
  useEffect(() => {
    if (onFinalResultsGenerated) {
      const summaryItems = generateSummaryItems();
      onFinalResultsGenerated(summaryItems, filterKeyword);
    }
  }, [generateSummaryItems, onFinalResultsGenerated, filterKeyword]);

  return (
      <DndProvider backend={HTML5Backend}>
        <div className="scaling-container">
          <Tab.Group selectedIndex={selectedGroup} onChange={(index) => {
            const newIndex = Math.max(0, Math.min(index, scalingGroups.length - 1));
            setSelectedGroup(newIndex);
            onActiveGroupChange(newIndex, filterKeyword);
          }}>
            <div className="scaling-header">
              <Tab.List className="scaling-tab-list">
                {scalingGroups.map((group, index) => (
                    <Tab
                        key={group.id}
                        className={({ selected }) =>
                            `scaling-tab ${selected ? 'scaling-tab-selected' : ''} ${protectedTabs.has(group.id) ? 'scaling-tab-protected' : ''} ${index > 0 ? 'scaling-tab-cumulative' : 'scaling-tab-default'}`
                        }
                    >
                      <div className="scaling-tab-content">
                        <span>{group.name}</span>
                        <div className="scaling-tab-actions">
                          <div
                              className="scaling-tab-action"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleProtection(group.id);
                              }}
                              title={protectedTabs.has(group.id) ? 'Protected (Click to unprotect)' : 'Unprotected (Click to protect)'}
                              role="button"
                              tabIndex={0}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.stopPropagation();
                                  toggleProtection(group.id);
                                }
                              }}
                          >
                            {protectedTabs.has(group.id) ? (
                                <LockClosedIcon className="scaling-action-icon" />
                            ) : (
                                <LockOpenIcon className="scaling-action-icon" />
                            )}
                          </div>
                          {scalingGroups.length > 1 && !protectedTabs.has(group.id) && (
                              <TrashIcon
                                  className="scaling-remove-icon"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeScalingGroup(index);
                                  }}
                              />
                          )}
                        </div>
                      </div>
                    </Tab>
                ))}
              </Tab.List>

              <div className="scaling-actions">
                {/* Hidden file input for import */}
                <input
                    type="file"
                    ref={fileInputRef}
                    className="file-input-hidden"
                    accept=".json"
                    onChange={importConfiguration}
                    style={{ display: 'none' }}
                    aria-label="Import scaling configuration"
                />

                {/* Import button */}
                <button
                    onClick={() => fileInputRef.current.click()}
                    disabled={isImporting}
                    className="scaling-action-button"
                    title="Import Configuration"
                >
                  {isImporting ? "Importing..." : "Import"}
                </button>

                {/* Export button */}
                <button
                    onClick={exportConfiguration}
                    disabled={isExporting}
                    className="scaling-action-button"
                    title="Export Configuration"
                >
                  {isExporting ? "Exporting..." : "Export"}
                </button>

                {/* Help button */}
                <button
                    onClick={() => setShowDocumentation(true)}
                    className="scaling-help-button scaling-action-button"
                    title="How cumulative scaling works"
                >
                  <QuestionMarkCircleIcon className="scaling-action-icon" />
                </button>

                {/* Toggle coordinates button */}
                <button
                    onClick={() => setShowCoordinates(prev => !prev)}
                    className="scaling-action-button"
                    title={showCoordinates ? "Hide Coordinates" : "Show Coordinates"}
                >
                  <MapIcon className="scaling-action-icon" />
                </button>

                {/* Toggle visualization button */}
                <button
                    onClick={toggleVisualization}
                    className="scaling-action-button"
                    title={showVisualization ? "Hide Visualization" : "Show Visualization"}
                >
                  <ChartBarIcon className="scaling-action-icon" />
                </button>

                {/* Undo/Redo buttons */}
                <button
                    onClick={undo}
                    disabled={historyIndex <= 0}
                    className="scaling-action-button"
                    title="Undo"
                >
                  <ArrowPathIcon className="scaling-action-icon rotate-180" />
                </button>
                <button
                    onClick={redo}
                    disabled={historyIndex >= history.length - 1}
                    className="scaling-action-button"
                    title="Redo"
                >
                  <ArrowPathIcon className="scaling-action-icon" />
                </button>

                {/* Add Group button */}
                <button
                    onClick={addScalingGroup}
                    className="scaling-add-button"
                >
                  <PlusIcon className="scaling-add-icon" />
                  Add Scaling Group
                </button>
              </div>
            </div>

            {/* Error messages */}
            {(errors.protection || errors.removal || errors.import || errors.export) && (
                <div className="scaling-error-message">
                  {errors.protection || errors.removal || errors.import || errors.export}
                </div>
            )}

            <Tab.Panels>
              {scalingGroups.map((group, groupIndex) => (
                  <Tab.Panel key={group.id} className="scaling-panel">
                    <div className="scaling-group-name">
                      <input
                          type="text"
                          value={group.name}
                          onChange={(e) => {
                            const newGroups = [...scalingGroups];
                            newGroups[groupIndex].name = e.target.value;
                            setScalingGroups(newGroups);

                            // Update tab configs when group name changes
                            const newTabConfigs = [...tabConfigs];
                            const tabIndex = newTabConfigs.findIndex(tab => tab.id === group.id);
                            if (tabIndex !== -1) {
                              newTabConfigs[tabIndex] = {
                                ...newTabConfigs[tabIndex],
                                label: e.target.value
                              };
                              setTabConfigs(newTabConfigs);
                            }

                            // Add to history
                            addToHistory(
                                newGroups,
                                'rename_group',
                                `Renamed group to "${e.target.value}"`,
                                {
                                  groupId: group.id,
                                  groupIndex,
                                  oldName: group.name,
                                  newName: e.target.value,
                                  tabConfigs: newTabConfigs
                                }
                            );

                            if (onScalingGroupsChange) {
                              onScalingGroupsChange(newGroups);
                            }
                          }}
                          className="scaling-name-input"
                          placeholder="Group Name"
                          disabled={protectedTabs.has(group.id)}
                      />
                    </div>

                    {group.items.map((item, itemIndex) => (
                        <DraggableScalingItem
                            key={item.id}
                            className={`scaling-item ${!item.enabled ? 'scaling-item-disabled' : ''} ${groupIndex > 0 ? 'scaling-item-cumulative' : 'scaling-item-default'}`}
                            item={item}
                            index={itemIndex}
                            moveItem={moveItem}
                            V={V}
                            R={R}
                            toggleV={toggleV}
                            toggleR={toggleR}
                        >
                          <div className="scaling-item-content">
                            <input
                                type="checkbox"
                                checked={item.enabled}
                                onChange={(e) =>
                                    updateGroupItem(groupIndex, itemIndex, {
                                      enabled: e.target.checked
                                    })
                                }
                                className="scaling-checkbox"
                                disabled={protectedTabs.has(group.id)}
                            />

                            <div className="scaling-item-info">
                              <label className="scaling-item-label">
                                {item.label}
                              </label>
                              <div className="scaling-base-value">
                                {groupIndex > 0 ? (
                                    <div className="cumulative-value-container">
                                      <span>Base Value: {item.baseValue.toFixed(2)}</span>
                                      <span className="cumulative-indicator">
                                ← Previous Tab Result
                              </span>
                                      <div className="original-value">
                                        (Original: {item.originalBaseValue.toFixed(2)})
                                      </div>
                                    </div>
                                ) : (
                                    <span>Base Value: {item.baseValue.toFixed(2)}</span>
                                )}
                              </div>
                            </div>

                            <Tooltip content={operations.find(op => op.id === item.operation)?.description}>
                              <select
                                  value={item.operation}
                                  onChange={(e) =>
                                      updateGroupItem(groupIndex, itemIndex, {
                                        operation: e.target.value
                                      })
                                  }
                                  disabled={!item.enabled || protectedTabs.has(group.id)}
                                  className="scaling-operation-select"
                              >
                                {operations.map(op => (
                                    <option key={op.id} value={op.id}>
                                      {op.label} ({op.symbol})
                                    </option>
                                ))}
                              </select>
                            </Tooltip>

                            <input
                                type="number"
                                value={item.scalingFactor}
                                onChange={(e) =>
                                    updateGroupItem(groupIndex, itemIndex, {
                                      scalingFactor: parseFloat(e.target.value) || 0
                                    })
                                }
                                disabled={!item.enabled || protectedTabs.has(group.id)}
                                className="scaling-factor-input"
                                step="0.1"
                                placeholder="Factor"
                            />

                            <div className="scaling-result">
                              <div className="scaling-result-value">
                                Scaled Value:{' '}
                                {item.enabled
                                    ? calculateScaledValue(
                                        item.baseValue,
                                        item.operation,
                                        item.scalingFactor
                                    ).toFixed(2)
                                    : 'Disabled'}
                              </div>
                              {errors[item.baseValue] && (
                                  <div className="scaling-error">
                                    {errors[item.baseValue]}
                                  </div>
                              )}
                            </div>
                          </div>

                          <input
                              type="text"
                              value={item.notes}
                              onChange={(e) =>
                                  updateGroupItem(groupIndex, itemIndex, {
                                    notes: e.target.value
                                  })
                              }
                              disabled={!item.enabled || protectedTabs.has(group.id)}
                              className="scaling-notes-input"
                              placeholder="Notes about this scaling..."
                          />
                        </DraggableScalingItem>
                    ))}
                  </Tab.Panel>
              ))}
            </Tab.Panels>
          </Tab.Group>

          {onSave && (
              <div className="scaling-footer">
                <button
                    onClick={() => onSave(scalingGroups)}
                    className="scaling-save-button"
                >
                  Save Scaling Configuration
                </button>
              </div>
          )}

          <ScalingSummary
              items={generateSummaryItems()}
              tabConfigs={tabConfigs}
              onExpressionChange={handleExpressionChange}
              V={V}
              R={R}
              toggleV={toggleV}
              toggleR={toggleR}
          />

          {/* Visualization panel (conditionally rendered) */}
          {showVisualization && (
              <div className="scaling-visualization-panel">
                <div className="visualization-header">
                  <h3>Scaling Visualization</h3>
                  <div className="visualization-controls">
                    <button
                        className={`viz-control-button ${visualizationType === 'summary' ? 'active' : ''}`}
                        onClick={() => setVisualizationType('summary')}
                    >
                      Summary
                    </button>
                    <button
                        className={`viz-control-button ${visualizationType === 'comparison' ? 'active' : ''}`}
                        onClick={() => setVisualizationType('comparison')}
                    >
                      Comparison
                    </button>
                    <button
                        className={`viz-control-button ${visualizationType === 'impact' ? 'active' : ''}`}
                        onClick={() => setVisualizationType('impact')}
                    >
                      Impact
                    </button>
                    <button
                        className="viz-close-button"
                        onClick={toggleVisualization}
                    >
                      Close
                    </button>
                  </div>
                </div>

                <div className="visualization-content">
                  <div className="scaling-groups-preview-section">
                    <h4 className="scaling-preview-title">Scaling Groups Preview</h4>
                    <div className="scaling-preview-container">
                      <ScalingGroupsPreview
                          scalingGroups={scalingGroups}
                      />
                    </div>
                  </div>

                  {/* Additional visualization content would go here based on visualizationType */}
                  <div className="climate-module-container">
                    <ClimateModule
                        scalingGroups={scalingGroups}
                        versions={{ active: 'v1', list: ['v1'] }}
                        zones={{ active: 'z1', list: ['z1'] }}
                        onCarbonFootprintChange={setCarbonFootprints}
                        showCoordinateComponent={false}
                    />
                  </div>
                </div>
              </div>
          )}

          {/* Coordinates panel (conditionally rendered) */}
          {showCoordinates && (
              <div className="scaling-coordinates-panel">
                <div className="coordinates-header">
                  <h3>Geographic Coordinates</h3>
                  <div className="coordinates-actions">
                    <button
                        className={`coordinates-action-button ${showFactFinder ? 'active' : ''}`}
                        onClick={toggleFactFinder}
                    >
                      {showFactFinder ? 'Hide Fact Finder' : 'Show Fact Finder'}
                    </button>
                    <button
                        className="coordinates-close-button"
                        onClick={() => setShowCoordinates(false)}
                    >
                      Close
                    </button>
                  </div>
                </div>

                <div className="coordinates-content">
                  <div className="coordinate-component-container">
                    <CoordinateComponent
                        zone={selectedZone || {
                          id: 'default-zone',
                          metadata: { label: 'Default Zone' },
                          coordinates: { longitude: 0, latitude: 0 },
                          assets: zoneAssets
                        }}
                        onCoordinateChange={handleCoordinateChange}
                        onAssetChange={handleAssetChange}
                        onMapView={handleMapView}
                    />
                  </div>

                  {showFactFinder && (
                      <div className="fact-finder-container">
                        <CoordinateFactFinder
                            coordinates={selectedZone?.coordinates || { longitude: 0, latitude: 0 }}
                            assets={zoneAssets}
                            onFactFound={handleFactFound}
                        />
                      </div>
                  )}
                </div>
              </div>
          )}

          {showDocumentation && (
              <div className="scaling-documentation-overlay">
                <CumulativeDocumentation onClose={() => setShowDocumentation(false)} />
              </div>
          )}

          {/* Delete Confirmation Modal */}
          <DeleteConfirmationModal
              isOpen={showDeleteModal}
              onClose={() => setShowDeleteModal(false)}
              groupToDelete={groupToDelete}
              affectedGroups={groupIndexToDelete !== null ? scalingGroups.slice(groupIndexToDelete + 1) : []}
              onConfirm={handleDeleteConfirm}
          />
        </div>
      </DndProvider>
  );
};

ExtendedScaling.propTypes = {
  baseCosts: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        label: PropTypes.string,
        value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        baseValue: PropTypes.number,
        vKey: PropTypes.string,
        rKey: PropTypes.string
      })
  ).isRequired,
  onScaledValuesChange: PropTypes.func,
  onSave: PropTypes.func,
  initialScalingGroups: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        isProtected: PropTypes.bool,
        _scalingType: PropTypes.string,
        items: PropTypes.arrayOf(
            PropTypes.shape({
              id: PropTypes.string.isRequired,
              label: PropTypes.string,
              originalBaseValue: PropTypes.number,
              baseValue: PropTypes.number,
              scalingFactor: PropTypes.number,
              operation: PropTypes.string,
              enabled: PropTypes.bool,
              notes: PropTypes.string,
              scaledValue: PropTypes.number,
              vKey: PropTypes.string,
              rKey: PropTypes.string
            })
        ).isRequired
      })
  ),
  onScalingGroupsChange: PropTypes.func,
  filterKeyword: PropTypes.string.isRequired,
  V: PropTypes.object,
  R: PropTypes.object,
  toggleV: PropTypes.func,
  toggleR: PropTypes.func,
  // Tab persistence props:
  activeGroupIndex: PropTypes.number,
  onActiveGroupChange: PropTypes.func,
  // Results callback
  onFinalResultsGenerated: PropTypes.func
};

ExtendedScaling.defaultProps = {
  baseCosts: [],
  initialScalingGroups: [],
  onScaledValuesChange: () => {},
  onScalingGroupsChange: () => {},
  V: {},
  R: {},
  toggleV: () => {},
  toggleR: () => {},
  activeGroupIndex: 0,
  onActiveGroupChange: () => {},
  onFinalResultsGenerated: () => {}
};

export default ExtendedScaling;