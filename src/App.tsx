import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import VehicleListPage from './pages/VehicleListPage'
import VehicleFormPage from './pages/VehicleFormPage'
import VehicleDetailPage from './pages/VehicleDetailPage'
import MaintenanceFormPage from './pages/MaintenanceFormPage'
import FuelFormPage from './pages/FuelFormPage'
import DeadlineFormPage from './pages/DeadlineFormPage'
import CustomFormPage from './pages/CustomFormPage'
import CustomCategoryManagePage from './pages/CustomCategoryManagePage'
import RemindersPage from './pages/RemindersPage'
import SettingsPage from './pages/SettingsPage'
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
        <Route path="/vehicles/:id/maintenance/new" element={<MaintenanceFormPage />} />
        <Route
          path="/vehicles/:id/maintenance/:recordId/edit"
          element={<MaintenanceFormPage />}
        />
        <Route path="/vehicles/:id/fuel/new" element={<FuelFormPage />} />
        <Route path="/vehicles/:id/fuel/:fuelId/edit" element={<FuelFormPage />} />
        <Route path="/vehicles/:id/deadline/new" element={<DeadlineFormPage />} />
        <Route path="/vehicles/:id/deadline/:deadlineId/edit" element={<DeadlineFormPage />} />
        <Route path="/vehicles/:id/custom/new" element={<CustomFormPage />} />
        <Route path="/vehicles/:id/custom/:recordId/edit" element={<CustomFormPage />} />
        <Route path="/vehicles/:id/custom/categories" element={<CustomCategoryManagePage />} />
        <Route path="/reminders" element={<RemindersPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  )
}

export default App
