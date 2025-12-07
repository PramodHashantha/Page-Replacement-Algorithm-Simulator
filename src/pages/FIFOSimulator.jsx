import React, { useState, useCallback, useMemo } from 'react';
import './fifoSimulator.css'; 

const FIFOSimulator = () => {
    // --- State Management ---
    const [inputRefString, setInputRefString] = useState('1, 9, 3, 5, 6, 3, 2, 6');
    const [frameCount, setFrameCount] = useState(3);
    const [simulationSteps, setSimulationSteps] = useState([]);
    const [pageFaults, setPageFaults] = useState(0);

    const [currentStepIndex, setCurrentStepIndex] = useState(-1); 
    const [isSimulated, setIsSimulated] = useState(false);
    const [validationError, setValidationError] = useState(''); 

    // --- Core FIFO Simulation Logic ---
    const runFIFOSimulation = useCallback(() => {
        setValidationError(''); 

        // --- Input Validation and Parsing ---
        const pageStrings = inputRefString.split(',');
        const pages = pageStrings
            .map(s => s.trim())
            .filter(s => s !== '')
            .map(s => parseInt(s)); 
        
        if (pages.some(isNaN) || pageStrings.some(s => s.trim() !== '' && isNaN(parseInt(s.trim())))) {
             setValidationError("Error: Reference String contains non-numeric or invalid input.");
             return;
        }
        
        if (pages.some(n => n < 0)) {
             setValidationError("Error: Page references must be non-negative (0 or greater).");
             return;
        }

        if (pages.length === 0 || pages.length > 10) {
            setValidationError("Error: Please enter 1 to 10 page references.");
            return;
        }
        
        if (frameCount < 3 || frameCount > 5) {
            setValidationError("Error: Frame count must be between 3 and 5.");
            return;
        }

        // --- FIFO Variables ---
        let frames = Array(frameCount).fill(null); 
        let loadOrder = [];                       
        let totalFaults = 0;
        const steps = [];

        // --- Simulation Loop ---
        for (const page of pages) {
            let isFault = false;
            let replacedPage = null;

            if (frames.includes(page)) {
                // HIT
            } else {
                // FAULT
                totalFaults++;
                isFault = true;

                const freeIndex = frames.indexOf(null);
                if (freeIndex !== -1) {
                    // Case A: Fault (Load into Free Frame)
                    frames[freeIndex] = page;
                    loadOrder.push(page);
                } else {
                    // Case B: Fault & Replace (Eviction)
                    const victimPage = loadOrder.shift(); 
                    replacedPage = victimPage;

                    const replaceIndex = frames.indexOf(victimPage);
                    frames[replaceIndex] = page;          
                    loadOrder.push(page);                 
                }
            }
            
            // Determine FIFO rank (1st = oldest)
            const rankMap = {};
            loadOrder.forEach((p, index) => {
                rankMap[p] = index + 1; 
            });

            // Store the state snapshot for playback
            steps.push({
                pageReference: page,
                frames: [...frames],
                isFault,
                replacedPage,
                frameRanks: rankMap 
            });
        }

        // --- Update React State ---
        setSimulationSteps(steps);
        setPageFaults(totalFaults);
        setCurrentStepIndex(0); 
        setIsSimulated(true);
    }, [inputRefString, frameCount]);

    // --- Playback Controls ---
    const goToNextStep = () => {
        setCurrentStepIndex(prev => Math.min(prev + 1, simulationSteps.length - 1));
    };

    const goToPreviousStep = () => {
        setCurrentStepIndex(prev => Math.max(prev - 1, 0));
    };

    const resetSimulation = () => {
        setIsSimulated(false);
        setSimulationSteps([]);
        setCurrentStepIndex(-1);
        setPageFaults(0);
        setValidationError(''); 
    };

    // --- Memoized Data for Rendering ---
    const visibleSteps = useMemo(() => {
        if (currentStepIndex < 0) return [];
        return simulationSteps.slice(0, currentStepIndex + 1);
    }, [simulationSteps, currentStepIndex]);

    const currentStepData = useMemo(() => 
        visibleSteps[visibleSteps.length - 1] || null, 
        [visibleSteps]
    );

    const cumulativeFaults = useMemo(() => 
        visibleSteps.filter(step => step.isFault).length, 
        [visibleSteps]
    );


    // --- Render Logic ---
    return (
        <div className="simulator-container">
            <h1>FIFO Page Replacement Simulator</h1>
            <p>EEX5564 Mini Project - Group B</p>
            <hr />

            {/* --- 1. Input Panel --- */}
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

            {/* --- 2. Playback Controls --- */}
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

            {/* --- 3. Simulation Grid --- */}
            {visibleSteps.length > 0 && currentStepData && (
                <div className="simulation-output">
                    <h2>Simulation Steps</h2>
                    <table className="simulation-grid">
                        <thead>
                            <tr>
                                <th>Page Reference</th>
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
                            {/* Rows for each Frame */}
                            {Array.from({ length: frameCount }).map((_, frameIndex) => (
                                <tr key={frameIndex}>
                                    <th>Frame {frameIndex + 1}</th>
                                    {visibleSteps.map((step, stepIndex) => {
                                        const page = step.frames[frameIndex];
                                        let className = 'frame-cell';
                                        
                                        const isLastStep = stepIndex === visibleSteps.length - 1;

                                        if (isLastStep) {
                                            className += ' current-step';
                                        }
                                        
                                        // --- ENHANCED VISUAL FEEDBACK LOGIC ---
                                        if (isLastStep) {
                                            if (!step.isFault) {
                                                // Case 1: HIT (Page found in memory)
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
                            {/* Result Row */}
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

                    {/* --- 4. Summary --- */}
                    <div className="summary-panel">
                        <h3>Overall Metrics (Cumulative)</h3>
                        <p>Total Page References Displayed: **{visibleSteps.length}**</p>
                        <p>Cumulative Page Faults: **{cumulativeFaults}**</p>
                        <p>Cumulative Hits: **{visibleSteps.length - cumulativeFaults}**</p>
                        
                        <div className="action-summary">
                            <h3>Action at Current Step:</h3>
                            <p>Page Reference: **{currentStepData.pageReference}**</p>
                            <p>Result: **{currentStepData.isFault ? 'Page Fault' : 'Page Hit'}**</p>
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
                        {/* Final Results (Displayed when all steps are shown) */}
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