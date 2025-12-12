import React, { useState, useCallback, useMemo } from 'react';
import './fifoSimulator.css'; 

const FIFOSimulator = () => {
    // --- State Management ---

    // [User Input] Tracks the raw text input for the page sequence. Default set for easy testing.
    const [inputRefString, setInputRefString] = useState('1, 9, 3, 5, 6, 3, 2, 6');
    // [User Input] Tracks the number of physical frames available. Must be 3-5.
    const [frameCount, setFrameCount] = useState(3);
    
    // [Simulation Model] Stores the full history (all snapshots) of the simulation.
    const [simulationSteps, setSimulationSteps] = useState([]);
    // [Simulation Metric] Stores the final count of page faults.
    const [pageFaults, setPageFaults] = useState(0);

    // [Playback Control] Index pointing to the last step/column currently visible in the grid.
    const [currentStepIndex, setCurrentStepIndex] = useState(-1); 
    // [UI Control] Flag to disable inputs once simulation starts.
    const [isSimulated, setIsSimulated] = useState(false);
    // [UI Feedback] Stores human-readable error messages for input validation.
    const [validationError, setValidationError] = useState(''); 

    // --- Core FIFO Simulation Logic ---
    // useCallback ensures this calculation function is only recreated if inputs change.
    const runFIFOSimulation = useCallback(() => {
        setValidationError(''); // Clear any previous error before starting

        // --- Input Validation and Parsing ---
        const pageStrings = inputRefString.split(',');
        const pages = pageStrings
            .map(s => s.trim())
            .filter(s => s !== '')
            .map(s => parseInt(s)); 
        
        // 1. Check for non-numeric/empty references.
        if (pages.some(isNaN) || pageStrings.some(s => s.trim() !== '' && isNaN(parseInt(s.trim())))) {
             setValidationError("Error: Reference String contains non-numeric or invalid input.");
             return;
        }
        
        // 2. Check for negative page numbers (pages must be non-negative).
        if (pages.some(n => n < 0)) {
             setValidationError("Error: Page references must be non-negative (0 or greater).");
             return;
        }

        // 3. Check reference string length (Max 10 pages).
        if (pages.length === 0 || pages.length > 10) {
            setValidationError("Error: Please enter 1 to 10 page references.");
            return;
        }
        
        // 4. Check frame count limits (3-5 frames).
        if (frameCount < 3 || frameCount > 5) {
            setValidationError("Error: Frame count must be between 3 and 5.");
            return;
        }

        // --- FIFO Variables Initialization ---
        let frames = Array(frameCount).fill(null); // Represents the physical memory state.
        let loadOrder = [];                       // FIFO Queue: Stores pages in the order they were loaded (oldest at the front).
        let totalFaults = 0;
        const steps = [];                         // Array to store all memory snapshots.

        // --- Simulation Loop: Process each page reference ---
        for (const page of pages) {
            let isFault = false;
            let replacedPage = null;

            // Step 1: Check for Page Hit
            if (frames.includes(page)) {
                // HIT: Memory state (frames/loadOrder) remains unchanged.
            } else {
                // Step 2: FAULT occurred
                totalFaults++;
                isFault = true;

                const freeIndex = frames.indexOf(null);
                if (freeIndex !== -1) {
                    // Case A: LOAD into FREE Frame
                    frames[freeIndex] = page;
                    loadOrder.push(page); // Page is newest, push to the back of the queue.
                } else {
                    // Case B: FAULT & REPLACE (Memory is full)
                    const victimPage = loadOrder.shift(); // FIFO rule: Select and remove the OLDEST page (from the front).
                    replacedPage = victimPage;

                    const replaceIndex = frames.indexOf(victimPage);
                    frames[replaceIndex] = page;          // Load the new page into the victim's slot.
                    loadOrder.push(page);                 // New page is newest, push to the back of the queue.
                }
            }
            
            // Step 3: Determine FIFO Rank for the current memory state
            // This is used for the visual '1, 2, 3...' overlay on the active column.
            const rankMap = {};
            loadOrder.forEach((p, index) => {
                rankMap[p] = index + 1; // 1-based rank (1 is the oldest/victim candidate)
            });

            // Step 4: Store the state snapshot for playback
            steps.push({
                pageReference: page,
                frames: [...frames],      // Deep copy ensures immutability for the snapshot.
                isFault,
                replacedPage,
                frameRanks: rankMap       // Stores the load order for visual verification.
            });
        }

        // --- Update React State: Finalizing the simulation ---
        setSimulationSteps(steps);
        setPageFaults(totalFaults);
        setCurrentStepIndex(0); // Start playback at the first column.
        setIsSimulated(true);
    }, [inputRefString, frameCount]); // Re-run only if inputs change.

    // --- Playback Controls ---
    const goToNextStep = () => {
        // Increment index, but stop at the last step of the simulationSteps array.
        setCurrentStepIndex(prev => Math.min(prev + 1, simulationSteps.length - 1));
    };

    const goToPreviousStep = () => {
        // Decrement index, but stop at the first step (index 0).
        setCurrentStepIndex(prev => Math.max(prev - 1, 0));
    };

    const resetSimulation = () => {
        // Resets all state variables to initial values, emptying the table and enabling inputs.
        setIsSimulated(false);
        setSimulationSteps([]);
        setCurrentStepIndex(-1); // Resets the view to empty.
        setPageFaults(0);
        setValidationError(''); 
    };

    // --- Memoized Data for Rendering ---
    // Calculates the array of steps to be shown in the table (from step 0 up to currentStepIndex).
    const visibleSteps = useMemo(() => {
        if (currentStepIndex < 0) return [];
        return simulationSteps.slice(0, currentStepIndex + 1);
    }, [simulationSteps, currentStepIndex]);

    // Gets the data for the *last* column displayed, used for the Summary Panel.
    const currentStepData = useMemo(() => 
        visibleSteps[visibleSteps.length - 1] || null, 
        [visibleSteps]
    );

    // Calculates cumulative faults shown up to the current step.
    const cumulativeFaults = useMemo(() => 
        visibleSteps.filter(step => step.isFault).length, 
        [visibleSteps]
    );


    // --- Render Logic (JSX) ---
    return (
        <div className="simulator-container">
            <h1>FIFO Page Replacement Simulator</h1>
            <p>EEX5564 Mini Project - Group B</p>
            <hr />

            {/* --- 1. Input Panel (Allows user to set parameters) --- */}
            <div className="input-panel">
                <label>
                    Reference String (max 10, comma-separated): 
                    <input
                        type="text"
                        value={inputRefString}
                        onChange={(e) => setInputRefString(e.target.value)}
                        disabled={isSimulated}
                    />
                </label>
                <label>
                    Frames (3-5):
                    <input
                        type="number"
                        min="3"
                        max="5"
                        value={frameCount}
                        onChange={(e) => setFrameCount(parseInt(e.target.value))}
                        disabled={isSimulated}
                    />
                </label>
                <button onClick={runFIFOSimulation} disabled={isSimulated}>Simulate</button>
                <button onClick={resetSimulation} className="reset-button">Reset</button>
            </div>
            {validationError && <p className="error-message">{validationError}</p>}
            <hr />

            {/* --- 2. Playback Controls (Manages the visible column index) --- */}
            {isSimulated && simulationSteps.length > 0 && (
                <div className="playback-controls">
                    <button 
                        onClick={goToPreviousStep} 
                        disabled={currentStepIndex <= 0}
                    >
                        &larr; Previous Step
                    </button>
                    <button 
                        onClick={goToNextStep} 
                        disabled={currentStepIndex >= simulationSteps.length - 1}
                    >
                        Next Step &rarr;
                    </button>
                    <p>
                        Viewing Step: **{currentStepIndex + 1}** of {simulationSteps.length}
                    </p>
                </div>
            )}

            {/* --- 3. Simulation Grid (Dynamically rendered table) --- */}
            {visibleSteps.length > 0 && currentStepData && (
                <div className="simulation-output">
                    <h2>Simulation Steps</h2>
                    <table className="simulation-grid">
                        <thead>
                            <tr>
                                <th>Page Reference</th>
                                {/* Maps only the visible steps for the table columns */}
                                {visibleSteps.map((step, index) => (
                                    <th 
                                        key={index} 
                                        className={index === visibleSteps.length - 1 ? 'current-step' : ''}
                                    >
                                        {step.pageReference}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {/* Renders rows for each physical Frame */}
                            {Array.from({ length: frameCount }).map((_, frameIndex) => (
                                <tr key={frameIndex}>
                                    <th>Frame {frameIndex + 1}</th>
                                    {/* Maps the frame content for each visible column */}
                                    {visibleSteps.map((step, stepIndex) => {
                                        const page = step.frames[frameIndex];
                                        let className = 'frame-cell';
                                        
                                        const isLastStep = stepIndex === visibleSteps.length - 1;

                                        // Apply general column highlighting
                                        if (isLastStep) {
                                            className += ' current-step';
                                        }
                                        
                                        // --- ENHANCED VISUAL FEEDBACK LOGIC (Color-coding the active cell) ---
                                        if (isLastStep) {
                                            if (!step.isFault) {
                                                // Case 1: HIT 
                                                if (page === step.pageReference) {
                                                     className += ' hit-cell'; 
                                                }
                                            } else { 
                                                // Cases 2 & 3: FAULT
                                                if (step.replacedPage !== null) {
                                                    // Case 3A: FAULT & REPLACE (Victim page)
                                                    if (page === step.replacedPage) {
                                                        className += ' replaced-cell'; 
                                                    } 
                                                    // Case 3B: FAULT & REPLACE (Newly loaded page)
                                                    else if (page === step.pageReference) {
                                                        className += ' loaded-replace';
                                                    }
                                                } else {
                                                    // Case 2: FAULT (Load into FREE Frame)
                                                    if (page === step.pageReference) {
                                                        className += ' loaded-free';
                                                    }
                                                }
                                            }
                                        }
                                        
                                        const rank = step.frameRanks[page];

                                        return (
                                            <td key={stepIndex} className={className}>
                                                {page !== null ? (
                                                    <>
                                                        {page}
                                                        {/* Visual FIFO Rank Overlay */}
                                                        {isLastStep && rank && (
                                                            <span className="load-rank">{rank}</span> 
                                                        )}
                                                    </>
                                                ) : ''}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                            {/* Result Row (Shows if the reference was a Hit or Fault) */}
                            <tr>
                                <th>Result</th>
                                {visibleSteps.map((step, index) => {
                                    const isLastStep = index === visibleSteps.length - 1;
                                    const resultClass = step.isFault ? 'fault' : 'hit';
                                    return (
                                        <td 
                                            key={index} 
                                            className={`${isLastStep ? 'current-step' : ''} result-cell ${resultClass}`}
                                        >
                                            {step.isFault ? 'FAULT ❌' : 'HIT ✅'}
                                        </td>
                                    );
                                })}
                            </tr>
                        </tbody>
                    </table>

                    {/* --- 4. Summary Panel --- */}
                    <div className="summary-panel">
                        <h3>Overall Metrics (Cumulative)</h3>
                        <p>Total Page References Displayed: **{visibleSteps.length}**</p>
                        <p>Cumulative Page Faults: **{cumulativeFaults}**</p>
                        <p>Cumulative Hits: **{visibleSteps.length - cumulativeFaults}**</p>
                        
                        <div className="action-summary">
                            <h3>Action at Current Step:</h3>
                            <p>Page Reference: **{currentStepData.pageReference}**</p>
                            <p>Result: **{currentStepData.isFault ? 'Page Fault' : 'Page Hit'}**</p>
                            {/* Detailed action message based on fault type */}
                            {currentStepData.isFault && currentStepData.replacedPage !== undefined && currentStepData.replacedPage !== null ? (
                                <p className="fault-action">
                                    **FIFO Action:** Page **{currentStepData.pageReference}** loaded, replacing Page **{currentStepData.replacedPage}**.
                                </p>
                            ) : currentStepData.isFault ? (
                                <p className="fault-action-free">
                                    **FIFO Action:** Page **{currentStepData.pageReference}** loaded into a **free** frame.
                                </p>
                            ) : null}
                        </div>
                        {/* Final results displayed only when the simulation is complete */}
                        {visibleSteps.length === simulationSteps.length && (
                             <div className="final-summary">
                                <h3>FINAL RESULTS:</h3>
                                <p>Total Simulation Page Faults: **{pageFaults}**</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default FIFOSimulator;