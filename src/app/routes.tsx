import {
    createBrowserRouter,
    createRoutesFromElements,
    Route,
} from 'react-router-dom';
import PublicLayout from '../layouts/PublicLayout';
import Home from '../features/home/pages/Home';
import Play from '../features/game/pages/Play';

export const router = createBrowserRouter(
    createRoutesFromElements(
        <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
            <Route
                path="/play"
                element={
                    <>
                        <Play localPlayer="white" randomMovesCount={2} />
                        <Play localPlayer="black" randomMovesCount={1} />
                    </>
                }
            />
        </Route>
    )
);
