// SPDX-License-Identifier: Apache-2.0
// Copyright 2025 Emanuele Relmi

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ReviewDApp from "./ReviewDApp";

export default function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<ReviewDApp />} />
            </Routes>
        </Router>
    );
}