import 'bootstrap/dist/css/bootstrap.min.css';
import './css/index.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import {
    BrowserRouter as Router,
    Routes,
    Route,
} from "react-router-dom";
import { NavigationTopBar } from "./components/NavigationTopBar.jsx";
import { NavigationButtomBar } from "./components/NavigationButtomBar.jsx";
import MainPage from "./pages/MainPage.jsx";
import ViewPage from "./pages/ViewPage.jsx";
import ModifyPage from "./pages/ModifyPage.jsx";
import { DataProvider } from "./context/DataContext";
import SimulationControl from "./components/SimulationControl.jsx";


createRoot(document.getElementById('root')).render(
    <StrictMode>
        <DataProvider>
            <Router>
                <div style={{ display: "flex", flexDirection: "column" }}>
                    <NavigationTopBar />
                    <Routes>
                        <Route exact path="/" element={<MainPage />} />
                        <Route path="/view" element={<ViewPage />} />
                        <Route path="/modify" element={<ModifyPage />} />
                        {/*<Route path="/gamble" element={<MainPage />} />*/}
                    </Routes>
                    <NavigationButtomBar />
                    <SimulationControl />
                </div>
            </Router>
        </DataProvider>
    </StrictMode>
)
