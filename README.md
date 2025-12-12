# 💻 FIFO Page Replacement Algorithm Simulator

## EEX5564 Mini Project - Group B

### Overview
This project is an interactive, web-based simulator developed for the **EEX5564 - Computer Architecture and Operating Systems** mini-project. It visually demonstrates the operation of the **FIFO (First-In, First-Out) Page Replacement Algorithm**, a fundamental concept in virtual memory management.

The simulator allows the user to input a page reference string and a fixed number of memory frames (3-5), then displays the entire simulation history step-by-step, providing crucial visual feedback on memory operations.

### ✨ Key Features

| Feature | Description | Academic Value |
| :--- | :--- | :--- |
| **Step-by-Step Playback** | The results table dynamically grows column by column, controlled by playback buttons. | Allows for precise, non-destructive analysis of memory state evolution. |
| **Visual Verification (FIFO Rank)** | Active frame cells show a subtle overlay indicating the page's **FIFO load rank** (1 = oldest/victim). | Directly verifies that the algorithm correctly selects the longest-resident page for eviction. |
| **Event-Driven Feedback** | Uses distinct **color-coded borders and backgrounds** to instantly identify: **Page Hit**, **Fault (Load into Free Frame)**, and **Fault & Replace (Eviction)**. | Eliminates reliance on text output for immediate understanding of memory access outcomes. |
| **Belady's Anomaly Testing**| The step-by-step format is ideal for testing and visualizing the non-optimal behavior of FIFO (e.g., fault count increasing when frames increase). | Supports academic analysis of the algorithm's weaknesses (documented in the report). |
| **Robust Validation** | Implements custom, non-alert-based validation for input length and frame limits (3-5), enhancing user experience. |

---

## 🚀 Getting Started

Follow these steps to clone the repository, set up dependencies, and run the simulator locally.

### Prerequisites
You must have [Node.js](https://nodejs.org/) and [npm](https://www.npmjs.com/) (Node Package Manager) installed on your system.

### Installation and Setup

1.  **Clone the Repository:**
    ```bash
    git clone [Your GitHub Repository URL Here]
    cd Page-Replacement-Algorithm-Simulator
    ```

2.  **Install Dependencies:**
    ```bash
    npm install
    ```

## ▶️ Available Scripts

In the project directory, you can run:

### `npm start` (Development Mode)

Runs the app in the development mode.

The application will be accessible in your web browser at: **[http://localhost:3000](http://localhost:3000)**. The page will automatically reload as you make changes to the source code.

### `npm run build` (Production Build)

Builds the app for production to the `build` folder. This optimized version is ready for deployment.

---

## 🔗 Live Demo and Report

The complete code, detailed report, and a live demonstration of the simulator are available here:

* **Live Application URL:** **https://page-replacement-algorithm-simulato-red.vercel.app/**
* **Full Report (PDF):** [Link to your final PDF report in the repository]

---

## 📁 Project Structure

The core logic and styling are centralized for high readability:

| File | Description |
| :--- | :--- |
| **`src/FIFOSimulator.js`** | **Core Logic & State:** Contains the full React component, the `runFIFOSimulation` algorithm (including FIFO Rank tracking), state management (`useState`, `useMemo`), and rendering of the entire grid. |
| **`src/fifoSimulator.css`** | **Presentation Layer:** Contains all modern CSS for the layout, advanced button styling, and the critical event-driven styling (borders/colors) that provides visual feedback. |
| **`src/App.js`** | React entry point, mounting the main component. |