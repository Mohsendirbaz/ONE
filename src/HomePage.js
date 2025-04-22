import { useEffect, useState } from 'react';
import { Tab, TabList, TabPanel, Tabs } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';
import CustomizableImage from './components/modules/CustomizableImage';
import CustomizableTable from './components/modules/CustomizableTable';
import ExtendedScaling from 'src/components/truly_extended_scaling/ExtendedScaling';
import FactEngine from './components/modules/FactEngine';
import FactEngineAdmin from './components/modules/FactEngineAdmin';
import GeneralFormConfig from './GeneralFormConfig.js';
import './styles/HomePage.CSS/HomePage1.css';
import './styles/HomePage.CSS/HomePage2.css';
import './styles/HomePage.CSS/HomePage3.css';
import './styles/HomePage.CSS/HomePage5.css';
import './styles/HomePage.CSS/HomePage6.css';
import './styles/HomePage.CSS/CustomizableTable.css';
import './styles/HomePage.CSS/HomePage_AboutUs.css';
import './styles/HomePage.CSS/HomePage_buttons.css';
import './styles/HomePage.CSS/HomePage_monitoring.css';
import './styles/HomePage.CSS/HomePage_FactEngine.css';
import './styles/HomePage.CSS/HomePage_FactAdmin.css';
import './styles/HomePage.CSS/HomePage_neumorphic-tabs.css';
import './styles/Themes/dark-theme.css';
import './styles/Themes/light-theme.css';
import './styles/Themes/creative-theme.css';
import PropertySelector from './PropertySelector.js';
import VersionSelector from './VersionSelector.js';
import SpatialTransformComponent from './Naturalmotion.js'
import useFormValues from './useFormValues.js';
import './styles/HomePage.CSS/ResetOptionsPopup.css';
import versionEventEmitter from './state/EventEmitter';
import TestingZone from './components/modules/TestingZone';
import CalculationMonitor from './components/modules/CalculationMonitor';
import SensitivityMonitor from './components/modules/SensitivityMonitor';
import ConfigurationMonitor from './components/modules/ConfigurationMonitor';
import ThemeButton from './components/modules/ThemeButton';
import PlotsTabs from './components/modules/PlotsTabs';
import SensitivityPlotsTabs from './components/modules/SensitivityPlotsTabs';
import CentralScalingTab from 'src/components/truly_extended_scaling/CentralScalingTab';
import StickerHeader from './components/modules/HeaderBackground';
import ProcessEconomicsLibrary from './components/process_economics_pilot/integration-module';


const HomePageContent = () => {
    const [selectedVersions, setSelectedVersions] = useState([1]);
    const [activeTab, setActiveTab] = useState('Input');

    // Listen for version change events
    useEffect(() => {
        const handleVersionChange = (version) => {
            setSelectedVersions(Array.isArray(version) ? version : [version]);
        };

        versionEventEmitter.on('versionChange', handleVersionChange);
        return () => {
            versionEventEmitter.off('versionChange', handleVersionChange);
        };
    }, []);
    const [activeSubTab, setActiveSubTab] = useState('ProjectConfig');
    const [selectedProperties, setSelectedProperties] = useState([]);
    const [season, setSeason] = useState('dark');

    // Loading States
    const [loadingStates, setLoadingStates] = useState({
        html: false,
        csv: false,
        plots: false,
    });
    const [contentLoaded, setContentLoaded] = useState({});
    const [iframesLoaded, setIframesLoaded] = useState({});
    const [imagesLoaded, setImagesLoaded] = useState({});

    // Content Loading States
    const [contentLoadingState, setContentLoadingState] = useState({
        csv: false,
        html: false,
        plots: false,
        iframes: {},
        images: {},
        content: {},
    });

    // Effect for tab transitions
    useEffect(() => {
        setContentLoadingState((prev) => ({
            ...prev,
            csv: activeTab === 'Case1',
            html: activeTab === 'Case2',
            plots: activeTab === 'Case3',
            iframes: {},
            images: {},
            content: {},
        }));
    }, [activeTab]);

    // Effect for content loading
    useEffect(() => {
        if (contentLoadingState.csv || contentLoadingState.html || contentLoadingState.plots) {
            const timer = setTimeout(() => {
                setContentLoadingState((prev) => ({
                    ...prev,
                    content: { ...prev.content, [activeTab]: true },
                }));
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [contentLoadingState.csv, contentLoadingState.html, contentLoadingState.plots, activeTab]);

    // Theme management
    useEffect(() => {
        // Remove all theme classes
        document.documentElement.classList.remove('dark-theme', 'light-theme', 'creative-theme');

        // Map season to theme class
        const themeMap = {
            'dark': 'dark-theme',
            'light': 'light-theme',
            'creative': 'creative-theme'
        };

        // Add the appropriate theme class
        document.documentElement.classList.add(themeMap[season]);

        // Set data-theme attribute for backward compatibility
        document.documentElement.setAttribute('data-theme', season);


    }, [season]);
// Final results and handler now managed in useFormValues
    const { 
        formValues, 
        handleInputChange, 
        handleReset, 
        setFormValues,
        S,
        setS,
        F,
        setF,
        toggleF,
        V,
        setV,
        toggleV,
        R,
        setR,
        toggleR,
        RF,
        setRF,
        toggleRF,
        scalingGroups,
        setScalingGroups,
        scalingBaseCosts,
        setScalingBaseCosts,
        finalResults,
        setFinalResults,
        handleFinalResultsGenerated,
        // Reset options popup states and functions
        showResetOptions,
        resetOptions,
        setResetOptions,
        handleResetOptionChange,
        handleResetConfirm,
        handleResetCancel
    } = useFormValues();
    const [version, setVersion] = useState('1');
    const [batchRunning, setBatchRunning] = useState(false);
    const [analysisRunning, setAnalysisRunning] = useState(false);

    const renderVersionControl = () => (
        <div className="version-control-container" style={{
            position: 'sticky',
            top: '0',
            zIndex: '100',
            backgroundColor: 'var(--background-color)',
            padding: '10px',
            borderBottom: '1px solid var(--border-color)',
            marginBottom: '20px'
        }}>
            <div className="version-input-container" style={{
                display: 'flex',
                gap: '10px',
                alignItems: 'center',
                justifyContent: 'flex-end',
                maxWidth: '1200px',
                margin: '0 auto',
                padding: '0 20px'
            }}>
                <input
                    id="versionNumber"
                    type="number"
                    className="version-input"
                    placeholder="1"
                    value={version}
                    onChange={handleVersionChange}
                    style={{
                        width: '80px',
                        padding: '5px',
                        border: '1px solid var(--border-color)',
                        borderRadius: '4px'
                    }}
                />
                <button
                    className="refresh-button"
                    onClick={handleRefresh}
                    title="Refresh visualization"
                    style={{
                        padding: '5px 10px',
                        border: '1px solid var(--border-color)',
                        borderRadius: '4px',
                        background: 'var(--button-background)',
                        cursor: 'pointer'
                    }}
                >
                    ↻
                </button>
            </div>
        </div>
    );
    const [monitoringActive, setMonitoringActive] = useState(false);
    const [csvFiles, setCsvFiles] = useState([]);
    const [subTab, setSubTab] = useState('');
    const [albumImages, setAlbumImages] = useState({});
    const [selectedAlbum, setSelectedAlbum] = useState('');
    const [albumHtmls, setAlbumHtmls] = useState({});
    const [selectedHtml, setSelectedHtml] = useState('');
    const [remarks, setRemarks] = useState('off');
    const [customizedFeatures, setcustomizedFeatures] = useState('off');
    const [selectedCalculationOption, setSelectedCalculationOption] = useState('calculateForPrice');
    const [target_row, settarget_row] = useState('20');
    const [calculatedPrices, setCalculatedPrices] = useState({});
    const [baseCosts, setBaseCosts] = useState([]);
    const [collapsedTabs, setCollapsedTabs] = useState({});
    const [isToggleSectionOpen, setIsToggleSectionOpen] = useState(false);
    const [showPopup, setShowPopup] = useState(false);
    const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });
    // THEN define the effect that depends on formValues
    useEffect(() => {
        // Create a mapping of all four Amount categories
        const amountCategories = ['Amount4', 'Amount5', 'Amount6', 'Amount7'];

        // Generate scalingBaseCosts with the same structure for all categories
        const updatedScalingBaseCosts = amountCategories.reduce((result, category) => {
            // Extract entries for this category - correctly match without underscore
            const categoryEntries = Object.entries(formValues)
                .filter(([key]) => key.includes(category));

            // Sort entries based on their numeric suffix
            categoryEntries.sort(([keyA], [keyB]) => {
                // Extract the numeric part after the category (e.g., "Amount40" -> "40")
                const suffixA = keyA.replace(category, '');
                const suffixB = keyB.replace(category, '');
                return parseInt(suffixA) - parseInt(suffixB);
            });

            // Map sorted entries to scaling items
            result[category] = categoryEntries.map(([key, value]) => ({
                id: key,
                label: value.label || `Unnamed ${category}`,
                value: parseFloat(value.value) || 0,
                baseValue: parseFloat(value.value) || 0,
                vKey: key.startsWith('v') ? key : null,  // Only set vKey if key starts with 'v'
                rKey: key.startsWith('r') ? key : null   // Only set rKey if key starts with 'r'
            }));

            return result;
        }, {});

        // Update state
        setScalingBaseCosts(updatedScalingBaseCosts);
    }, [formValues]);
// Add this state to HomePage to track active groups by type
    const [activeScalingGroups, setActiveScalingGroups] = useState({
        Amount4: 0,
        Amount5: 0,
        Amount6: 0,
        Amount7: 0
    });

// Handler for active group changes
    const handleActiveGroupChange = (groupIndex, filterKeyword) => {
        setActiveScalingGroups(prev => ({
            ...prev,
            [filterKeyword]: groupIndex
        }));
    };
    const handleScaledValuesChange = (scaledValues) => {
        console.log('Scaled values:', scaledValues);
    };

    const handleScalingGroupsChange = (newGroups) => {
        setScalingGroups(newGroups);
    };

    const toggleTabCollapse = (tabId) => {
        setCollapsedTabs((prev) => ({
            ...prev,
            [tabId]: !prev[tabId],
        }));
    };

    const loadConfiguration = async (version) => {
        try {
            const response = await fetch('http://localhost:5000/load_configuration', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ version }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            const { filteredValues } = data;

            filteredValues.forEach((item) => {
                let { id, value, remarks } = item;
                if (typeof value === 'string') {
                    value = value.trim().replace(/^"|"$/g, '');
                    value = isNaN(value) ? value : parseFloat(value);
                }

                setFormValues((prevValues) => ({
                    ...prevValues,
                    [id]: {
                        ...prevValues[id],
                        value: typeof value === 'number' ? value : prevValues[id].value,
                        remarks: remarks !== undefined ? remarks : prevValues[id].remarks,
                    },
                }));
            });

            console.log('Updated formValues:', formValues);
        } catch (error) {
            console.error('Error loading configuration:', error);
        }
    };

    const handleOptionChange = (event) => {
        setSelectedCalculationOption(event.target.value);
    };

    const handleTargetRowChange = (event) => {
        settarget_row(event.target.value);
    };

    const toggleRemarks = () => {
        setRemarks((prevState) => (prevState === 'off' ? 'on' : 'off'));
    };

    const toggleCustomizedFeatures = () => {
        setcustomizedFeatures((prevState) => (prevState === 'off' ? 'on' : 'off'));
    };

    // State to track refresh operations
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleRefresh = () => {
        // Store the current version
        const currentVersion = version;

        // Set refreshing state to true
        setIsRefreshing(true);

        // Force a re-fetch by setting a different version temporarily
        // Using '0' instead of empty string to ensure it's a valid version number
        setVersion('0');

        // Set it back to the current version after a short delay
        setTimeout(() => {
            setVersion(currentVersion);
            setIsRefreshing(false);
        }, 100);
    };

    const updatePrice = (version, price) => {
        setCalculatedPrices((prevPrices) => ({
            ...prevPrices,
            [version]: price,
        }));
    };

    // Reset options popup component
    const ResetOptionsPopup = ({ 
        show, 
        options, 
        onOptionChange, 
        onConfirm, 
        onCancel 
    }) => {
        if (!show) return null;

        return (
            <div className="reset-options-popup-overlay">
                <div className="reset-options-popup">
                    <h3>Select states to reset</h3>
                    <div className="checkbox-row">
                        <label className="reset-option-label">
                            <input 
                                type="checkbox" 
                                checked={options.S} 
                                onChange={() => onOptionChange('S')} 
                            />
                            S (Sensitivity Analysis)
                        </label>
                    </div>
                    <div className="checkbox-row">
                        <label className="reset-option-label">
                            <input 
                                type="checkbox" 
                                checked={options.F} 
                                onChange={() => onOptionChange('F')} 
                            />
                            F (Factor Parameters)
                        </label>
                    </div>
                    <div className="checkbox-row">
                        <label className="reset-option-label">
                            <input 
                                type="checkbox" 
                                checked={options.V} 
                                onChange={() => onOptionChange('V')} 
                            />
                            V (Process Quantities)
                        </label>
                    </div>
                    <div className="checkbox-row">
                        <label className="reset-option-label">
                            <input 
                                type="checkbox" 
                                checked={options.R} 
                                onChange={() => onOptionChange('R')} 
                            />
                            R (Revenue Variables)
                        </label>
                    </div>
                    <div className="reset-options-buttons">
                        <button onClick={onConfirm} className="reset-confirm-button">Reset</button>
                        <button onClick={onCancel} className="reset-cancel-button">Cancel</button>
                    </div>
                </div>
            </div>
        );
    };

    // States for V1-V10 and R1-R10 now managed in useFormValues
    const handleThemeChange = (newSeason) => {
        const themeRibbon = document.querySelector('.theme-ribbon');


        // Update theme state
        setSeason(newSeason);
        document.body.className = newSeason;

    };

    // Toggle functions for F, V, and R now managed in useFormValues
    const createNewBatch = async () => {
        setBatchRunning(true);
        try {
            const response = await fetch('http://127.0.0.1:8001/create_new_batch', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const result = await response.json();
            if (response.ok) {
                console.log(result.message);
                console.log('New Batch Number:', result.NewBatchNumber);
                setVersion(result.NewBatchNumber); // Update the version state with the new batch number
            } else {
                console.error(result.error);
            }
        } catch (error) {
            console.error('Batch creation failed', error);
        } finally {
            setBatchRunning(false);
        }
    };

    const RemoveBatch = async () => {
        try {
            const response = await fetch('http://127.0.0.1:7001/Remove_batch', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    version,
                    path: "C:/Users/Mohse/IdeaProjects2/codebase/backend/Logs/SENSITIVITY.log"
                }),
            });
            const result = await response.json();
            if (response.ok) {
                setVersion(result.max_version); // Update the version state with the max batch number
            } else {
                console.error('Batch removal failed');
            }
        } catch (error) {
            console.error('Error during batch removal:', error);
        }
    };

    const checkAndCreateUploads = async () => {
        setAnalysisRunning(true);
        try {
            const response = await fetch('http://127.0.0.1:8007/check_and_create_uploads', {
                method: 'POST',
            });
            const result = await response.json();
            if (response.ok) {
                console.log(result.message);
            } else {
                console.error(result.error);
            }
        } catch (error) {
            console.error('Analysis failed', error);
        } finally {
            setAnalysisRunning(false);
        }
    };

    /**
     * Runs Cash Flow Analysis (CFA) calculations for selected versions
     * Sends configuration parameters to the backend and processes the response
     */
    /**
     * Runs Cash Flow Analysis (CFA) calculations for selected versions
     * Sends configuration parameters to the backend and processes the response
     */
    const handleRun = async () => {
        // Set loading state and reset previous results
        setAnalysisRunning(true);
        setCalculatedPrices({});

        try {
            // Prepare request payload with all necessary parameters
            const requestPayload = {
                selectedVersions,
                selectedV: V,
                selectedF: F,
                selectedR: R,
                selectedRF: RF,
                selectedCalculationOption,
                targetRow: target_row,
                SenParameters: S,
                formValues: formValues // Include form values to extract Amount10
            };

            console.log('Running CFA with parameters:', requestPayload);

            // Make API request to run calculations
            const response = await fetch('http://127.0.0.1:5007/run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestPayload),
            });

            // Process the response
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to run calculation');
            }

            const result = await response.json();
            console.log('Calculation completed successfully:', result);

            // Check if year columns configuration was returned
            if (result.yearColumns) {
                console.log('Year columns configuration:', result.yearColumns);
                // You could store this in state if needed for other components
            }

            // If price calculation was selected, fetch the calculated prices
            if (selectedCalculationOption === 'calculateForPrice') {
                await fetchCalculatedPrices();
            }

            // Start real-time monitoring if calculation was successful
            if (result.status === 'success') {
                startRealTimeMonitoring();
            }
        } catch (error) {
            console.error('Error during CFA calculation:', error);
            // Could add user notification here
        } finally {
            setAnalysisRunning(false);
        }
    };

    /**
     * Fetches calculated prices for all selected versions
     * This is a separate function to keep the main handleRun function focused
     */
    const fetchCalculatedPrices = async () => {
        try {
            // For each selected version, fetch the calculated price
            for (const version of selectedVersions) {
                const priceResponse = await fetch(`http://127.0.0.1:5007/price/${version}`);

                if (priceResponse.ok) {
                    const priceData = await priceResponse.json();
                    updatePrice(version, priceData.price);
                    console.log(`Fetched price for version ${version}:`, priceData.price);
                }
            }
        } catch (error) {
            console.error('Error fetching calculated prices:', error);
        }
    };

    /**
     * Starts real-time monitoring of calculation progress
     * This function connects to a stream for live updates from the calculation process
     */
    const startRealTimeMonitoring = () => {
        // Close any existing stream connections
        if (window.calculationEventSource) {
            window.calculationEventSource.close();
        }

        // For each selected version, set up a stream connection
        selectedVersions.forEach(version => {
            // Create a new EventSource connection for streaming updates
            const eventSource = new EventSource(`http://127.0.0.1:5007/stream_price/${version}`);
            window.calculationEventSource = eventSource;

            // Handle incoming messages
            eventSource.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    console.log(`Real-time update for version ${version}:`, data);

                    // Update price if available
                    if (data.price) {
                        updatePrice(version, data.price);
                    }

                    // Close the stream if the backend signals completion
                    if (data.complete) {
                        console.log(`Completed streaming for version ${version}`);
                        eventSource.close();
                    }
                } catch (error) {
                    console.error('Error processing stream data:', error);
                }
            };

            // Handle errors
            eventSource.onerror = (error) => {
                console.error(`Error in calculation stream for version ${version}:`, error);
                eventSource.close();
            };
        });

        /*
        // FUTURE ENHANCEMENTS (commented placeholders):
        // - Add progress indicators for each calculation step
        // - Implement real-time visualization updates
        // - Display performance metrics during calculation
        // - Show memory usage statistics
        // - Track and display error rates
        // - Provide estimated completion time
        */
    };

    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [availableParameters, setAvailableParameters] = useState([]);
    const [plotData, setPlotData] = useState(null);
    const [sensitivityReport, setSensitivityReport] = useState(null);
    const [sensitivitySummary, setSensitivitySummary] = useState(false);
    const [enabledParams, setEnabledParams] = useState([]);
    const handleRuns = async () => {
        // Set loading state and reset previous results
        setAnalysisRunning(true);
        setCalculatedPrices({});

        try {
            // Prepare request payload with all necessary parameters
            const requestPayload = {
                selectedVersions,
                selectedV: V,
                selectedF: F,
                selectedCalculationOption,
                targetRow: target_row,
                SenParameters: S,
                formValues: formValues // Include form values to extract presentable names
            };
            console.log('Running CFA with parameters:', requestPayload);

            // STEP 1: Run baseline calculations first
            console.log('Step 1: Running baseline calculations...');
            const baselineResponse = await fetch('http://127.0.0.1:2500/run-baseline', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestPayload),
            });
            if (!baselineResponse.ok) {
                const baselineError = await baselineResponse.json();
                throw new Error(baselineError.error || 'Baseline calculation failed');
            }
            const baselineResult = await baselineResponse.json();
            console.log('Baseline calculations completed:', baselineResult);

            // STEP 2: Generate sensitivity configurations
            console.log('Step 2: Generating sensitivity configurations...');
            const configResponse = await fetch('http://127.0.0.1:2500/sensitivity/configure', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestPayload),
            });
            if (!configResponse.ok) {
                const configErrorData = await configResponse.json();
                throw new Error(configErrorData.error || 'Failed to generate sensitivity configurations');
            }
            const configResult = await configResponse.json();
            console.log('Sensitivity configurations generated successfully:', configResult);

            // STEP 3: Run full calculations with sensitivity
            console.log('Step 3: Running full CFA calculations...');
            const response = await fetch('http://127.0.0.1:2500/runs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestPayload),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to run calculation');
            }
            const result = await response.json();
            console.log('Calculation completed successfully:', result);

            // STEP 4: Execute specific sensitivity calculations with CalSen paths
            console.log('Step 4: Running parameter-specific sensitivity calculations...');
            const senCalcResponse = await fetch('http://127.0.0.1:2500/calculate-sensitivity', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestPayload),
            });
            if (!senCalcResponse.ok) {
                const senCalcErrorData = await senCalcResponse.json();
                throw new Error(senCalcErrorData.error || 'Failed to execute sensitivity calculations');
            }
            const senCalcResult = await senCalcResponse.json();
            console.log('Parameter-specific sensitivity calculations completed:', senCalcResult);

            // Process each enabled parameter
            for (const param of enabledParams) {
                console.log(`Processing parameter ${param.paramId} in ${param.mode} mode`);

                const analysisResponse = await fetch('http://127.0.0.1:2500/sensitivity/analysis', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        param_id: param.paramId,
                        mode: param.mode,
                        values: param.values,
                        compareToKey: param.compareToKey,
                        version: selectedVersions[0],
                        waterfall: true,
                        bar: true,
                        point: true
                    }),
                });

                if (!analysisResponse.ok) {
                    console.warn(`Analysis for ${param.paramId} failed:`, await analysisResponse.json());
                } else {
                    const analysisResult = await analysisResponse.json();
                    console.log(`Analysis for ${param.paramId} completed:`, analysisResult);
                }
            }

            // STEP 5: Get available sensitivity parameters for visualization
            console.log('Step 5: Fetching available sensitivity parameters...');
            const paramsResponse = await fetch(`http://127.0.0.1:2500/api/sensitivity/parameters?version=${selectedVersions[0]}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });
            if (!paramsResponse.ok) {
                const paramsError = await paramsResponse.json();
                throw new Error(paramsError.error || 'Failed to fetch sensitivity parameters');
            }
            const paramsData = await paramsResponse.json();
            console.log('Available sensitivity parameters:', paramsData);
            setAvailableParameters(paramsData || []);

            // STEP 6: Generate a comprehensive sensitivity report
            console.log('Step 6: Generating sensitivity report...');
            const reportResponse = await fetch('http://127.0.0.1:2500/generate-report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    version: selectedVersions[0]
                }),
            });
            if (reportResponse.ok) {
                const reportResult = await reportResponse.json();
                console.log('Report generated successfully:', reportResult);
                setSensitivityReport(reportResult);
            }

            // STEP 7: Get sensitivity summary with plot counts and status
            console.log('Step 7: Getting sensitivity summary...');
            const summaryResponse = await fetch(`http://127.0.0.1:2500/api/sensitivity-summary/${selectedVersions[0]}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });
            if (summaryResponse.ok) {
                const summaryData = await summaryResponse.json();
                console.log('Sensitivity summary:', summaryData);
                setSensitivitySummary(summaryData);
            }

            // STEP 8: Visualize results if we have parameters
            if (paramsData && paramsData.length > 0) {
                const firstParam = paramsData[0];
                console.log('Step 8: Visualizing results for first parameter...');
                const visualizeResponse = await fetch('http://127.0.0.1:2500/api/sensitivity/visualize', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        version: selectedVersions[0],
                        param_id: firstParam.id,
                        mode: firstParam.modes[0] || 'percentage',
                        compareToKey: firstParam.compareToKey || 'S13',
                        plotTypes: ['waterfall', 'bar', 'point']
                    }),
                });
                if (!visualizeResponse.ok) {
                    const visualizeError = await visualizeResponse.json();
                    console.warn('Failed to visualize results:', visualizeError);
                } else {
                    const visualizeData = await visualizeResponse.json();
                    console.log('Visualization data:', visualizeData);
                    setPlotData(visualizeData);
                }
            }

            // STEP 9: Unified call to /run-all-sensitivity
            console.log('Step 9: Running unified sensitivity analysis...');
            const allResponse = await fetch('http://127.0.0.1:2500/run-all-sensitivity', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    selectedVersions,
                    enabledParams: enabledParams // make sure this is available in scope
                }),
            });
            if (allResponse.ok) {
                const allResult = await allResponse.json();
                console.log('Unified sensitivity analysis completed:', allResult);
            } else {
                const allError = await allResponse.json();
                console.warn('Unified sensitivity analysis failed:', allError);
            }


// STEP 10: Inject presentable parameter names into sensitivity JSON
            console.log('Step 10: Injecting presentable parameter names...');
            const injectResponse = await fetch('http://127.0.0.1:2500/inject-names', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    version: selectedVersions[0]
                }),
            });
            if (injectResponse.ok) {
                const injectResult = await injectResponse.json();
                console.log('Parameter names injected successfully:', injectResult);
            } else {
                const injectError = await injectResponse.json();
                console.warn('Failed to inject parameter names:', injectError);
            }
            setSuccess('Analysis completed successfully!');
            setError(null);
        } catch (error) {
            console.error('Error during CFA calculation:', error);
            setError(error.message);
            setSuccess(null);
        } finally {
            setAnalysisRunning(false);
        }
    };





    const handleRunPNG = async () => {
        setAnalysisRunning(true);
        try {
            // Always use current version if no versions selected
            const versions = selectedVersions.length > 0 ? selectedVersions : [version];

            // Ensure current version is included
            if (!versions.includes(version)) {
                versions.push(version);
            }

            const response = await fetch('http://127.0.0.1:5008/generate_png_plots', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    selectedVersions: versions,
                    selectedProperties: selectedProperties || [], // Ensure array even if empty
                    remarks,
                    customizedFeatures,
                    S: {} // Empty sensitivity params for now
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // Wait a bit for plots to be generated
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Trigger a refresh of the plots
            const plotsTab = document.querySelector('button.tab-button:nth-child(4)');
            if (plotsTab) {
                plotsTab.click();
            }
        } catch (error) {
            console.error('Error during PNG generation:', error);
        } finally {
            setAnalysisRunning(false);
        }
    };

    const handleRunSub = async () => {
        setAnalysisRunning(true);
        try {
            const response = await fetch('http://127.0.0.1:5009/runSub', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    selectedVersions,
                    selectedProperties,
                    remarks,
                    customizedFeatures,
                    selectedV: V,
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
        } catch (error) {
            console.error('Error during analysis:', error);
        } finally {
            setAnalysisRunning(false);
        }
    };

    const handleSubmitCompleteSet = async () => {
        const formItems = Object.keys(formValues)
            .filter((key) =>
                ['Amount1', 'Amount2', 'Amount3', 'Amount4', 'Amount5', 'Amount6', 'Amount7'].some((amt) =>
                    key.includes(amt)
                )
            )
            .map((key) => ({
                id: key,
                ...formValues[key],
            }));

        const filteredValues = formItems.map((item) => {
            const efficacyPeriod = formValues[item.id].efficacyPeriod || {};
            return {
                id: item.id,
                value: item.value,
                remarks: item.remarks || '',
            };
        });

        try {
            const response = await fetch(`http://127.0.0.1:3052/append/${version}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ filteredValues }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.text();
            console.log(result);
        } catch (error) {
            console.error('Error during parameter submission:', error);
        }
    };

    // Fetch HTML files based on version
    useEffect(() => {
        const fetchHtmlFiles = async () => {
            // Skip API call if version is empty (during refresh)
            if (!version) {
                console.log('Skipping HTML fetch - version is empty (refresh in progress)');
                return;
            }

            try {
                console.log(`Fetching HTML files for version: ${version}`);
                const response = await fetch(`http://localhost:8009/api/album_html/${version}`);
                console.log(`Response status:`, response.status);

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                console.log(`API response data:`, data);

                if (!data || data.length === 0) {
                    console.log(`No HTML files returned from API for version ${version}`);
                    setAlbumHtmls({});
                    return;
                }

                // Log the raw data to see what's being returned
                console.log(`Raw HTML data:`, data);

                // Check if data is an array and has elements
                if (!Array.isArray(data) || data.length === 0) {
                    console.log(`No HTML files returned from API for version ${version}`);
                    setAlbumHtmls({});
                    return;
                }

                // Log the first item in the data array
                console.log(`First HTML file:`, data[0]);

                // Check if the data has the expected structure
                if (!data[0].album || !data[0].content) {
                    console.log(`HTML data does not have the expected structure:`, data[0]);
                    setAlbumHtmls({});
                    return;
                }

                // Group HTML files by album
                const albumGroupedHtmls = data.reduce((acc, html) => {
                    const { album } = html;
                    if (!acc[album]) {
                        acc[album] = [];
                    }
                    acc[album].push(html);
                    return acc;
                }, {});

                console.log(`Grouped HTML files by album:`, albumGroupedHtmls);
                setAlbumHtmls(albumGroupedHtmls); // Update the HTML paths for the specified version

                // Automatically select the first album that has HTML files
                const firstAlbumWithHtml = Object.keys(albumGroupedHtmls)[0];
                console.log(`First album with HTML files:`, firstAlbumWithHtml);
                if (firstAlbumWithHtml) {
                    setSelectedHtml(firstAlbumWithHtml);

                    // Log the HTML content of the first file in the first album
                    if (albumGroupedHtmls[firstAlbumWithHtml] && albumGroupedHtmls[firstAlbumWithHtml][0]) {
                        console.log(`HTML content of first file:`, albumGroupedHtmls[firstAlbumWithHtml][0].content);
                        console.log(`HTML content length:`, albumGroupedHtmls[firstAlbumWithHtml][0].content.length);
                    }
                }
            } catch (error) {
                console.error('Error fetching HTML files:', error);
                console.error('Error details:', error.message);
                setAlbumHtmls({});
            }
        };

        fetchHtmlFiles();
    }, [version]);

    const transformPathToUrlh = (filePath) => {
        // Normalize the file path to replace backslashes with forward slashes
        const normalizedPath = filePath.replace(/\\/g, '/');

        // Extract the batch version using a simpler regex that just looks for the number in Batch(X)
        const batchMatch = normalizedPath.match(/Batch\((\d+)\)/);
        if (!batchMatch) return normalizedPath; // If no batch number found, return original path

        const version = batchMatch[1];

        // Split the path by '/' to extract album and filename more reliably
        const pathParts = normalizedPath.split('/');

        // The HTML file should be the last part
        const fileName = pathParts[pathParts.length - 1];

        // The album should be the second-to-last directory
        const album = pathParts[pathParts.length - 2];

        // Construct the URL using the extracted parts
        // Use the Flask server that's serving the HTML files (port 8009)
        return `http://localhost:8009/static/html/${version}/${album}/${fileName}`;
    };

    const transformAlbumName = (album) => {
        // Handle HTML_v1_2_PlotType format
        const htmlMatch = album.match(/HTML_v([\d_]+)_(.+)/);
        if (htmlMatch) {
            const versions = htmlMatch[1].replace(/_/g, ', ');
            const description = htmlMatch[2].replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2');
            return `${description} for versions [${versions}] (Current: ${version})`;
        }

        // Handle legacy v1_2_PlotType_Plot format
        const legacyMatch = album.match(/v([\d_]+)_(.+?)(_Plot)?$/);
        if (legacyMatch) {
            const versions = legacyMatch[1].replace(/_/g, ', ');
            const description = legacyMatch[2].replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2');
            return `${description} for versions [${versions}] (Current: ${version})`;
        }

        // Default formatting for other album names
        return `${album.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2')} (Version ${version})`;
    };

    const renderHtmlContent = () => {
        if (!selectedHtml || !albumHtmls[selectedHtml]) return null;

        return albumHtmls[selectedHtml].map((html, index) => {
            return (
                <div key={index} className={`html-content ${iframesLoaded[index] ? 'loaded' : ''}`}>
                    <iframe
                        srcDoc={html.content}
                        style={{ margin: '10px', width: '100%', height: '600px', border: 'none' }}
                        onLoad={() => {
                            setIframesLoaded((prev) => ({ ...prev, [index]: true }));
                            console.log(`Iframe ${index} loaded successfully`);
                        }}
                        className={iframesLoaded[index] ? 'loaded' : ''}
                        title={`HTML Content ${index}`}
                        allowFullScreen={true}
                        allow="fullscreen"
                    />
                </div>
            );
        });
    };

    const renderCase2Content = () => {
        return (
            <div>
                {renderVersionControl()}

                {(!albumHtmls || Object.keys(albumHtmls).length === 0) ? (
                    <div>No HTML files available</div>
                ) : (
                    <Tabs
                        selectedIndex={Object.keys(albumHtmls).indexOf(selectedHtml)}
                        onSelect={(index) => setSelectedHtml(Object.keys(albumHtmls)[index])}
                    >
                        <TabList>
                            {Object.keys(albumHtmls).map((album) => (
                                <Tab key={album}>{transformAlbumName(album)}</Tab>
                            ))}
                        </TabList>
                        {Object.keys(albumHtmls).map((album) => (
                            <TabPanel key={album}>{renderHtmlContent()}</TabPanel>
                        ))}
                    </Tabs>
                )}
            </div>
        );
    };

    // Fetch album images based on version
    useEffect(() => {
        const fetchImages = async () => {
            // Skip API call if version is empty (during refresh)
            if (!version) {
                console.log('Skipping image fetch - version is empty (refresh in progress)');
                return;
            }

            try {
                console.log(`Fetching images for version: ${version}`);
                const response = await fetch(`http://localhost:8008/api/album/${version}`);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();

                // Group images by album
                const albumGroupedImages = data.reduce((acc, image) => {
                    const { album } = image;
                    if (!acc[album]) {
                        acc[album] = [];
                    }
                    acc[album].push(image);
                    return acc;
                }, {});

                setAlbumImages(albumGroupedImages); // Update the image paths for the specified version

                // Automatically select the first album that has images
                const firstAlbumWithImages = Object.keys(albumGroupedImages)[0];
                if (firstAlbumWithImages) {
                    setSelectedAlbum(firstAlbumWithImages);
                }
            } catch (error) {
                console.error('Error fetching images:', error);
            }
        };

        fetchImages();
    }, [version]);

    const transformPathToUrl = (filePath) => {
        // Normalize the file path to replace backslashes with forward slashes
        const normalizedPath = filePath.replace(/\\/g, '/');

        // Extract the batch version using a simpler regex that just looks for the number in Batch(X)
        const batchMatch = normalizedPath.match(/Batch\((\d+)\)/);
        if (!batchMatch) return normalizedPath; // If no batch number found, return original path

        const version = batchMatch[1];

        // Split the path by '/' to extract album and filename more reliably
        const pathParts = normalizedPath.split('/');

        // The PNG file should be the last part
        const fileName = pathParts[pathParts.length - 1];

        // The album should be the second-to-last directory
        const album = pathParts[pathParts.length - 2];

        // Construct the URL using the extracted parts
        return `http://localhost:5008/images/Batch(${version})/Results(${version})/${album}/${fileName}`;
    };

    const transformAlbumNamePlot = (album) => {
        // Handle organized album format (e.g., 1_2_PlotType_PlotAlbum)
        const organizedMatch = album.match(/([\d_]+)_(.+?)(_PlotAlbum)?$/);
        if (organizedMatch) {
            const versions = organizedMatch[1].replace(/_/g, ', ');
            const description = organizedMatch[2].replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2');
            return `${description} for versions [${versions}] (Current: ${version})`;
        }

        // Handle legacy format (e.g., AnnotatedStaticPlots)
        const legacyMatch = album.match(/([\d_]+)_(.+?)$/);
        if (legacyMatch) {
            const versions = legacyMatch[1].replace(/_/g, ', ');
            const description = legacyMatch[2].replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2');
            return `${description} for versions [${versions}] (Current: ${version})`;
        }

        // Default formatting for other album names
        return `${album.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2')} (Version ${version})`;
    };

    const renderPlotContent1 = () => {
        if (!selectedAlbum || !albumImages[selectedAlbum]) return null;

        return albumImages[selectedAlbum].map((image, index) => {
            const imageUrl = transformPathToUrl(image.path);
            return (
                <div key={index} className={`plot-content ${imagesLoaded[index] ? 'loaded' : ''}`}>
                    <CustomizableImage
                        src={imageUrl}
                        alt={image.name}
                        width="600"
                        height="400"
                        style={{ margin: '10px' }}
                        onLoad={() => {
                            setImagesLoaded((prev) => ({ ...prev, [index]: true }));
                        }}
                        className={imagesLoaded[index] ? 'loaded' : ''}
                    />
                </div>
            );
        });
    };

    const renderCase3Content = () => {
        if (!albumImages || Object.keys(albumImages).length === 0)
            return <div>No PNG files available</div>;

        return (
            <div>
                {renderVersionControl()}
                <Tabs
                    selectedIndex={Object.keys(albumImages).indexOf(selectedAlbum)}
                    onSelect={(index) => setSelectedAlbum(Object.keys(albumImages)[index])}
                >
                    <TabList>
                        {Object.keys(albumImages).map((album) => (
                            <Tab key={album}>{transformAlbumNamePlot(album)}</Tab>
                        ))}
                    </TabList>
                    {Object.keys(albumImages).map((album) => (
                        <TabPanel key={album}>{renderPlotContent1()}</TabPanel>
                    ))}
                </Tabs>
            </div>
        );
    };

    // Fetch CSV files based on version
    useEffect(() => {
        const fetchCsvFiles = async () => {
            // Skip API call if version is empty (during refresh)
            if (!version) {
                console.log('Skipping CSV fetch - version is empty (refresh in progress)');
                return;
            }

            try {
                console.log(`Fetching CSV files for version: ${version}`);
                const response = await fetch(`http://localhost:8007/api/csv-files/${version}`);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                setCsvFiles(data);
                setSubTab(data.length > 0 ? data[0].name : ''); // Set the first file as the default subtab if none is active
            } catch (error) {
                console.error('Error fetching CSV files:', error);
            }
        };

        fetchCsvFiles();
    }, [version]);

    // Update subTab based on activeSubTab and ensure it's valid
    useEffect(() => {
        if (csvFiles.length > 0) {
            const fileNames = csvFiles.map((file) => file.name);
            if (!fileNames.includes(subTab)) {
                setSubTab(fileNames[0]); // Set to the first available file if not in list
            }
        }
    }, [csvFiles, subTab]);

    const handleVersionChange = (event) => {
        setVersion(event.target.value);
    };

    const renderCase1Content = () => {
        // Name mapping for specific files to more presentable names
        const amount10Keys = Object.keys(formValues).filter(key => key.includes('Amount10'));
        const yearColumnsToHighlight = amount10Keys.length > 0
            ? parseInt(formValues[amount10Keys[0]].value) || 0
            : 0;
        const nameMapping = {
            [`CFA(${version}).csv`]: `Cash Flow Analysis (Version ${version})`,
            [`Economic_Summary(${version}).csv`]: `Economic Summary (Version ${version})`,
            [`Cumulative_Opex_Table_(${version}).csv`]: `Cumulative Opex Table (Version ${version})`,
            [`Filtered_Value_Intervals(${version}).csv`]: `Filtered Value Intervals (Version ${version})`,
            [`Fixed_Opex_Table_(${version}).csv`]: `Fixed Opex Table (Version ${version})`,
            [`Variable_Opex_Table_(${version}).csv`]: `Variable Opex Table (Version ${version})`,
            [`Configuration_Matrix(${version}).csv`]: `Configuration Matrix (Version ${version})`,
            [`Distance_From_Paying_Taxes(${version}).csv`]: `Distance from Paying Taxes (Version ${version})`,
            [`Sorted_Points(${version}).csv`]: `Sorted Points (Version ${version})`,
            [`Variable_Table(${version}).csv`]: `Variable Table (Version ${version})`,
        };

        // Exclude these files from display (if any)
        const exclusionArray = [
            `Configuration_Matrix(${version}).csv`,
            `Distance_From_Paying_Taxes(${version}).csv`,
            `Sorted_Points(${version}).csv`,
            `Fixed_Opex_Table_${version}.csv`,
            `Variable_Opex_Table_${version}.csv`,
            `Filtered_Value_Intervals(${version}).csv`,
        ];

        // Filter and sort the CSV files
        const sortedCsvFiles = [...csvFiles]
            .filter((file) => !exclusionArray.includes(file.name)) // Filter out excluded files
            .sort((a, b) => a.name.localeCompare(b.name)); // Sort files alphabetically

        return (
            <div>
                {renderVersionControl()}
                <Tabs
                    selectedIndex={sortedCsvFiles.findIndex((file) => file.name === subTab)}
                    onSelect={(index) => setSubTab(sortedCsvFiles[index]?.name || '')}
                >
                <TabList>
                    {sortedCsvFiles.map((file) => (
                        <Tab key={file.name}>
                            {nameMapping[file.name] || file.name.replace(`(${version})`, '')}{' '}
                            {/* Use mapped name or fallback to filename without version */}
                        </Tab>
                    ))}
                </TabList>
                {sortedCsvFiles.map((file) => (
                    <TabPanel key={file.name}>
                        <CustomizableTable data={file.data} fileName={file.name}  yearColumnsToHighlight={yearColumnsToHighlight}
                        />
                    </TabPanel>
                ))}
            </Tabs>
            </div>
        );
    };

    const renderForm = () => (
        <div className="form-container">
            <div className="sub-tab-buttons">
                <button
                    className={`sub-tab-button ${activeSubTab === 'ProjectConfig' ? 'active' : ''}`}
                    onClick={() => setActiveSubTab('ProjectConfig')}
                >
                    Project Configuration
                </button>
                <button
                    className={`sub-tab-button ${activeSubTab === 'LoanConfig' ? 'active' : ''}`}
                    onClick={() => setActiveSubTab('LoanConfig')}
                >
                    Loan Configuration
                </button>
                <button
                    className={`sub-tab-button ${activeSubTab === 'RatesConfig' ? 'active' : ''}`}
                    onClick={() => setActiveSubTab('RatesConfig')}
                >
                    Rates & Fixed Costs
                </button>
                <button
                    className={`sub-tab-button ${activeSubTab === 'Process1Config' ? 'active' : ''}`}
                    onClick={() => setActiveSubTab('Process1Config')}
                >
                    Process Quantities (Vs, units)
                </button>
                <button
                    className={`sub-tab-button ${activeSubTab === 'Process2Config' ? 'active' : ''}`}
                    onClick={() => setActiveSubTab('Process2Config')}
                >
                    Process Costs <br /> (Vs, $ / unit)
                </button>
                <button
                    className={`sub-tab-button ${activeSubTab === 'Revenue1Config' ? 'active' : ''}`}
                    onClick={() => setActiveSubTab('Revenue1Config')}
                >
                    Additional Revenue Streams Quantities<br /> (Rs, units)
                </button>
                <button
                    className={`sub-tab-button ${activeSubTab === 'Revenue2Config' ? 'active' : ''}`}
                    onClick={() => setActiveSubTab('Revenue2Config')}
                >
                    Additional Revenue Streams Prices <br /> (Rs, $ / unit)
                </button>
                <button
                            className={`sub-tab-button ${activeSubTab === 'Scaling' ? 'active' : ''}`}
                            onClick={() => setActiveSubTab('Scaling')}
                        >
                            + Scaling
                        </button>
                <button
                    className={`sub-tab-button ${activeSubTab === 'FixedRevenueConfig' ? 'active' : ''}`}
                    onClick={() => setActiveSubTab('FixedRevenueConfig')}
                >
                    Fixed Revenue Components <br /> (RFs, $)
                </button>
            </div>
            <div className="form-content">

                {activeSubTab === 'ProjectConfig' && (
                    <GeneralFormConfig
                        formValues={formValues}
                        handleInputChange={handleInputChange}
                        version={version}
                        filterKeyword="Amount1"
                        S={S || {}}
                        setS={setS}
                        setVersion={setVersion}
                    />
                )}
                {activeSubTab === 'LoanConfig' && (
                    <GeneralFormConfig
                        formValues={formValues}
                        handleInputChange={handleInputChange}
                        version={version}
                        filterKeyword="Amount2"
                        S={S || {}}
                        setS={setS}
                        setVersion={setVersion}
                    />
                )}
                {activeSubTab === 'RatesConfig' && (
                    <GeneralFormConfig
                        formValues={formValues}
                        handleInputChange={handleInputChange}
                        version={version}
                        filterKeyword="Amount3"
                        F={F}
                        toggleF={toggleF}
                        S={S || {}}
                        setS={setS}
                        setVersion={setVersion}
                    />
                )}
                {activeSubTab === 'Process1Config' && (
                    <>
                        <GeneralFormConfig
                            formValues={formValues}
                            handleInputChange={handleInputChange}
                            version={version}
                            filterKeyword="Amount4"
                            V={V}
                            setV={setV}
                            R={R}
                            setR={setR}
                            toggleR={toggleR}
                            toggleV={toggleV}
                            S={S || {}}
                            setS={setS}
                            setVersion={setVersion}
                            summaryItems={finalResults.Amount4} // Pass the stored results
                        />
                        <ExtendedScaling
                            baseCosts={scalingBaseCosts.Amount4 || []}
                            onScaledValuesChange={handleScaledValuesChange}
                            initialScalingGroups={scalingGroups.filter(g => g._scalingType === 'Amount4')}
                            onScalingGroupsChange={(newGroups) => {
                                const otherGroups = scalingGroups.filter(g => g._scalingType !== 'Amount4');
                                const updatedGroups = newGroups.map(g => ({...g, _scalingType: 'Amount4'}));
                                handleScalingGroupsChange([...otherGroups, ...updatedGroups]);
                            }}
                            filterKeyword="Amount4"
                            V={V}
                            R={R}
                            toggleV={toggleV}
                            toggleR={toggleR}
                            onFinalResultsGenerated={handleFinalResultsGenerated} // Add this callback
                            activeGroupIndex={activeScalingGroups.Amount4 || 0}
                            onActiveGroupChange={handleActiveGroupChange}
                        />
                    </>
                )}
                {activeSubTab === 'Process2Config' && (
                    <>
                        <GeneralFormConfig
                            formValues={formValues}
                            handleInputChange={handleInputChange}
                            version={version}
                            filterKeyword="Amount5"
                            V={V}
                            setV={setV}
                            R={R}
                            setR={setR}
                            toggleR={toggleR}
                            toggleV={toggleV}
                            S={S || {}}
                            setS={setS}
                            setVersion={setVersion}
                            summaryItems={finalResults.Amount5} // Pass the stored results
                        />
                        <ExtendedScaling
                            baseCosts={scalingBaseCosts.Amount5 || []}
                            onScaledValuesChange={handleScaledValuesChange}
                            initialScalingGroups={scalingGroups.filter(g => g._scalingType === 'Amount5')}
                            onScalingGroupsChange={(newGroups) => {
                                const otherGroups = scalingGroups.filter(g => g._scalingType !== 'Amount5');
                                const updatedGroups = newGroups.map(g => ({...g, _scalingType: 'Amount5'}));
                                handleScalingGroupsChange([...otherGroups, ...updatedGroups]);
                            }}
                            filterKeyword="Amount5"
                            V={V}
                            R={R}
                            toggleV={toggleV}
                            toggleR={toggleR}
                            onFinalResultsGenerated={handleFinalResultsGenerated} // Add this callback
                            activeGroupIndex={activeScalingGroups.Amount5 || 0}
                            onActiveGroupChange={handleActiveGroupChange}
                        />
                    </>
                )}
                {activeSubTab === 'Revenue1Config' && (
                    <>
                        <GeneralFormConfig
                            formValues={formValues}
                            handleInputChange={handleInputChange}
                            version={version}
                            filterKeyword="Amount6"
                            V={V}
                            setV={setV}
                            R={R}
                            setR={setR}
                            toggleR={toggleR}
                            toggleV={toggleV}
                            S={S || {}}
                            setS={setS}
                            setVersion={setVersion}
                            summaryItems={finalResults.Amount6} // Pass the stored results
                        />
                        <ExtendedScaling
                            baseCosts={scalingBaseCosts.Amount6 || []}
                            onScaledValuesChange={handleScaledValuesChange}
                            initialScalingGroups={scalingGroups.filter(g => g._scalingType === 'Amount6')}
                            onScalingGroupsChange={(newGroups) => {
                                const otherGroups = scalingGroups.filter(g => g._scalingType !== 'Amount6');
                                const updatedGroups = newGroups.map(g => ({...g, _scalingType: 'Amount6'}));
                                handleScalingGroupsChange([...otherGroups, ...updatedGroups]);
                            }}
                            filterKeyword="Amount6"
                            V={V}
                            R={R}
                            toggleV={toggleV}
                            toggleR={toggleR}
                            onFinalResultsGenerated={handleFinalResultsGenerated} // Add this callback
                            activeGroupIndex={activeScalingGroups.Amount6 || 0}
                            onActiveGroupChange={handleActiveGroupChange}
                        />
                    </>
                )}
                {activeSubTab === 'Revenue2Config' && (
                    <>
                        <GeneralFormConfig
                            formValues={formValues}
                            handleInputChange={handleInputChange}
                            version={version}
                            filterKeyword="Amount7"
                            V={V}
                            setV={setV}
                            R={R}
                            setR={setR}
                            toggleR={toggleR}
                            toggleV={toggleV}
                            S={S || {}}
                            setS={setS}
                            setVersion={setVersion}
                            summaryItems={finalResults.Amount7} // Pass the stored results
                        />
                        <ExtendedScaling
                            baseCosts={scalingBaseCosts.Amount7 || []}
                            onScaledValuesChange={handleScaledValuesChange}
                            initialScalingGroups={scalingGroups.filter(g => g._scalingType === 'Amount7')}
                            onScalingGroupsChange={(newGroups) => {
                                const otherGroups = scalingGroups.filter(g => g._scalingType !== 'Amount7');
                                const updatedGroups = newGroups.map(g => ({...g, _scalingType: 'Amount7'}));
                                handleScalingGroupsChange([...otherGroups, ...updatedGroups]);
                            }}
                            filterKeyword="Amount7"
                            V={V}
                            R={R}
                            toggleV={toggleV}
                            toggleR={toggleR}
                            onFinalResultsGenerated={handleFinalResultsGenerated} // Add this callback
                            activeGroupIndex={activeScalingGroups.Amount7 || 0}
                            onActiveGroupChange={handleActiveGroupChange}
                        />
                    </>
                )}

                {activeSubTab === 'Scaling' && (
                    <CentralScalingTab
                        formValues={formValues}
                        V={V}
                        R={R}
                        toggleV={toggleV}
                        toggleR={toggleR}

                        scalingBaseCosts={scalingBaseCosts}
                        setScalingBaseCosts={setScalingBaseCosts}
                        scalingGroups={scalingGroups}

                        onScalingGroupsChange={handleScalingGroupsChange}
                        onScaledValuesChange={handleScaledValuesChange}

                    />
                )}
                { activeSubTab === 'FixedRevenueConfig' && (
                    <GeneralFormConfig
                        formValues={formValues}
                        handleInputChange={handleInputChange}
                        version={version}
                        filterKeyword="Amount8"
                        RF={RF}
                        setRF={setRF}
                        toggleRF={toggleRF}
                        S={S || {}}
                        setS={setS}
                        setVersion={setVersion}
                    />
                )}
                <div className="form-panel-container" style={{gap: 0, margin: 0, padding: 0}}>
                <div className="form-action-buttons" style={{gap: 0}}>
                    <div className="button-row config-row" style={{marginBottom: 0, padding: 0}}>
                        <div className="tooltip-container">
                            <button
                                type="button"
                                onClick={() => loadConfiguration(version)}
                                style={{padding: "5px 8px"}}
                            >
                                Load Configuration
                            </button>
                        </div>
                        <div className="version-input-container">
                            <input
                                id="versionNumber"
                                type="number"
                                className="version-input"
                                placeholder="1"
                                value={version}
                                onChange={handleVersionChange}
                                style={{height: "25px"}}
                            />
                        </div>
                    </div>

                    <div className="button-row checkbox-row" style={{marginTop: 0, marginBottom: 0, padding: 0}}>
                        <label>
                            <input
                                type="checkbox"
                                checked={remarks === 'on'}
                                onChange={toggleRemarks}
                            />
                            Remarks
                        </label>
                        <label>
                            <input
                                type="checkbox"
                                checked={customizedFeatures === 'on'}
                                onChange={toggleCustomizedFeatures}
                            />
                            Customized Features
                        </label>
                    </div>

                    <div className="button-row visualization-row" style={{marginTop: 0, marginBottom: 0, padding: 0}}>
                        <div className="tooltip-container">
                            <button
                                onClick={handleRunPNG}
                                style={{padding: "5px 8px"}}
                            >
                                Generate PNG Plots
                            </button>
                           {/* <span className="tooltip1">
                                Choose the attributes thou wishest to grace the legend, and with a
                                click, summon forth the PNG plots.
                            </span> */}
                        </div>
                        <div className="tooltip-container">
                            <button
                                type="button"
                                onClick={handleRunSub}
                                style={{padding: "5px 8px"}}
                            >
                                Generate Dynamic Plots
                            </button>
                            {/* <span className="tooltip1">
                                Seize the power of efficacy to tailor thy analysis, then click to
                                conjure dynamic plots.
                            </span> */}
                        </div>
                    </div>

                    <div className="step-content" style={{marginTop: 0, marginBottom: 0, padding: 0}}>
                        <button
                          className="primary-action"
                          onClick={createNewBatch}
                          disabled={batchRunning || analysisRunning}
                          style={{padding: "5px 8px", margin: 0}}
                        >
                          {batchRunning ? (
                            <span className="loading-text">Creating New Batch</span>
                          ) : (
                            <span className="action-text">Create New Batch</span>
                          )}
                        </button>
                        <button
                          className="secondary-action"
                          onClick={RemoveBatch}
                          disabled={batchRunning || analysisRunning}
                          style={{padding: "5px 8px", margin: 0}}
                        >
                          <span className="action-text">Remove Current Batch</span>
                        </button>
                    </div>

                    <div className="button-row practical-row" style={{marginTop: 0, padding: 0}}>
                        <div className="tooltip-container">
                            <button
                                onClick={handleRun}
                                style={{padding: "5px 8px"}}
                            >
                                Run CFA
                            </button>
                            <button
                                onClick={handleRuns}
                                style={{padding: "5px 8px"}}
                            >
                                Run Sensitivity
                            </button>
                            <button
                                onClick={handleRuns}
                                style={{padding: "5px 8px"}}
                            >
                                Visualize Sensitivity
                            </button>
                            {/* <span className="tooltip1">
                                <p className="left-aligned-text">
                                    Engage the button to unleash a thorough cash flow analysis:
                                    Cumulative cash flows • Annual revenues • Operating expenses •
                                    Loan repayment terms • Depreciation schedules • State taxes •
                                    Federal taxes • Annual cash flows
                                </p>
                            </span> */}
                        </div>
                        <div className="tooltip-container">
                            <button
                                onClick={() => setMonitoringActive(!monitoringActive)}
                                className={monitoringActive ? 'active-monitoring' : ''}
                                style={{padding: "5px 8px"}}
                            >
                                {monitoringActive ? 'Hide Monitoring' : 'Show Monitoring'}
                            </button>
                            {/* <span className="tooltip1">
                                Toggle real-time calculation monitoring display
                            </span> */}
                        </div>
                        <div className="tooltip-container">
                            <button
                                onClick={handleSubmitCompleteSet}
                                style={{padding: "5px 8px"}}
                            >
                                Submit Complete Set
                            </button>
                        </div>
                        <div className="tooltip-container">
                            <button
                                type="button"
                                onClick={handleReset}
                                style={{padding: "5px 8px"}}
                            >
                                Reset
                            </button>
                        </div>

                        {/* Reset Options Popup */}
                        <ResetOptionsPopup
                            show={showResetOptions}
                            options={resetOptions}
                            onOptionChange={handleResetOptionChange}
                            onConfirm={handleResetConfirm}
                            onCancel={handleResetCancel}
                        />
                    </div>
                </div>
                </div>
                {monitoringActive && (
                    <CalculationMonitor
                        selectedVersions={selectedVersions}
                        updatePrice={updatePrice}
                        isActive={monitoringActive}
                        currentVersion={version}
                        onChange={() => {}} // Adding empty function to satisfy prop requirement
                    />
                )}
                <div className="calculation-options">
                    <div className="calculation-row">
                        <div className="calculation-input-group">
                            <label className="radio-label">
                                <input
                                    type="radio"
                                    name="calculationOption"
                                    value="calculateForPrice"
                                    checked={selectedCalculationOption === 'calculateForPrice'}
                                    onChange={handleOptionChange}
                                />
                                Calculate for Price, Zeroing NPV at Year
                            </label>
                            <div className="target-row-container">
                                <input
                                    type="number"
                                    className="target-row-input"
                                    placeholder="Enter Year"
                                    value={target_row}
                                    onChange={handleTargetRowChange}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="selectors-container">
                        <div className="property-selector-container">
                            <PropertySelector
                                selectedProperties={selectedProperties}
                                setSelectedProperties={setSelectedProperties}
                            />
                        </div>
                        <div className="version-selector-container">
                            <VersionSelector />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );


    const renderAboutUsContent = () => {
        return (
            <div className="about-us-container">
                <div className="about-us-content">
                    <div className="about-us-seal"></div>
                    <h1>Financial Literacy<br/>
                        A Foundation for Economic Empowerment</h1>
                    <p>Financial literacy stands as the cornerstone of personal and professional empowerment in today's complex economic landscape.</p>

                    <div className="decorative-divider">✦ ✦ ✦</div>


                    <h2>Synthesize disparate elements into cohesive strategies</h2>

                    <p>learners can manipulate, analyze, and internalize.</p>

                    <h2>Cultivating Integrated Financial Thinkers</h2>

                    <div className="decorative-divider">✦ ✦ ✦</div>

                </div>

            </div>
        );
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'AboutUs':
                return renderAboutUsContent();

            case 'Input':
                return (
                        renderForm()
                );

            case 'NaturalMotion':
                return (
                    <div className="model-selection">
                        <SpatialTransformComponent />
                    </div>
                );

            case 'Case1':
                return renderCase1Content();

            case 'Case2':
                return renderCase2Content();

            case 'Case3':
                return renderCase3Content();

            case 'Scaling':
                return (
                    <CentralScalingTab
                        formValues={formValues}
                        V={V}
                        R={R}
                        toggleV={toggleV}
                        toggleR={toggleR}

                        scalingBaseCosts={scalingBaseCosts}
                        setScalingBaseCosts={setScalingBaseCosts}
                        scalingGroups={scalingGroups}

                        onScalingGroupsChange={handleScalingGroupsChange}
                        onScaledValuesChange={handleScaledValuesChange}
                    />
                );

            case 'TestingZone':
                return <TestingZone />;

            case 'FactAdmin':
                return (
                    <div>
                        <FactEngine />
                        <FactEngineAdmin />
                        <StickerHeader />
                    </div>
                );

            case 'PlotGallery':
                return (
                    <PlotsTabs
                        version={version}
                    />
                );

            case 'SensitivityPlots':
                return (
                    <SensitivityPlotsTabs
                        version={version}
                        S={S}
                    />
                );

            default:
                return null;
        }
    };

    return (
        <div className="HomePage">

            <div className="HomePageSectionA">
                <div className="about-us-image1"></div>
                <div className="HomePageSectionT">

                </div>
                <div className="theme-ribbon">

                <div className="theme-buttons">
    <ThemeButton
        theme="creative"
        currentTheme={season === 'creative' ? 'creative' : season === 'creative' ? 'light' : 'dark'}
        onThemeChange={() => handleThemeChange('creative')}
    />
    <ThemeButton
        theme="light"
        currentTheme={season === 'light' ? 'light' : season === 'light' ? 'creative' : 'dark'}
        onThemeChange={() => handleThemeChange('light')}
    />
    <ThemeButton
        theme="dark"
        currentTheme={season === 'dark' ? 'dark' : season === 'dark' ? 'light' : 'creative'}
        onThemeChange={() => handleThemeChange('dark')}
    />
</div>
                </div>
            </div>
            <div className="main-content">
                <nav className="HomePageTabs">
                    <div>
                        <button
                            className={`tab-button ${activeTab === 'AboutUs' ? 'active' : ''}`}
                            onClick={() => setActiveTab('AboutUs')}
                            data-tab="AboutUs"
                        >
                            About Us
                        </button>
                        <button
                            className={`tab-button ${activeTab === 'Input' ? 'active' : ''}`}
                            onClick={() => setActiveTab('Input')}
                        >
                            Input
                        </button>
                        <button
                            className={`tab-button ${activeTab === 'Case1' ? 'active' : ''}`}
                            onClick={() => setActiveTab('Case1')}
                        >
                            Cash Flow Analysis
                        </button>
                        <button
                            className={`tab-button ${activeTab === 'Case2' ? 'active' : ''}`}
                            onClick={() => setActiveTab('Case2')}
                        >
                            Dynamic SubPlots
                        </button>
                        <button
                            className={`tab-button ${activeTab === 'Case3' ? 'active' : ''}`}
                            onClick={() => setActiveTab('Case3')}
                        >
                            Plots
                        </button>
                        <button
                            className={`tab-button ${activeTab === 'Scaling' ? 'active' : ''}`}
                            onClick={() => setActiveTab('Scaling')}
                        >
                            Scaling
                        </button>
                        <button
                            className={`tab-button ${activeTab === 'TestingZone' ? 'active' : ''}`}
                            onClick={() => setActiveTab('TestingZone')}
                        >
                            CFA Consolidation
                        </button>
                        <button
                            className={`tab-button ${activeTab === 'NaturalMotion' ? 'active' : ''}`}
                            onClick={() => setActiveTab('NaturalMotion')}
                        >
                            Natural Motion
                        </button>
                        <button
                            className={`tab-button ${activeTab === 'FactAdmin' ? 'active' : ''}`}
                            onClick={() => setActiveTab('FactAdmin')}
                        >
                            Admin
                        </button>
                        <button
                            className={`tab-button ${activeTab === 'PlotGallery' ? 'active' : ''}`}
                            onClick={() => setActiveTab('PlotGallery')}
                        >
                            Plot Gallery
                        </button>
                        <button
                            className={`tab-button ${activeTab === 'SensitivityPlots' ? 'active' : ''}`}
                            onClick={() => setActiveTab('SensitivityPlots')}
                        >
                            Sensitivity Analysis
                        </button>
                    </div>
                </nav>
                <div className="content-container">
                    {activeTab !== 'AboutUs' && activeTab !== 'TestingZone' &&
                        (
                        <>
                            <SensitivityMonitor
                                S={S}
                                setS={setS}
                                version={version}
                                activeTab={activeTab}
                            />
                            <ConfigurationMonitor
                                version={version}
                            />
                        </>
                    )}
                    <div className="HomePageTabContent">
                        {renderTabContent()}
                    </div>
                </div>
            </div>
        </div>
    );
};

const HomePage = () => {
    return <HomePageContent />;
};

export default HomePage;
