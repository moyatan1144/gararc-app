import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import VehicleListPage from './pages/VehicleListPage'
import VehicleFormPage from './pages/VehicleFormPage'
import VehicleDetailPage from './pages/VehicleDetailPage'
import BikeLogFormPage from './pages/BikeLogFormPage'
import FuelFormPage from './pages/FuelFormPage'
import DeadlineFormPage from './pages/DeadlineFormPage'
import CustomCategoryManagePage from './pages/CustomCategoryManagePage'
import RemindersPage from './pages/RemindersPage'
import SettingsPage from './pages/SettingsPage'
import ExportPage from './pages/ExportPage'
import SharePage from './pages/SharePage'

function App() {
  return (
    <Routes>
      <Route path="/share/:payload" element={<SharePage />} />
      <Route element={<Layout />}>
        <Route path="/" element={<VehicleListPage />} />
        <Route path="/vehicles/new" element={<VehicleFormPage />} />
        <Route path="/vehicles/:id" element={<VehicleDetailPage />} />
        <Route path="/vehicles/:id/edit" element={<VehicleFormPage />} />
        <Route path="/vehicles/:id/fuel/new" element={<FuelFormPage />} />
        <Route path="/vehicles/:id/fuel/:fuelId/edit" element={<FuelFormPage />} />
        <Route path="/vehicles/:id/bikelog/new" element={<BikeLogFormPage />} />
        <Route path="/vehicles/:id/bikelog/:recordId/edit" element={<BikeLogFormPage />} />
        <Route path="/vehicles/:id/bikelog/categories" element={<CustomCategoryManagePage />} />
        <Route path="/reminders" element={<RemindersPage />} />
        <Route path="/reminders/deadline/new" element={<DeadlineFormPage />} />
        <Route path="/reminders/deadline/:deadlineId/edit" element={<DeadlineFormPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/settings/export" element={<ExportPage />} />
      </Route>
    </Routes>
  )
}

export default App
